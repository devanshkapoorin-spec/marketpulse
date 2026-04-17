import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://api.polygon.io'
const KEY = process.env.POLYGON_API_KEY

export async function GET(req: NextRequest, { params }: { params: { ticker: string } }) {
  if (!KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const period = new URL(req.url).searchParams.get('period') || '1y'
  const ticker = params.ticker.toUpperCase()

  const end = new Date()
  const start = new Date()
  let limit = 365
  // Short periods are time-sensitive — don't cache them in Next.js Data Cache
  // Long periods are stable — cache aggressively to stay within Polygon free tier
  let revalidate = 300
  let cacheControl = 'public, s-maxage=60, stale-while-revalidate=300'

  if (period === '1w') {
    start.setDate(end.getDate() - 20) // 20 calendar days buffer for weekends + holidays
    limit = 20
    revalidate = 0           // never cache — always fetch fresh dates
    cacheControl = 'public, s-maxage=30, stale-while-revalidate=60'
  } else if (period === '1m') {
    start.setDate(end.getDate() - 50) // 50 calendar days buffer
    limit = 50
    revalidate = 0
    cacheControl = 'public, s-maxage=60, stale-while-revalidate=120'
  } else if (period === '3m') {
    start.setDate(end.getDate() - 95)
    limit = 95
  } else if (period === '6m') {
    start.setDate(end.getDate() - 185)
    limit = 185
  } else if (period === '2y') {
    start.setFullYear(end.getFullYear() - 2)
    limit = 730
  } else {
    start.setFullYear(end.getFullYear() - 1)
    start.setDate(start.getDate() - 5)
  }

  const from = start.toISOString().split('T')[0]
  const to = end.toISOString().split('T')[0]

  try {
    const res = await fetch(
      `${BASE}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=${limit}&apiKey=${KEY}`,
      { next: { revalidate } }
    )
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })

    const data = await res.json()
    if (data.status === 'ERROR') {
      return NextResponse.json({ error: data.error ?? 'Polygon API error' }, { status: 500 })
    }

    const results = (data.results ?? [])
      .sort((a: any, b: any) => a.t - b.t)
      .map((bar: any) => ({
        date: new Date(bar.t).toISOString(),
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v,
      }))

    // Slice to the correct number of recent trading days
    const displayLimits: Record<string, number> = { '1w': 7, '1m': 22, '3m': 65, '6m': 130 }
    const trimmed = displayLimits[period] ? results.slice(-displayLimits[period]) : results

    return NextResponse.json(trimmed, {
      headers: { 'Cache-Control': cacheControl },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch history'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

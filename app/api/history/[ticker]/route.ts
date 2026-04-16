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

  if (period === '1w') {
    start.setDate(end.getDate() - 12)
    limit = 12
  } else if (period === '1m') {
    start.setDate(end.getDate() - 38)
    limit = 35
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
    // next: { revalidate } means Next.js Data Cache is shared across all
    // serverless invocations — PriceChart, TechnicalPanel, and AIScore all
    // request the same URL, so only the first hits Polygon; the rest get
    // the cached response. This keeps us within Polygon's free-tier rate limit.
    const res = await fetch(
      `${BASE}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=${limit}&apiKey=${KEY}`,
      { next: { revalidate: 300 } }
    )
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })

    const data = await res.json()
    if (data.status === 'ERROR') {
      return NextResponse.json({ error: data.error ?? 'Polygon API error' }, { status: 500 })
    }

    const results = (data.results ?? []).map((bar: any) => ({
      date: new Date(bar.t).toISOString(),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }))

    return NextResponse.json(results, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch history'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

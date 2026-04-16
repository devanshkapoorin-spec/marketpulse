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

  // Always use daily bars — intraday is not reliable on the free tier.
  // Add extra margin to the lookback so weekends and any data lag don't
  // leave us short of trading days.
  if (period === '1w') {
    start.setDate(end.getDate() - 12)   // ~8 trading days
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
    // 1y default
    start.setFullYear(end.getFullYear() - 1)
    start.setDate(start.getDate() - 5)
  }

  const from = start.toISOString().split('T')[0]
  const to = end.toISOString().split('T')[0]

  try {
    const res = await fetch(
      `${BASE}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=${limit}&apiKey=${KEY}`
    )
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })

    const data = await res.json()
    const results = (data.results ?? []).map((bar: any) => ({
      // Return the full ISO string so the chart can parse exact dates
      date: new Date(bar.t).toISOString(),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    }))

    return NextResponse.json(results)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch history'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

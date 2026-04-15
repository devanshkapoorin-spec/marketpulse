import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://api.polygon.io'
const KEY = process.env.POLYGON_API_KEY

export async function GET(req: NextRequest, { params }: { params: { ticker: string } }) {
  if (!KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const period = new URL(req.url).searchParams.get('period') || '1y'
  const ticker = params.ticker.toUpperCase()

  const end = new Date()
  const start = new Date()
  let multiplier = 1
  let timespan = 'day'
  let limit = 365

  if (period === '1w') {
    start.setDate(end.getDate() - 7)
    timespan = 'hour'
    limit = 168
  } else if (period === '1m') {
    start.setMonth(end.getMonth() - 1)
  } else if (period === '3m') {
    start.setMonth(end.getMonth() - 3)
  } else if (period === '6m') {
    start.setMonth(end.getMonth() - 6)
  } else if (period === '2y') {
    start.setFullYear(end.getFullYear() - 2)
    limit = 730
  } else {
    start.setFullYear(end.getFullYear() - 1)
  }

  const from = start.toISOString().split('T')[0]
  const to = end.toISOString().split('T')[0]

  try {
    const res = await fetch(
      `${BASE}/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=${limit}&apiKey=${KEY}`
    )
    if (!res.ok) return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })

    const data = await res.json()
    const results = (data.results ?? []).map((bar: any) => ({
      date: new Date(bar.t).toISOString().split('T')[0],
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

import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://api.polygon.io'
const KEY = process.env.POLYGON_API_KEY

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  if (!KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const ticker = params.ticker.toUpperCase()

  try {
    const today = new Date().toISOString().split('T')[0]
    const oneYearAgo = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Two calls instead of three — one aggregates call covers current price,
    // prev close, 52W high/low, and 3M avg volume all at once.
    // next: { revalidate } shares the cached response across all serverless
    // invocations that hit the same URL within the revalidation window.
    const [aggRes, detailsRes] = await Promise.allSettled([
      fetch(
        `${BASE}/v2/aggs/ticker/${ticker}/range/1/day/${oneYearAgo}/${today}?adjusted=true&sort=desc&limit=365&apiKey=${KEY}`,
        { next: { revalidate: 300 } }
      ),
      fetch(
        `${BASE}/vX/reference/tickers/${ticker}?apiKey=${KEY}`,
        { next: { revalidate: 86400 } }  // company info changes rarely
      ),
    ])

    const aggData = aggRes.status === 'fulfilled' && aggRes.value.ok
      ? await aggRes.value.json() : null
    const detailsData = detailsRes.status === 'fulfilled' && detailsRes.value.ok
      ? await detailsRes.value.json() : null

    const bars: any[] = aggData?.results ?? []
    if (bars.length === 0) return NextResponse.json({ error: 'Ticker not found' }, { status: 404 })

    const latest = bars[0]            // most recent trading day
    const prev = bars[1]              // previous trading day
    const closes = bars.map((b: any) => b.c as number)
    const w52High = Math.max(...closes)
    const w52Low = Math.min(...closes)

    const last63Vols = bars.slice(0, 63).map((b: any) => b.v as number)
    const avgVol3M = last63Vols.reduce((a, b) => a + b, 0) / last63Vols.length

    const price: number = latest.c
    const prevClose: number = prev?.c ?? latest.o
    const change = price - prevClose
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0

    const d = detailsData?.results

    const quote = {
      regularMarketPrice: price,
      regularMarketChange: change,
      regularMarketChangePercent: changePct,
      regularMarketOpen: latest.o,
      regularMarketPreviousClose: prevClose,
      regularMarketDayHigh: latest.h,
      regularMarketDayLow: latest.l,
      regularMarketVolume: latest.v,
      averageDailyVolume3Month: avgVol3M,
      marketCap: d?.market_cap ?? null,
      trailingPE: null,
      epsTrailingTwelveMonths: null,
      fiftyTwoWeekHigh: w52High,
      fiftyTwoWeekLow: w52Low,
      longName: d?.name ?? ticker,
      shortName: d?.name ?? ticker,
    }

    const info = {
      summaryDetail: { beta: null },
      assetProfile: {
        sector: d?.sic_description ?? null,
        industry: d?.sic_description ?? null,
        longBusinessSummary: d?.description ?? null,
      },
    }

    return NextResponse.json({ quote, info }, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch quote'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://api.polygon.io'
const KEY = process.env.POLYGON_API_KEY

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  if (!KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const ticker = params.ticker.toUpperCase()

  try {
    const today = new Date().toISOString().split('T')[0]
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const oneYearAgo = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [recentRes, detailsRes, yearRes] = await Promise.allSettled([
      fetch(`${BASE}/v2/aggs/ticker/${ticker}/range/1/day/${twoWeeksAgo}/${today}?adjusted=true&sort=desc&limit=5&apiKey=${KEY}`),
      fetch(`${BASE}/vX/reference/tickers/${ticker}?apiKey=${KEY}`),
      fetch(`${BASE}/v2/aggs/ticker/${ticker}/range/1/day/${oneYearAgo}/${today}?adjusted=true&sort=asc&limit=365&apiKey=${KEY}`),
    ])

    const recentData = recentRes.status === 'fulfilled' && recentRes.value.ok ? await recentRes.value.json() : null
    const detailsData = detailsRes.status === 'fulfilled' && detailsRes.value.ok ? await detailsRes.value.json() : null
    const yearData = yearRes.status === 'fulfilled' && yearRes.value.ok ? await yearRes.value.json() : null

    const bars: any[] = recentData?.results ?? []
    if (bars.length === 0) return NextResponse.json({ error: 'Ticker not found' }, { status: 404 })

    const latest = bars[0]
    const prev = bars[1]

    const yearBars: any[] = yearData?.results ?? []
    const yearCloses = yearBars.map(b => b.c as number)
    const w52High = yearCloses.length > 0 ? Math.max(...yearCloses) : null
    const w52Low = yearCloses.length > 0 ? Math.min(...yearCloses) : null

    const recentVols = yearBars.slice(-63).map(b => b.v as number)
    const avgVol3M = recentVols.length > 0
      ? recentVols.reduce((a, b) => a + b, 0) / recentVols.length
      : null

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

    return NextResponse.json({ quote, info })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch quote'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

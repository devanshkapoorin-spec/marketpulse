import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  try {
    const ticker = params.ticker.toUpperCase()
    const [quote, info] = await Promise.all([
      yahooFinance.quote(ticker),
      (yahooFinance.quoteSummary(ticker, { modules: ['summaryDetail', 'defaultKeyStatistics', 'assetProfile'] }) as any)
        .catch(() => null),
    ])
    return NextResponse.json({ quote, info })
  } catch {
    return NextResponse.json({ error: 'Ticker not found' }, { status: 404 })
  }
}

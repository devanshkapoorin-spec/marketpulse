import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  try {
    const ticker = params.ticker.toUpperCase()
    const [quote, info] = await Promise.all([
      yahooFinance.quote(ticker, {}, { validateResult: false }) as any,
      (yahooFinance.quoteSummary(ticker, { modules: ['summaryDetail', 'defaultKeyStatistics', 'assetProfile'] }, { validateResult: false }) as any)
        .catch(() => null),
    ])
    return NextResponse.json({ quote, info })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Ticker not found' }, { status: 404 })
  }
}

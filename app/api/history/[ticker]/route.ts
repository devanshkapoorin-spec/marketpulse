import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(req: NextRequest, { params }: { params: { ticker: string } }) {
  try {
    const period = new URL(req.url).searchParams.get('period') || '1y'
    const ticker = params.ticker.toUpperCase()
    const end = new Date()
    const start = new Date()
    if (period === '1w')  start.setDate(end.getDate() - 7)
    else if (period === '1m')  start.setMonth(end.getMonth() - 1)
    else if (period === '3m')  start.setMonth(end.getMonth() - 3)
    else if (period === '6m')  start.setMonth(end.getMonth() - 6)
    else if (period === '2y')  start.setFullYear(end.getFullYear() - 2)
    else start.setFullYear(end.getFullYear() - 1)

    const data = await yahooFinance.historical(ticker, { period1: start, period2: end }, { validateResult: false })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch history' }, { status: 500 })
  }
}

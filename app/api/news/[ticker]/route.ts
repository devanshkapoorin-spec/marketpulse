import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'
import { analyzeSentiment, overallSentiment } from '@/lib/sentiment'

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  try {
    const ticker = params.ticker.toUpperCase()
    const result = await yahooFinance.search(ticker, { newsCount: 12 }) as any
    const articles = (result.news || []).map((item: any) => ({
      title: item.title,
      link: item.link,
      publisher: item.publisher,
      publishedAt: item.providerPublishTime,
      sentiment: analyzeSentiment(item.title),
    }))
    const scores = articles.map((a: any) => a.sentiment.score)
    return NextResponse.json({ articles, overall: overallSentiment(scores) })
  } catch {
    return NextResponse.json({ articles: [], overall: { avg: 0, label: 'Neutral', color: '#8B949E' } })
  }
}

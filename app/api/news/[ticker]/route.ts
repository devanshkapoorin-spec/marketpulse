import { NextRequest, NextResponse } from 'next/server'
import { analyzeSentiment, overallSentiment } from '@/lib/sentiment'

const BASE = 'https://api.polygon.io'
const KEY = process.env.POLYGON_API_KEY

export async function GET(_req: NextRequest, { params }: { params: { ticker: string } }) {
  if (!KEY) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

  const ticker = params.ticker.toUpperCase()

  try {
    const res = await fetch(
      `${BASE}/v2/reference/news?ticker=${ticker}&limit=12&order=desc&sort=published_utc&apiKey=${KEY}`
    )
    if (!res.ok) throw new Error('Failed to fetch news')

    const data = await res.json()
    const articles = (data.results ?? []).map((item: any) => ({
      title: item.title,
      link: item.article_url,
      publisher: item.publisher?.name ?? 'Unknown',
      publishedAt: Math.floor(new Date(item.published_utc).getTime() / 1000),
      sentiment: analyzeSentiment(item.title),
    }))

    const scores = articles.map((a: any) => a.sentiment.score)
    return NextResponse.json({ articles, overall: overallSentiment(scores) })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to fetch news'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

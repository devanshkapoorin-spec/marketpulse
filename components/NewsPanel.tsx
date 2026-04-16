'use client'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

interface Article {
  title: string
  link: string
  publisher: string
  publishedAt: number
  sentiment: { score: number; label: string; color: string }
}

interface NewsPanelProps { ticker: string }

export default function NewsPanel({ ticker }: NewsPanelProps) {
  const { data, error, isLoading } = useSWR(`/api/news/${ticker}`, fetcher)

  const articles: Article[] = data?.articles ?? []
  const overall = data?.overall

  if (isLoading) return (
    <div className="bg-bg-secondary rounded-xl border border-border p-5">
      <div className="h-48 flex items-center justify-center text-text-secondary text-sm animate-pulse">
        Loading news...
      </div>
    </div>
  )

  if (error) return (
    <div className="bg-bg-secondary rounded-xl border border-border p-5">
      <h3 className="text-text-primary font-semibold mb-4">Latest News</h3>
      <p className="text-text-secondary text-sm text-center py-8">Unable to load news</p>
    </div>
  )

  return (
    <div className="bg-bg-secondary rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold">Latest News</h3>
        {overall && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary">Sentiment:</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ color: overall.color, background: `${overall.color}18`, border: `1px solid ${overall.color}30` }}>
              {overall.label}
            </span>
          </div>
        )}
      </div>

      {articles.length === 0 ? (
        <p className="text-text-secondary text-sm text-center py-8">No news available</p>
      ) : (
        <div className="space-y-3">
          {articles.map((a, i) => (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-bg-primary border border-border hover:border-accent-blue transition-colors group">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-text-primary group-hover:text-accent-blue transition-colors leading-snug flex-1">
                  {a.title}
                </p>
                <ExternalLink className="w-3.5 h-3.5 text-text-muted flex-shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted">{a.publisher}</span>
                  {a.publishedAt && (
                    <>
                      <span className="text-text-muted">·</span>
                      <span className="text-xs text-text-muted">
                        {format(new Date(a.publishedAt * 1000), 'MMM d')}
                      </span>
                    </>
                  )}
                </div>
                <span className="text-xs font-medium px-1.5 py-0.5 rounded"
                  style={{ color: a.sentiment.color, background: `${a.sentiment.color}18` }}>
                  {a.sentiment.label}
                </span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

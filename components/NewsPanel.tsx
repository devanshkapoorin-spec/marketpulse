'use client'
import { useState, useEffect } from 'react'
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
  const [articles, setArticles] = useState<Article[]>([])
  const [overall, setOverall] = useState<{ avg: number; label: string; color: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/news/${ticker}`)
      .then(r => r.json())
      .then(d => {
        setArticles(d.articles || [])
        setOverall(d.overall)
      })
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-48 flex items-center justify-center text-text-secondary">Loading news...</div>

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

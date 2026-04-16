'use client'
import { useState, useEffect } from 'react'

interface AboutPanelProps { ticker: string }

export default function AboutPanel({ ticker }: AboutPanelProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/quote/${ticker}`)
      .then(r => r.json())
      .then(d => {
        setSummary(d.info?.assetProfile?.longBusinessSummary ?? null)
        setName(d.quote?.shortName ?? ticker)
      })
      .catch(() => {})
  }, [ticker])

  if (!summary) return null

  return (
    <div className="bg-bg-secondary rounded-xl border border-border p-5">
      <h3 className="text-text-primary font-semibold mb-3 text-sm">About {name ?? ticker}</h3>
      <p className="text-text-muted text-xs leading-relaxed line-clamp-6">{summary}</p>
    </div>
  )
}

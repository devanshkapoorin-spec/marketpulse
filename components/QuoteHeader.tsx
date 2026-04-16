'use client'
import { useState, useEffect } from 'react'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

interface QuoteHeaderProps {
  ticker: string
  onColorReady?: (color: string) => void
}

interface Quote {
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketOpen: number
  regularMarketPreviousClose: number
  regularMarketDayHigh: number
  regularMarketDayLow: number
  fiftyTwoWeekHigh: number | null
  fiftyTwoWeekLow: number | null
  regularMarketVolume: number
  averageDailyVolume3Month: number | null
  marketCap: number | null
  trailingPE: number | null
  epsTrailingTwelveMonths: number | null
  longName: string
  shortName: string
}

interface Info {
  summaryDetail: { beta: number | null }
  assetProfile: {
    sector: string | null
    industry: string | null
    longBusinessSummary: string | null
  }
}

function fmt(n: number | null | undefined, decimals = 2) {
  if (n == null) return '—'
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

function fmtBig(n: number | null | undefined) {
  if (n == null) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  return `$${n.toLocaleString()}`
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3 mt-6 p-4
                    bg-bg-secondary rounded-xl border border-border animate-pulse">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="text-center">
          <div className="h-2 bg-bg-tertiary rounded w-3/4 mx-auto mb-1.5" />
          <div className="h-3 bg-bg-tertiary rounded w-full mx-auto" />
        </div>
      ))}
    </div>
  )
}

export default function QuoteHeader({ ticker, onColorReady }: QuoteHeaderProps) {
  const [quote, setQuote] = useState<Quote | null>(null)
  const [info, setInfo] = useState<Info | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    fetch(`/api/quote/${ticker}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error)
        setQuote(d.quote)
        setInfo(d.info)
        const change = d.quote?.regularMarketChange ?? 0
        onColorReady?.(change >= 0 ? '#3FB950' : '#F85149')
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [ticker, onColorReady])

  if (loading) {
    return (
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 animate-pulse">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-24 bg-bg-secondary rounded-lg" />
              <div className="h-6 w-48 bg-bg-secondary rounded-lg" />
            </div>
            <div className="h-3 w-36 bg-bg-secondary rounded" />
          </div>
          <div className="text-right">
            <div className="h-10 w-32 bg-bg-secondary rounded-lg mb-2" />
            <div className="h-4 w-24 bg-bg-secondary rounded ml-auto" />
          </div>
        </div>
        <StatsSkeleton />
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-extrabold text-text-primary">{ticker}</h1>
        </div>
        <p className="text-text-secondary text-sm">Quote data unavailable — try refreshing</p>
        <StatsSkeleton />
      </div>
    )
  }

  const change = quote.regularMarketChange ?? 0
  const changePct = quote.regularMarketChangePercent ?? 0
  const isUp = change >= 0
  const isFlat = change === 0

  const stats = [
    { label: 'Open',       value: `$${fmt(quote.regularMarketOpen)}` },
    { label: 'Prev Close', value: `$${fmt(quote.regularMarketPreviousClose)}` },
    { label: 'Day High',   value: `$${fmt(quote.regularMarketDayHigh)}` },
    { label: 'Day Low',    value: `$${fmt(quote.regularMarketDayLow)}` },
    { label: '52W High',   value: quote.fiftyTwoWeekHigh ? `$${fmt(quote.fiftyTwoWeekHigh)}` : '—' },
    { label: '52W Low',    value: quote.fiftyTwoWeekLow ? `$${fmt(quote.fiftyTwoWeekLow)}` : '—' },
    { label: 'Volume',     value: quote.regularMarketVolume ? `${(quote.regularMarketVolume / 1e6).toFixed(1)}M` : '—' },
    { label: 'Avg Volume', value: quote.averageDailyVolume3Month ? `${(quote.averageDailyVolume3Month / 1e6).toFixed(1)}M` : '—' },
    { label: 'Market Cap', value: fmtBig(quote.marketCap) },
    { label: 'P/E Ratio',  value: fmt(quote.trailingPE) },
    { label: 'EPS (TTM)',  value: quote.epsTrailingTwelveMonths ? `$${fmt(quote.epsTrailingTwelveMonths)}` : '—' },
    { label: 'Beta',       value: fmt(info?.summaryDetail?.beta) },
  ]

  return (
    <div className="mb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-extrabold text-text-primary">{ticker}</h1>
            {quote.longName && (
              <span className="text-text-secondary text-lg font-normal">{quote.longName}</span>
            )}
          </div>
          {info?.assetProfile?.sector && (
            <p className="text-text-muted text-sm">
              {info.assetProfile.sector} · {info.assetProfile.industry}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="text-4xl font-bold text-text-primary">${fmt(quote.regularMarketPrice)}</p>
          <div className={`flex items-center justify-end gap-1 mt-1 text-sm font-medium
            ${isFlat ? 'text-text-secondary' : isUp ? 'text-accent-green' : 'text-accent-red'}`}>
            {isFlat
              ? <Minus className="w-4 h-4" />
              : isUp
              ? <ArrowUpRight className="w-4 h-4" />
              : <ArrowDownRight className="w-4 h-4" />}
            {isUp && '+'}{fmt(change)} ({isUp && '+'}{changePct.toFixed(2)}%)
            <span className="text-text-muted font-normal ml-1">today</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3 mt-6 p-4
                      bg-bg-secondary rounded-xl border border-border">
        {stats.map(({ label, value }) => (
          <div key={label} className="text-center min-w-0">
            <p className="text-text-muted text-xs truncate">{label}</p>
            <p className="text-text-primary text-xs font-semibold mt-0.5 truncate">{value}</p>
          </div>
        ))}
      </div>

      {info?.assetProfile?.longBusinessSummary && (
        <div className="hidden" data-summary={info.assetProfile.longBusinessSummary} />
      )}
    </div>
  )
}

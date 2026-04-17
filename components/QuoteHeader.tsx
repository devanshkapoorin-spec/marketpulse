'use client'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

interface QuoteHeaderProps { ticker: string }

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

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-bg-tertiary rounded animate-pulse ${className}`} />
}

export default function QuoteHeader({ ticker }: QuoteHeaderProps) {
  const { data, error, isLoading } = useSWR(`/api/quote/${ticker}`, fetcher)

  const quote = data?.quote
  const info = data?.info

  if (isLoading) {
    return (
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-3 w-36" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="h-10 w-32 ml-auto" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3 p-4
                        bg-bg-secondary rounded-xl border border-border animate-pulse">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="text-center space-y-1.5">
              <Skeleton className="h-2 w-3/4 mx-auto" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="mb-8 p-4 bg-bg-secondary rounded-xl border border-border">
        <p className="text-text-secondary text-sm">
          Could not load quote for <span className="text-text-primary font-semibold">{ticker}</span> — check the ticker symbol or try again.
        </p>
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
              {info.assetProfile.sector !== info.assetProfile.industry
                ? `${info.assetProfile.sector} · ${info.assetProfile.industry}`
                : info.assetProfile.sector}
            </p>
          )}
        </div>

        <div className="text-right">
          <p className="text-4xl font-bold text-text-primary">${fmt(quote.regularMarketPrice)}</p>
          <div className={`flex items-center justify-end gap-1 mt-1 text-sm font-medium
            ${isFlat ? 'text-text-secondary' : isUp ? 'text-accent-green' : 'text-accent-red'}`}>
            {isFlat ? <Minus className="w-4 h-4" /> : isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
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
        <details className="mt-4 bg-bg-secondary rounded-xl border border-border p-4 group">
          <summary className="text-text-primary font-semibold text-sm cursor-pointer list-none flex items-center justify-between">
            About {quote.shortName ?? ticker}
            <span className="text-text-muted text-xs group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <p className="text-text-muted text-xs leading-relaxed mt-3">
            {info.assetProfile.longBusinessSummary}
          </p>
        </details>
      )}
    </div>
  )
}

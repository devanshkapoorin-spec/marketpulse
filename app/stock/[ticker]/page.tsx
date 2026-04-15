export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import yahooFinance from 'yahoo-finance2'
import PriceChart from '@/components/PriceChart'
import TechnicalPanel from '@/components/TechnicalPanel'
import AIScore from '@/components/AIScore'
import NewsPanel from '@/components/NewsPanel'
import PortfolioOptimizer from '@/components/PortfolioOptimizer'
import { ArrowUpRight, ArrowDownRight, Minus, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

interface StockPageProps { params: { ticker: string } }

type QuoteResult =
  | { status: 'ok'; quote: any; info: any }
  | { status: 'not_found' }
  | { status: 'error' }

async function getQuote(ticker: string): Promise<QuoteResult> {
  try {
    const [quote, info] = await Promise.all([
      yahooFinance.quote(ticker, {}, { validateResult: false }) as any,
      (yahooFinance.quoteSummary(
        ticker,
        { modules: ['summaryDetail', 'defaultKeyStatistics', 'assetProfile'] },
        { validateResult: false }
      ) as any).catch(() => null),
    ])
    // Yahoo Finance returns a result with no price for invalid tickers
    if (!quote?.regularMarketPrice) return { status: 'not_found' }
    return { status: 'ok', quote, info }
  } catch {
    // Network/timeout/rate-limit — not the user's fault
    return { status: 'error' }
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

export default async function StockPage({ params }: StockPageProps) {
  const ticker = params.ticker.toUpperCase()

  // Reject obviously invalid ticker formats before hitting Yahoo Finance
  if (!/^[A-Z0-9.\-]{1,10}$/.test(ticker)) notFound()

  const result = await getQuote(ticker)

  if (result.status === 'not_found') notFound()

  // API error — still render the page with client components (chart, AI score, news)
  // so users get as much data as possible even when the quote endpoint is slow
  if (result.status === 'error') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-extrabold text-text-primary">{ticker}</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-accent-yellow bg-accent-yellow/10
                          border border-accent-yellow/20 rounded-xl px-4 py-3 mt-4">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              Quote data is temporarily unavailable — Yahoo Finance may be rate-limiting this server.
              Charts and indicators below load independently.
            </span>
            <Link href={`/stock/${ticker}`}
              className="ml-auto text-xs underline underline-offset-2 flex-shrink-0">
              Retry
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PriceChart ticker={ticker} initialColor="#58A6FF" />
            <TechnicalPanel ticker={ticker} />
            <PortfolioOptimizer />
          </div>
          <div className="space-y-6">
            <AIScore ticker={ticker} />
            <NewsPanel ticker={ticker} />
          </div>
        </div>
      </div>
    )
  }

  const { quote: q, info } = result

  const change = q.regularMarketChange ?? 0
  const changePct = q.regularMarketChangePercent ?? 0
  const isUp = change >= 0
  const isFlat = change === 0
  const chartColor = isUp ? '#3FB950' : '#F85149'

  const stats = [
    { label: 'Open',       value: `$${fmt(q.regularMarketOpen)}` },
    { label: 'Prev Close', value: `$${fmt(q.regularMarketPreviousClose)}` },
    { label: 'Day High',   value: `$${fmt(q.regularMarketDayHigh)}` },
    { label: 'Day Low',    value: `$${fmt(q.regularMarketDayLow)}` },
    { label: '52W High',   value: `$${fmt(q.fiftyTwoWeekHigh)}` },
    { label: '52W Low',    value: `$${fmt(q.fiftyTwoWeekLow)}` },
    { label: 'Volume',     value: q.regularMarketVolume ? `${(q.regularMarketVolume / 1e6).toFixed(1)}M` : '—' },
    { label: 'Avg Volume', value: q.averageDailyVolume3Month ? `${(q.averageDailyVolume3Month / 1e6).toFixed(1)}M` : '—' },
    { label: 'Market Cap', value: fmtBig(q.marketCap) },
    { label: 'P/E Ratio',  value: fmt(q.trailingPE) },
    { label: 'EPS (TTM)',  value: q.epsTrailingTwelveMonths ? `$${fmt(q.epsTrailingTwelveMonths)}` : '—' },
    { label: 'Beta',       value: fmt(info?.summaryDetail?.beta) },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-4xl font-extrabold text-text-primary">{ticker}</h1>
              {q.longName && (
                <span className="text-text-secondary text-lg font-normal">{q.longName}</span>
              )}
            </div>
            {info?.assetProfile?.sector && (
              <p className="text-text-muted text-sm">
                {info.assetProfile.sector} · {info.assetProfile.industry}
              </p>
            )}
          </div>

          <div className="text-right">
            <p className="text-4xl font-bold text-text-primary">${fmt(q.regularMarketPrice)}</p>
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

        {/* Key stats bar */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3 mt-6 p-4
                        bg-bg-secondary rounded-xl border border-border">
          {stats.map(({ label, value }) => (
            <div key={label} className="text-center min-w-0">
              <p className="text-text-muted text-xs truncate">{label}</p>
              <p className="text-text-primary text-xs font-semibold mt-0.5 truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left: chart + technicals + portfolio */}
        <div className="lg:col-span-2 space-y-6">
          <PriceChart ticker={ticker} initialColor={chartColor} />
          <TechnicalPanel ticker={ticker} />
          <PortfolioOptimizer />
        </div>

        {/* Right: AI score + news */}
        <div className="space-y-6">
          <AIScore ticker={ticker} />
          <NewsPanel ticker={ticker} />

          {info?.assetProfile?.longBusinessSummary && (
            <div className="bg-bg-secondary rounded-xl border border-border p-5">
              <h3 className="text-text-primary font-semibold mb-3 text-sm">
                About {q.shortName ?? ticker}
              </h3>
              <p className="text-text-muted text-xs leading-relaxed line-clamp-6">
                {info.assetProfile.longBusinessSummary}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

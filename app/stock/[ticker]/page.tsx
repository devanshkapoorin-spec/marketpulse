import { notFound } from 'next/navigation'
import QuoteHeader from '@/components/QuoteHeader'
import PriceChart from '@/components/PriceChart'
import TechnicalPanel from '@/components/TechnicalPanel'
import AIScore from '@/components/AIScore'
import NewsPanel from '@/components/NewsPanel'
import PortfolioOptimizer from '@/components/PortfolioOptimizer'
import AboutPanel from '@/components/AboutPanel'

interface StockPageProps { params: { ticker: string } }

export default function StockPage({ params }: StockPageProps) {
  const ticker = params.ticker.toUpperCase()

  if (!/^[A-Z0-9.\-]{1,10}$/.test(ticker)) notFound()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <QuoteHeader ticker={ticker} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PriceChart ticker={ticker} />
          <TechnicalPanel ticker={ticker} />
          <PortfolioOptimizer />
        </div>
        <div className="space-y-6">
          <AIScore ticker={ticker} />
          <NewsPanel ticker={ticker} />
          <AboutPanel ticker={ticker} />
        </div>
      </div>
    </div>
  )
}

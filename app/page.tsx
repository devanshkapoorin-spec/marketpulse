import SearchBar from '@/components/SearchBar'
import { TrendingUp, Zap, BarChart2, Shield } from 'lucide-react'

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Technical Analysis',
    desc: 'RSI, MACD, Bollinger Bands, and moving averages — all calculated from live data.',
    color: '#58A6FF',
  },
  {
    icon: Zap,
    title: 'AI Signal Score',
    desc: 'Proprietary 0–100 scoring model aggregating multiple technical signals into a single actionable rating.',
    color: '#3FB950',
  },
  {
    icon: BarChart2,
    title: 'Sentiment Analysis',
    desc: 'Real-time news sentiment across 12 latest articles with bullish/bearish/neutral classification.',
    color: '#D29922',
  },
  {
    icon: Shield,
    title: 'Portfolio Optimizer',
    desc: 'Monte Carlo simulation over 3,000 portfolios to find max-Sharpe and min-volatility allocations.',
    color: '#BC8CFF',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(88,166,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(88,166,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        {/* Radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent-blue/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-accent-blue/10 border border-accent-blue/20 text-accent-blue
                          text-xs font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            Live data · No API key required
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-text-primary tracking-tight leading-tight mb-6">
            Stock Intelligence
            <br />
            <span className="text-accent-blue">Powered by AI</span>
          </h1>

          <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
            Analyse any stock with professional-grade technical indicators, AI signal scoring,
            real-time news sentiment, and portfolio optimization — completely free.
          </p>

          <SearchBar />
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-center text-text-secondary text-sm font-medium uppercase tracking-widest mb-10">
          What you get
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-bg-secondary border border-border rounded-xl p-5 hover:border-[#30363D] transition-colors">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="text-text-primary font-semibold mb-2 text-sm">{title}</h3>
              <p className="text-text-muted text-xs leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-4">How it works</h2>
          <p className="text-text-secondary text-sm mb-12">Three steps to a full market analysis</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Enter a ticker', desc: 'Type any stock symbol — US markets supported.' },
              { step: '02', title: 'Live data fetched', desc: 'Prices, news & financials pulled directly from Yahoo Finance.' },
              { step: '03', title: 'Analyse & decide', desc: 'Review AI score, technicals, sentiment and optimise your portfolio.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="text-4xl font-black text-accent-blue/20 mb-2">{step}</div>
                <h3 className="text-text-primary font-semibold mb-1 text-sm">{title}</h3>
                <p className="text-text-muted text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts'
import { runMonteCarlo } from '@/lib/portfolio'
import { Plus, X, TrendingUp } from 'lucide-react'

const DEFAULT_TICKERS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA']

export default function PortfolioOptimizer() {
  const [tickers, setTickers] = useState<string[]>(DEFAULT_TICKERS)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Awaited<ReturnType<typeof runMonteCarlo>> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addTicker = () => {
    const t = input.trim().toUpperCase()
    if (t && !tickers.includes(t) && tickers.length < 8) {
      setTickers([...tickers, t])
      setInput('')
    }
  }

  const removeTicker = (t: string) => setTickers(tickers.filter(x => x !== t))

  const optimize = async () => {
    if (tickers.length < 2) { setError('Add at least 2 tickers'); return }
    setLoading(true)
    setError('')
    try {
      const histories = await Promise.all(
        tickers.map(t =>
          fetch(`/api/history/${t}?period=1y`)
            .then(r => r.json())
            .then((raw: any[]) => raw.map(d => +d.close))
        )
      )
      const res = await runMonteCarlo(tickers, histories)
      setResult(res)
    } catch {
      setError('Failed to fetch data for one or more tickers')
    } finally {
      setLoading(false)
    }
  }

  const CustomDot = (props: any) => {
    const { cx, cy } = props
    return <circle cx={cx} cy={cy} r={2.5} fill="#21262D" stroke="#30363D" strokeWidth={0.5} opacity={0.6} />
  }

  return (
    <div className="bg-bg-secondary rounded-xl border border-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-accent-blue" />
        <h3 className="text-text-primary font-semibold">Portfolio Optimizer</h3>
        <span className="text-xs text-text-muted ml-auto">Monte Carlo · 3,000 simulations</span>
      </div>

      {/* Ticker input */}
      <div className="flex gap-2 mb-3">
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && addTicker()}
          placeholder="Add ticker (e.g. TSLA)"
          className="flex-1 bg-bg-primary border border-border text-text-primary placeholder-text-muted
                     rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent-blue"
          maxLength={6}
        />
        <button onClick={addTicker}
          className="bg-bg-primary border border-border text-text-secondary hover:text-text-primary
                     rounded-lg px-3 py-2 transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {tickers.map(t => (
          <span key={t} className="flex items-center gap-1.5 bg-bg-primary border border-border
                                   text-text-secondary text-xs px-2.5 py-1 rounded-lg">
            {t}
            <button onClick={() => removeTicker(t)} className="text-text-muted hover:text-accent-red transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {error && <p className="text-accent-red text-xs mb-3">{error}</p>}

      <button onClick={optimize} disabled={loading}
        className="w-full bg-accent-blue text-bg-primary font-semibold py-2.5 rounded-lg
                   hover:opacity-90 transition-opacity disabled:opacity-50 text-sm mb-5">
        {loading ? 'Optimizing...' : 'Run Optimization'}
      </button>

      {result && (
        <>
          {/* Efficient frontier scatter */}
          <div className="mb-5">
            <p className="text-xs text-text-muted mb-2">Efficient Frontier (Risk vs. Return)</p>
            <ResponsiveContainer width="100%" height={220}>
              <ScatterChart margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                <XAxis dataKey="risk" name="Risk" unit="%" tick={{ fill: '#8B949E', fontSize: 11 }}
                  tickLine={false} axisLine={false} tickFormatter={v => `${(+v).toFixed(1)}%`} label={{ value: 'Volatility', position: 'insideBottom', offset: -2, fill: '#8B949E', fontSize: 10 }} />
                <YAxis dataKey="ret" name="Return" unit="%" tick={{ fill: '#8B949E', fontSize: 11 }}
                  tickLine={false} axisLine={false} tickFormatter={v => `${(+v).toFixed(1)}%`} width={45} />
                <Tooltip
                  cursor={{ strokeDasharray: '4 4', stroke: '#30363D' }}
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const d = payload[0]?.payload
                    return (
                      <div className="bg-bg-secondary border border-border rounded-lg p-2 text-xs">
                        <p className="text-text-secondary">Return: <span className="text-accent-green">{d.ret.toFixed(2)}%</span></p>
                        <p className="text-text-secondary">Risk: <span className="text-accent-red">{d.risk.toFixed(2)}%</span></p>
                        <p className="text-text-secondary">Sharpe: <span className="text-text-primary">{d.sharpe.toFixed(2)}</span></p>
                      </div>
                    )
                  }}
                />
                <Scatter data={result.simulations} shape={<CustomDot />} />
                {/* Max Sharpe */}
                <ReferenceDot x={result.maxSharpe.risk} y={result.maxSharpe.ret}
                  r={6} fill="#58A6FF" stroke="#0D1117" strokeWidth={2} label={{ value: '★', position: 'top', fill: '#58A6FF', fontSize: 12 }} />
                {/* Min Vol */}
                <ReferenceDot x={result.minVol.risk} y={result.minVol.ret}
                  r={6} fill="#3FB950" stroke="#0D1117" strokeWidth={2} label={{ value: '●', position: 'top', fill: '#3FB950', fontSize: 10 }} />
              </ScatterChart>
            </ResponsiveContainer>
            <div className="flex gap-4 justify-center mt-1">
              <span className="flex items-center gap-1.5 text-xs text-text-muted"><span className="w-2 h-2 rounded-full bg-accent-blue inline-block" /> Max Sharpe</span>
              <span className="flex items-center gap-1.5 text-xs text-text-muted"><span className="w-2 h-2 rounded-full bg-accent-green inline-block" /> Min Volatility</span>
            </div>
          </div>

          {/* Optimal portfolios side by side */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Max Sharpe Portfolio', port: result.maxSharpe, color: '#58A6FF' },
              { label: 'Min Volatility Portfolio', port: result.minVol, color: '#3FB950' },
            ].map(({ label, port, color }) => (
              <div key={label} className="bg-bg-primary rounded-xl border border-border p-4">
                <p className="text-xs font-semibold mb-3" style={{ color }}>{label}</p>
                <div className="space-y-1.5 mb-3">
                  {tickers.map((t, i) => (
                    <div key={t} className="flex items-center justify-between">
                      <span className="text-xs text-text-secondary">{t}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-bg-secondary rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${port.weights[i] * 100}%`, background: color }} />
                        </div>
                        <span className="text-xs text-text-primary w-10 text-right">{(port.weights[i] * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-border space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Ann. Return</span>
                    <span className="text-accent-green">{port.ret.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Volatility</span>
                    <span className="text-accent-red">{port.risk.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Sharpe</span>
                    <span className="text-text-primary">{port.sharpe.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

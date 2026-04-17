'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Bar, Area } from 'recharts'
import { format } from 'date-fns'
import { calcRSI, calcMACD, calcBollingerBands, calcSMA } from '@/lib/indicators'

interface TechnicalPanelProps { ticker: string }

export default function TechnicalPanel({ ticker }: TechnicalPanelProps) {
  const [active, setActive] = useState<'RSI' | 'MACD' | 'BB'>('RSI')

  const { data: raw, error, isLoading } = useSWR(
    `/api/history/${ticker}?period=1y`,
    fetcher
  )

  const Tip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-bg-secondary border border-border rounded-lg p-3 text-xs">
        <p className="text-text-secondary mb-1">{payload[0]?.payload?.date}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
  }

  if (isLoading) return (
    <div className="h-64 flex items-center justify-center text-text-secondary text-sm animate-pulse">
      Loading indicators...
    </div>
  )

  if (error || !Array.isArray(raw) || raw.length === 0) return (
    <div className="bg-bg-secondary rounded-xl border border-border p-5">
      <p className="text-text-secondary text-sm text-center py-8">Failed to load indicator data</p>
    </div>
  )

  const closes = raw.map((d: any) => +d.close)
  const dates = raw.map((d: any) => format(new Date(d.date), 'MMM yy'))
  const rsi = calcRSI(closes)
  const { macd, signal, histogram } = calcMACD(closes)
  const { upper, lower, mid } = calcBollingerBands(closes)
  const sma20 = calcSMA(closes, 20)
  const sma50 = calcSMA(closes, 50)

  const data = closes.map((c: number, i: number) => ({
    date: dates[i],
    close: +c.toFixed(2),
    rsi: rsi[i] != null ? +rsi[i]!.toFixed(1) : null,
    macd: macd[i] != null ? +macd[i]!.toFixed(3) : null,
    macdSignal: signal[i] != null ? +signal[i]!.toFixed(3) : null,
    macdHist: histogram[i] != null ? +histogram[i]!.toFixed(3) : null,
    bbUpper: upper[i] != null ? +upper[i]!.toFixed(2) : null,
    bbLower: lower[i] != null ? +lower[i]!.toFixed(2) : null,
    bbMid: mid[i] != null ? +mid[i]!.toFixed(2) : null,
    sma20: sma20[i] != null ? +sma20[i]!.toFixed(2) : null,
    sma50: sma50[i] != null ? +sma50[i]!.toFixed(2) : null,
  }))

  const price = closes[closes.length - 1]
  const latestSma20 = data.filter(d => d.sma20 != null).slice(-1)[0]?.sma20
  const latestSma50 = data.filter(d => d.sma50 != null).slice(-1)[0]?.sma50

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['RSI', 'MACD', 'BB'] as const).map(t => (
          <button key={t} onClick={() => setActive(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${active === t ? 'bg-accent-blue text-bg-primary' : 'bg-bg-secondary text-text-secondary border border-border hover:text-text-primary'}`}>
            {t === 'BB' ? 'Bollinger Bands' : t}
          </button>
        ))}
      </div>

      {active === 'RSI' && (
        <div className="bg-bg-secondary rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-text-primary font-semibold">RSI (14)</h3>
            <div className="flex gap-4 text-xs text-text-secondary">
              <span className="text-accent-red">Overbought &gt; 70</span>
              <span className="text-accent-green">Oversold &lt; 30</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#8B949E', fontSize: 11 }} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(data.length / 10))} />
              <YAxis domain={[0, 100]} tick={{ fill: '#8B949E', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<Tip />} />
              <ReferenceLine y={70} stroke="#F85149" strokeDasharray="4 4" strokeWidth={1} />
              <ReferenceLine y={30} stroke="#3FB950" strokeDasharray="4 4" strokeWidth={1} />
              <ReferenceLine y={50} stroke="#30363D" strokeDasharray="2 4" strokeWidth={1} />
              <Line type="monotone" dataKey="rsi" stroke="#58A6FF" strokeWidth={2} dot={false} name="RSI" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {active === 'MACD' && (
        <div className="bg-bg-secondary rounded-xl border border-border p-5">
          <h3 className="text-text-primary font-semibold mb-3">MACD (12, 26, 9)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fill: '#8B949E', fontSize: 11 }} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(data.length / 10))} />
              <YAxis tick={{ fill: '#8B949E', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<Tip />} />
              <ReferenceLine y={0} stroke="#30363D" strokeWidth={1} />
              <Bar dataKey="macdHist" name="Histogram" fill="#58A6FF" opacity={0.5} />
              <Line type="monotone" dataKey="macd" stroke="#58A6FF" strokeWidth={2} dot={false} name="MACD" />
              <Line type="monotone" dataKey="macdSignal" stroke="#F85149" strokeWidth={1.5} dot={false} name="Signal" strokeDasharray="4 2" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      {active === 'BB' && (
        <div className="bg-bg-secondary rounded-xl border border-border p-5">
          <h3 className="text-text-primary font-semibold mb-3">Bollinger Bands (20, 2σ)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="bbGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#58A6FF" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#58A6FF" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#8B949E', fontSize: 11 }} tickLine={false} axisLine={false} interval={Math.max(1, Math.floor(data.length / 10))} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#8B949E', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} width={60} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="bbUpper" stroke="#58A6FF" strokeWidth={1} strokeDasharray="4 2" fill="url(#bbGrad)" dot={false} name="Upper" />
              <Area type="monotone" dataKey="bbLower" stroke="#58A6FF" strokeWidth={1} strokeDasharray="4 2" fill="transparent" dot={false} name="Lower" />
              <Line type="monotone" dataKey="bbMid" stroke="#8B949E" strokeWidth={1} dot={false} name="Mid" strokeDasharray="2 4" />
              <Line type="monotone" dataKey="close" stroke="#E6EDF3" strokeWidth={2} dot={false} name="Price" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'SMA 20', val: latestSma20, color: '#D29922' },
          { label: 'SMA 50', val: latestSma50, color: '#BC8CFF' },
        ].map(({ label, val, color }) => {
          const diff = val && price ? ((price - val) / val * 100).toFixed(2) : null
          return (
            <div key={label} className="bg-bg-secondary rounded-xl border border-border p-4">
              <p className="text-xs text-text-secondary mb-1">{label}</p>
              <p className="font-semibold" style={{ color }}>${val?.toFixed(2) ?? '—'}</p>
              {diff && (
                <p className={`text-xs mt-1 ${+diff >= 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                  Price {+diff >= 0 ? 'above' : 'below'} by {Math.abs(+diff)}%
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

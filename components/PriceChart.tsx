'use client'
import { useState, useEffect, useCallback } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { format } from 'date-fns'

const PERIODS = ['1W', '1M', '3M', '6M', '1Y', '2Y']

interface PriceChartProps { ticker: string; color?: string }

interface ChartPoint {
  date: string
  close: number
  volume: number
  open: number
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { value: number; payload: ChartPoint }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-bg-secondary border border-border rounded-lg p-3 text-sm">
      <p className="text-text-secondary">{d.date}</p>
      <p className="text-text-primary font-semibold">${payload[0].value.toLocaleString()}</p>
      <p className="text-text-secondary">Vol: {(d.volume / 1e6).toFixed(1)}M</p>
    </div>
  )
}

export default function PriceChart({ ticker, color = '#58A6FF' }: PriceChartProps) {
  const [period, setPeriod] = useState('1Y')
  const [data, setData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchData = useCallback(() => {
    setLoading(true)
    setError(false)
    fetch(`/api/history/${ticker}?period=${period.toLowerCase()}`)
      .then(r => r.json())
      .then((raw: unknown) => {
        if (!Array.isArray(raw) || raw.length === 0) throw new Error('no data')
        setData(raw.map((d: { date: string; close: number; volume: number; open: number }) => ({
          date: format(
            new Date(d.date),
            period === '1W' || period === '1M' ? 'MMM d' : 'MMM yy'
          ),
          close: +d.close.toFixed(2),
          volume: d.volume,
          open: +d.open.toFixed(2),
        })))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [ticker, period])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="bg-bg-secondary rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-text-primary font-semibold">Price History</h3>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors
                ${period === p ? 'bg-accent-blue text-bg-primary' : 'text-text-secondary hover:text-text-primary'}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-text-secondary text-sm">Loading chart...</div>
      ) : error ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <p className="text-text-secondary text-sm">Failed to load price data</p>
          <button onClick={fetchData} className="text-xs text-accent-blue hover:underline">Try again</button>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#8B949E', fontSize: 11 }} tickLine={false} axisLine={false}
                interval="preserveStartEnd" />
              <YAxis tick={{ fill: '#8B949E', fontSize: 11 }} tickLine={false} axisLine={false}
                domain={['auto', 'auto']} tickFormatter={v => `$${v}`} width={60} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="close" stroke={color} strokeWidth={2}
                fill="url(#colorGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>

          <ResponsiveContainer width="100%" height={60}>
            <BarChart data={data} margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <Bar dataKey="volume" fill="#21262D" />
              <XAxis dataKey="date" hide />
              <YAxis hide />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}

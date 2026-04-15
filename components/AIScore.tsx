'use client'
import { useState, useEffect } from 'react'
import { calcRSI, calcMACD, calcBollingerBands, calcSMA, calcAIScore } from '@/lib/indicators'

interface AIScoreProps { ticker: string }

const arcPath = (pct: number, r: number) => {
  const angle = pct * 180 - 90
  const rad = (angle * Math.PI) / 180
  const x = 100 + r * Math.cos(rad)
  const y = 100 + r * Math.sin(rad)
  return { x, y }
}

function Gauge({ score }: { score: number }) {
  const color = score >= 65 ? '#3FB950' : score >= 40 ? '#D29922' : '#F85149'
  const pct = score / 100
  const end = arcPath(pct, 72)
  const largeArc = pct > 0.5 ? 1 : 0
  const pathD = `M 28 100 A 72 72 0 ${largeArc} 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`

  return (
    <svg viewBox="0 0 200 110" className="w-48 h-24 mx-auto">
      {/* background arc */}
      <path d="M 28 100 A 72 72 0 0 1 172 100" fill="none" stroke="#21262D" strokeWidth="12" strokeLinecap="round" />
      {/* score arc */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      {/* score text */}
      <text x="100" y="88" textAnchor="middle" fill={color} fontSize="28" fontWeight="700">{score}</text>
      <text x="100" y="104" textAnchor="middle" fill="#8B949E" fontSize="11">out of 100</text>
    </svg>
  )
}

export default function AIScore({ ticker }: AIScoreProps) {
  const [result, setResult] = useState<ReturnType<typeof calcAIScore> | null>(null)
  const [signals, setSignals] = useState<{ name: string; value: string; status: 'bullish' | 'bearish' | 'neutral' }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/history/${ticker}?period=1y`)
      .then(r => r.json())
      .then(raw => {
        const closes = raw.map((d: any) => +d.close)
        const scored = calcAIScore(closes)
        setResult(scored)

        const rsi = calcRSI(closes)
        const { macd, signal } = calcMACD(closes)
        const { upper, lower } = calcBollingerBands(closes)
        const sma20 = calcSMA(closes, 20)
        const sma50 = calcSMA(closes, 50)
        const price = closes[closes.length - 1]

        const lastRsi = rsi.filter(v => v !== null).slice(-1)[0] ?? 0
        const lastMacd = macd.filter(v => v !== null).slice(-1)[0] ?? 0
        const lastSig = signal.filter(v => v !== null).slice(-1)[0] ?? 0
        const lastUpper = upper.filter(v => v !== null).slice(-1)[0] ?? 0
        const lastLower = lower.filter(v => v !== null).slice(-1)[0] ?? 0
        const lastSma20 = sma20.filter(v => v !== null).slice(-1)[0] ?? 0
        const lastSma50 = sma50.filter(v => v !== null).slice(-1)[0] ?? 0

        setSignals([
          {
            name: 'RSI (14)',
            value: lastRsi.toFixed(1),
            status: lastRsi < 30 ? 'bullish' : lastRsi > 70 ? 'bearish' : 'neutral',
          },
          {
            name: 'MACD',
            value: lastMacd > lastSig ? 'Bullish Cross' : 'Bearish Cross',
            status: lastMacd > lastSig ? 'bullish' : 'bearish',
          },
          {
            name: 'Bollinger Band',
            value: price < lastLower ? 'Below Lower' : price > lastUpper ? 'Above Upper' : 'Within Bands',
            status: price < lastLower ? 'bullish' : price > lastUpper ? 'bearish' : 'neutral',
          },
          {
            name: 'SMA 20',
            value: price > lastSma20 ? 'Price Above' : 'Price Below',
            status: price > lastSma20 ? 'bullish' : 'bearish',
          },
          {
            name: 'SMA 50',
            value: price > lastSma50 ? 'Price Above' : 'Price Below',
            status: price > lastSma50 ? 'bullish' : 'bearish',
          },
        ])
      })
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return <div className="h-48 flex items-center justify-center text-text-secondary">Calculating score...</div>
  if (!result) return null

  const recColor = result.recommendation === 'Strong Buy' || result.recommendation === 'Buy'
    ? 'text-accent-green'
    : result.recommendation === 'Sell' || result.recommendation === 'Strong Sell'
    ? 'text-accent-red'
    : 'text-yellow-400'

  const statusColors = {
    bullish: 'bg-accent-green/10 text-accent-green border border-accent-green/20',
    bearish: 'bg-accent-red/10 text-accent-red border border-accent-red/20',
    neutral: 'bg-bg-primary text-text-secondary border border-border',
  }

  return (
    <div className="bg-bg-secondary rounded-xl border border-border p-5">
      <h3 className="text-text-primary font-semibold mb-4">AI Signal Score</h3>

      <div className="flex flex-col items-center mb-5">
        <Gauge score={result.score} />
        <p className={`text-2xl font-bold mt-2 ${recColor}`}>{result.recommendation}</p>
        <p className="text-xs text-text-secondary mt-1">Based on technical indicators</p>
      </div>

      <div className="space-y-2">
        {signals.map(s => (
          <div key={s.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <span className="text-sm text-text-secondary">{s.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status]}`}>
              {s.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

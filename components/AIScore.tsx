'use client'
import { useState, useEffect } from 'react'
import { calcRSI, calcMACD, calcBollingerBands, calcSMA, calcAIScore } from '@/lib/indicators'

interface AIScoreProps { ticker: string }

type CalcResult = ReturnType<typeof calcAIScore>
type SignalStatus = 'bullish' | 'bearish' | 'neutral'

function colorToStatus(color: string): SignalStatus {
  if (color === 'green') return 'bullish'
  if (color === 'red') return 'bearish'
  return 'neutral'
}

const arcPath = (pct: number, r: number) => {
  const angle = pct * 180 - 90
  const rad = (angle * Math.PI) / 180
  return { x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad) }
}

function Gauge({ score }: { score: number }) {
  const color = score >= 60 ? '#3FB950' : score >= 40 ? '#D29922' : '#F85149'
  const pct = score / 100
  const end = arcPath(pct, 72)
  const largeArc = pct > 0.5 ? 1 : 0
  const pathD = `M 28 100 A 72 72 0 ${largeArc} 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)}`

  return (
    <svg viewBox="0 0 200 110" className="w-48 h-24 mx-auto">
      <path d="M 28 100 A 72 72 0 0 1 172 100" fill="none" stroke="#21262D" strokeWidth="12" strokeLinecap="round" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round" />
      <text x="100" y="88" textAnchor="middle" fill={color} fontSize="28" fontWeight="700">{score}</text>
      <text x="100" y="104" textAnchor="middle" fill="#8B949E" fontSize="11">out of 100</text>
    </svg>
  )
}

export default function AIScore({ ticker }: AIScoreProps) {
  const [result, setResult] = useState<CalcResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    setResult(null)
    fetch(`/api/history/${ticker}?period=1y`)
      .then(r => r.json())
      .then((raw: unknown) => {
        if (!Array.isArray(raw)) throw new Error('invalid response')

        const closes = raw.map((d: { close: number }) => +d.close)
        const volumes = raw.map((d: { volume: number }) => +d.volume)
        const price = closes[closes.length - 1]

        const rsiArr = calcRSI(closes)
        const { histogram } = calcMACD(closes)
        const { pctB } = calcBollingerBands(closes)
        const sma20Arr = calcSMA(closes, 20)
        const sma50Arr = calcSMA(closes, 50)

        const lastRsi = rsiArr.filter((v): v is number => v !== null).slice(-1)[0] ?? null
        const lastMacdHist = histogram.filter((v): v is number => v !== null).slice(-1)[0] ?? null
        const lastPctB = pctB.filter((v): v is number => v !== null).slice(-1)[0] ?? null
        const lastSma20 = sma20Arr.filter((v): v is number => v !== null).slice(-1)[0] ?? null
        const lastSma50 = sma50Arr.filter((v): v is number => v !== null).slice(-1)[0] ?? null

        const priceVsSMA20 = lastSma20 !== null ? (price - lastSma20) / lastSma20 : null
        const priceVsSMA50 = lastSma50 !== null ? (price - lastSma50) / lastSma50 : null

        const change5d = closes.length >= 6
          ? (closes[closes.length - 1] - closes[closes.length - 6]) / closes[closes.length - 6]
          : null

        const recentVols = volumes.slice(-21, -1)
        const avgVol20 = recentVols.length > 0
          ? recentVols.reduce((a, b) => a + b, 0) / recentVols.length
          : null
        const volumeRatio = avgVol20 && avgVol20 > 0 ? volumes[volumes.length - 1] / avgVol20 : null

        setResult(calcAIScore({
          rsi: lastRsi,
          macdHist: lastMacdHist,
          priceVsSMA20,
          priceVsSMA50,
          bbPctB: lastPctB,
          volumeRatio,
          change5d,
        }))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [ticker])

  if (loading) return (
    <div className="bg-bg-secondary rounded-xl border border-border p-5">
      <div className="h-48 flex items-center justify-center text-text-secondary text-sm">Calculating score...</div>
    </div>
  )

  if (error || !result) return (
    <div className="bg-bg-secondary rounded-xl border border-border p-5">
      <h3 className="text-text-primary font-semibold mb-4">AI Signal Score</h3>
      <p className="text-text-secondary text-sm text-center py-8">Unable to calculate score</p>
    </div>
  )

  const recColor =
    result.recommendation === 'Strong Buy' || result.recommendation === 'Buy'
      ? 'text-accent-green'
      : result.recommendation === 'Sell' || result.recommendation === 'Strong Sell'
      ? 'text-accent-red'
      : 'text-yellow-400'

  const statusColors: Record<SignalStatus, string> = {
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
        {result.signals.map(s => {
          const status = colorToStatus(s.color)
          return (
            <div key={s.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-sm text-text-secondary">{s.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[status]}`}>
                {s.signal}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

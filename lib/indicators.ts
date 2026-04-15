export function calcSMA(prices: number[], period: number): (number | null)[] {
  return prices.map((_, i) =>
    i < period - 1 ? null : prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period
  )
}

export function calcEMA(prices: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1)
  const result: (number | null)[] = new Array(period - 1).fill(null)
  const seed = prices.slice(0, period).reduce((a, b) => a + b) / period
  result.push(seed)
  for (let i = period; i < prices.length; i++) {
    result.push(prices[i] * k + result[result.length - 1]! * (1 - k))
  }
  return result
}

export function calcRSI(prices: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(period).fill(null)
  let avgGain = 0, avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1]
    if (diff > 0) avgGain += diff; else avgLoss -= diff
  }
  avgGain /= period; avgLoss /= period
  result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1]
    avgGain = (avgGain * (period - 1) + Math.max(diff, 0)) / period
    avgLoss = (avgLoss * (period - 1) + Math.max(-diff, 0)) / period
    result.push(avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss))
  }
  return result
}

export function calcMACD(prices: number[], fast = 12, slow = 26, signal = 9) {
  const emaFast = calcEMA(prices, fast)
  const emaSlow = calcEMA(prices, slow)
  const macd = prices.map((_, i) =>
    emaFast[i] !== null && emaSlow[i] !== null ? emaFast[i]! - emaSlow[i]! : null
  )
  const validMacd = macd.filter((v): v is number => v !== null)
  const signalLine: (number | null)[] = new Array(macd.length - validMacd.length).fill(null)
  const emaSignal = calcEMA(validMacd, signal)
  const histogram: (number | null)[] = []
  let signalIdx = 0
  for (let i = 0; i < macd.length; i++) {
    if (macd[i] === null) { signalLine.push(null); histogram.push(null) }
    else {
      const s = emaSignal[signalIdx] ?? null
      signalLine.push(s)
      histogram.push(s !== null ? macd[i]! - s : null)
      signalIdx++
    }
  }
  return { macd, signal: signalLine, histogram }
}

export function calcBollingerBands(prices: number[], period = 20, stdDevMult = 2) {
  const mid = calcSMA(prices, period)
  const upper: (number | null)[] = []
  const lower: (number | null)[] = []
  const pctB: (number | null)[] = []
  prices.forEach((_, i) => {
    if (i < period - 1) { upper.push(null); lower.push(null); pctB.push(null); return }
    const slice = prices.slice(i - period + 1, i + 1)
    const mean = mid[i]!
    const std = Math.sqrt(slice.reduce((acc, v) => acc + (v - mean) ** 2, 0) / period)
    const u = mean + stdDevMult * std
    const l = mean - stdDevMult * std
    upper.push(u); lower.push(l)
    pctB.push((prices[i] - l) / (u - l))
  })
  return { upper, lower, mid, pctB }
}

export function calcAIScore(indicators: {
  rsi: number | null
  macdHist: number | null
  priceVsSMA20: number | null
  priceVsSMA50: number | null
  bbPctB: number | null
  volumeRatio: number | null
  change5d: number | null
}) {
  let score = 50
  const signals: { name: string; signal: string; color: string; value: string }[] = []

  const { rsi, macdHist, priceVsSMA20, priceVsSMA50, bbPctB, volumeRatio, change5d } = indicators

  if (rsi !== null) {
    if (rsi < 30) { score += 15; signals.push({ name: 'RSI', signal: 'Oversold — Bullish', color: 'green', value: rsi.toFixed(1) }) }
    else if (rsi > 70) { score -= 15; signals.push({ name: 'RSI', signal: 'Overbought — Bearish', color: 'red', value: rsi.toFixed(1) }) }
    else { signals.push({ name: 'RSI', signal: 'Neutral', color: 'yellow', value: rsi.toFixed(1) }) }
  }

  if (macdHist !== null) {
    if (macdHist > 0) { score += 10; signals.push({ name: 'MACD', signal: 'Bullish Momentum', color: 'green', value: macdHist.toFixed(3) }) }
    else { score -= 10; signals.push({ name: 'MACD', signal: 'Bearish Momentum', color: 'red', value: macdHist.toFixed(3) }) }
  }

  if (priceVsSMA20 !== null) {
    if (priceVsSMA20 > 0) { score += 8; signals.push({ name: 'SMA 20', signal: 'Price Above — Bullish', color: 'green', value: `+${(priceVsSMA20 * 100).toFixed(1)}%` }) }
    else { score -= 8; signals.push({ name: 'SMA 20', signal: 'Price Below — Bearish', color: 'red', value: `${(priceVsSMA20 * 100).toFixed(1)}%` }) }
  }

  if (priceVsSMA50 !== null) {
    if (priceVsSMA50 > 0) { score += 7; signals.push({ name: 'SMA 50', signal: 'Price Above — Bullish', color: 'green', value: `+${(priceVsSMA50 * 100).toFixed(1)}%` }) }
    else { score -= 7; signals.push({ name: 'SMA 50', signal: 'Price Below — Bearish', color: 'red', value: `${(priceVsSMA50 * 100).toFixed(1)}%` }) }
  }

  if (bbPctB !== null) {
    if (bbPctB < 0.2) { score += 10; signals.push({ name: 'Bollinger', signal: 'Near Lower Band — Bullish', color: 'green', value: bbPctB.toFixed(2) }) }
    else if (bbPctB > 0.8) { score -= 10; signals.push({ name: 'Bollinger', signal: 'Near Upper Band — Bearish', color: 'red', value: bbPctB.toFixed(2) }) }
    else { signals.push({ name: 'Bollinger', signal: 'Mid Range — Neutral', color: 'yellow', value: bbPctB.toFixed(2) }) }
  }

  if (volumeRatio !== null) {
    if (volumeRatio > 1.5) { signals.push({ name: 'Volume', signal: 'High Volume — Strong Signal', color: 'blue', value: `${volumeRatio.toFixed(1)}x avg` }) }
    else { signals.push({ name: 'Volume', signal: 'Normal Volume', color: 'yellow', value: `${volumeRatio.toFixed(1)}x avg` }) }
  }

  if (change5d !== null) {
    if (change5d > 0.03) { score += 5; signals.push({ name: 'Momentum', signal: '5d Rally — Bullish', color: 'green', value: `+${(change5d * 100).toFixed(1)}%` }) }
    else if (change5d < -0.03) { score -= 5; signals.push({ name: 'Momentum', signal: '5d Decline — Bearish', color: 'red', value: `${(change5d * 100).toFixed(1)}%` }) }
    else { signals.push({ name: 'Momentum', signal: 'Sideways', color: 'yellow', value: `${(change5d * 100).toFixed(1)}%` }) }
  }

  const clamped = Math.max(5, Math.min(95, score))
  const recommendation =
    clamped >= 75 ? 'Strong Buy' :
    clamped >= 60 ? 'Buy' :
    clamped >= 40 ? 'Hold' :
    clamped >= 25 ? 'Sell' : 'Strong Sell'
  const recColor =
    clamped >= 60 ? 'green' :
    clamped >= 40 ? 'yellow' : 'red'

  return { score: clamped, recommendation, recColor, signals }
}

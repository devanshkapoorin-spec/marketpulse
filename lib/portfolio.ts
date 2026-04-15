export function calcReturns(prices: number[]): number[] {
  return prices.slice(1).map((p, i) => (p - prices[i]) / prices[i])
}

export function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function std(arr: number[]): number {
  const m = mean(arr)
  return Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / arr.length)
}

export interface PortfolioPoint {
  weights: number[]
  ret: number   // annualised return %
  risk: number  // annualised volatility %
  sharpe: number
}

export interface MonteCarloResult {
  simulations: PortfolioPoint[]
  maxSharpe: PortfolioPoint
  minVol: PortfolioPoint
}

/**
 * @param tickers   - array of ticker symbols, e.g. ['AAPL', 'MSFT']
 * @param histories - parallel array of close-price arrays, one per ticker
 * @param sims      - number of random portfolios to simulate (default 3000)
 */
export function runMonteCarlo(
  tickers: string[],
  histories: number[][],
  sims = 3000
): MonteCarloResult {
  const n = tickers.length
  const returnSeries = histories.map(calcReturns)
  const simulations: PortfolioPoint[] = []
  const RF_ANNUAL = 0.05 // 5% risk-free rate

  for (let s = 0; s < sims; s++) {
    const raw = Array.from({ length: n }, () => Math.random())
    const sum = raw.reduce((a, b) => a + b, 0)
    const weights = raw.map(w => w / sum)

    // Annualised return
    let ret = 0
    for (let i = 0; i < n; i++) ret += mean(returnSeries[i]) * weights[i]
    ret = ret * 252 * 100 // → %

    // Annualised variance via covariance matrix
    let variance = 0
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const ri = returnSeries[i]
        const rj = returnSeries[j]
        const len = Math.min(ri.length, rj.length)
        const mi = mean(ri.slice(-len))
        const mj = mean(rj.slice(-len))
        const cov = ri.slice(-len).reduce(
          (acc, v, k) => acc + (v - mi) * (rj[rj.length - len + k] - mj), 0
        ) / len
        variance += weights[i] * weights[j] * cov * 252
      }
    }

    const risk = Math.sqrt(Math.max(variance, 0)) * 100 // → %
    const sharpe = risk > 0 ? (ret - RF_ANNUAL * 100) / risk : 0
    simulations.push({ weights, ret, risk, sharpe })
  }

  const maxSharpe = simulations.reduce((best, p) => p.sharpe > best.sharpe ? p : best)
  const minVol = simulations.reduce((best, p) => p.risk < best.risk ? p : best)

  return { simulations, maxSharpe, minVol }
}

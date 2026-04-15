const BULLISH = ['surge', 'soar', 'jump', 'beat', 'rise', 'gain', 'growth', 'profit', 'record',
  'bullish', 'upgrade', 'strong', 'positive', 'rally', 'boost', 'exceed', 'outperform',
  'buy', 'breakout', 'wins', 'expands', 'launches', 'approval', 'deal', 'high']

const BEARISH = ['plunge', 'crash', 'drop', 'fall', 'miss', 'loss', 'decline', 'cut', 'weak',
  'bearish', 'downgrade', 'negative', 'sell', 'concern', 'risk', 'warn', 'down', 'below',
  'disappoints', 'layoff', 'lawsuit', 'recall', 'fraud', 'deficit', 'debt', 'probe']

// Use word-boundary matching to prevent false positives (e.g. "support" matching "up")
function countMatches(text: string, words: string[]): number {
  return words.reduce((count, w) => {
    const re = new RegExp(`\\b${w}\\b`, 'i')
    return re.test(text) ? count + 1 : count
  }, 0)
}

export function analyzeSentiment(text: string): { score: number; label: 'Bullish' | 'Bearish' | 'Neutral'; color: string } {
  const bullCount = countMatches(text, BULLISH)
  const bearCount = countMatches(text, BEARISH)
  const score = bullCount - bearCount
  if (score > 0) return { score, label: 'Bullish', color: '#3FB950' }
  if (score < 0) return { score, label: 'Bearish', color: '#F85149' }
  return { score: 0, label: 'Neutral', color: '#8B949E' }
}

export function overallSentiment(scores: number[]): { avg: number; label: string; color: string } {
  if (!scores.length) return { avg: 0, label: 'Neutral', color: '#8B949E' }
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  if (avg > 0.3) return { avg, label: 'Bullish', color: '#3FB950' }
  if (avg < -0.3) return { avg, label: 'Bearish', color: '#F85149' }
  return { avg, label: 'Neutral', color: '#8B949E' }
}

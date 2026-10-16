export interface IntervalRange {
  minMs: number
  maxMs: number
}

const TYPICAL_REQUEST_MS = 500

export const REMOVAL_INTERVAL: IntervalRange = { minMs: 2000, maxMs: 3000 }

// Mais lento que a exclusão de posts: ações em sequência sobre contas são o que o X mais vigia como automação.
export const ACCOUNT_ACTION_INTERVAL: IntervalRange = { minMs: 5000, maxMs: 8000 }

export const ESTIMATED_MS_PER_REMOVAL = estimateAverageMs(REMOVAL_INTERVAL)

export const ESTIMATED_MS_PER_ACCOUNT_ACTION = estimateAverageMs(ACCOUNT_ACTION_INTERVAL)

function estimateAverageMs(interval: IntervalRange): number {
  return (interval.minMs + interval.maxMs) / 2 + TYPICAL_REQUEST_MS
}

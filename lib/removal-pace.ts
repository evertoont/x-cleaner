export interface IntervalRange {
  minMs: number
  maxMs: number
}

const TYPICAL_REQUEST_MS = 500

export const REMOVAL_INTERVAL: IntervalRange = { minMs: 2000, maxMs: 3000 }

export const ESTIMATED_MS_PER_REMOVAL = estimateAverageMs(REMOVAL_INTERVAL)

function estimateAverageMs(interval: IntervalRange): number {
  return (interval.minMs + interval.maxMs) / 2 + TYPICAL_REQUEST_MS
}

import { describe, expect, it } from 'vitest'
import {
  countRemainingActions,
  DAILY_ACCOUNT_ACTION_LIMIT,
  findQuotaResumeTime,
  listRecentActions,
} from '../lib/account-quota'

const HOUR_MS = 60 * 60_000
const NOW = Date.UTC(2026, 9, 16, 12)

describe('listRecentActions', () => {
  it('keeps only actions from the last 24 hours, oldest first', () => {
    const timestamps = [NOW - 2 * HOUR_MS, NOW - 25 * HOUR_MS, NOW - 23 * HOUR_MS]

    expect(listRecentActions(timestamps, NOW)).toEqual([NOW - 23 * HOUR_MS, NOW - 2 * HOUR_MS])
  })
})

describe('countRemainingActions', () => {
  it('subtracts recent actions from the daily limit', () => {
    expect(countRemainingActions([NOW - HOUR_MS, NOW - 30 * HOUR_MS], NOW)).toBe(
      DAILY_ACCOUNT_ACTION_LIMIT - 1,
    )
  })

  it('never goes below zero', () => {
    const timestamps = Array.from({ length: DAILY_ACCOUNT_ACTION_LIMIT + 5 }, () => NOW - HOUR_MS)

    expect(countRemainingActions(timestamps, NOW)).toBe(0)
  })
})

describe('findQuotaResumeTime', () => {
  it('frees the quota 24 hours after the oldest recent action', () => {
    expect(findQuotaResumeTime([NOW - 3 * HOUR_MS, NOW - HOUR_MS], NOW)).toEqual(
      new Date(NOW + 21 * HOUR_MS),
    )
  })
})

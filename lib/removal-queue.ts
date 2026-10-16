import type { RemovalBridgeRequest } from './bridge-messages'
import { XSessionExpiredError } from './errors'
import type { IntervalRange } from './removal-pace'
import type { RemovalResult } from './removal-response'
import { sleep } from './sleep'
import { findOrOpenXTab, navigateXTab, sendBridgeRequest, X_HOME_URL } from './x-tab'

export type SettledRemoval = Extract<RemovalResult, { status: 'removed' | 'failed' }>

export interface RemovalQueueOptions<Entry> {
  entries: Entry[]
  interval: IntervalRange
  signal: AbortSignal
  buildRequest: (entry: Entry) => RemovalBridgeRequest
  onEntrySettled: (entry: Entry, removal: SettledRemoval) => void
  onRateLimited: (resumeAt: Date) => void
}

const RATE_LIMIT_FALLBACK_WAIT_MS = 5 * 60_000

export async function runRemovalQueue<Entry>(options: RemovalQueueOptions<Entry>): Promise<void> {
  const { entries, interval, signal, onEntrySettled } = options
  const tabId = await findOrOpenXTab()

  await navigateXTab(tabId, X_HOME_URL)

  for (const [index, entry] of entries.entries()) {
    const removal = await removeRespectingRateLimit(tabId, entry, options)

    if (!removal) {
      return
    }

    onEntrySettled(entry, removal)

    const isLastEntry = index === entries.length - 1

    if (!isLastEntry) {
      await sleep(pickInterval(interval), signal)
    }
  }
}

async function removeRespectingRateLimit<Entry>(
  tabId: number,
  entry: Entry,
  options: RemovalQueueOptions<Entry>,
): Promise<SettledRemoval | undefined> {
  const { signal, buildRequest, onRateLimited } = options

  while (!signal.aborted) {
    const result = await sendBridgeRequest(tabId, buildRequest(entry))

    if (result.status === 'session-expired') {
      throw new XSessionExpiredError()
    }

    if (result.status !== 'rate-limited') {
      return result
    }

    const resumeAt = new Date(result.retryAt ?? Date.now() + RATE_LIMIT_FALLBACK_WAIT_MS)

    onRateLimited(resumeAt)
    await sleep(resumeAt.getTime() - Date.now(), signal)
  }

  return undefined
}

function pickInterval(interval: IntervalRange): number {
  return interval.minMs + Math.random() * (interval.maxMs - interval.minMs)
}

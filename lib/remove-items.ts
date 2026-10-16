import { XSessionExpiredError } from './errors'
import type { CapturedItem } from './items'
import type { RemovalResult } from './removal-response'
import { sleep } from './sleep'
import { findOrOpenXTab, navigateXTab, sendBridgeRequest, X_HOME_URL } from './x-tab'

export type SettledRemoval = Extract<RemovalResult, { status: 'removed' | 'failed' }>

interface RemoveItemsOptions {
  items: CapturedItem[]
  signal: AbortSignal
  onItemSettled: (item: CapturedItem, removal: SettledRemoval) => void
  onRateLimited: (resumeAt: Date) => void
}

const MIN_INTERVAL_MS = 2000
const MAX_INTERVAL_MS = 3000
const TYPICAL_REQUEST_MS = 500
const RATE_LIMIT_FALLBACK_WAIT_MS = 5 * 60_000

export const ESTIMATED_MS_PER_REMOVAL = (MIN_INTERVAL_MS + MAX_INTERVAL_MS) / 2 + TYPICAL_REQUEST_MS

export async function removeItems(options: RemoveItemsOptions): Promise<void> {
  const { items, signal, onItemSettled, onRateLimited } = options
  const tabId = await findOrOpenXTab()

  await navigateXTab(tabId, X_HOME_URL)

  for (const [index, item] of items.entries()) {
    const removal = await removeRespectingRateLimit(tabId, item, signal, onRateLimited)

    if (!removal) {
      return
    }

    onItemSettled(item, removal)

    const isLastItem = index === items.length - 1

    if (!isLastItem) {
      await sleep(pickInterval(), signal)
    }
  }
}

async function removeRespectingRateLimit(
  tabId: number,
  item: CapturedItem,
  signal: AbortSignal,
  onRateLimited: (resumeAt: Date) => void,
): Promise<SettledRemoval | undefined> {
  while (!signal.aborted) {
    const result = await sendBridgeRequest(tabId, { type: 'remove', item })

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

function pickInterval(): number {
  return MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS)
}

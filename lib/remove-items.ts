import type { CapturedItem } from './items'
import { REMOVAL_INTERVAL } from './removal-pace'
import { runRemovalQueue } from './removal-queue'
import type { SettledRemoval } from './removal-queue'

interface RemoveItemsOptions {
  items: CapturedItem[]
  signal: AbortSignal
  onItemSettled: (item: CapturedItem, removal: SettledRemoval) => Promise<void>
  onRateLimited: (resumeAt: Date) => Promise<void>
}

export function removeItems(options: RemoveItemsOptions): Promise<void> {
  const { items, signal, onItemSettled, onRateLimited } = options

  return runRemovalQueue({
    entries: items,
    interval: REMOVAL_INTERVAL,
    signal,
    buildRequest: item => ({ type: 'remove', item }),
    onEntrySettled: onItemSettled,
    onRateLimited,
  })
}

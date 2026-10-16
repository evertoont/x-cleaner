import { removalJobStorage, removalNoticeStorage, removalStopRequestStorage } from './item-storage'
import type { RemovalJob } from './removal-jobs'

export async function startRemovalJob(job: RemovalJob): Promise<void> {
  await removalStopRequestStorage.setValue(false)
  await removalNoticeStorage.setValue(null)
  await removalJobStorage.setValue(job)
}

export function requestRemovalStop(): Promise<void> {
  return removalStopRequestStorage.setValue(true)
}

export function clearRemovalNotice(): Promise<void> {
  return removalNoticeStorage.setValue(null)
}

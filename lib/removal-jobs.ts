import type { AccountRemovalPlan } from './account-removals'
import type { Account, AccountAction } from './accounts'
import type { Notice, RemovalActivity } from './activity'
import { countItemsByKind } from './items'
import type { CapturedItem, ItemStatus, KindCounts } from './items'
import type { SettledRemoval } from './removal-queue'
import { describeAccountRemovalOutcome, describeRemovalOutcome } from './removal-summary'

interface RemovalJobProgress {
  pendingKeys: string[]
  total: number
  failedCount: number
  isBackgroundRun: boolean
  resumeAt?: number
}

export interface ItemRemovalJob extends RemovalJobProgress {
  target: 'items'
  removedCounts: KindCounts
}

export interface AccountRemovalJob extends RemovalJobProgress {
  target: AccountAction
  processedCount: number
  heldBackCount: number
  quotaResumeAt: number
}

export type RemovalJob = ItemRemovalJob | AccountRemovalJob

interface SettleableEntry {
  key: string
  status: ItemStatus
  errorMessage?: string
}

export function createItemRemovalJob(items: CapturedItem[], isBackgroundRun: boolean): ItemRemovalJob {
  return {
    target: 'items',
    pendingKeys: items.map(item => item.key),
    total: items.length,
    failedCount: 0,
    isBackgroundRun,
    removedCounts: countItemsByKind([]),
  }
}

export function createAccountRemovalJob(
  action: AccountAction,
  plan: AccountRemovalPlan,
  isBackgroundRun: boolean,
): AccountRemovalJob {
  return {
    target: action,
    pendingKeys: plan.accountsToProcess.map(account => account.key),
    total: plan.accountsToProcess.length,
    failedCount: 0,
    isBackgroundRun,
    processedCount: 0,
    heldBackCount: plan.heldBackCount,
    quotaResumeAt: plan.quotaResumeAt.getTime(),
  }
}

export function selectPendingEntries<Entry extends { key: string }>(
  entries: Entry[],
  pendingKeys: string[],
): Entry[] {
  const entriesByKey = new Map(entries.map(entry => [entry.key, entry]))

  return pendingKeys.flatMap(pendingKey => entriesByKey.get(pendingKey) ?? [])
}

export function applySettlement<Entry extends SettleableEntry>(
  entries: Entry[],
  settledKey: string,
  removal: SettledRemoval,
): Entry[] {
  if (removal.status === 'removed') {
    return entries.filter(entry => entry.key !== settledKey)
  }

  return entries.map(entry =>
    entry.key === settledKey ? { ...entry, status: 'failed', errorMessage: removal.message } : entry,
  )
}

export function recordItemRemoval(
  job: ItemRemovalJob,
  item: CapturedItem,
  removal: SettledRemoval,
): ItemRemovalJob {
  const advancedJob = advancePastEntry(job, item.key, removal)

  if (removal.status === 'failed') {
    return advancedJob
  }

  return {
    ...advancedJob,
    removedCounts: { ...job.removedCounts, [item.kind]: job.removedCounts[item.kind] + 1 },
  }
}

export function recordAccountAction(
  job: AccountRemovalJob,
  account: Account,
  removal: SettledRemoval,
): AccountRemovalJob {
  const advancedJob = advancePastEntry(job, account.key, removal)

  if (removal.status === 'failed') {
    return advancedJob
  }

  return { ...advancedJob, processedCount: job.processedCount + 1 }
}

export function toRemovalActivity(job: RemovalJob): RemovalActivity {
  return {
    type: 'removing',
    target: job.target,
    completed: job.total - job.pendingKeys.length,
    total: job.total,
    resumeAt: job.resumeAt === undefined ? undefined : new Date(job.resumeAt),
  }
}

export function describeRemovalJobOutcome(job: RemovalJob, wasStopped: boolean): Notice {
  const tone = job.failedCount > 0 ? 'error' : 'info'

  if (job.target === 'items') {
    return { message: describeRemovalOutcome(job.removedCounts, job.failedCount, wasStopped), tone }
  }

  const message = describeAccountRemovalOutcome({
    action: job.target,
    processedCount: job.processedCount,
    failedCount: job.failedCount,
    heldBackCount: job.heldBackCount,
    quotaResumeAt: new Date(job.quotaResumeAt),
    wasStopped,
  })

  return { message, tone }
}

function advancePastEntry<Job extends RemovalJob>(
  job: Job,
  settledKey: string,
  removal: SettledRemoval,
): Job {
  return {
    ...job,
    pendingKeys: job.pendingKeys.filter(pendingKey => pendingKey !== settledKey),
    failedCount: removal.status === 'failed' ? job.failedCount + 1 : job.failedCount,
    resumeAt: undefined,
  }
}

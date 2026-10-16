import { describe, expect, it } from 'vitest'
import type { Account } from '../lib/accounts'
import { createItem } from '../lib/items'
import type { CapturedItem, ItemKind } from '../lib/items'
import {
  applySettlement,
  createAccountRemovalJob,
  createItemRemovalJob,
  describeRemovalJobOutcome,
  recordAccountAction,
  recordItemRemoval,
  selectPendingEntries,
  toRemovalActivity,
} from '../lib/removal-jobs'

const REMOVED = { status: 'removed' } as const
const FAILED = { status: 'failed', message: 'X refused the removal.' } as const

function buildItem(id: string, kind: ItemKind = 'tweet'): CapturedItem {
  return createItem({ id, kind, text: '', createdAt: '2026-10-16T12:00:00Z', authorHandle: 'owner' })
}

function buildAccount(id: string): Account {
  return {
    key: `account:${id}`,
    id,
    handle: `user${id}`,
    name: `User ${id}`,
    bio: '',
    avatarUrl: '',
    followersCount: 0,
    followingCount: 0,
    isVerified: false,
    isMutual: false,
    listOrder: 0,
    status: 'active',
  }
}

function buildAccountJob(accounts: Account[], heldBackCount = 0) {
  return createAccountRemovalJob(
    'unfollow',
    { accountsToProcess: accounts, heldBackCount, quotaResumeAt: new Date(0) },
    true,
  )
}

describe('selectPendingEntries', () => {
  it('keeps the queue order and skips entries no longer stored', () => {
    const storedItems = [buildItem('1'), buildItem('2'), buildItem('3')]

    expect(selectPendingEntries(storedItems, ['tweet:3', 'tweet:9', 'tweet:1'])).toEqual([
      storedItems[2],
      storedItems[0],
    ])
  })
})

describe('applySettlement', () => {
  it('drops the removed entry from the list', () => {
    const storedItems = [buildItem('1'), buildItem('2')]

    expect(applySettlement(storedItems, 'tweet:1', REMOVED)).toEqual([storedItems[1]])
  })

  it('keeps a failed entry and records why', () => {
    const [failedItem] = applySettlement([buildItem('1')], 'tweet:1', FAILED)

    expect(failedItem).toMatchObject({ status: 'failed', errorMessage: 'X refused the removal.' })
  })
})

describe('recordItemRemoval', () => {
  it('counts removals by kind and advances the queue', () => {
    const like = buildItem('1', 'like')
    const job = createItemRemovalJob([like, buildItem('2')], false)

    const settledJob = recordItemRemoval({ ...job, resumeAt: 123 }, like, REMOVED)

    expect(settledJob.pendingKeys).toEqual(['tweet:2'])
    expect(settledJob.removedCounts.like).toBe(1)
    expect(settledJob.resumeAt).toBeUndefined()
  })

  it('counts failures without counting them as removed', () => {
    const tweet = buildItem('1')

    const settledJob = recordItemRemoval(createItemRemovalJob([tweet], false), tweet, FAILED)

    expect(settledJob.failedCount).toBe(1)
    expect(settledJob.removedCounts.tweet).toBe(0)
  })
})

describe('recordAccountAction', () => {
  it('counts processed accounts and advances the queue', () => {
    const [first, second] = [buildAccount('1'), buildAccount('2')]

    const settledJob = recordAccountAction(buildAccountJob([first, second]), first, REMOVED)

    expect(settledJob.pendingKeys).toEqual(['account:2'])
    expect(settledJob.processedCount).toBe(1)
  })
})

describe('toRemovalActivity', () => {
  it('reports progress from the entries still pending', () => {
    const job = { ...createItemRemovalJob([buildItem('1'), buildItem('2')], true), pendingKeys: ['tweet:2'] }

    expect(toRemovalActivity(job)).toEqual({
      type: 'removing',
      target: 'items',
      completed: 1,
      total: 2,
      resumeAt: undefined,
    })
  })

  it('restores the rate limit resume time as a date', () => {
    const job = { ...createItemRemovalJob([buildItem('1')], true), resumeAt: 1_000 }

    expect(toRemovalActivity(job).resumeAt).toEqual(new Date(1_000))
  })
})

describe('describeRemovalJobOutcome', () => {
  it('summarizes removed items', () => {
    const tweet = buildItem('1')
    const job = recordItemRemoval(createItemRemovalJob([tweet], true), tweet, REMOVED)

    expect(describeRemovalJobOutcome(job, false)).toEqual({ message: '1 post deleted.', tone: 'info' })
  })

  it('flags the outcome as an error when something failed', () => {
    const account = buildAccount('1')
    const job = recordAccountAction(buildAccountJob([account]), account, FAILED)

    expect(describeRemovalJobOutcome(job, true).tone).toBe('error')
    expect(describeRemovalJobOutcome(job, true).message).toMatch(/^Stopped\./)
  })
})

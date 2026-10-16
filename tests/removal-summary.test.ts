import { describe, expect, it } from 'vitest'
import type { KindCounts } from '../lib/items'
import {
  describeRemovalActions,
  describeRemovalOutcome,
  selectRemovalAction,
} from '../lib/removal-summary'

function buildCounts(counts: Partial<KindCounts>): KindCounts {
  return { tweet: 0, reply: 0, retweet: 0, like: 0, ...counts }
}

describe('selectRemovalAction', () => {
  it('uses the action of the only selected kind', () => {
    expect(selectRemovalAction(buildCounts({ like: 30 }), 'tweet')).toBe('unlike')
    expect(selectRemovalAction(buildCounts({ retweet: 5 }), 'tweet')).toBe('undoRepost')
  })

  it('treats posts and replies as the same delete action', () => {
    expect(selectRemovalAction(buildCounts({ tweet: 12, reply: 3 }), 'like')).toBe('delete')
  })

  it('falls back to a neutral action when the selection mixes actions', () => {
    expect(selectRemovalAction(buildCounts({ tweet: 12, like: 30 }), 'tweet')).toBe('mixed')
  })

  it('uses the active tab action when nothing is selected', () => {
    expect(selectRemovalAction(buildCounts({}), 'retweet')).toBe('undoRepost')
  })
})

describe('describeRemovalActions', () => {
  it('lists every selected kind with its own action', () => {
    expect(describeRemovalActions(buildCounts({ tweet: 12, retweet: 1, like: 30 }))).toEqual([
      { kind: 'tweet', description: 'Delete 12 posts' },
      { kind: 'retweet', description: 'Undo 1 repost' },
      { kind: 'like', description: 'Remove 30 likes' },
    ])
  })
})

describe('describeRemovalOutcome', () => {
  it('summarizes what was removed by kind', () => {
    expect(describeRemovalOutcome(buildCounts({ tweet: 12, like: 30 }), 0, false)).toBe(
      '12 posts deleted and 30 likes removed.',
    )
  })

  it('mentions the stop and the failures', () => {
    expect(describeRemovalOutcome(buildCounts({ reply: 1 }), 2, true)).toBe(
      'Stopped. 1 reply deleted. 2 items failed and are still in the list.',
    )
  })

  it('says when nothing was removed', () => {
    expect(describeRemovalOutcome(buildCounts({}), 1, false)).toBe(
      'Nothing was removed. 1 item failed and is still in the list.',
    )
  })
})

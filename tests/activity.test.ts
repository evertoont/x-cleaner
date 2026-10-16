import { describe, expect, it } from 'vitest'
import {
  describeActivity,
  describeActivityAnnouncement,
  estimateRemovalDuration,
} from '../lib/activity'

describe('describeActivity', () => {
  it('says X is opening before the first section starts', () => {
    expect(describeActivity({ type: 'capturing' })).toBe('Opening X…')
  })

  it('names the section being fetched and its position', () => {
    expect(
      describeActivity({ type: 'capturing', section: { target: 'like', step: 2, totalSteps: 3 } }),
    ).toBe('Fetching Likes (2 of 3)… the X tab scrolls by itself.')
  })

  it('names the following section', () => {
    expect(
      describeActivity({
        type: 'capturing',
        section: { target: 'following', step: 5, totalSteps: 5 },
      }),
    ).toBe('Fetching Following (5 of 5)… the X tab scrolls by itself.')
  })

  it('estimates the time left while removing', () => {
    expect(
      describeActivity({ type: 'removing', target: 'items', completed: 12, total: 420 }),
    ).toBe('Removing 12 of 420 · about 21 min left')
  })

  it('shows hours for long removals', () => {
    expect(
      describeActivity({ type: 'removing', target: 'items', completed: 0, total: 1500 }),
    ).toBe('Removing 0 of 1500 · about 1 hr 15 min left')
  })

  it('estimates unfollows at their slower pace', () => {
    expect(
      describeActivity({ type: 'removing', target: 'unfollow', completed: 10, total: 50 }),
    ).toBe('Unfollowing 10 of 50 · about 5 min left')
  })
})

describe('estimateRemovalDuration', () => {
  it('rounds short removals up to a minute', () => {
    expect(estimateRemovalDuration(3, 'items')).toBe('1 min')
  })

  it('estimates from the average time per entry', () => {
    expect(estimateRemovalDuration(42, 'items')).toBe('3 min')
    expect(estimateRemovalDuration(42, 'unfollow')).toBe('5 min')
  })
})

describe('describeActivityAnnouncement', () => {
  it('announces removal progress only at 10% milestones', () => {
    expect(
      describeActivityAnnouncement({ type: 'removing', target: 'items', completed: 12, total: 42 }),
    ).toBe('Removing: 20% done')
    expect(
      describeActivityAnnouncement({ type: 'removing', target: 'items', completed: 13, total: 42 }),
    ).toBe('Removing: 30% done')
  })

  it('describes follower removals with their own wording', () => {
    expect(
      describeActivityAnnouncement({
        type: 'removing',
        target: 'removeFollower',
        completed: 3,
        total: 10,
      }),
    ).toBe('Removing followers: 30% done')
  })

  it('announces unfollow milestones', () => {
    expect(
      describeActivityAnnouncement({ type: 'removing', target: 'unfollow', completed: 5, total: 10 }),
    ).toBe('Unfollowing: 50% done')
  })
})

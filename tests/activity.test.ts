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
      describeActivity({ type: 'capturing', section: { kind: 'like', step: 2, totalSteps: 3 } }),
    ).toBe('Fetching Likes (2 of 3)… the X tab scrolls by itself.')
  })

  it('estimates the time left while removing', () => {
    expect(describeActivity({ type: 'removing', completed: 12, total: 420 })).toBe(
      'Removing 12 of 420 · about 21 min left',
    )
  })

  it('shows hours for long removals', () => {
    expect(describeActivity({ type: 'removing', completed: 0, total: 1500 })).toBe(
      'Removing 0 of 1500 · about 1 hr 15 min left',
    )
  })
})

describe('estimateRemovalDuration', () => {
  it('rounds short removals up to a minute', () => {
    expect(estimateRemovalDuration(3)).toBe('1 min')
  })

  it('estimates from the average time per item', () => {
    expect(estimateRemovalDuration(42)).toBe('3 min')
  })
})

describe('describeActivityAnnouncement', () => {
  it('announces removal progress only at 10% milestones', () => {
    expect(describeActivityAnnouncement({ type: 'removing', completed: 12, total: 42 })).toBe(
      'Removing: 20% done',
    )
    expect(describeActivityAnnouncement({ type: 'removing', completed: 13, total: 42 })).toBe(
      'Removing: 30% done',
    )
  })
})

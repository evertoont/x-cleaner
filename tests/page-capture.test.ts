import { describe, expect, it } from 'vitest'
import { isTimelineOperation } from '../lib/page-capture'

describe('isTimelineOperation', () => {
  it('reads the X search for posts, replies and reposts', () => {
    expect(isTimelineOperation('posts', 'SearchTimeline')).toBe(true)
    expect(isTimelineOperation('replies', 'SearchTimeline')).toBe(true)
    expect(isTimelineOperation('reposts', 'SearchTimeline')).toBe(true)
  })

  it('ignores the X search for likes', () => {
    expect(isTimelineOperation('likes', 'SearchTimeline')).toBe(false)
  })
})

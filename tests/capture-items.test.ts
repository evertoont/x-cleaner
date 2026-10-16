import { describe, expect, it } from 'vitest'
import { buildSectionUrl, selectCaptureModes } from '../lib/capture-items'

describe('selectCaptureModes', () => {
  it('visits one section per selected kind', () => {
    expect(selectCaptureModes(['tweet'])).toEqual(['posts'])
    expect(selectCaptureModes(['reply'])).toEqual(['replies'])
    expect(selectCaptureModes(['retweet'])).toEqual(['reposts'])
    expect(selectCaptureModes(['like'])).toEqual(['likes'])
  })

  it('visits every needed section in a stable order', () => {
    expect(selectCaptureModes(['like', 'retweet', 'reply', 'tweet'])).toEqual([
      'posts',
      'replies',
      'reposts',
      'likes',
    ])
  })

  it('visits nothing when no kind is selected', () => {
    expect(selectCaptureModes([])).toEqual([])
  })
})

describe('buildSectionUrl', () => {
  it('builds the new x-web page for each section', () => {
    const session = { ownerHandle: 'owner', app: 'x-web' } as const

    expect(buildSectionUrl('posts', session)).toBe('https://x.com/owner')
    expect(buildSectionUrl('replies', session)).toBe('https://x.com/owner/with_replies')
    expect(buildSectionUrl('reposts', session)).toBe('https://x.com/owner/reposts')
    expect(buildSectionUrl('likes', session)).toBe('https://x.com/i/history/likes')
  })

  it('builds the legacy responsive-web page for each section', () => {
    const session = { ownerHandle: 'owner', app: 'responsive-web' } as const

    expect(buildSectionUrl('posts', session)).toBe('https://x.com/owner')
    expect(buildSectionUrl('replies', session)).toBe('https://x.com/owner/with_replies')
    expect(buildSectionUrl('reposts', session)).toBe('https://x.com/owner/reposts')
    expect(buildSectionUrl('likes', session)).toBe('https://x.com/owner/likes')
  })
})

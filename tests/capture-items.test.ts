import { describe, expect, it } from 'vitest'
import { buildCapturePages, buildSectionUrl, selectCaptureModes } from '../lib/capture-items'

describe('selectCaptureModes', () => {
  it('visits one section per selected kind', () => {
    expect(selectCaptureModes(['tweet'])).toEqual(['posts'])
    expect(selectCaptureModes(['reply'])).toEqual(['replies'])
    expect(selectCaptureModes(['retweet'])).toEqual(['reposts'])
    expect(selectCaptureModes(['like'])).toEqual(['likes'])
  })

  it('visits every needed section in a stable order', () => {
    expect(
      selectCaptureModes(['followers', 'following', 'like', 'retweet', 'reply', 'tweet']),
    ).toEqual(['posts', 'replies', 'reposts', 'likes', 'following', 'followers'])
  })

  it('visits the people lists only when they are selected', () => {
    expect(selectCaptureModes(['following'])).toEqual(['following'])
    expect(selectCaptureModes(['followers'])).toEqual(['followers'])
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
    expect(buildSectionUrl('following', session)).toBe('https://x.com/owner/following')
    expect(buildSectionUrl('followers', session)).toBe('https://x.com/owner/followers')
  })

  it('builds the legacy responsive-web page for each section', () => {
    const session = { ownerHandle: 'owner', app: 'responsive-web' } as const

    expect(buildSectionUrl('posts', session)).toBe('https://x.com/owner')
    expect(buildSectionUrl('replies', session)).toBe('https://x.com/owner/with_replies')
    expect(buildSectionUrl('reposts', session)).toBe('https://x.com/owner/reposts')
    expect(buildSectionUrl('likes', session)).toBe('https://x.com/owner/likes')
    expect(buildSectionUrl('following', session)).toBe('https://x.com/owner/following')
    expect(buildSectionUrl('followers', session)).toBe('https://x.com/owner/followers')
  })
})

describe('buildCapturePages', () => {
  const session = { ownerHandle: 'owner', app: 'responsive-web' } as const

  it('follows the profile with an X search for posts, replies and reposts', () => {
    expect(buildCapturePages(['posts', 'replies', 'reposts'], session)).toEqual([
      { mode: 'posts', source: 'profile', url: 'https://x.com/owner' },
      {
        mode: 'posts',
        source: 'search',
        url: 'https://x.com/search?q=from%3Aowner%20-filter%3Areplies&src=typed_query&f=live',
      },
      { mode: 'replies', source: 'profile', url: 'https://x.com/owner/with_replies' },
      {
        mode: 'replies',
        source: 'search',
        url: 'https://x.com/search?q=from%3Aowner%20filter%3Areplies&src=typed_query&f=live',
      },
      { mode: 'reposts', source: 'profile', url: 'https://x.com/owner/reposts' },
      {
        mode: 'reposts',
        source: 'search',
        url: 'https://x.com/search?q=from%3Aowner%20filter%3Anativeretweets&src=typed_query&f=live',
      },
    ])
  })

  it('visits only the profile for likes and people lists', () => {
    expect(buildCapturePages(['likes', 'following', 'followers'], session)).toEqual([
      { mode: 'likes', source: 'profile', url: 'https://x.com/owner/likes' },
      { mode: 'following', source: 'profile', url: 'https://x.com/owner/following' },
      { mode: 'followers', source: 'profile', url: 'https://x.com/owner/followers' },
    ])
  })
})

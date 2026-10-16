import { describe, expect, it } from 'vitest'
import { parseTimelineResponse } from '../lib/timeline-parser'
import likesResponse from './fixtures/likes.json'
import newLikesResponse from './fixtures/new-likes.json'
import newRepliesResponse from './fixtures/new-user-replies.json'
import newRepostsResponse from './fixtures/new-user-reposts.json'
import newTweetsResponse from './fixtures/new-user-tweets.json'
import repliesTimelineResponse from './fixtures/user-replies-timeline.json'
import postsResponse from './fixtures/user-tweets-and-replies.json'

describe('parseTimelineResponse — posts', () => {
  const items = parseTimelineResponse(postsResponse, 'posts', 'owner')
  const findItem = (itemId: string) => items.find(item => item.id === itemId)

  it('keeps only items authored by the owner, ignoring handle case', () => {
    expect(items.map(item => item.key)).toEqual([
      'tweet:1001',
      'tweet:1002',
      'retweet:9001',
      'reply:1004',
      'tweet:1005',
    ])
  })

  it('classifies a plain tweet and decodes html entities', () => {
    expect(findItem('1002')).toMatchObject({
      key: 'tweet:1002',
      kind: 'tweet',
      text: 'Café & pão <3',
      createdAt: '2023-01-02T10:00:00.000Z',
      status: 'active',
    })
  })

  it('classifies a retweet by the original id, keeping its own id for removal', () => {
    expect(findItem('9001')).toMatchObject({
      key: 'retweet:9001',
      kind: 'retweet',
      retweetId: '1003',
      text: 'Texto completo do tweet original',
      authorHandle: 'someone',
      createdAt: '2024-03-05T12:00:00.000Z',
    })
  })

  it('classifies a reply and keeps who it replied to', () => {
    expect(findItem('1004')).toMatchObject({
      kind: 'reply',
      replyToHandle: 'other',
    })
  })

  it('unwraps tweets with visibility results and prefers the long-form text', () => {
    expect(findItem('1005')).toMatchObject({
      kind: 'tweet',
      text: 'Texto longo completo de um tweet acima de 280 caracteres',
    })
  })

  it('returns nothing for responses without tweets', () => {
    expect(parseTimelineResponse({ data: {} }, 'posts', 'owner')).toEqual([])
    expect(parseTimelineResponse(undefined, 'posts', 'owner')).toEqual([])
  })
})

describe('parseTimelineResponse — new x-web schema', () => {
  it('reads text and date from details and decodes html entities', () => {
    const items = parseTimelineResponse(newTweetsResponse, 'posts', 'owner')

    expect(items.find(item => item.id === '2001')).toMatchObject({
      key: 'tweet:2001',
      kind: 'tweet',
      text: 'Formato novo & teste',
      createdAt: '2024-01-02T10:00:00.000Z',
    })
  })

  it('classifies a retweet from retweeted_status_results with the original text and author', () => {
    const items = parseTimelineResponse(newTweetsResponse, 'posts', 'owner')

    expect(items.find(item => item.id === '9101')).toMatchObject({
      key: 'retweet:9101',
      kind: 'retweet',
      retweetId: '2002',
      text: 'Texto original completo',
      authorHandle: 'someone',
      createdAt: '2024-03-05T12:00:00.000Z',
    })
  })

  it('reads tweets without a legacy object', () => {
    const items = parseTimelineResponse(newTweetsResponse, 'posts', 'owner')

    expect(items.find(item => item.id === '2003')).toMatchObject({
      kind: 'tweet',
      text: 'Texto longo completo',
    })
  })

  it('classifies a reply from reply_to_results and ignores the parent by someone else', () => {
    const items = parseTimelineResponse(newRepliesResponse, 'replies', 'owner')

    expect(items.find(item => item.id === '3001')).toMatchObject({
      key: 'reply:3001',
      kind: 'reply',
      replyToHandle: 'other',
      createdAt: '2024-06-07T09:00:00.000Z',
    })
    expect(items.some(item => item.id === '9201')).toBe(false)
  })

  it('does not treat empty reply wrappers as replies', () => {
    const items = parseTimelineResponse(newRepliesResponse, 'replies', 'owner')

    expect(items.find(item => item.id === '3002')).toMatchObject({ kind: 'tweet' })
    expect(items.find(item => item.id === '3003')).toMatchObject({ kind: 'tweet' })
  })

  it('reads the reposts tab as retweets, by wrapper or by original tweet', () => {
    const items = parseTimelineResponse(newRepostsResponse, 'reposts', 'owner')

    expect(items).toEqual([
      expect.objectContaining({
        key: 'retweet:9301',
        kind: 'retweet',
        authorHandle: 'someone',
        text: 'Tweet original que eu retweetei',
      }),
      expect.objectContaining({
        key: 'retweet:9302',
        kind: 'retweet',
        authorHandle: 'another',
        text: 'Outro original completo',
        retweetId: '4002',
      }),
    ])
    expect(items[0]?.retweetId).toBeUndefined()
  })

  it('captures liked tweets', () => {
    const items = parseTimelineResponse(newLikesResponse, 'likes', 'owner')

    expect(items).toEqual([
      expect.objectContaining({
        key: 'like:8001',
        kind: 'like',
        text: 'Tweet curtido no formato novo',
        authorHandle: 'someone',
      }),
    ])
  })
})

describe('parseTimelineResponse — replies timeline', () => {
  const items = parseTimelineResponse(repliesTimelineResponse, 'replies', 'owner')

  it('classifies a tweet from someone else’s conversation as a reply without reply fields', () => {
    expect(items.find(item => item.id === '3101')).toMatchObject({
      key: 'reply:3101',
      kind: 'reply',
      text: '@other minha resposta',
      createdAt: '2024-06-01T12:00:00.000Z',
    })
  })

  it('keeps a tweet that starts its own conversation as a tweet', () => {
    expect(items.find(item => item.id === '3102')).toMatchObject({ key: 'tweet:3102', kind: 'tweet' })
  })
})

describe('parseTimelineResponse — likes', () => {
  const items = parseTimelineResponse(likesResponse, 'likes', 'owner')

  it('captures every liked tweet regardless of author', () => {
    expect(items).toEqual([
      expect.objectContaining({ key: 'like:7001', kind: 'like', authorHandle: 'someone' }),
      expect.objectContaining({ key: 'like:7002', kind: 'like', authorHandle: 'owner' }),
    ])
  })
})

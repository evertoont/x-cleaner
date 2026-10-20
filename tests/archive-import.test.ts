import { describe, expect, it } from 'vitest'
import { mergeArchiveItems, parseArchiveTweets } from '../lib/archive-import'
import { ArchiveFileInvalidError } from '../lib/errors'
import { createItem } from '../lib/items'

const TWEETS_FILE = `window.YTD.tweets.part0 = [
  {
    "tweet" : {
      "id_str" : "1511800000000000001",
      "full_text" : "Press F for Eli &amp; friends",
      "created_at" : "Wed Apr 06 21:15:00 +0000 2022",
      "retweeted" : false
    }
  },
  {
    "tweet" : {
      "id_str" : "1511800000000000002",
      "full_text" : "@friend concordo",
      "created_at" : "Thu Apr 07 10:00:00 +0000 2022",
      "in_reply_to_status_id_str" : "1511700000000000000",
      "in_reply_to_screen_name" : "friend",
      "retweeted" : false
    }
  },
  {
    "tweet" : {
      "id_str" : "1511800000000000003",
      "full_text" : "RT @news: Breaking news…",
      "created_at" : "Fri Apr 08 12:30:00 +0000 2022",
      "retweeted" : false
    }
  }
]`

describe('parseArchiveTweets', () => {
  it('reads posts, replies and reposts from tweets.js', () => {
    expect(parseArchiveTweets(TWEETS_FILE, 'tweets.js')).toEqual([
      createItem({
        id: '1511800000000000001',
        kind: 'tweet',
        text: 'Press F for Eli & friends',
        createdAt: '2022-04-06T21:15:00.000Z',
        authorHandle: '',
      }),
      createItem({
        id: '1511800000000000002',
        kind: 'reply',
        text: '@friend concordo',
        createdAt: '2022-04-07T10:00:00.000Z',
        authorHandle: '',
        replyToHandle: 'friend',
      }),
      createItem({
        id: '1511800000000000003',
        kind: 'retweet',
        text: 'Breaking news…',
        createdAt: '2022-04-08T12:30:00.000Z',
        authorHandle: 'news',
        retweetId: '1511800000000000003',
      }),
    ])
  })

  it('accepts the older tweet.js name and later parts', () => {
    const olderFile = TWEETS_FILE.replace('window.YTD.tweets.part0', 'window.YTD.tweet.part0')
    const laterPart = TWEETS_FILE.replace('window.YTD.tweets.part0', 'window.YTD.tweets.part1')

    expect(parseArchiveTweets(olderFile, 'tweet.js')).toHaveLength(3)
    expect(parseArchiveTweets(laterPart, 'tweets-part1.js')).toHaveLength(3)
  })

  it('returns nothing for an archive without posts', () => {
    expect(parseArchiveTweets('window.YTD.tweets.part0 = []', 'tweets.js')).toEqual([])
  })

  it('rejects a file from the archive that is not tweets.js', () => {
    const likesFile = `window.YTD.like.part0 = [
      { "like" : { "tweetId" : "1511800000000000009", "fullText" : "liked post" } }
    ]`

    expect(() => parseArchiveTweets(likesFile, 'like.js')).toThrow(ArchiveFileInvalidError)
  })

  it('rejects a file that is not from the archive', () => {
    expect(() => parseArchiveTweets('just some notes', 'notes.txt')).toThrow(ArchiveFileInvalidError)
  })
})

describe('mergeArchiveItems', () => {
  it('keeps listed items and their failures', () => {
    const failedPost = {
      ...createItem({ id: '1', kind: 'tweet', text: 'old', createdAt: '', authorHandle: 'owner' }),
      status: 'failed' as const,
      errorMessage: 'X refused the removal.',
    }
    const archivePost = createItem({ id: '1', kind: 'tweet', text: 'old', createdAt: '', authorHandle: '' })
    const archiveReply = createItem({ id: '2', kind: 'reply', text: 'new', createdAt: '', authorHandle: '' })

    expect(mergeArchiveItems([failedPost], [archivePost, archiveReply])).toEqual([
      failedPost,
      archiveReply,
    ])
  })

  it('skips reposts already listed by their repost id', () => {
    const capturedRepost = createItem({
      id: 'original-1',
      kind: 'retweet',
      text: 'news',
      createdAt: '',
      authorHandle: 'news',
      retweetId: 'repost-1',
    })
    const archiveRepost = createItem({
      id: 'repost-1',
      kind: 'retweet',
      text: 'news',
      createdAt: '',
      authorHandle: 'news',
      retweetId: 'repost-1',
    })

    expect(mergeArchiveItems([capturedRepost], [archiveRepost])).toEqual([capturedRepost])
  })
})

import { describe, expect, it } from 'vitest'
import { createItem } from '../lib/items'
import type { NewItemFields } from '../lib/items'
import { buildRemovalRequest } from '../lib/removal-operations'

function buildItem(fields: Partial<NewItemFields> & Pick<NewItemFields, 'kind' | 'id'>) {
  return createItem({ text: '', createdAt: '', authorHandle: 'someone', ...fields })
}

describe('buildRemovalRequest', () => {
  it('deletes tweets and replies by their own id', () => {
    expect(buildRemovalRequest(buildItem({ kind: 'tweet', id: '1' }))).toEqual({
      operationName: 'DeleteTweet',
      variables: { tweet_id: '1', dark_request: false },
    })
    expect(buildRemovalRequest(buildItem({ kind: 'reply', id: '2' }))).toMatchObject({
      operationName: 'DeleteTweet',
      variables: { tweet_id: '2' },
    })
  })

  it('deletes a retweet by its own id when it is known', () => {
    expect(buildRemovalRequest(buildItem({ kind: 'retweet', id: '900', retweetId: '3' }))).toEqual({
      operationName: 'DeleteTweet',
      variables: { tweet_id: '3', dark_request: false },
    })
  })

  it('undoes a retweet by the original tweet id when its own id is unknown', () => {
    expect(buildRemovalRequest(buildItem({ kind: 'retweet', id: '900' }))).toEqual({
      operationName: 'DeleteRetweet',
      variables: { source_tweet_id: '900', dark_request: false },
    })
  })

  it('unlikes a liked tweet', () => {
    expect(buildRemovalRequest(buildItem({ kind: 'like', id: '4' }))).toEqual({
      operationName: 'UnfavoriteTweet',
      variables: { tweet_id: '4', dark_request: false },
    })
  })
})

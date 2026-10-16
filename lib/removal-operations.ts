import type { CapturedItem } from './items'

export type RemovalOperationName =
  | 'DeleteTweet'
  | 'DeleteRetweet'
  | 'UnfavoriteTweet'
  | 'RemoveFollower'

export interface RemovalRequest {
  operationName: RemovalOperationName
  variables: Record<string, unknown>
}

export const REMOVAL_QUERY_IDS: Record<RemovalOperationName, string> = {
  DeleteTweet: 'VaenaVgh5q5ih7kvyVjgtg',
  DeleteRetweet: 'iQtK4dl5hBmXewYZuEOKVw',
  UnfavoriteTweet: 'ZYKSe-w7KEslx3JhSIk5LA',
  RemoveFollower: 'QpNfg0kpPRfjROQ_9eOLXA',
}

export function buildRemovalRequest(item: CapturedItem): RemovalRequest {
  if (item.kind === 'like') {
    return { operationName: 'UnfavoriteTweet', variables: { tweet_id: item.id, dark_request: false } }
  }

  if (item.kind !== 'retweet') {
    return buildDeleteTweetRequest(item.id)
  }

  // Apagar o próprio retweet desfaz o retweet; sem o ID dele, desfaz pelo tweet original.
  if (item.retweetId) {
    return buildDeleteTweetRequest(item.retweetId)
  }

  return { operationName: 'DeleteRetweet', variables: { source_tweet_id: item.id, dark_request: false } }
}

function buildDeleteTweetRequest(tweetId: string): RemovalRequest {
  return { operationName: 'DeleteTweet', variables: { tweet_id: tweetId, dark_request: false } }
}

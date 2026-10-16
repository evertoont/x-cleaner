import { createItem } from './items'
import type { CapturedItem, ItemKind } from './items'

export type CaptureMode = 'posts' | 'replies' | 'reposts' | 'likes'

export const CAPTURE_MODE_KIND: Record<CaptureMode, ItemKind> = {
  posts: 'tweet',
  replies: 'reply',
  reposts: 'retweet',
  likes: 'like',
}

interface RawUser {
  core?: { screen_name?: string }
  legacy?: { screen_name?: string }
}

interface RawTweetResults {
  result?: RawTweet
}

interface RawTweetLegacy {
  created_at?: string
  full_text?: string
  in_reply_to_status_id_str?: string
  in_reply_to_screen_name?: string
  retweeted_status_result?: RawTweetResults
  retweeted_status_results?: RawTweetResults
}

interface RawTweet {
  __typename?: string
  rest_id?: string
  tweet?: RawTweet
  core?: { user_results?: { result?: RawUser } }
  details?: { created_at_ms?: number | string; full_text?: string }
  note_tweet?: { note_tweet_results?: { result?: { text?: string } } }
  reply_to_results?: RawTweetResults | null
  reply_to_user_results?: { result?: RawUser } | null
  legacy?: RawTweetLegacy
}

interface ParsedTweet extends RawTweet {
  rest_id: string
}

const TWEET_RESULTS_FIELD = 'tweet_results'

const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
}

export function parseTimelineResponse(
  body: unknown,
  mode: CaptureMode,
  ownerHandle: string,
): CapturedItem[] {
  const tweets = collectTweetResults(body)
    .map(unwrapTweet)
    .filter((tweet): tweet is ParsedTweet => tweet !== undefined)

  if (mode === 'likes') {
    return tweets.map(toLikeItem)
  }

  if (mode === 'reposts') {
    return tweets.flatMap(tweet => toRepostItems(tweet, ownerHandle))
  }

  return tweets
    .filter(tweet => isSameHandle(readAuthorHandle(tweet), ownerHandle))
    .map(toPostItem)
}

function toRepostItems(tweet: ParsedTweet, ownerHandle: string): CapturedItem[] {
  const isOwnTweet = isSameHandle(readAuthorHandle(tweet), ownerHandle)
  const retweetedResults = readRetweetedResults(tweet)

  if (retweetedResults) {
    return isOwnTweet ? [toRetweetItem(tweet, retweetedResults)] : []
  }

  // Na aba Reposts, um tweet de outra pessoa sem invólucro de retweet é o próprio original retweetado.
  if (isOwnTweet) {
    return []
  }

  return [
    createItem({
      id: tweet.rest_id,
      kind: 'retweet',
      text: readText(tweet),
      createdAt: readCreatedAt(tweet),
      authorHandle: readAuthorHandle(tweet),
    }),
  ]
}

function collectTweetResults(node: unknown): RawTweet[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectTweetResults)
  }

  if (!isRecord(node)) {
    return []
  }

  return Object.entries(node).flatMap(([fieldName, fieldValue]) => {
    if (fieldName === TWEET_RESULTS_FIELD && isRecord(fieldValue) && isRecord(fieldValue.result)) {
      return [fieldValue.result as RawTweet]
    }

    return collectTweetResults(fieldValue)
  })
}

function unwrapTweet(result: RawTweet | undefined): ParsedTweet | undefined {
  const tweet = result?.__typename === 'TweetWithVisibilityResults' ? result.tweet : result

  if (!tweet?.rest_id) {
    return undefined
  }

  return tweet as ParsedTweet
}

function toPostItem(tweet: ParsedTweet): CapturedItem {
  const retweetedResults = readRetweetedResults(tweet)

  if (retweetedResults) {
    return toRetweetItem(tweet, retweetedResults)
  }

  const isReply = Boolean(
    tweet.reply_to_results?.result ||
      tweet.reply_to_user_results?.result ||
      tweet.legacy?.in_reply_to_status_id_str,
  )

  return createItem({
    id: tweet.rest_id,
    kind: isReply ? 'reply' : 'tweet',
    text: readText(tweet),
    createdAt: readCreatedAt(tweet),
    authorHandle: readAuthorHandle(tweet),
    replyToHandle: isReply ? readReplyToHandle(tweet) : undefined,
  })
}

function toRetweetItem(retweet: ParsedTweet, retweetedResults: RawTweetResults): CapturedItem {
  const originalTweet = unwrapTweet(retweetedResults.result)

  return createItem({
    id: originalTweet?.rest_id ?? retweet.rest_id,
    kind: 'retweet',
    text: readText(originalTweet ?? retweet),
    createdAt: readCreatedAt(retweet),
    authorHandle: readAuthorHandle(originalTweet ?? retweet),
    retweetId: retweet.rest_id,
  })
}

function readRetweetedResults(tweet: RawTweet): RawTweetResults | undefined {
  return tweet.legacy?.retweeted_status_results ?? tweet.legacy?.retweeted_status_result
}

function toLikeItem(tweet: ParsedTweet): CapturedItem {
  return createItem({
    id: tweet.rest_id,
    kind: 'like',
    text: readText(tweet),
    createdAt: readCreatedAt(tweet),
    authorHandle: readAuthorHandle(tweet),
  })
}

function readAuthorHandle(tweet: RawTweet): string {
  return readUserHandle(tweet.core?.user_results?.result) ?? ''
}

function readReplyToHandle(tweet: RawTweet): string | undefined {
  return readUserHandle(tweet.reply_to_user_results?.result) ?? tweet.legacy?.in_reply_to_screen_name
}

function readUserHandle(user: RawUser | undefined): string | undefined {
  return user?.core?.screen_name ?? user?.legacy?.screen_name
}

function readText(tweet: RawTweet): string {
  const text =
    tweet.note_tweet?.note_tweet_results?.result?.text ??
    tweet.details?.full_text ??
    tweet.legacy?.full_text ??
    ''

  return text.replace(/&(amp|lt|gt|quot|#39);/g, entity => HTML_ENTITIES[entity] ?? entity)
}

function readCreatedAt(tweet: RawTweet): string {
  const createdAtMs = Number(tweet.details?.created_at_ms)
  const hasDetailsDate = Number.isFinite(createdAtMs) && createdAtMs > 0
  const createdAt = hasDetailsDate
    ? new Date(createdAtMs)
    : new Date(tweet.legacy?.created_at ?? '')

  if (Number.isNaN(createdAt.getTime())) {
    return ''
  }

  return createdAt.toISOString()
}

function isSameHandle(handle: string, otherHandle: string): boolean {
  return handle.toLowerCase() === otherHandle.toLowerCase()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

import { decodeHtmlEntities } from './html-entities'

export interface ParsedAccount {
  id: string
  handle: string
  name: string
  bio: string
  avatarUrl: string
  followersCount: number
  followingCount: number
  isVerified: boolean
  isFollowedByOwner?: boolean
  followsOwner?: boolean
}

interface RawUserLegacy {
  screen_name?: string
  name?: string
  description?: string
  profile_image_url_https?: string
  followers_count?: number
  friends_count?: number
  verified?: boolean
  following?: boolean
  followed_by?: boolean
}

interface RawUser {
  __typename?: string
  rest_id?: string
  is_blue_verified?: boolean
  core?: { screen_name?: string; name?: string }
  avatar?: { image_url?: string }
  profile_bio?: { description?: string }
  relationship_counts?: { followers?: number; following?: number }
  relationship_perspectives?: { following?: boolean; followed_by?: boolean }
  verification?: { verified?: boolean }
  legacy?: RawUserLegacy
}

const TIMELINE_USER_TYPE = 'TimelineUser'

export function parseTimelineUsers(body: unknown): ParsedAccount[] {
  return collectTimelineUsers(body)
    .filter((user): user is RawUser & { rest_id: string } => isAvailableUser(user))
    .map(toParsedAccount)
}

function collectTimelineUsers(node: unknown): RawUser[] {
  if (Array.isArray(node)) {
    return node.flatMap(collectTimelineUsers)
  }

  if (!isRecord(node)) {
    return []
  }

  if (isTimelineUserContent(node)) {
    const userResults = node.user_results

    return isRecord(userResults) && isRecord(userResults.result) ? [userResults.result as RawUser] : []
  }

  return Object.values(node).flatMap(collectTimelineUsers)
}

function isTimelineUserContent(node: Record<string, unknown>): boolean {
  return node.__typename === TIMELINE_USER_TYPE || node.itemType === TIMELINE_USER_TYPE
}

function isAvailableUser(user: RawUser): boolean {
  return user.__typename !== 'UserUnavailable' && Boolean(user.rest_id)
}

function toParsedAccount(user: RawUser & { rest_id: string }): ParsedAccount {
  const { legacy } = user

  return {
    id: user.rest_id,
    handle: user.core?.screen_name ?? legacy?.screen_name ?? '',
    name: user.core?.name ?? legacy?.name ?? '',
    bio: decodeHtmlEntities(user.profile_bio?.description ?? legacy?.description ?? ''),
    avatarUrl: user.avatar?.image_url ?? legacy?.profile_image_url_https ?? '',
    followersCount: user.relationship_counts?.followers ?? legacy?.followers_count ?? 0,
    followingCount: user.relationship_counts?.following ?? legacy?.friends_count ?? 0,
    isVerified: Boolean(user.is_blue_verified || user.verification?.verified || legacy?.verified),
    isFollowedByOwner: user.relationship_perspectives?.following ?? legacy?.following,
    followsOwner: user.relationship_perspectives?.followed_by ?? legacy?.followed_by,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

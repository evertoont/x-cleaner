import { messages } from './i18n'
import { ITEM_KINDS } from './items'
import type { ItemKind } from './items'

export type CaptureMode = 'posts' | 'replies' | 'reposts' | 'likes' | 'following' | 'followers'

export type PeopleCaptureMode = Extract<CaptureMode, 'following' | 'followers'>

export type PostCaptureMode = Exclude<CaptureMode, PeopleCaptureMode>

export type CaptureTarget = ItemKind | PeopleCaptureMode

export const CAPTURE_MODES: CaptureMode[] = [
  'posts',
  'replies',
  'reposts',
  'likes',
  'following',
  'followers',
]

export const CAPTURE_TARGETS: CaptureTarget[] = [...ITEM_KINDS, 'following', 'followers']

export const CAPTURE_MODE_TARGET: Record<CaptureMode, CaptureTarget> = {
  posts: 'tweet',
  replies: 'reply',
  reposts: 'retweet',
  likes: 'like',
  following: 'following',
  followers: 'followers',
}

export function isItemKind(target: CaptureTarget): target is ItemKind {
  return ITEM_KINDS.some(kind => kind === target)
}

export function isPeopleCaptureMode(mode: CaptureMode): mode is PeopleCaptureMode {
  return mode === 'following' || mode === 'followers'
}

export function describeCaptureTarget(target: CaptureTarget): string {
  return isItemKind(target) ? messages.kinds[target] : messages.people.captureTargets[target]
}

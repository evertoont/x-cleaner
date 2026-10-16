import type { Account } from './accounts'
import type { CaptureMode } from './capture-modes'
import type { CapturedItem } from './items'
import type { CaptureResult, XSession } from './page-capture'
import type { RemovalResult } from './removal-response'

export type BridgeRequest =
  | { type: 'detect-handle' }
  | { type: 'capture'; mode: CaptureMode; ownerHandle: string }
  | { type: 'stop-capture' }
  | { type: 'remove'; item: CapturedItem }
  | { type: 'unfollow'; account: Account }
  | { type: 'remove-follower'; account: Account }

export type RemovalBridgeRequest = Extract<
  BridgeRequest,
  { type: 'remove' | 'unfollow' | 'remove-follower' }
>

export interface BridgeResponses {
  'detect-handle': XSession | null
  capture: CaptureResult
  'stop-capture': true
  remove: RemovalResult
  unfollow: RemovalResult
  'remove-follower': RemovalResult
}

const BRIDGE_REQUEST_TYPES: BridgeRequest['type'][] = [
  'detect-handle',
  'capture',
  'stop-capture',
  'remove',
  'unfollow',
  'remove-follower',
]

export function isBridgeRequest(message: unknown): message is BridgeRequest {
  if (typeof message !== 'object' || message === null || !('type' in message)) {
    return false
  }

  return BRIDGE_REQUEST_TYPES.includes(message.type as BridgeRequest['type'])
}

import type { CapturedItem } from './items'
import type { CaptureResult, XSession } from './page-capture'
import type { RemovalResult } from './removal-response'
import type { CaptureMode } from './timeline-parser'

export type BridgeRequest =
  | { type: 'detect-handle' }
  | { type: 'capture'; mode: CaptureMode; ownerHandle: string }
  | { type: 'stop-capture' }
  | { type: 'remove'; item: CapturedItem }

export type RemovalBridgeRequest = Extract<BridgeRequest, { type: 'remove' }>

export interface BridgeResponses {
  'detect-handle': XSession | null
  capture: CaptureResult
  'stop-capture': true
  remove: RemovalResult
}

const BRIDGE_REQUEST_TYPES: BridgeRequest['type'][] = [
  'detect-handle',
  'capture',
  'stop-capture',
  'remove',
]

export function isBridgeRequest(message: unknown): message is BridgeRequest {
  if (typeof message !== 'object' || message === null || !('type' in message)) {
    return false
  }

  return BRIDGE_REQUEST_TYPES.includes(message.type as BridgeRequest['type'])
}

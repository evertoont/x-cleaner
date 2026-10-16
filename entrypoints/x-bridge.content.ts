import { browser } from 'wxt/browser'
import { defineContentScript } from 'wxt/utils/define-content-script'
import { requestRemoveFollower, requestUnfollow } from '../lib/account-requests'
import { isBridgeRequest } from '../lib/bridge-messages'
import type { BridgeRequest, BridgeResponses } from '../lib/bridge-messages'
import { captureTimeline, detectSession, stopCapture } from '../lib/page-capture'
import { isGraphqlResponseMessage } from '../lib/page-messages'
import type { GraphqlResponseMessage } from '../lib/page-messages'
import { watchRemovalBadge } from '../lib/removal-badge'
import { requestRemoval } from '../lib/removal-request'

export default defineContentScript({
  matches: ['https://x.com/*'],
  runAt: 'document_start',
  main() {
    const receivedResponses: GraphqlResponseMessage[] = []

    window.addEventListener('message', event => {
      if (event.source !== window || !isGraphqlResponseMessage(event.data)) {
        return
      }

      receivedResponses.push(event.data)
    })

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (!isBridgeRequest(message)) {
        return false
      }

      handleBridgeRequest(message, receivedResponses)
        .then(sendResponse)
        .catch(() => sendResponse(undefined))

      return true
    })

    watchRemovalBadge()
  },
})

function handleBridgeRequest(
  request: BridgeRequest,
  receivedResponses: GraphqlResponseMessage[],
): Promise<BridgeResponses[BridgeRequest['type']]> {
  if (request.type === 'ping') {
    return Promise.resolve(true)
  }

  if (request.type === 'detect-handle') {
    return detectSession()
  }

  if (request.type === 'capture') {
    return captureTimeline(receivedResponses, request.mode, request.ownerHandle)
  }

  if (request.type === 'stop-capture') {
    stopCapture()
    return Promise.resolve(true)
  }

  if (request.type === 'unfollow') {
    return requestUnfollow(request.account)
  }

  if (request.type === 'remove-follower') {
    return requestRemoveFollower(request.account)
  }

  return requestRemoval(request.item)
}

import { defineContentScript } from 'wxt/utils/define-content-script'
import { readGraphqlOperationName } from '../lib/graphql-url'
import { PAGE_MESSAGE_SOURCE } from '../lib/page-messages'
import type { GraphqlResponseMessage } from '../lib/page-messages'

export default defineContentScript({
  matches: ['https://x.com/*'],
  runAt: 'document_start',
  world: 'MAIN',
  main() {
    interceptXhrResponses()
    interceptFetchResponses()
  },
})

function interceptXhrResponses(): void {
  const originalOpen = XMLHttpRequest.prototype.open

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    ...remainingArgs: unknown[]
  ) {
    const operationName = readGraphqlOperationName(String(url))

    if (operationName) {
      this.addEventListener('load', () => forwardResponse(operationName, readXhrBody(this)))
    }

    return Reflect.apply(originalOpen, this, [method, url, ...remainingArgs])
  } as XMLHttpRequest['open']
}

function interceptFetchResponses(): void {
  const originalFetch = window.fetch

  window.fetch = async (...fetchArgs: Parameters<typeof fetch>) => {
    const response = await originalFetch(...fetchArgs)
    const operationName = readGraphqlOperationName(readRequestUrl(fetchArgs[0]))

    if (operationName) {
      response
        .clone()
        .text()
        .then(responseText => forwardResponse(operationName, responseText))
        .catch(() => undefined)
    }

    return response
  }
}

function readRequestUrl(input: RequestInfo | URL): string {
  return input instanceof Request ? input.url : String(input)
}

function readXhrBody(request: XMLHttpRequest): unknown {
  const isTextResponse = request.responseType === '' || request.responseType === 'text'

  return isTextResponse ? request.responseText : request.response
}

function forwardResponse(operationName: string, body: unknown): void {
  const message: GraphqlResponseMessage = { source: PAGE_MESSAGE_SOURCE, operationName, body }

  window.postMessage(message, location.origin)
}

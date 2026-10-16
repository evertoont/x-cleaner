export const PAGE_MESSAGE_SOURCE = 'x-cleaner'

export interface GraphqlResponseMessage {
  source: typeof PAGE_MESSAGE_SOURCE
  operationName: string
  body: unknown
}

export function isGraphqlResponseMessage(data: unknown): data is GraphqlResponseMessage {
  if (typeof data !== 'object' || data === null) {
    return false
  }

  return 'source' in data && data.source === PAGE_MESSAGE_SOURCE && 'operationName' in data
}

const URL_BASE = 'https://x.com'

// Cobre o app novo (api.x.com/graphql/<id>/<operação>) e o antigo (x.com/i/api/graphql/<id>/<operação>).
const GRAPHQL_OPERATION_PATTERN = /\/graphql\/[^/]+\/([^/]+)$/

export function readGraphqlOperationName(requestUrl: string): string | undefined {
  const pathname = readPathname(requestUrl)

  return pathname?.match(GRAPHQL_OPERATION_PATTERN)?.[1]
}

function readPathname(requestUrl: string): string | undefined {
  try {
    return new URL(requestUrl, URL_BASE).pathname
  } catch {
    return undefined
  }
}

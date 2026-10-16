import { messages } from './i18n'
import { interpretRemovalResponse } from './removal-response'
import type { RemovalResult } from './removal-response'

export interface XPostRequest {
  path: string
  body: string
  contentType: string
}

const PUBLIC_WEB_BEARER_TOKEN =
  'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA'

const CSRF_COOKIE_NAME = 'ct0'
const REQUEST_TIMEOUT_MS = 15_000
const TRANSACTION_ID_LENGTH = 95
const TRANSACTION_ID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export interface XGraphqlMutation {
  operationName: string
  queryId: string
  variables: Record<string, unknown>
}

export function postGraphqlMutation(mutation: XGraphqlMutation): Promise<RemovalResult> {
  const { operationName, queryId, variables } = mutation

  return postToX({
    path: `/i/api/graphql/${queryId}/${operationName}`,
    body: JSON.stringify({ variables, queryId }),
    contentType: 'application/json',
  })
}

export async function postToX(request: XPostRequest): Promise<RemovalResult> {
  const csrfToken = readCookie(CSRF_COOKIE_NAME)

  if (!csrfToken) {
    return { status: 'session-expired' }
  }

  try {
    const response = await fetch(`${location.origin}${request.path}`, {
      method: 'POST',
      credentials: 'include',
      headers: buildHeaders(csrfToken, request.contentType),
      body: request.body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    return interpretRemovalResponse({
      httpStatus: response.status,
      rateLimitReset: response.headers.get('x-rate-limit-reset'),
      body: await readJsonBody(response),
    })
  } catch {
    return { status: 'failed', message: messages.errors.network }
  }
}

function buildHeaders(csrfToken: string, contentType: string): HeadersInit {
  return {
    authorization: `Bearer ${PUBLIC_WEB_BEARER_TOKEN}`,
    'content-type': contentType,
    'x-client-transaction-id': createTransactionId(),
    'x-csrf-token': csrfToken,
    'x-twitter-active-user': 'yes',
    'x-twitter-auth-type': 'OAuth2Session',
  }
}

// O X exige o cabeçalho de transação, mas aceita um valor aleatório (mesma estratégia do TweetXer).
function createTransactionId(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(TRANSACTION_ID_LENGTH))

  return Array.from(
    randomBytes,
    randomByte => TRANSACTION_ID_ALPHABET[randomByte % TRANSACTION_ID_ALPHABET.length],
  ).join('')
}

function readCookie(cookieName: string): string | undefined {
  const cookiePrefix = `${cookieName}=`
  const cookie = document.cookie
    .split('; ')
    .find(cookieEntry => cookieEntry.startsWith(cookiePrefix))

  return cookie?.slice(cookiePrefix.length)
}

async function readJsonBody(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

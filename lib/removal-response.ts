import { messages } from './i18n'

export type RemovalResult =
  | { status: 'removed' }
  | { status: 'rate-limited'; retryAt?: number }
  | { status: 'session-expired' }
  | { status: 'account-locked' }
  | { status: 'failed'; message: string }

export interface RemovalResponse {
  httpStatus: number
  rateLimitReset: string | null
  body: unknown
}

interface GraphqlError {
  code?: number
  message?: string
}

const RATE_LIMIT_ERROR_CODE = 88
const ACCOUNT_LOCKED_ERROR_CODE = 326
const NOT_FOUND_ERROR_CODES = [34, 144]

export function interpretRemovalResponse(response: RemovalResponse): RemovalResult {
  const { httpStatus, rateLimitReset, body } = response

  if (httpStatus === 429) {
    return { status: 'rate-limited', retryAt: parseRateLimitReset(rateLimitReset) }
  }

  if (httpStatus === 401) {
    return { status: 'session-expired' }
  }

  const errors = readGraphqlErrors(body)

  if (errors.some(error => error.code === RATE_LIMIT_ERROR_CODE)) {
    return { status: 'rate-limited', retryAt: parseRateLimitReset(rateLimitReset) }
  }

  if (errors.some(error => error.code === ACCOUNT_LOCKED_ERROR_CODE)) {
    return { status: 'account-locked' }
  }

  // Item que já não existe no X conta como removido.
  if (errors.some(isNotFoundError)) {
    return { status: 'removed' }
  }

  const [firstError] = errors

  if (firstError) {
    return { status: 'failed', message: firstError.message ?? messages.errors.removalRejected }
  }

  if (httpStatus >= 400) {
    return { status: 'failed', message: messages.errors.removalHttpError(httpStatus) }
  }

  return { status: 'removed' }
}

function readGraphqlErrors(body: unknown): GraphqlError[] {
  if (typeof body !== 'object' || body === null || !('errors' in body)) {
    return []
  }

  return Array.isArray(body.errors) ? body.errors : []
}

function isNotFoundError(error: GraphqlError): boolean {
  if (error.code !== undefined && NOT_FOUND_ERROR_CODES.includes(error.code)) {
    return true
  }

  return /not found/i.test(error.message ?? '')
}

function parseRateLimitReset(rateLimitReset: string | null): number | undefined {
  const resetEpochSeconds = Number(rateLimitReset)

  if (!rateLimitReset || !Number.isFinite(resetEpochSeconds)) {
    return undefined
  }

  return resetEpochSeconds * 1000
}

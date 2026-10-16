import { describe, expect, it } from 'vitest'
import { interpretRemovalResponse } from '../lib/removal-response'

describe('interpretRemovalResponse', () => {
  it('treats a successful response as removed', () => {
    const result = interpretRemovalResponse({
      httpStatus: 200,
      rateLimitReset: null,
      body: { data: { delete_tweet: { tweet_results: {} } } },
    })

    expect(result).toEqual({ status: 'removed' })
  })

  it('reports rate limit with the reset time from the header', () => {
    const result = interpretRemovalResponse({
      httpStatus: 429,
      rateLimitReset: '1760000000',
      body: undefined,
    })

    expect(result).toEqual({ status: 'rate-limited', retryAt: 1_760_000_000_000 })
  })

  it('reports rate limit without reset time when the header is missing', () => {
    const result = interpretRemovalResponse({
      httpStatus: 200,
      rateLimitReset: null,
      body: { errors: [{ code: 88, message: 'Rate limit exceeded' }] },
    })

    expect(result).toEqual({ status: 'rate-limited', retryAt: undefined })
  })

  it('treats an item that no longer exists as removed', () => {
    const result = interpretRemovalResponse({
      httpStatus: 200,
      rateLimitReset: null,
      body: { errors: [{ code: 144, message: 'No status found with that ID.' }] },
    })

    expect(result).toEqual({ status: 'removed' })
  })

  it('reports an expired session on 401', () => {
    const result = interpretRemovalResponse({ httpStatus: 401, rateLimitReset: null, body: undefined })

    expect(result).toEqual({ status: 'session-expired' })
  })

  it('reports other graphql errors as failures with their message', () => {
    const result = interpretRemovalResponse({
      httpStatus: 200,
      rateLimitReset: null,
      body: { errors: [{ code: 200, message: 'Forbidden.' }] },
    })

    expect(result).toEqual({ status: 'failed', message: 'Forbidden.' })
  })

  it('reports http errors without body as failures', () => {
    const result = interpretRemovalResponse({ httpStatus: 404, rateLimitReset: null, body: undefined })

    expect(result).toEqual({ status: 'failed', message: 'X responded with error 404.' })
  })

  it('reports a locked account so the queue can stop', () => {
    const result = interpretRemovalResponse({
      httpStatus: 403,
      rateLimitReset: null,
      body: { errors: [{ code: 326, message: 'To protect our users from spam…' }] },
    })

    expect(result).toEqual({ status: 'account-locked' })
  })
})

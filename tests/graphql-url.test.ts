import { describe, expect, it } from 'vitest'
import { readGraphqlOperationName } from '../lib/graphql-url'

describe('readGraphqlOperationName', () => {
  it('reads the operation from the new api.x.com endpoint', () => {
    const requestUrl = 'https://api.x.com/graphql/6-W2tOomT-Jyu0_uTzLVUw/UserRepliesTimeline?variables=%7B%7D'

    expect(readGraphqlOperationName(requestUrl)).toBe('UserRepliesTimeline')
  })

  it('reads the operation from the legacy x.com endpoint', () => {
    const requestUrl = 'https://x.com/i/api/graphql/VaenaVgh5q5ih7kvyVjgtg/DeleteTweet'

    expect(readGraphqlOperationName(requestUrl)).toBe('DeleteTweet')
  })

  it('reads the operation from a relative legacy path', () => {
    expect(readGraphqlOperationName('/i/api/graphql/abc/Likes?variables=%7B%7D')).toBe('Likes')
  })

  it('ignores requests that are not graphql operations', () => {
    expect(readGraphqlOperationName('https://x.com/1.1/graphql/viewer_context.json')).toBeUndefined()
    expect(readGraphqlOperationName('https://abs.twimg.com/x-web/x-web/assets/startup.js')).toBeUndefined()
  })

  it('ignores urls that cannot be parsed', () => {
    expect(readGraphqlOperationName('http://[invalid')).toBeUndefined()
  })
})

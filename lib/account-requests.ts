import type { Account } from './accounts'
import { REMOVAL_QUERY_IDS } from './removal-operations'
import type { RemovalResult } from './removal-response'
import { postGraphqlMutation, postToX } from './x-api'

const UNFOLLOW_PATH = '/i/api/1.1/friendships/destroy.json'

export function requestUnfollow(account: Account): Promise<RemovalResult> {
  return postToX({
    path: UNFOLLOW_PATH,
    body: new URLSearchParams({ user_id: account.id }).toString(),
    contentType: 'application/x-www-form-urlencoded',
  })
}

export function requestRemoveFollower(account: Account): Promise<RemovalResult> {
  return postGraphqlMutation({
    operationName: 'RemoveFollower',
    queryId: REMOVAL_QUERY_IDS.RemoveFollower,
    variables: { target_user_id: account.id },
  })
}

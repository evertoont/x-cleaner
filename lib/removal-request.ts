import type { CapturedItem } from './items'
import { buildRemovalRequest, REMOVAL_QUERY_IDS } from './removal-operations'
import type { RemovalResult } from './removal-response'
import { postGraphqlMutation } from './x-api'

export function requestRemoval(item: CapturedItem): Promise<RemovalResult> {
  const { operationName, variables } = buildRemovalRequest(item)

  return postGraphqlMutation({ operationName, queryId: REMOVAL_QUERY_IDS[operationName], variables })
}

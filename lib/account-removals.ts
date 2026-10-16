import {
  countRemainingActions,
  DAILY_ACCOUNT_ACTION_LIMITS,
  findQuotaResumeTime,
  listRecentActions,
} from './account-quota'
import type { Account, AccountAction } from './accounts'
import type { RemovalBridgeRequest } from './bridge-messages'
import { accountActionLogStorages } from './item-storage'
import { ACCOUNT_ACTION_INTERVAL } from './removal-pace'
import { runRemovalQueue } from './removal-queue'
import type { SettledRemoval } from './removal-queue'

export interface AccountRemovalPlan {
  accountsToProcess: Account[]
  heldBackCount: number
  quotaResumeAt: Date
}

interface RunAccountRemovalsOptions {
  action: AccountAction
  accounts: Account[]
  signal: AbortSignal
  onAccountSettled: (account: Account, removal: SettledRemoval) => void
  onRateLimited: (resumeAt: Date) => void
}

export async function planAccountRemovals(
  action: AccountAction,
  selectedAccounts: Account[],
): Promise<AccountRemovalPlan> {
  const now = Date.now()
  const dailyLimit = DAILY_ACCOUNT_ACTION_LIMITS[action]

  if (dailyLimit === undefined) {
    return { accountsToProcess: selectedAccounts, heldBackCount: 0, quotaResumeAt: new Date(now) }
  }

  const actionLog = await accountActionLogStorages[action].getValue()
  const remainingCount = countRemainingActions(actionLog, now, dailyLimit)
  const accountsToProcess = selectedAccounts.slice(0, remainingCount)

  return {
    accountsToProcess,
    heldBackCount: selectedAccounts.length - accountsToProcess.length,
    quotaResumeAt: findQuotaResumeTime(actionLog, now),
  }
}

export function runAccountRemovals(options: RunAccountRemovalsOptions): Promise<void> {
  const { action, accounts, signal, onAccountSettled, onRateLimited } = options

  return runRemovalQueue({
    entries: accounts,
    interval: ACCOUNT_ACTION_INTERVAL,
    signal,
    buildRequest: account => buildAccountRequest(action, account),
    onEntrySettled: (account, removal) => {
      if (removal.status === 'removed') {
        void recordAction(action)
      }

      onAccountSettled(account, removal)
    },
    onRateLimited,
  })
}

function buildAccountRequest(action: AccountAction, account: Account): RemovalBridgeRequest {
  if (action === 'unfollow') {
    return { type: 'unfollow', account }
  }

  return { type: 'remove-follower', account }
}

async function recordAction(action: AccountAction): Promise<void> {
  const now = Date.now()
  const actionLogStorage = accountActionLogStorages[action]
  const actionLog = await actionLogStorage.getValue()

  await actionLogStorage.setValue([...listRecentActions(actionLog, now), now])
}

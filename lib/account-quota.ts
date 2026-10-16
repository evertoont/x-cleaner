import type { AccountAction } from './accounts'

// O X não publica limites para unfollows ou remoção de seguidores; 250 unfollows por dia é um teto conservador
// para não parecer automação. Remover seguidores fica sem teto por decisão de produto.
export const DAILY_ACCOUNT_ACTION_LIMITS: Partial<Record<AccountAction, number>> = {
  unfollow: 250,
}

const QUOTA_WINDOW_MS = 24 * 60 * 60_000

export function listRecentActions(actionTimestamps: number[], now: number): number[] {
  return actionTimestamps
    .filter(timestamp => now - timestamp < QUOTA_WINDOW_MS)
    .sort((first, second) => first - second)
}

export function countRemainingActions(
  actionTimestamps: number[],
  now: number,
  dailyLimit: number,
): number {
  const recentCount = listRecentActions(actionTimestamps, now).length

  return Math.max(0, dailyLimit - recentCount)
}

export function findQuotaResumeTime(actionTimestamps: number[], now: number): Date {
  const [oldestRecentAction] = listRecentActions(actionTimestamps, now)

  return new Date((oldestRecentAction ?? now) + QUOTA_WINDOW_MS)
}

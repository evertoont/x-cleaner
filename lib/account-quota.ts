// O X não publica limites para unfollows ou remoção de seguidores; 150 por dia por ação é um teto conservador
// para não parecer automação.
export const DAILY_ACCOUNT_ACTION_LIMIT = 150

const QUOTA_WINDOW_MS = 24 * 60 * 60_000

export function listRecentActions(actionTimestamps: number[], now: number): number[] {
  return actionTimestamps
    .filter(timestamp => now - timestamp < QUOTA_WINDOW_MS)
    .sort((first, second) => first - second)
}

export function countRemainingActions(actionTimestamps: number[], now: number): number {
  const recentCount = listRecentActions(actionTimestamps, now).length

  return Math.max(0, DAILY_ACCOUNT_ACTION_LIMIT - recentCount)
}

export function findQuotaResumeTime(actionTimestamps: number[], now: number): Date {
  const [oldestRecentAction] = listRecentActions(actionTimestamps, now)

  return new Date((oldestRecentAction ?? now) + QUOTA_WINDOW_MS)
}

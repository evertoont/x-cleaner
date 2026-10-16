import type { AccountAction } from './accounts'
import type { CaptureSection } from './capture-items'
import { describeCaptureTarget } from './capture-modes'
import { LOCALE, messages } from './i18n'
import { ESTIMATED_MS_PER_ACCOUNT_ACTION, ESTIMATED_MS_PER_REMOVAL } from './removal-pace'

export type RemovalTarget = 'items' | AccountAction

export type Activity =
  | { type: 'idle' }
  | { type: 'capturing'; section?: CaptureSection }
  | {
      type: 'removing'
      target: RemovalTarget
      completed: number
      total: number
      resumeAt?: Date
    }

export interface Notice {
  message: string
  tone: 'info' | 'error'
  details?: string
}

const MINUTE_MS = 60_000
const MINUTES_PER_HOUR = 60

const ESTIMATED_MS_PER_ENTRY: Record<RemovalTarget, number> = {
  items: ESTIMATED_MS_PER_REMOVAL,
  unfollow: ESTIMATED_MS_PER_ACCOUNT_ACTION,
  removeFollower: ESTIMATED_MS_PER_ACCOUNT_ACTION,
}

const timeFormatter = new Intl.DateTimeFormat(LOCALE, { timeStyle: 'short' })
const minuteFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'unit',
  unit: 'minute',
  unitDisplay: 'short',
})
const hourFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'unit',
  unit: 'hour',
  unitDisplay: 'short',
})

export function describeActivity(activity: Activity): string | null {
  if (activity.type === 'idle') {
    return null
  }

  if (activity.type === 'capturing') {
    return describeCapture(activity.section)
  }

  const progress = describeRemovalProgress(activity.target, activity.completed, activity.total)
  const remainingCount = activity.total - activity.completed

  if (activity.resumeAt) {
    return `${progress} · ${describeRateLimit(activity.resumeAt)}`
  }

  if (remainingCount === 0) {
    return progress
  }

  const timeLeft = estimateRemovalDuration(remainingCount, activity.target)

  return `${progress} · ${messages.activity.timeLeft(timeLeft)}`
}

// Leitores de tela anunciam cada mudança da região de status; na exclusão, só os marcos de 10% são anunciados.
export function describeActivityAnnouncement(activity: Activity): string | null {
  if (activity.type !== 'removing') {
    return describeActivity(activity)
  }

  const completedRatio = activity.total === 0 ? 0 : activity.completed / activity.total
  const percentDone = Math.floor(completedRatio * 10) * 10
  const milestone =
    activity.target === 'items'
      ? messages.activity.removalMilestone(percentDone)
      : messages.accountActions[activity.target].milestone(percentDone)

  if (!activity.resumeAt) {
    return milestone
  }

  return `${milestone} · ${describeRateLimit(activity.resumeAt)}`
}

export function estimateRemovalDuration(entryCount: number, target: RemovalTarget): string {
  return formatDuration(entryCount * ESTIMATED_MS_PER_ENTRY[target])
}

function describeCapture(section: CaptureSection | undefined): string {
  if (!section) {
    return messages.activity.openingX
  }

  return messages.activity.capturing(
    describeCaptureTarget(section.target),
    section.step,
    section.totalSteps,
  )
}

function describeRemovalProgress(target: RemovalTarget, completed: number, total: number): string {
  if (target === 'items') {
    return messages.activity.removing(completed, total)
  }

  return messages.accountActions[target].progress(completed, total)
}

function describeRateLimit(resumeAt: Date): string {
  return messages.activity.rateLimited(timeFormatter.format(resumeAt))
}

function formatDuration(durationMs: number): string {
  const totalMinutes = Math.max(1, Math.ceil(durationMs / MINUTE_MS))
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
  const minutes = totalMinutes % MINUTES_PER_HOUR

  if (hours === 0) {
    return minuteFormatter.format(minutes)
  }

  if (minutes === 0) {
    return hourFormatter.format(hours)
  }

  return `${hourFormatter.format(hours)} ${minuteFormatter.format(minutes)}`
}

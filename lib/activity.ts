import type { CaptureSection } from './capture-items'
import { LOCALE, messages } from './i18n'
import { ESTIMATED_MS_PER_REMOVAL } from './remove-items'

export type Activity =
  | { type: 'idle' }
  | { type: 'capturing'; section?: CaptureSection }
  | { type: 'removing'; completed: number; total: number; resumeAt?: Date }

export interface Notice {
  message: string
  tone: 'info' | 'error'
  details?: string
}

const MINUTE_MS = 60_000
const MINUTES_PER_HOUR = 60

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

  const progress = messages.activity.removing(activity.completed, activity.total)
  const remainingCount = activity.total - activity.completed

  if (activity.resumeAt) {
    return `${progress} · ${describeRateLimit(activity.resumeAt)}`
  }

  if (remainingCount === 0) {
    return progress
  }

  return `${progress} · ${messages.activity.timeLeft(estimateRemovalDuration(remainingCount))}`
}

export function estimateRemovalDuration(itemCount: number): string {
  return formatDuration(itemCount * ESTIMATED_MS_PER_REMOVAL)
}

// Leitores de tela anunciam cada mudança da região de status; na exclusão, só os marcos de 10% são anunciados.
export function describeActivityAnnouncement(activity: Activity): string | null {
  if (activity.type !== 'removing') {
    return describeActivity(activity)
  }

  const completedRatio = activity.total === 0 ? 0 : activity.completed / activity.total
  const milestone = messages.activity.removalMilestone(Math.floor(completedRatio * 10) * 10)

  if (!activity.resumeAt) {
    return milestone
  }

  return `${milestone} · ${describeRateLimit(activity.resumeAt)}`
}

function describeCapture(section: CaptureSection | undefined): string {
  if (!section) {
    return messages.activity.openingX
  }

  return messages.activity.capturing(messages.kinds[section.kind], section.step, section.totalSteps)
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

import { en } from './messages/en'
import type { Messages } from './messages/en'
import { pt } from './messages/pt'

const isPortuguese = (globalThis.navigator?.language ?? 'en').toLowerCase().startsWith('pt')

export const LOCALE = isPortuguese ? 'pt-BR' : 'en'

export const messages: Messages = isPortuguese ? pt : en

const listFormatter = new Intl.ListFormat(LOCALE, { type: 'conjunction' })
const compactNumberFormatter = new Intl.NumberFormat(LOCALE, {
  notation: 'compact',
  maximumFractionDigits: 1,
})
const dayAndTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

export function formatList(parts: string[]): string {
  return listFormatter.format(parts)
}

export function formatCompactNumber(count: number): string {
  return compactNumberFormatter.format(count)
}

export function formatDayAndTime(date: Date): string {
  return dayAndTimeFormatter.format(date)
}

export function capitalizeFirstLetter(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

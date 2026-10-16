import { en } from './messages/en'
import type { Messages } from './messages/en'
import { pt } from './messages/pt'

const isPortuguese = (globalThis.navigator?.language ?? 'en').toLowerCase().startsWith('pt')

export const LOCALE = isPortuguese ? 'pt-BR' : 'en'

export const messages: Messages = isPortuguese ? pt : en

const listFormatter = new Intl.ListFormat(LOCALE, { type: 'conjunction' })

export function formatList(parts: string[]): string {
  return listFormatter.format(parts)
}

export function capitalizeFirstLetter(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

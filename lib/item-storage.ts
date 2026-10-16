import { storage } from 'wxt/utils/storage'
import type { CapturedItem } from './items'

export const itemsStorage = storage.defineItem<CapturedItem[]>('local:items', {
  fallback: [],
})

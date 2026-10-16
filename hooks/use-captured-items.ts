import { useCallback } from 'react'
import { itemsStorage } from '../lib/item-storage'
import type { CapturedItem } from '../lib/items'
import { useStoredValue } from './use-stored-value'

export function useCapturedItems() {
  const { value: items, isLoaded } = useStoredValue(itemsStorage)

  const replaceItems = useCallback(
    async (updateItems: (currentItems: CapturedItem[]) => CapturedItem[]) => {
      const storedItems = await itemsStorage.getValue()

      await itemsStorage.setValue(updateItems(storedItems))
    },
    [],
  )

  return { items, isLoaded, replaceItems }
}

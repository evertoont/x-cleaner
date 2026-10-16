import { useCallback, useEffect, useState } from 'react'
import { itemsStorage } from '../lib/item-storage'
import type { CapturedItem } from '../lib/items'

export function useCapturedItems() {
  const [items, setItems] = useState<CapturedItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    void itemsStorage.getValue().then(storedItems => {
      setItems(storedItems)
      setIsLoaded(true)
    })
  }, [])

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    void itemsStorage.setValue(items)
  }, [items, isLoaded])

  const removeItem = useCallback((itemKey: string) => {
    setItems(currentItems => currentItems.filter(item => item.key !== itemKey))
  }, [])

  const markItemFailed = useCallback((itemKey: string, errorMessage: string) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.key === itemKey ? { ...item, status: 'failed', errorMessage } : item,
      ),
    )
  }, [])

  return { items, isLoaded, replaceItems: setItems, removeItem, markItemFailed }
}

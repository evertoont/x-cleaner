import { useCallback, useState } from 'react'

export function useSelection() {
  const [selectedKeys, setSelectedKeys] = useState<ReadonlySet<string>>(new Set())

  const toggleKey = useCallback((itemKey: string) => {
    setSelectedKeys(currentKeys => {
      const nextKeys = new Set(currentKeys)

      if (nextKeys.has(itemKey)) {
        nextKeys.delete(itemKey)
        return nextKeys
      }

      nextKeys.add(itemKey)
      return nextKeys
    })
  }, [])

  const selectKeys = useCallback((itemKeys: string[]) => {
    setSelectedKeys(currentKeys => new Set([...currentKeys, ...itemKeys]))
  }, [])

  const deselectKeys = useCallback((itemKeys: string[]) => {
    setSelectedKeys(currentKeys => {
      const nextKeys = new Set(currentKeys)

      itemKeys.forEach(itemKey => nextKeys.delete(itemKey))

      return nextKeys
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set())
  }, [])

  return { selectedKeys, toggleKey, selectKeys, deselectKeys, clearSelection }
}

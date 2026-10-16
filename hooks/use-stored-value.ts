import { useCallback, useEffect, useState } from 'react'
import type { WxtStorageItem } from 'wxt/utils/storage'

type StoredValueSource<Value> = Pick<
  WxtStorageItem<Value, Record<string, unknown>>,
  'fallback' | 'getValue' | 'setValue' | 'watch'
>

// O background também grava nesses valores; a tela só acompanha o armazenamento, sem regravar o que leu.
export function useStoredValue<Value>(storageItem: StoredValueSource<Value>) {
  const [value, setValue] = useState<Value>(storageItem.fallback)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    void storageItem.getValue().then(storedValue => {
      setValue(storedValue)
      setIsLoaded(true)
    })

    return storageItem.watch(storedValue => setValue(storedValue))
  }, [storageItem])

  const saveValue = useCallback(
    (nextValue: Value) => {
      setValue(nextValue)
      void storageItem.setValue(nextValue)
    },
    [storageItem],
  )

  return { value, isLoaded, saveValue }
}

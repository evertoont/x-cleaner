import { useCallback } from 'react'
import type { Account, PeopleList } from '../lib/accounts'
import { accountListStorages } from '../lib/item-storage'
import { useStoredValue } from './use-stored-value'

export function useAccountList(list: PeopleList) {
  const accountListStorage = accountListStorages[list]
  const { value: accounts, isLoaded } = useStoredValue(accountListStorage)

  const replaceAccounts = useCallback(
    async (updateAccounts: (currentAccounts: Account[]) => Account[]) => {
      const storedAccounts = await accountListStorage.getValue()

      await accountListStorage.setValue(updateAccounts(storedAccounts))
    },
    [accountListStorage],
  )

  return { accounts, isLoaded, replaceAccounts }
}

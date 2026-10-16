import { useCallback, useEffect, useState } from 'react'
import type { Account, PeopleList } from '../lib/accounts'
import { accountListStorages } from '../lib/item-storage'

export function useAccountList(list: PeopleList) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    void accountListStorages[list].getValue().then(storedAccounts => {
      setAccounts(storedAccounts)
      setIsLoaded(true)
    })
  }, [list])

  useEffect(() => {
    if (!isLoaded) {
      return
    }

    void accountListStorages[list].setValue(accounts)
  }, [accounts, isLoaded, list])

  const removeAccount = useCallback((accountKey: string) => {
    setAccounts(currentAccounts => currentAccounts.filter(account => account.key !== accountKey))
  }, [])

  const markAccountFailed = useCallback((accountKey: string, errorMessage: string) => {
    setAccounts(currentAccounts =>
      currentAccounts.map(account =>
        account.key === accountKey ? { ...account, status: 'failed', errorMessage } : account,
      ),
    )
  }, [])

  return { accounts, isLoaded, replaceAccounts: setAccounts, removeAccount, markAccountFailed }
}

import type { Account, PeopleList } from '../lib/accounts'
import { AccountRow } from './AccountRow'

interface AccountListProps {
  list: PeopleList
  accounts: Account[]
  selectedKeys: ReadonlySet<string>
  isSelectionLocked: boolean
  emptyTitle: string
  emptyDescription: string
  onToggle: (accountKey: string) => void
}

export function AccountList(props: AccountListProps) {
  const { list, accounts, selectedKeys, isSelectionLocked, emptyTitle, emptyDescription, onToggle } =
    props

  if (accounts.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">{emptyTitle}</p>
        <p className="empty-state-description">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <ul className="item-list">
      {accounts.map(account => (
        <AccountRow
          key={account.key}
          account={account}
          showsFollowBack={list === 'followers'}
          isSelected={selectedKeys.has(account.key)}
          isSelectionLocked={isSelectionLocked}
          onToggle={onToggle}
        />
      ))}
    </ul>
  )
}

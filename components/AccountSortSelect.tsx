import { ACCOUNT_SORTS } from '../lib/accounts'
import type { AccountSort } from '../lib/accounts'
import { messages } from '../lib/i18n'

interface AccountSortSelectProps {
  sort: AccountSort
  onChangeSort: (sort: AccountSort) => void
}

export function AccountSortSelect(props: AccountSortSelectProps) {
  const { sort, onChangeSort } = props

  return (
    <label className="sort-select">
      <span>{messages.people.sortLabel}</span>
      <select value={sort} onChange={event => onChangeSort(event.target.value as AccountSort)}>
        {ACCOUNT_SORTS.map(accountSort => (
          <option key={accountSort} value={accountSort}>
            {messages.people.sorts[accountSort]}
          </option>
        ))}
      </select>
    </label>
  )
}

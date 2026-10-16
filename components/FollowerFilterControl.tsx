import { FOLLOWER_FILTERS } from '../lib/accounts'
import type { FollowerFilter } from '../lib/accounts'
import { messages } from '../lib/i18n'

interface FollowerFilterControlProps {
  filter: FollowerFilter
  countsByFilter: Record<FollowerFilter, number>
  onChangeFilter: (filter: FollowerFilter) => void
}

export function FollowerFilterControl(props: FollowerFilterControlProps) {
  const { filter, countsByFilter, onChangeFilter } = props

  return (
    <fieldset className="segmented">
      <legend className="visually-hidden">{messages.people.followerFilterLabel}</legend>
      {FOLLOWER_FILTERS.map(followerFilter => (
        <label key={followerFilter} className="segmented-option">
          <input
            type="radio"
            name="follower-filter"
            value={followerFilter}
            checked={followerFilter === filter}
            onChange={() => onChangeFilter(followerFilter)}
          />
          <span>
            {messages.people.followerFilters[followerFilter]}
            <span className="segmented-count">{countsByFilter[followerFilter]}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}

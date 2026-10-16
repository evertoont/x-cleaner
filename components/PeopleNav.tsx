import { UserMinus, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PEOPLE_LISTS } from '../lib/accounts'
import type { PeopleList } from '../lib/accounts'
import { messages } from '../lib/i18n'
import { NavItem } from './NavItem'

interface PeopleNavProps {
  activeList?: PeopleList
  accountCounts: Record<PeopleList, number>
  selectedCounts: Record<PeopleList, number>
  onSelectList: (list: PeopleList) => void
}

const PEOPLE_LIST_ICONS: Record<PeopleList, LucideIcon> = {
  nonFollowers: UserMinus,
  followers: Users,
}

export function PeopleNav(props: PeopleNavProps) {
  const { activeList, accountCounts, selectedCounts, onSelectList } = props

  return (
    <nav className="nav-group" aria-labelledby="people-nav-heading">
      <h2 id="people-nav-heading" className="sidebar-heading">
        {messages.nav.peopleHeading}
      </h2>

      <div className="kind-nav">
        {PEOPLE_LISTS.map(list => (
          <NavItem
            key={list}
            icon={PEOPLE_LIST_ICONS[list]}
            label={messages.people.lists[list].title}
            count={accountCounts[list]}
            selectedCount={selectedCounts[list]}
            isActive={list === activeList}
            onSelect={() => onSelectList(list)}
          />
        ))}
      </div>
    </nav>
  )
}

import { messages } from '../lib/i18n'
import { ITEM_KINDS } from '../lib/items'
import type { ItemKind, KindCounts } from '../lib/items'
import { KIND_ICONS } from './kind-icons'
import { NavItem } from './NavItem'

interface KindNavProps {
  activeKind?: ItemKind
  countsByKind: KindCounts
  selectedCountsByKind: KindCounts
  onSelectKind: (kind: ItemKind) => void
}

export function KindNav(props: KindNavProps) {
  const { activeKind, countsByKind, selectedCountsByKind, onSelectKind } = props

  return (
    <nav className="nav-group" aria-labelledby="activity-nav-heading">
      <h2 id="activity-nav-heading" className="sidebar-heading">
        {messages.nav.activityHeading}
      </h2>

      <div className="kind-nav">
        {ITEM_KINDS.map(kind => (
          <NavItem
            key={kind}
            icon={KIND_ICONS[kind]}
            label={messages.kinds[kind]}
            count={countsByKind[kind]}
            selectedCount={selectedCountsByKind[kind]}
            isActive={kind === activeKind}
            onSelect={() => onSelectKind(kind)}
          />
        ))}
      </div>
    </nav>
  )
}

import { messages } from '../lib/i18n'
import { ITEM_KINDS } from '../lib/items'
import type { ItemKind, KindCounts } from '../lib/items'
import { KIND_ICONS } from './kind-icons'

interface KindNavProps {
  activeKind: ItemKind
  countsByKind: KindCounts
  selectedCountsByKind: KindCounts
  onSelectKind: (kind: ItemKind) => void
}

export function KindNav(props: KindNavProps) {
  const { activeKind, countsByKind, selectedCountsByKind, onSelectKind } = props

  return (
    <nav className="kind-nav" aria-label={messages.nav.label}>
      {ITEM_KINDS.map(kind => {
        const KindIcon = KIND_ICONS[kind]
        const selectedCount = selectedCountsByKind[kind]

        return (
          <button
            key={kind}
            type="button"
            className="kind-nav-item"
            aria-current={kind === activeKind ? 'page' : undefined}
            onClick={() => onSelectKind(kind)}
          >
            <KindIcon size={16} strokeWidth={1.75} aria-hidden />
            <span>{messages.kinds[kind]}</span>
            <span className="kind-nav-counts">
              {selectedCount > 0 && (
                <span className="kind-nav-selected" title={messages.nav.selectedCount(selectedCount)}>
                  <span aria-hidden>{selectedCount}</span>
                  <span className="visually-hidden">{messages.nav.selectedCount(selectedCount)}</span>
                </span>
              )}
              <span className="kind-nav-count">{countsByKind[kind]}</span>
            </span>
          </button>
        )
      })}
    </nav>
  )
}

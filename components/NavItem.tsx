import type { LucideIcon } from 'lucide-react'
import { messages } from '../lib/i18n'

interface NavItemProps {
  icon: LucideIcon
  label: string
  count: number
  selectedCount: number
  isActive: boolean
  onSelect: () => void
}

export function NavItem(props: NavItemProps) {
  const { icon: ItemIcon, label, count, selectedCount, isActive, onSelect } = props

  return (
    <button
      type="button"
      className="kind-nav-item"
      aria-current={isActive ? 'page' : undefined}
      onClick={onSelect}
    >
      <ItemIcon size={16} strokeWidth={1.75} aria-hidden />
      <span>{label}</span>
      <span className="kind-nav-counts">
        {selectedCount > 0 && (
          <span className="kind-nav-selected" title={messages.nav.selectedCount(selectedCount)}>
            <span aria-hidden>{selectedCount}</span>
            <span className="visually-hidden">{messages.nav.selectedCount(selectedCount)}</span>
          </span>
        )}
        <span className="kind-nav-count">{count}</span>
      </span>
    </button>
  )
}

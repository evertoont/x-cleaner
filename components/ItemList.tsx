import type { CapturedItem } from '../lib/items'
import { ItemRow } from './ItemRow'

interface ItemListProps {
  items: CapturedItem[]
  selectedKeys: ReadonlySet<string>
  isSelectionLocked: boolean
  emptyTitle: string
  emptyDescription: string
  onToggle: (itemKey: string) => void
}

export function ItemList(props: ItemListProps) {
  const { items, selectedKeys, isSelectionLocked, emptyTitle, emptyDescription, onToggle } = props

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <p className="empty-state-title">{emptyTitle}</p>
        <p className="empty-state-description">{emptyDescription}</p>
      </div>
    )
  }

  return (
    <ul className="item-list">
      {items.map(item => (
        <ItemRow
          key={item.key}
          item={item}
          isSelected={selectedKeys.has(item.key)}
          isSelectionLocked={isSelectionLocked}
          onToggle={onToggle}
        />
      ))}
    </ul>
  )
}

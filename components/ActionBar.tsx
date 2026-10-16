import { HeartOff, Square, Trash2, TriangleAlert, Undo2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { describeActivity, describeActivityAnnouncement } from '../lib/activity'
import type { Activity, Notice } from '../lib/activity'
import { messages } from '../lib/i18n'
import { sumKindCounts } from '../lib/items'
import type { ItemKind, KindCounts } from '../lib/items'
import { selectRemovalAction } from '../lib/removal-summary'
import type { RemovalButtonAction } from '../lib/removal-summary'
import { ConfirmRemovalDialog } from './ConfirmRemovalDialog'
import { ProgressBar } from './ProgressBar'

interface ActionBarProps {
  activity: Activity
  notice: Notice | null
  activeKind: ItemKind
  selectedCounts: KindCounts
  unselectedFailedCount: number
  isAllVisibleSelected: boolean
  hasVisibleItems: boolean
  onToggleAllVisible: () => void
  onSelectFailed: () => void
  onClearSelection: () => void
  onRemove: () => void
  onStop: () => void
}

const REMOVAL_ACTION_ICONS: Record<RemovalButtonAction, LucideIcon> = {
  delete: Trash2,
  undoRepost: Undo2,
  unlike: HeartOff,
  mixed: Trash2,
}

export function ActionBar(props: ActionBarProps) {
  const {
    activity,
    notice,
    activeKind,
    selectedCounts,
    unselectedFailedCount,
    isAllVisibleSelected,
    hasVisibleItems,
    onToggleAllVisible,
    onSelectFailed,
    onClearSelection,
    onRemove,
    onStop,
  } = props
  const [isConfirming, setIsConfirming] = useState(false)

  const selectedCount = sumKindCounts(selectedCounts)
  const isBusy = activity.type !== 'idle'
  const isRemoving = activity.type === 'removing'

  const activityMessage = describeActivity(activity)
  const statusMessage = activityMessage ?? notice?.message
  const statusTone = activityMessage ? 'info' : notice?.tone
  const announcement = describeActivityAnnouncement(activity) ?? notice?.message

  const removalAction = selectRemovalAction(selectedCounts, activeKind)
  const removalLabel = messages.removal.button[removalAction](selectedCount)
  const RemovalIcon = REMOVAL_ACTION_ICONS[removalAction]

  function handleConfirm() {
    setIsConfirming(false)
    onRemove()
  }

  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <label className="select-all">
          <input
            type="checkbox"
            checked={isAllVisibleSelected}
            disabled={!hasVisibleItems || isBusy}
            onChange={onToggleAllVisible}
          />
          {messages.toolbar.selectAll}
        </label>

        <p className="toolbar-status" data-tone={statusTone}>
          {statusMessage}
        </p>

        <div className="toolbar-actions">
          {isBusy && (
            <button type="button" className="button button-quiet" onClick={onStop}>
              <Square size={14} strokeWidth={2} aria-hidden />
              {messages.toolbar.stop}
            </button>
          )}

          {!isBusy && unselectedFailedCount > 0 && (
            <button type="button" className="button button-quiet" onClick={onSelectFailed}>
              {messages.toolbar.selectFailed(unselectedFailedCount)}
            </button>
          )}

          {!isBusy && selectedCount > 0 && (
            <button type="button" className="button button-quiet" onClick={onClearSelection}>
              {messages.toolbar.clearSelection}
            </button>
          )}

          {!isBusy && (
            <button
              type="button"
              className="button button-primary"
              disabled={selectedCount === 0}
              onClick={() => setIsConfirming(true)}
            >
              <RemovalIcon size={16} strokeWidth={1.75} aria-hidden />
              {removalLabel}
            </button>
          )}
        </div>
      </div>

      <p className="visually-hidden" role="status">
        {announcement}
      </p>

      {notice?.details && (
        <details className="toolbar-details">
          <summary>{messages.toolbar.technicalDetails}</summary>
          <p>{notice.details}</p>
        </details>
      )}

      {isRemoving && (
        <p className="toolbar-warning" role="alert">
          <TriangleAlert size={16} strokeWidth={2} aria-hidden />
          {messages.toolbar.keepTabsOpen}
        </p>
      )}

      <ProgressBar activity={activity} />

      <ConfirmRemovalDialog
        isOpen={isConfirming && selectedCount > 0 && !isBusy}
        selectedCounts={selectedCounts}
        confirmLabel={removalLabel}
        confirmIcon={RemovalIcon}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirming(false)}
      />
    </div>
  )
}

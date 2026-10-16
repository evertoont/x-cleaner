import { Square, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { describeActivity, describeActivityAnnouncement } from '../lib/activity'
import type { Activity, Notice } from '../lib/activity'
import { messages } from '../lib/i18n'
import { ConfirmRemovalDialog } from './ConfirmRemovalDialog'
import { ProgressBar } from './ProgressBar'
import type { RemovalPresentation } from './removal-presentations'

interface ActionBarProps {
  activity: Activity
  notice: Notice | null
  isRunningInBackground: boolean
  selectedCount: number
  unselectedFailedCount: number
  removal: RemovalPresentation
  isAllVisibleSelected: boolean
  hasVisibleItems: boolean
  onToggleAllVisible: () => void
  onSelectFailed: () => void
  onClearSelection: () => void
  onRemove: (isBackgroundRun: boolean) => void
  onStop: () => void
}

export function ActionBar(props: ActionBarProps) {
  const {
    activity,
    notice,
    isRunningInBackground,
    selectedCount,
    unselectedFailedCount,
    removal,
    isAllVisibleSelected,
    hasVisibleItems,
    onToggleAllVisible,
    onSelectFailed,
    onClearSelection,
    onRemove,
    onStop,
  } = props
  const [isConfirming, setIsConfirming] = useState(false)

  const isBusy = activity.type !== 'idle'
  const isRemoving = activity.type === 'removing'
  const RemovalIcon = removal.buttonIcon

  const activityMessage = describeActivity(activity)
  const statusMessage = activityMessage ?? notice?.message
  const statusTone = activityMessage ? 'info' : notice?.tone
  const announcement = describeActivityAnnouncement(activity) ?? notice?.message

  function handleConfirm(isBackgroundRun: boolean) {
    setIsConfirming(false)
    onRemove(isBackgroundRun)
  }

  return (
    <div className="toolbar">
      <div className="toolbar-panel">
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
                {removal.buttonLabel}
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
            {isRunningInBackground ? messages.toolbar.keepXTabOpen : messages.toolbar.keepTabsOpen}
          </p>
        )}

        <ProgressBar activity={activity} />
      </div>

      <ConfirmRemovalDialog
        isOpen={isConfirming && selectedCount > 0 && !isBusy}
        presentation={removal}
        onConfirm={handleConfirm}
        onCancel={() => setIsConfirming(false)}
      />
    </div>
  )
}

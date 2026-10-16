import { TriangleAlert } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { estimateRemovalDuration } from '../lib/activity'
import { messages } from '../lib/i18n'
import { sumKindCounts } from '../lib/items'
import type { KindCounts } from '../lib/items'
import { describeRemovalActions } from '../lib/removal-summary'
import { KIND_ICONS } from './kind-icons'

interface ConfirmRemovalDialogProps {
  isOpen: boolean
  selectedCounts: KindCounts
  confirmLabel: string
  confirmIcon: LucideIcon
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmRemovalDialog(props: ConfirmRemovalDialogProps) {
  const { isOpen, selectedCounts, confirmLabel, confirmIcon: ConfirmIcon, onConfirm, onCancel } =
    props
  const dialogRef = useRef<HTMLDialogElement>(null)

  const selectedCount = sumKindCounts(selectedCounts)

  useEffect(() => {
    const dialog = dialogRef.current

    if (!dialog) {
      return
    }

    if (isOpen && !dialog.open) {
      dialog.showModal()
      return
    }

    if (!isOpen && dialog.open) {
      dialog.close()
    }
  }, [isOpen])

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) {
      return
    }

    onCancel()
  }

  return (
    <dialog
      ref={dialogRef}
      className="confirm-dialog"
      aria-labelledby="confirm-removal-title"
      onClose={onCancel}
      onClick={handleBackdropClick}
    >
      <div className="confirm-dialog-body">
        <h2 id="confirm-removal-title" className="confirm-dialog-title">
          {messages.confirmDialog.title(selectedCount)}
        </h2>

        <ul className="confirm-dialog-actions">
          {describeRemovalActions(selectedCounts).map(actionLine => {
            const KindIcon = KIND_ICONS[actionLine.kind]

            return (
              <li key={actionLine.kind} className="confirm-dialog-action">
                <KindIcon size={16} strokeWidth={1.75} aria-hidden />
                {actionLine.description}
              </li>
            )
          })}
        </ul>

        <p className="confirm-dialog-note">
          {messages.confirmDialog.duration(estimateRemovalDuration(selectedCount))}
        </p>

        <p className="confirm-dialog-warning">
          <TriangleAlert size={16} strokeWidth={2} aria-hidden />
          {messages.confirmDialog.irreversible}
        </p>

        <div className="confirm-dialog-buttons">
          <button type="button" className="button button-quiet" onClick={onCancel}>
            {messages.toolbar.cancel}
          </button>
          <button type="button" className="button button-danger" onClick={onConfirm}>
            <ConfirmIcon size={16} strokeWidth={1.75} aria-hidden />
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}

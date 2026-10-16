import { TriangleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import { useStoredValue } from '../hooks/use-stored-value'
import { messages } from '../lib/i18n'
import { backgroundRunPreferenceStorage } from '../lib/item-storage'
import type { RemovalPresentation } from './removal-presentations'

interface ConfirmRemovalDialogProps {
  isOpen: boolean
  presentation: RemovalPresentation
  onConfirm: (isBackgroundRun: boolean) => void
  onCancel: () => void
}

export function ConfirmRemovalDialog(props: ConfirmRemovalDialogProps) {
  const { isOpen, presentation, onConfirm, onCancel } = props
  const { buttonLabel, buttonIcon: ButtonIcon, dialogTitle, dialogLines, dialogNotes, dialogWarning } =
    presentation
  const dialogRef = useRef<HTMLDialogElement>(null)
  const { value: isBackgroundRunPreferred, saveValue: saveBackgroundRunPreference } =
    useStoredValue(backgroundRunPreferenceStorage)

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

  function handleBackgroundRunChange(event: ChangeEvent<HTMLInputElement>) {
    saveBackgroundRunPreference(event.target.checked)
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
          {dialogTitle}
        </h2>

        <ul className="confirm-dialog-actions">
          {dialogLines.map(dialogLine => {
            const LineIcon = dialogLine.icon

            return (
              <li key={dialogLine.key} className="confirm-dialog-action" data-muted={!LineIcon}>
                {LineIcon && <LineIcon size={16} strokeWidth={1.75} aria-hidden />}
                {dialogLine.description}
              </li>
            )
          })}
        </ul>

        {dialogNotes.map(dialogNote => (
          <p key={dialogNote} className="confirm-dialog-note">
            {dialogNote}
          </p>
        ))}

        {dialogWarning && (
          <p className="confirm-dialog-warning">
            <TriangleAlert size={16} strokeWidth={2} aria-hidden />
            {dialogWarning}
          </p>
        )}

        <label className="confirm-dialog-option">
          <input
            type="checkbox"
            checked={isBackgroundRunPreferred}
            onChange={handleBackgroundRunChange}
          />
          {messages.confirmDialog.backgroundRun}
        </label>

        <div className="confirm-dialog-buttons">
          <button type="button" className="button button-quiet" onClick={onCancel}>
            {messages.toolbar.cancel}
          </button>
          <button
            type="button"
            className="button button-danger"
            onClick={() => onConfirm(isBackgroundRunPreferred)}
          >
            <ButtonIcon size={16} strokeWidth={1.75} aria-hidden />
            {buttonLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}

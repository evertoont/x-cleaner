import { Download } from 'lucide-react'
import { messages } from '../lib/i18n'
import { ITEM_KINDS } from '../lib/items'
import type { ItemKind } from '../lib/items'

interface CaptureControlsProps {
  selectedKinds: ItemKind[]
  isBusy: boolean
  onToggleKind: (kind: ItemKind) => void
  onCapture: () => void
}

export function CaptureControls(props: CaptureControlsProps) {
  const { selectedKinds, isBusy, onToggleKind, onCapture } = props

  return (
    <section className="capture-panel" aria-labelledby="capture-heading">
      <h2 id="capture-heading" className="sidebar-heading">
        {messages.capture.heading}
      </h2>

      <fieldset className="capture-kinds" disabled={isBusy}>
        <legend className="visually-hidden">{messages.capture.legend}</legend>
        {ITEM_KINDS.map(kind => (
          <label key={kind} className="capture-kind">
            <input
              type="checkbox"
              checked={selectedKinds.includes(kind)}
              onChange={() => onToggleKind(kind)}
            />
            {messages.kinds[kind]}
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        className="button button-secondary capture-button"
        disabled={isBusy || selectedKinds.length === 0}
        onClick={onCapture}
      >
        <Download size={16} strokeWidth={1.75} aria-hidden />
        {messages.capture.button}
      </button>

      <p className="capture-hint">{messages.capture.hint}</p>
    </section>
  )
}

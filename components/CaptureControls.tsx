import { Download } from 'lucide-react'
import { CAPTURE_TARGETS, describeCaptureTarget } from '../lib/capture-modes'
import type { CaptureTarget } from '../lib/capture-modes'
import { messages } from '../lib/i18n'

interface CaptureControlsProps {
  selectedTargets: CaptureTarget[]
  isBusy: boolean
  onToggleTarget: (target: CaptureTarget) => void
  onCapture: () => void
}

export function CaptureControls(props: CaptureControlsProps) {
  const { selectedTargets, isBusy, onToggleTarget, onCapture } = props

  return (
    <section className="capture-panel" aria-labelledby="capture-heading">
      <h2 id="capture-heading" className="sidebar-heading">
        {messages.capture.heading}
      </h2>

      <fieldset className="capture-kinds" disabled={isBusy}>
        <legend className="visually-hidden">{messages.capture.legend}</legend>
        {CAPTURE_TARGETS.map(target => (
          <label key={target} className="capture-kind">
            <input
              type="checkbox"
              checked={selectedTargets.includes(target)}
              onChange={() => onToggleTarget(target)}
            />
            {describeCaptureTarget(target)}
          </label>
        ))}
      </fieldset>

      <button
        type="button"
        className="button button-secondary capture-button"
        disabled={isBusy || selectedTargets.length === 0}
        onClick={onCapture}
      >
        <Download size={16} strokeWidth={1.75} aria-hidden />
        {messages.capture.button}
      </button>

      <p className="capture-hint">{messages.capture.hint}</p>
    </section>
  )
}

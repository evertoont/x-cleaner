import { messages } from './i18n'

const OVERLAY_STYLES = `
  .overlay {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 2147483647;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 10px 10px 16px;
    border: 1px solid oklch(0.33 0.016 305);
    border-radius: 999px;
    background: oklch(0.18 0.014 305);
    color: oklch(0.93 0.01 75);
    font: 600 14px system-ui, -apple-system, 'Segoe UI', sans-serif;
    box-shadow: 0 12px 32px oklch(0.1 0.02 305 / 0.45);
  }

  button {
    height: 34px;
    border: none;
    border-radius: 999px;
    padding: 0 16px;
    background: oklch(0.8 0.115 58);
    color: oklch(0.24 0.04 50);
    font: inherit;
    cursor: pointer;
  }

  button:hover:not(:disabled) {
    background: oklch(0.85 0.1 62);
  }

  button:disabled {
    opacity: 0.6;
    cursor: default;
  }
`

export function showCaptureOverlay(sectionLabel: string, onStop: () => void): () => void {
  const overlayHost = document.createElement('div')
  const shadowRoot = overlayHost.attachShadow({ mode: 'closed' })
  const styleElement = document.createElement('style')
  const overlayElement = document.createElement('div')
  const messageElement = document.createElement('span')
  const stopButton = document.createElement('button')

  styleElement.textContent = OVERLAY_STYLES
  overlayElement.className = 'overlay'
  messageElement.setAttribute('role', 'status')
  messageElement.textContent = messages.overlay.capturing(sectionLabel)
  stopButton.type = 'button'
  stopButton.textContent = messages.overlay.stop

  stopButton.addEventListener(
    'click',
    () => {
      stopButton.disabled = true
      messageElement.textContent = messages.overlay.stopping
      onStop()
    },
    { once: true },
  )

  overlayElement.append(messageElement, stopButton)
  shadowRoot.append(styleElement, overlayElement)
  document.documentElement.append(overlayHost)

  return () => overlayHost.remove()
}

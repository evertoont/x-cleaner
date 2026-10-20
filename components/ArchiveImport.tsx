import { FileUp } from 'lucide-react'
import { useRef } from 'react'
import type { ChangeEvent } from 'react'
import { messages } from '../lib/i18n'

interface ArchiveImportProps {
  isBusy: boolean
  onImport: (archiveFiles: File[]) => void
}

export function ArchiveImport(props: ArchiveImportProps) {
  const { isBusy, onImport } = props
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFilesChosen(event: ChangeEvent<HTMLInputElement>) {
    const archiveFiles = Array.from(event.target.files ?? [])

    // Sem limpar, escolher o mesmo arquivo de novo não dispara outra importação.
    event.target.value = ''

    if (archiveFiles.length === 0) {
      return
    }

    onImport(archiveFiles)
  }

  return (
    <section className="archive-panel" aria-labelledby="archive-heading">
      <h2 id="archive-heading" className="sidebar-heading">
        {messages.archive.heading}
      </h2>

      <input
        ref={fileInputRef}
        type="file"
        accept=".js"
        multiple
        hidden
        onChange={handleFilesChosen}
      />

      <button
        type="button"
        className="button button-secondary capture-button"
        disabled={isBusy}
        onClick={() => fileInputRef.current?.click()}
      >
        <FileUp size={16} strokeWidth={1.75} aria-hidden />
        {messages.archive.button}
      </button>

      <p className="capture-hint">{messages.archive.hint}</p>
    </section>
  )
}

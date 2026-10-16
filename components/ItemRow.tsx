import { CircleAlert } from 'lucide-react'
import { LOCALE, messages } from '../lib/i18n'
import { buildTweetUrl } from '../lib/items'
import type { CapturedItem } from '../lib/items'

interface ItemRowProps {
  item: CapturedItem
  isSelected: boolean
  isSelectionLocked: boolean
  onToggle: (itemKey: string) => void
}

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function ItemRow(props: ItemRowProps) {
  const { item, isSelected, isSelectionLocked, onToggle } = props
  const context = describeContext(item)
  const isFailed = item.status === 'failed'

  return (
    <li className="item" data-selected={isSelected} data-failed={isFailed}>
      <label className="item-label">
        <input
          type="checkbox"
          className="item-checkbox"
          checked={isSelected}
          disabled={isSelectionLocked}
          onChange={() => onToggle(item.key)}
        />
        <div className="item-body">
          <p className="item-meta">
            <a
              className="item-date"
              href={buildTweetUrl(item)}
              target="_blank"
              rel="noreferrer"
              title={messages.list.openOnX}
            >
              {formatDate(item.createdAt)}
            </a>
            {context && (
              <>
                <span className="item-meta-separator" aria-hidden>
                  ·
                </span>
                <span>{context}</span>
              </>
            )}
          </p>

          {item.text ? (
            <p className="item-text">{item.text}</p>
          ) : (
            <p className="item-text item-text-empty">{messages.list.mediaOnly}</p>
          )}

          {isFailed && (
            <p className="item-error">
              <CircleAlert size={14} strokeWidth={2} aria-hidden />
              {item.errorMessage}
            </p>
          )}
        </div>
      </label>
    </li>
  )
}

function describeContext(item: CapturedItem): string | undefined {
  if (item.kind === 'retweet') {
    return messages.list.repostOf(item.authorHandle)
  }

  if (item.kind === 'like') {
    return `@${item.authorHandle}`
  }

  if (item.replyToHandle) {
    return messages.list.replyingTo(item.replyToHandle)
  }

  return undefined
}

function formatDate(isoDate: string): string {
  if (!isoDate) {
    return messages.list.noDate
  }

  return dateFormatter.format(new Date(isoDate))
}

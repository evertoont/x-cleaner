import { ArrowLeftRight, BadgeCheck, CircleAlert, ExternalLink, UserRound } from 'lucide-react'
import { buildProfileUrl } from '../lib/accounts'
import type { Account } from '../lib/accounts'
import { formatCompactNumber, messages } from '../lib/i18n'

interface AccountRowProps {
  account: Account
  showsFollowBack: boolean
  isSelected: boolean
  isSelectionLocked: boolean
  onToggle: (accountKey: string) => void
}

export function AccountRow(props: AccountRowProps) {
  const { account, showsFollowBack, isSelected, isSelectionLocked, onToggle } = props
  const isFailed = account.status === 'failed'
  const profileUrl = buildProfileUrl(account)
  const followersLabel = messages.people.followerCount(
    account.followersCount,
    formatCompactNumber(account.followersCount),
  )
  const followingLabel = messages.people.followingCount(formatCompactNumber(account.followingCount))

  return (
    <li className="item" data-selected={isSelected} data-failed={isFailed}>
      <label className="item-label account-label">
        <input
          type="checkbox"
          className="item-checkbox"
          checked={isSelected}
          disabled={isSelectionLocked}
          onChange={() => onToggle(account.key)}
        />

        <a
          className="account-avatar-link"
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          tabIndex={-1}
          aria-hidden
        >
          {account.avatarUrl ? (
            <img className="account-avatar" src={account.avatarUrl} alt="" loading="lazy" />
          ) : (
            <span className="account-avatar" />
          )}
        </a>

        <div className="item-body">
          <p className="account-name-line">
            <a
              className="account-profile-link"
              href={profileUrl}
              target="_blank"
              rel="noreferrer"
              title={messages.people.openProfile}
            >
              <span className="account-name">{account.name || account.handle}</span>
              {account.isVerified && (
                <span className="account-verified">
                  <BadgeCheck size={15} strokeWidth={2} aria-hidden />
                  <span className="visually-hidden">{messages.people.verified}</span>
                </span>
              )}
              <span className="account-handle">@{account.handle}</span>
              <ExternalLink className="account-external" size={13} strokeWidth={2} aria-hidden />
            </a>
          </p>

          <p className="item-meta">
            <span>{followersLabel}</span>
            <span className="item-meta-separator" aria-hidden>
              ·
            </span>
            <span>{followingLabel}</span>
          </p>

          {showsFollowBack && <FollowBackTag isMutual={account.isMutual} />}

          {account.bio && <p className="account-bio">{account.bio}</p>}

          {isFailed && (
            <p className="item-error">
              <CircleAlert size={14} strokeWidth={2} aria-hidden />
              {account.errorMessage}
            </p>
          )}
        </div>
      </label>
    </li>
  )
}

interface FollowBackTagProps {
  isMutual: boolean
}

function FollowBackTag(props: FollowBackTagProps) {
  const { isMutual } = props
  const TagIcon = isMutual ? ArrowLeftRight : UserRound

  return (
    <p className="follow-back-tag" data-mutual={isMutual}>
      <TagIcon size={13} strokeWidth={2} aria-hidden />
      {isMutual ? messages.people.mutual : messages.people.notFollowedBack}
    </p>
  )
}

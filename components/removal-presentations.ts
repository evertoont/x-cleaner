import { HeartOff, Trash2, Undo2, UserMinus, UserX } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { DAILY_ACCOUNT_ACTION_LIMIT } from '../lib/account-quota'
import type { Account, AccountAction } from '../lib/accounts'
import { estimateRemovalDuration } from '../lib/activity'
import { messages } from '../lib/i18n'
import { sumKindCounts } from '../lib/items'
import type { ItemKind, KindCounts } from '../lib/items'
import { describeRemovalActions, selectRemovalAction } from '../lib/removal-summary'
import type { RemovalButtonAction } from '../lib/removal-summary'
import { KIND_ICONS } from './kind-icons'

export interface DialogLine {
  key: string
  icon?: LucideIcon
  description: string
}

export interface RemovalPresentation {
  buttonLabel: string
  buttonIcon: LucideIcon
  dialogTitle: string
  dialogLines: DialogLine[]
  dialogNotes: string[]
  dialogWarning?: string
}

const REMOVAL_ACTION_ICONS: Record<RemovalButtonAction, LucideIcon> = {
  delete: Trash2,
  undoRepost: Undo2,
  unlike: HeartOff,
  mixed: Trash2,
}

const ACCOUNT_ACTION_ICONS: Record<AccountAction, LucideIcon> = {
  unfollow: UserMinus,
  removeFollower: UserX,
}

const PREVIEWED_ACCOUNT_COUNT = 5

export function presentPostRemoval(
  selectedCounts: KindCounts,
  activeKind: ItemKind,
): RemovalPresentation {
  const selectedCount = sumKindCounts(selectedCounts)
  const removalAction = selectRemovalAction(selectedCounts, activeKind)

  return {
    buttonLabel: messages.removal.button[removalAction](selectedCount),
    buttonIcon: REMOVAL_ACTION_ICONS[removalAction],
    dialogTitle: messages.confirmDialog.title(selectedCount),
    dialogLines: describeRemovalActions(selectedCounts).map(actionLine => ({
      key: actionLine.kind,
      icon: KIND_ICONS[actionLine.kind],
      description: actionLine.description,
    })),
    dialogNotes: [messages.confirmDialog.duration(estimateRemovalDuration(selectedCount, 'items'))],
    dialogWarning: messages.confirmDialog.irreversible,
  }
}

export function presentAccountRemoval(
  action: AccountAction,
  selectedAccounts: Account[],
): RemovalPresentation {
  const selectedCount = selectedAccounts.length
  const countProcessedToday = Math.min(selectedCount, DAILY_ACCOUNT_ACTION_LIMIT)
  const actionMessages = messages.accountActions[action]

  return {
    buttonLabel: actionMessages.button(selectedCount),
    buttonIcon: ACCOUNT_ACTION_ICONS[action],
    dialogTitle: actionMessages.dialogTitle(selectedCount),
    dialogLines: describePreviewedAccounts(selectedAccounts, ACCOUNT_ACTION_ICONS[action]),
    dialogNotes: [
      messages.accountRemoval.duration(estimateRemovalDuration(countProcessedToday, action)),
      messages.accountRemoval.dailyLimit(DAILY_ACCOUNT_ACTION_LIMIT),
      actionMessages.effect,
    ],
  }
}

function describePreviewedAccounts(selectedAccounts: Account[], lineIcon: LucideIcon): DialogLine[] {
  const previewedAccounts = selectedAccounts.slice(0, PREVIEWED_ACCOUNT_COUNT)
  const hiddenCount = selectedAccounts.length - previewedAccounts.length
  const accountLines = previewedAccounts.map(account => ({
    key: account.key,
    icon: lineIcon,
    description: `${account.name} @${account.handle}`,
  }))

  if (hiddenCount === 0) {
    return accountLines
  }

  return [...accountLines, { key: 'more-accounts', description: messages.people.moreAccounts(hiddenCount) }]
}

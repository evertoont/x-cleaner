import { capitalizeFirstLetter, formatList, messages } from './i18n'
import { ITEM_KIND_REMOVAL_ACTIONS, ITEM_KINDS } from './items'
import type { ItemKind, KindCounts, RemovalAction } from './items'

export type RemovalButtonAction = RemovalAction | 'mixed'

export interface RemovalActionLine {
  kind: ItemKind
  description: string
}

export function selectRemovalAction(
  selectedCounts: KindCounts,
  activeKind: ItemKind,
): RemovalButtonAction {
  const selectedActions = new Set(
    listCountedKinds(selectedCounts).map(kind => ITEM_KIND_REMOVAL_ACTIONS[kind]),
  )
  const [firstAction] = selectedActions

  if (!firstAction) {
    return ITEM_KIND_REMOVAL_ACTIONS[activeKind]
  }

  return selectedActions.size === 1 ? firstAction : 'mixed'
}

export function describeRemovalActions(selectedCounts: KindCounts): RemovalActionLine[] {
  return listCountedKinds(selectedCounts).map(kind => ({
    kind,
    description: capitalizeFirstLetter(messages.removal.confirmActions[kind](selectedCounts[kind])),
  }))
}

export function describeRemovalConfirmation(selectedCounts: KindCounts): string {
  const actionPhrases = listCountedKinds(selectedCounts).map(kind =>
    messages.removal.confirmActions[kind](selectedCounts[kind]),
  )

  return messages.removal.confirm(capitalizeFirstLetter(formatList(actionPhrases)))
}

export function describeRemovalOutcome(
  removedCounts: KindCounts,
  failedCount: number,
  wasStopped: boolean,
): string {
  const removedPhrases = listCountedKinds(removedCounts).map(kind =>
    messages.removal.done[kind](removedCounts[kind]),
  )
  const removedSummary =
    removedPhrases.length > 0
      ? `${capitalizeFirstLetter(formatList(removedPhrases))}.`
      : messages.removal.nothingRemoved

  const stoppedSentences = wasStopped ? [messages.removal.stopped] : []
  const failedSentences = failedCount > 0 ? [messages.removal.failed(failedCount)] : []

  return [...stoppedSentences, removedSummary, ...failedSentences].join(' ')
}

function listCountedKinds(countsByKind: KindCounts): ItemKind[] {
  return ITEM_KINDS.filter(kind => countsByKind[kind] > 0)
}

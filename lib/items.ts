export type ItemKind = 'tweet' | 'reply' | 'retweet' | 'like'

export type ItemStatus = 'active' | 'failed'

export interface CapturedItem {
  key: string
  id: string
  kind: ItemKind
  text: string
  createdAt: string
  authorHandle: string
  replyToHandle?: string
  retweetId?: string
  status: ItemStatus
  errorMessage?: string
}

export type NewItemFields = Omit<CapturedItem, 'key' | 'status' | 'errorMessage'>

export type KindCounts = Record<ItemKind, number>

export type RemovalAction = 'delete' | 'undoRepost' | 'unlike'

export const ITEM_KINDS: ItemKind[] = ['tweet', 'reply', 'retweet', 'like']

export const ITEM_KIND_REMOVAL_ACTIONS: Record<ItemKind, RemovalAction> = {
  tweet: 'delete',
  reply: 'delete',
  retweet: 'undoRepost',
  like: 'unlike',
}

export function countItemsByKind(items: CapturedItem[]): KindCounts {
  const countsByKind = Object.fromEntries(ITEM_KINDS.map(kind => [kind, 0])) as KindCounts

  items.forEach(item => {
    countsByKind[item.kind] += 1
  })

  return countsByKind
}

export function sumKindCounts(countsByKind: KindCounts): number {
  return ITEM_KINDS.reduce((total, kind) => total + countsByKind[kind], 0)
}

export function createItem(fields: NewItemFields): CapturedItem {
  return {
    ...fields,
    key: `${fields.kind}:${fields.id}`,
    status: 'active',
  }
}

export function replaceItemsOfKinds(
  currentItems: CapturedItem[],
  kinds: ItemKind[],
  capturedItems: CapturedItem[],
): CapturedItem[] {
  return [...currentItems.filter(item => !kinds.includes(item.kind)), ...capturedItems]
}

export function mergeItems(
  currentItems: CapturedItem[],
  capturedItems: CapturedItem[],
): CapturedItem[] {
  return dedupeItems([...currentItems, ...capturedItems])
}

export function dedupeItems(items: CapturedItem[]): CapturedItem[] {
  const itemsByKey = new Map(items.map(item => [item.key, item]))

  return [...itemsByKey.values()]
}

export function buildTweetUrl(item: CapturedItem): string {
  return `https://x.com/i/status/${item.id}`
}

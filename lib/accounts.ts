import type { ItemStatus } from './items'
import type { ParsedAccount } from './user-timeline-parser'

export type PeopleList = 'nonFollowers' | 'followers'

export type AccountAction = 'unfollow' | 'removeFollower'

export interface Account {
  key: string
  id: string
  handle: string
  name: string
  bio: string
  avatarUrl: string
  followersCount: number
  followingCount: number
  isVerified: boolean
  isMutual: boolean
  listOrder: number
  status: ItemStatus
  errorMessage?: string
}

export type AccountSort = 'recent' | 'mostFollowers' | 'fewestFollowers'

export const PEOPLE_LISTS: PeopleList[] = ['nonFollowers', 'followers']

export const PEOPLE_LIST_ACTIONS: Record<PeopleList, AccountAction> = {
  nonFollowers: 'unfollow',
  followers: 'removeFollower',
}

export const ACCOUNT_SORTS: AccountSort[] = ['recent', 'mostFollowers', 'fewestFollowers']

const ACCOUNT_COMPARATORS: Record<AccountSort, (first: Account, second: Account) => number> = {
  recent: (first, second) => first.listOrder - second.listOrder,
  mostFollowers: (first, second) => second.followersCount - first.followersCount,
  fewestFollowers: (first, second) => first.followersCount - second.followersCount,
}

// O X lista quem você segue do mais recente para o mais antigo; a posição vira a ordem "mais recentes".
// Só entra quem comprovadamente não segue de volta: sem o campo de relacionamento, a conta fica de fora.
export function selectNonFollowers(followingAccounts: ParsedAccount[]): Account[] {
  return dedupeById(followingAccounts.filter(account => account.isFollowedByOwner !== false)).flatMap(
    (account, listOrder) =>
      account.followsOwner === false ? [toAccount(account, listOrder, false)] : [],
  )
}

export function selectFollowers(followerAccounts: ParsedAccount[]): Account[] {
  return dedupeById(followerAccounts).flatMap((account, listOrder) =>
    account.followsOwner === true
      ? [toAccount(account, listOrder, account.isFollowedByOwner === true)]
      : [],
  )
}

export function sortAccounts(accounts: Account[], sort: AccountSort): Account[] {
  return [...accounts].sort(ACCOUNT_COMPARATORS[sort])
}

export function mergeAccounts(currentAccounts: Account[], capturedAccounts: Account[]): Account[] {
  const accountsByKey = new Map(
    [...currentAccounts, ...capturedAccounts].map(account => [account.key, account]),
  )

  return [...accountsByKey.values()]
}

export function buildProfileUrl(account: Account): string {
  return `https://x.com/${account.handle}`
}

function dedupeById(parsedAccounts: ParsedAccount[]): ParsedAccount[] {
  return [...new Map(parsedAccounts.map(account => [account.id, account])).values()]
}

function toAccount(account: ParsedAccount, listOrder: number, isMutual: boolean): Account {
  return {
    key: `account:${account.id}`,
    id: account.id,
    handle: account.handle,
    name: account.name,
    bio: account.bio,
    avatarUrl: account.avatarUrl,
    followersCount: account.followersCount,
    followingCount: account.followingCount,
    isVerified: account.isVerified,
    isMutual,
    listOrder,
    status: 'active',
  }
}

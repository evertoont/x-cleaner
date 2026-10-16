import { storage } from 'wxt/utils/storage'
import type { Account, AccountAction, PeopleList } from './accounts'
import type { CapturedItem } from './items'

export const itemsStorage = storage.defineItem<CapturedItem[]>('local:items', {
  fallback: [],
})

export const accountListStorages = {
  nonFollowers: storage.defineItem<Account[]>('local:nonFollowers', { fallback: [] }),
  followers: storage.defineItem<Account[]>('local:followers', { fallback: [] }),
} satisfies Record<PeopleList, unknown>

export const accountActionLogStorages = {
  unfollow: storage.defineItem<number[]>('local:unfollowLog', { fallback: [] }),
  removeFollower: storage.defineItem<number[]>('local:removeFollowerLog', { fallback: [] }),
} satisfies Record<AccountAction, unknown>

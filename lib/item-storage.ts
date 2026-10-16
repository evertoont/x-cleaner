import { storage } from 'wxt/utils/storage'
import type { Account, AccountAction, PeopleList } from './accounts'
import type { Notice } from './activity'
import type { CapturedItem } from './items'
import type { RemovalJob } from './removal-jobs'

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

// A fila de remoção roda no background; painel e abas do X só leem este estado e pedem para parar.
export const removalJobStorage = storage.defineItem<RemovalJob | null>('local:removalJob', {
  fallback: null,
})

export const removalStopRequestStorage = storage.defineItem<boolean>('local:removalStopRequested', {
  fallback: false,
})

export const removalNoticeStorage = storage.defineItem<Notice | null>('local:removalNotice', {
  fallback: null,
})

export const backgroundRunPreferenceStorage = storage.defineItem<boolean>(
  'local:backgroundRunPreferred',
  { fallback: true },
)

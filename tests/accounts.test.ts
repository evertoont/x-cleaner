import { describe, expect, it } from 'vitest'
import {
  countFollowersByFilter,
  filterFollowers,
  mergeAccounts,
  selectFollowers,
  selectNonFollowers,
  sortAccounts,
} from '../lib/accounts'
import { parseTimelineUsers } from '../lib/user-timeline-parser'
import type { ParsedAccount } from '../lib/user-timeline-parser'
import followersResponse from './fixtures/followers.json'
import followingResponse from './fixtures/following.json'

function buildParsedAccount(id: string, fields: Partial<ParsedAccount> = {}): ParsedAccount {
  return {
    id,
    handle: `user_${id}`,
    name: `User ${id}`,
    bio: '',
    avatarUrl: '',
    followersCount: Number(id),
    followingCount: 10,
    isVerified: false,
    isFollowedByOwner: true,
    followsOwner: false,
    ...fields,
  }
}

describe('selectNonFollowers', () => {
  const nonFollowers = selectNonFollowers(parseTimelineUsers(followingResponse))

  it('keeps only accounts the owner follows that do not follow back', () => {
    expect(nonFollowers.map(account => account.key)).toEqual(['account:5001', 'account:5003'])
  })

  it('numbers accounts by their position in the following list', () => {
    expect(nonFollowers.map(account => account.listOrder)).toEqual([0, 2])
  })

  it('never marks a non-follower as mutual', () => {
    expect(nonFollowers.every(account => !account.isMutual)).toBe(true)
  })

  it('leaves out accounts without relationship data', () => {
    const selected = selectNonFollowers([
      buildParsedAccount('1', { followsOwner: undefined }),
      buildParsedAccount('2'),
    ])

    expect(selected.map(account => account.id)).toEqual(['2'])
  })

  it('starts every account as active', () => {
    const [account] = selectNonFollowers([buildParsedAccount('1')])

    expect(account).toMatchObject({ status: 'active' })
  })
})

describe('selectFollowers', () => {
  const followers = selectFollowers(parseTimelineUsers(followersResponse))

  it('keeps only accounts that follow the owner, once each', () => {
    expect(followers.map(account => account.handle)).toEqual(['mutual_follower', 'one_way'])
  })

  it('marks whether the owner follows each follower back', () => {
    expect(followers.map(account => [account.handle, account.isMutual])).toEqual([
      ['mutual_follower', true],
      ['one_way', false],
    ])
  })

  it('keeps the following count to help spot bots', () => {
    expect(followers[0]).toMatchObject({ followersCount: 830, followingCount: 100 })
  })
})

describe('filterFollowers', () => {
  const followers = selectFollowers(parseTimelineUsers(followersResponse))

  it('keeps everyone with the all filter', () => {
    expect(filterFollowers(followers, 'all').map(account => account.handle)).toEqual([
      'mutual_follower',
      'one_way',
    ])
  })

  it('keeps only mutual follows or only the ones you do not follow back', () => {
    expect(filterFollowers(followers, 'mutual').map(account => account.handle)).toEqual([
      'mutual_follower',
    ])
    expect(filterFollowers(followers, 'notFollowedBack').map(account => account.handle)).toEqual([
      'one_way',
    ])
  })

  it('counts followers for each filter', () => {
    expect(countFollowersByFilter(followers)).toEqual({ all: 2, mutual: 1, notFollowedBack: 1 })
  })
})

describe('sortAccounts', () => {
  const accounts = selectNonFollowers([
    buildParsedAccount('300'),
    buildParsedAccount('100'),
    buildParsedAccount('200'),
  ])

  it('sorts newest first', () => {
    expect(sortAccounts(accounts, 'recent').map(account => account.id)).toEqual(['300', '100', '200'])
  })

  it('sorts by follower count', () => {
    expect(sortAccounts(accounts, 'mostFollowers').map(account => account.id)).toEqual([
      '300',
      '200',
      '100',
    ])
    expect(sortAccounts(accounts, 'fewestFollowers').map(account => account.id)).toEqual([
      '100',
      '200',
      '300',
    ])
  })
})

describe('mergeAccounts', () => {
  it('adds new accounts and replaces the ones fetched again', () => {
    const [firstAccount, secondAccount] = selectNonFollowers([
      buildParsedAccount('1'),
      buildParsedAccount('2'),
    ])
    const [refreshedAccount] = selectNonFollowers([buildParsedAccount('2', { name: 'Renamed' })])

    const merged = mergeAccounts(
      [firstAccount!, { ...secondAccount!, status: 'failed' }],
      [refreshedAccount!],
    )

    expect(merged.map(account => [account.id, account.name, account.status])).toEqual([
      ['1', 'User 1', 'active'],
      ['2', 'Renamed', 'active'],
    ])
  })
})

import { describe, expect, it } from 'vitest'
import { parseTimelineUsers } from '../lib/user-timeline-parser'
import followersResponse from './fixtures/followers.json'
import followingResponse from './fixtures/following.json'

describe('parseTimelineUsers', () => {
  const followingAccounts = parseTimelineUsers(followingResponse)

  it('reads every available account in timeline order', () => {
    expect(followingAccounts.map(account => account.handle)).toEqual([
      'recent_follow',
      'mutual_friend',
      'suggested',
      'big_news',
      'recent_follow',
    ])
  })

  it('reads profile fields, counts and both sides of the relationship', () => {
    expect(followingAccounts[0]).toEqual({
      id: '5001',
      handle: 'recent_follow',
      name: 'Recent Follow',
      bio: 'Café & código',
      avatarUrl: 'https://pbs.twimg.com/profile_images/5001/avatar_normal.png',
      followersCount: 4488,
      followingCount: 100,
      isVerified: true,
      isFollowedByOwner: true,
      followsOwner: false,
    })
  })

  it('treats legacy verification as verified', () => {
    expect(followingAccounts.find(account => account.id === '5003')).toMatchObject({
      isVerified: true,
      followersCount: 9800000,
    })
  })

  it('reads followers with whether the owner follows them back', () => {
    const followerAccounts = parseTimelineUsers(followersResponse)

    expect(
      followerAccounts.map(account => [account.handle, account.followsOwner, account.isFollowedByOwner]),
    ).toEqual([
      ['mutual_follower', true, true],
      ['one_way', true, false],
      ['not_follower', false, false],
      ['mutual_follower', true, true],
    ])
  })

  it('reads accounts in the legacy user format', () => {
    const legacyResponse = {
      content: {
        itemContent: {
          __typename: 'TimelineUser',
          user_results: {
            result: {
              __typename: 'User',
              rest_id: '6001',
              legacy: {
                screen_name: 'legacy_user',
                name: 'Legacy User',
                description: 'Old format',
                profile_image_url_https: 'https://pbs.twimg.com/legacy.png',
                followers_count: 12,
                friends_count: 34,
                following: true,
                followed_by: false,
              },
            },
          },
        },
      },
    }

    expect(parseTimelineUsers(legacyResponse)).toEqual([
      {
        id: '6001',
        handle: 'legacy_user',
        name: 'Legacy User',
        bio: 'Old format',
        avatarUrl: 'https://pbs.twimg.com/legacy.png',
        followersCount: 12,
        followingCount: 34,
        isVerified: false,
        isFollowedByOwner: true,
        followsOwner: false,
      },
    ])
  })

  it('returns nothing for responses without users', () => {
    expect(parseTimelineUsers({ data: {} })).toEqual([])
    expect(parseTimelineUsers(undefined)).toEqual([])
  })
})

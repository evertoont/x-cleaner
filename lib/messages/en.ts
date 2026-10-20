import { countOf } from './count-of'

export const en = {
  kinds: {
    tweet: 'Posts',
    reply: 'Replies',
    retweet: 'Reposts',
    like: 'Likes',
  },
  nav: {
    activityHeading: 'Activity',
    peopleHeading: 'People',
    selectedCount: (count: number) => `${count} selected`,
  },
  people: {
    captureTargets: {
      following: 'Following',
      followers: 'Followers',
    },
    lists: {
      nonFollowers: {
        title: 'Not following back',
        emptyTitle: 'Nobody listed yet',
        emptyDescription:
          "Check Following under Fetch from X, then click Fetch to find who doesn't follow you back.",
      },
      followers: {
        title: 'Followers',
        emptyTitle: 'No followers listed yet',
        emptyDescription: 'Check Followers under Fetch from X, then click Fetch to list who follows you.',
      },
    },
    followerFilterLabel: 'Show',
    followerFilters: {
      all: 'All',
      mutual: 'Mutual follows',
      notFollowedBack: "You don't follow back",
    },
    noFilterMatchesTitle: 'Nobody here',
    noFilterMatchesDescription: 'No followers match this filter.',
    sortLabel: 'Sort by',
    sorts: {
      recent: 'Newest first',
      mostFollowers: 'Most followers',
      fewestFollowers: 'Fewest followers',
    },
    followerCount: (count: number, formattedCount: string) =>
      count === 1 ? '1 follower' : `${formattedCount} followers`,
    followingCount: (formattedCount: string) => `${formattedCount} following`,
    mutual: 'You follow each other',
    notFollowedBack: "You don't follow back",
    verified: 'Verified',
    openProfile: 'Open profile on X',
    moreAccounts: (count: number) => `and ${count} more`,
  },
  accountActions: {
    unfollow: {
      button: (count: number) => `Unfollow ${count}`,
      dialogTitle: (count: number) => `Unfollow ${countOf(count, 'account', 'accounts')}?`,
      effect: 'You can follow them again on X at any time.',
      done: (count: number) => `${countOf(count, 'account', 'accounts')} unfollowed.`,
      nobody: 'Nobody was unfollowed.',
      progress: (completed: number, total: number) => `Unfollowing ${completed} of ${total}`,
      milestone: (percentDone: number) => `Unfollowing: ${percentDone}% done`,
    },
    removeFollower: {
      button: (count: number) => `Remove ${count}`,
      dialogTitle: (count: number) => `Remove ${countOf(count, 'follower', 'followers')}?`,
      effect: "They won't be notified, but they can follow you again.",
      done: (count: number) => `${countOf(count, 'follower', 'followers')} removed.`,
      nobody: 'No follower was removed.',
      progress: (completed: number, total: number) => `Removing followers ${completed} of ${total}`,
      milestone: (percentDone: number) => `Removing followers: ${percentDone}% done`,
    },
  },
  accountRemoval: {
    duration: (duration: string) => `Takes about ${duration}, at a slow pace to protect your account.`,
    dailyLimit: (limit: number) =>
      `X Cleaner stops after ${limit} a day; the rest stay selected for later.`,
    failed: (count: number) =>
      count === 1
        ? '1 account failed and is still in the list.'
        : `${count} accounts failed and are still in the list.`,
    heldBack: (count: number, resumeTime: string) =>
      `Daily limit reached: ${countOf(count, 'account stays', 'accounts stay')} selected. Continue after ${resumeTime}.`,
    limitReached: (resumeTime: string) =>
      `You reached today's limit for this action. Continue after ${resumeTime}.`,
  },
  sidebar: {
    footnote: 'Runs in your browser and only talks to x.com.',
  },
  capture: {
    heading: 'Fetch from X',
    legend: 'What to fetch',
    button: 'Fetch',
    hint: 'The X tab scrolls by itself, then comes back here.',
  },
  archive: {
    heading: 'X archive',
    button: 'Import tweets.js',
    hint: 'From the data archive X sends you (data/tweets.js). Lists what your profile and search leave out.',
    imported: (count: number) => `${countOf(count, 'item', 'items')} read from the archive.`,
  },
  list: {
    emptyTitle: 'Nothing fetched yet',
    emptyDescription: 'Pick what to fetch under Fetch from X, in the sidebar, then click Fetch.',
    emptyKindTitle: (kindLabel: string) => `Nothing in ${kindLabel}`,
    emptyKindDescription: 'Check this type under Fetch from X to fetch it again.',
    openOnX: 'Open on X',
    mediaOnly: 'No text, media only',
    noDate: 'no date',
    repostOf: (handle: string) => `Repost of @${handle}`,
    replyingTo: (handle: string) => `Replying to @${handle}`,
  },
  toolbar: {
    selectAll: 'Select all',
    selectFailed: (count: number) => `Select ${count} failed`,
    clearSelection: 'Clear selection',
    stop: 'Stop',
    cancel: 'Cancel',
    technicalDetails: 'Technical details',
    keepTabsOpen: 'Keep this tab and the X tab open until it finishes: items are removed through them.',
    keepXTabOpen:
      'You can close this tab: removal keeps going in the background. Keep the X tab open until it finishes.',
  },
  removal: {
    button: {
      delete: (count: number) => `Delete ${count}`,
      undoRepost: (count: number) => `Undo ${countOf(count, 'repost', 'reposts')}`,
      unlike: (count: number) => `Unlike ${count}`,
      mixed: (count: number) => `Remove ${count}`,
    },
    confirmActions: {
      tweet: (count: number) => `delete ${countOf(count, 'post', 'posts')}`,
      reply: (count: number) => `delete ${countOf(count, 'reply', 'replies')}`,
      retweet: (count: number) => `undo ${countOf(count, 'repost', 'reposts')}`,
      like: (count: number) => `remove ${countOf(count, 'like', 'likes')}`,
    },
    done: {
      tweet: (count: number) => `${countOf(count, 'post', 'posts')} deleted`,
      reply: (count: number) => `${countOf(count, 'reply', 'replies')} deleted`,
      retweet: (count: number) => `${countOf(count, 'repost', 'reposts')} undone`,
      like: (count: number) => `${countOf(count, 'like', 'likes')} removed`,
    },
    stopped: 'Stopped.',
    nothingRemoved: 'Nothing was removed.',
    failed: (count: number) =>
      count === 1
        ? '1 item failed and is still in the list.'
        : `${count} items failed and are still in the list.`,
  },
  confirmDialog: {
    title: (count: number) => `Remove ${countOf(count, 'item', 'items')}?`,
    duration: (duration: string) => `Takes about ${duration}. Keep the X tab open until it finishes.`,
    irreversible: "This can't be undone.",
    backgroundRun: 'Keep going if I close this tab',
  },
  activity: {
    openingX: 'Opening X…',
    capturing: (kindLabel: string, step: number, totalSteps: number) =>
      `Fetching ${kindLabel} (${step} of ${totalSteps})… the X tab scrolls by itself.`,
    capturingSearch: (kindLabel: string, step: number, totalSteps: number) =>
      `Fetching ${kindLabel} from the X search (${step} of ${totalSteps})… the X tab scrolls by itself.`,
    removing: (completed: number, total: number) => `Removing ${completed} of ${total}`,
    timeLeft: (duration: string) => `about ${duration} left`,
    rateLimited: (resumeTime: string) => `X rate limit reached, resuming at ${resumeTime}`,
    removalMilestone: (percentDone: number) => `Removing: ${percentDone}% done`,
  },
  captureOutcome: {
    fetched: (count: number) => `${countOf(count, 'item', 'items')} fetched.`,
    stopped: 'Fetch stopped.',
    nothingFound: (kindList: string) => `Nothing found in ${kindList}.`,
    diagnostics: (responseCount: number, operations: string) =>
      `Timeline responses read: ${responseCount}. Operations x.com sent: ${operations}.`,
    noOperations: 'none',
  },
  overlay: {
    capturing: (kindLabel: string) => `X Cleaner · fetching ${kindLabel}…`,
    stopping: 'X Cleaner · stopping…',
    stop: 'Stop fetching',
    removing: (progress: string) => `X Cleaner · ${progress}`,
    stopRemoval: 'Stop',
  },
  progress: {
    capturing: 'Fetching',
    removing: 'Removing',
  },
  errors: {
    tabUnavailable: 'The x.com tab was closed or stopped responding. Try again.',
    notLoggedIn: "Couldn't find your account on x.com. Log in and try again.",
    sessionExpired: 'Your x.com session expired. Log in again and pick up where you left off.',
    accountLocked: 'X temporarily locked your account. Open x.com to unlock it, then try again.',
    network: "Couldn't reach X. Check your connection.",
    removalRejected: 'X refused the removal.',
    removalHttpError: (httpStatus: number) => `X responded with error ${httpStatus}.`,
    archiveFileInvalid: (fileName: string) =>
      `${fileName} doesn't look like tweets.js from your X archive.`,
    generic: 'Something went wrong. Try again.',
  },
}

export type Messages = typeof en

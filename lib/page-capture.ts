import { selectFollowers, selectNonFollowers } from './accounts'
import type { Account } from './accounts'
import { CAPTURE_MODE_TARGET, describeCaptureTarget } from './capture-modes'
import type { CaptureMode, PeopleCaptureMode, PostCaptureMode } from './capture-modes'
import { showCaptureOverlay } from './capture-overlay'
import type { CapturedItem } from './items'
import type { GraphqlResponseMessage } from './page-messages'
import { sleep } from './sleep'
import { parseTimelineResponse } from './timeline-parser'
import { parseTimelineUsers } from './user-timeline-parser'

export type XWebApp = 'responsive-web' | 'x-web'

export interface XSession {
  ownerHandle: string
  app: XWebApp
}

export interface CaptureResult {
  items: CapturedItem[]
  nonFollowers: Account[]
  followers: Account[]
  wasStopped: boolean
  timelineResponseCount: number
  seenOperations: string[]
}

// Timelines de perfil só trazem itens do dono do perfil, então aceitar qualquer uma delas é seguro.
const PROFILE_TIMELINE_OPERATIONS = [
  'UserTweets',
  'UserTweetsAndReplies',
  'UserOriginalsTimeline',
  'UserRepliesTimeline',
  'UserRepostsTimeline',
]

const POST_CAPTURE_OPERATIONS: Record<PostCaptureMode, string[]> = {
  posts: PROFILE_TIMELINE_OPERATIONS,
  replies: PROFILE_TIMELINE_OPERATIONS,
  reposts: PROFILE_TIMELINE_OPERATIONS,
  likes: ['Likes', 'likesQuery'],
}

const PROFILE_LINK_SELECTOR = 'a[data-testid="AppTabBar_Profile_Link"]'
const RESPONSIVE_WEB_SCRIPT_SELECTOR = 'script[src*="/responsive-web/client-web"]'
const POLL_INTERVAL_MS = 500
const HANDLE_DETECTION_TIMEOUT_MS = 15_000
const FIRST_RESPONSE_TIMEOUT_MS = 20_000
const SCROLL_INTERVAL_MS = 1500
const IDLE_SCROLLS_BEFORE_STOP = 6

let activeCaptureController: AbortController | null = null

export async function detectSession(): Promise<XSession | null> {
  const profileLink = await waitFor(
    () => document.querySelector(PROFILE_LINK_SELECTOR),
    HANDLE_DETECTION_TIMEOUT_MS,
  )
  const profilePath = profileLink?.getAttribute('href')

  if (!profilePath) {
    return null
  }

  return {
    ownerHandle: profilePath.slice(1),
    app: document.querySelector(RESPONSIVE_WEB_SCRIPT_SELECTOR) ? 'responsive-web' : 'x-web',
  }
}

export function stopCapture(): void {
  activeCaptureController?.abort()
}

export async function captureTimeline(
  receivedResponses: GraphqlResponseMessage[],
  mode: CaptureMode,
  ownerHandle: string,
): Promise<CaptureResult> {
  const captureController = new AbortController()
  const { signal } = captureController
  const sectionLabel = describeCaptureTarget(CAPTURE_MODE_TARGET[mode])
  const removeOverlay = showCaptureOverlay(sectionLabel, () => captureController.abort())
  const readTimelineResponses = () =>
    receivedResponses.filter(response => isTimelineOperation(mode, response.operationName))

  activeCaptureController = captureController

  try {
    await waitFor(() => readTimelineResponses().length > 0, FIRST_RESPONSE_TIMEOUT_MS, signal)
    await scrollUntilTimelineEnds(() => readTimelineResponses().length, signal)

    const timelineResponses = readTimelineResponses()

    return {
      ...parseSection(timelineResponses, mode, ownerHandle),
      wasStopped: signal.aborted,
      timelineResponseCount: timelineResponses.length,
      seenOperations: summarizeOperations(receivedResponses),
    }
  } finally {
    removeOverlay()
    activeCaptureController = null
  }
}

async function scrollUntilTimelineEnds(
  countResponses: () => number,
  signal: AbortSignal,
): Promise<void> {
  let idleScrolls = 0
  let previousCount = countResponses()

  while (idleScrolls < IDLE_SCROLLS_BEFORE_STOP && !signal.aborted) {
    window.scrollTo(0, document.documentElement.scrollHeight)
    await sleep(SCROLL_INTERVAL_MS, signal)

    const currentCount = countResponses()
    idleScrolls = currentCount === previousCount ? idleScrolls + 1 : 0
    previousCount = currentCount
  }
}

// O nome das operações das listas de pessoas muda entre versões do X; todas contêm "Following" ou "Followers".
const PEOPLE_OPERATION_FRAGMENTS: Record<PeopleCaptureMode, string> = {
  following: 'Following',
  followers: 'Followers',
}

function isTimelineOperation(mode: CaptureMode, operationName: string): boolean {
  if (mode === 'following' || mode === 'followers') {
    return operationName.includes(PEOPLE_OPERATION_FRAGMENTS[mode])
  }

  return POST_CAPTURE_OPERATIONS[mode].includes(operationName)
}

function parseSection(
  responses: GraphqlResponseMessage[],
  mode: CaptureMode,
  ownerHandle: string,
): Pick<CaptureResult, 'items' | 'nonFollowers' | 'followers'> {
  const emptySection = { items: [], nonFollowers: [], followers: [] }
  const readUsers = () => responses.flatMap(response => parseTimelineUsers(readJson(response.body)))

  if (mode === 'following') {
    return { ...emptySection, nonFollowers: selectNonFollowers(readUsers()) }
  }

  if (mode === 'followers') {
    return { ...emptySection, followers: selectFollowers(readUsers()) }
  }

  return { ...emptySection, items: parseResponses(responses, mode, ownerHandle) }
}

function parseResponses(
  responses: GraphqlResponseMessage[],
  mode: PostCaptureMode,
  ownerHandle: string,
): CapturedItem[] {
  const itemsByKey = new Map<string, CapturedItem>()

  for (const response of responses) {
    const items = parseTimelineResponse(readJson(response.body), mode, ownerHandle)
    items.forEach(item => itemsByKey.set(item.key, item))
  }

  return [...itemsByKey.values()]
}

function summarizeOperations(responses: GraphqlResponseMessage[]): string[] {
  const countsByOperation = new Map<string, number>()

  responses.forEach(response => {
    countsByOperation.set(response.operationName, (countsByOperation.get(response.operationName) ?? 0) + 1)
  })

  return [...countsByOperation].map(([operationName, count]) => `${operationName}×${count}`)
}

function readJson(body: unknown): unknown {
  if (typeof body !== 'string') {
    return body
  }

  try {
    return JSON.parse(body)
  } catch {
    return undefined
  }
}

async function waitFor<Result>(
  readResult: () => Result | null | false,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<Result | null> {
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline && !signal?.aborted) {
    const result = readResult()

    if (result) {
      return result
    }

    await sleep(POLL_INTERVAL_MS, signal)
  }

  return null
}

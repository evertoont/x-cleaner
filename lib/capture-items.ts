import { XNotLoggedInError } from './errors'
import { dedupeItems } from './items'
import type { CapturedItem, ItemKind } from './items'
import type { CaptureResult, XSession, XWebApp } from './page-capture'
import { CAPTURE_MODE_KIND } from './timeline-parser'
import type { CaptureMode } from './timeline-parser'
import { findOrOpenXTab, focusTab, navigateXTab, sendBridgeRequest, X_HOME_URL } from './x-tab'

export interface CaptureSection {
  kind: ItemKind
  step: number
  totalSteps: number
}

type SectionUrlBuilder = (ownerHandle: string) => string

type SectionStartHandler = (section: CaptureSection) => void

const CAPTURE_MODES: CaptureMode[] = ['posts', 'replies', 'reposts', 'likes']

// Os dois apps têm aba própria de reposts (o perfil principal só mostra originais); só as curtidas mudam de lugar.
const SECTION_URL_BUILDERS: Record<XWebApp, Record<CaptureMode, SectionUrlBuilder>> = {
  'responsive-web': {
    posts: ownerHandle => `https://x.com/${ownerHandle}`,
    replies: ownerHandle => `https://x.com/${ownerHandle}/with_replies`,
    reposts: ownerHandle => `https://x.com/${ownerHandle}/reposts`,
    likes: ownerHandle => `https://x.com/${ownerHandle}/likes`,
  },
  'x-web': {
    posts: ownerHandle => `https://x.com/${ownerHandle}`,
    replies: ownerHandle => `https://x.com/${ownerHandle}/with_replies`,
    reposts: ownerHandle => `https://x.com/${ownerHandle}/reposts`,
    likes: () => 'https://x.com/i/history/likes',
  },
}

export async function captureItems(
  kinds: ItemKind[],
  signal: AbortSignal,
  onSectionStart: SectionStartHandler,
): Promise<CaptureResult> {
  const tabId = await findOrOpenXTab()
  const stopPageCapture = () => {
    void sendBridgeRequest(tabId, { type: 'stop-capture' }).catch(() => undefined)
  }

  signal.addEventListener('abort', stopPageCapture, { once: true })

  try {
    return await captureFromTab(tabId, kinds, signal, onSectionStart)
  } finally {
    signal.removeEventListener('abort', stopPageCapture)
  }
}

export function selectCaptureModes(kinds: ItemKind[]): CaptureMode[] {
  return CAPTURE_MODES.filter(mode => kinds.includes(CAPTURE_MODE_KIND[mode]))
}

export function buildSectionUrl(mode: CaptureMode, session: XSession): string {
  return SECTION_URL_BUILDERS[session.app][mode](session.ownerHandle)
}

async function captureFromTab(
  tabId: number,
  kinds: ItemKind[],
  signal: AbortSignal,
  onSectionStart: SectionStartHandler,
): Promise<CaptureResult> {
  const capturedItems: CapturedItem[] = []
  const seenOperations: string[] = []
  let timelineResponseCount = 0

  const buildResult = (wasStopped: boolean): CaptureResult => ({
    items: dedupeItems(capturedItems).filter(item => kinds.includes(item.kind)),
    wasStopped,
    timelineResponseCount,
    seenOperations,
  })

  await focusTab(tabId)
  await navigateXTab(tabId, X_HOME_URL)

  const session = await sendBridgeRequest(tabId, { type: 'detect-handle' })

  if (!session) {
    throw new XNotLoggedInError()
  }

  const captureModes = selectCaptureModes(kinds)

  for (const [index, mode] of captureModes.entries()) {
    onSectionStart({ kind: CAPTURE_MODE_KIND[mode], step: index + 1, totalSteps: captureModes.length })
    await navigateXTab(tabId, buildSectionUrl(mode, session))

    if (signal.aborted) {
      return buildResult(true)
    }

    const section = await sendBridgeRequest(tabId, {
      type: 'capture',
      mode,
      ownerHandle: session.ownerHandle,
    })

    capturedItems.push(...section.items)
    seenOperations.push(...section.seenOperations)
    timelineResponseCount += section.timelineResponseCount

    if (section.wasStopped || signal.aborted) {
      return buildResult(true)
    }
  }

  return buildResult(false)
}

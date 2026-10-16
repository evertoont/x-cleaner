import type { RemovalBridgeRequest } from './bridge-messages'
import { XAccountLockedError, XSessionExpiredError, XTabUnavailableError } from './errors'
import type { IntervalRange } from './removal-pace'
import type { RemovalResult } from './removal-response'
import { sleep } from './sleep'
import { prepareXTab, sendBridgeRequest } from './x-tab'

export type SettledRemoval = Extract<RemovalResult, { status: 'removed' | 'failed' }>

export interface RemovalQueueOptions<Entry> {
  entries: Entry[]
  interval: IntervalRange
  signal: AbortSignal
  buildRequest: (entry: Entry) => RemovalBridgeRequest
  onEntrySettled: (entry: Entry, removal: SettledRemoval) => Promise<void>
  onRateLimited: (resumeAt: Date) => Promise<void>
}

interface XTabConnection {
  tabId: number
}

const RATE_LIMIT_FALLBACK_WAIT_MS = 5 * 60_000

export async function runRemovalQueue<Entry>(options: RemovalQueueOptions<Entry>): Promise<void> {
  const { entries, interval, signal, onEntrySettled } = options
  const xTab: XTabConnection = { tabId: await prepareXTab() }

  for (const [index, entry] of entries.entries()) {
    const removal = await removeRespectingRateLimit(xTab, entry, options)

    if (!removal) {
      return
    }

    await onEntrySettled(entry, removal)

    const isLastEntry = index === entries.length - 1

    if (!isLastEntry) {
      await sleep(pickInterval(interval), signal)
    }
  }
}

async function removeRespectingRateLimit<Entry>(
  xTab: XTabConnection,
  entry: Entry,
  options: RemovalQueueOptions<Entry>,
): Promise<SettledRemoval | undefined> {
  const { signal, buildRequest, onRateLimited } = options

  while (!signal.aborted) {
    const result = await sendRecoveringTab(xTab, buildRequest(entry))

    if (result.status === 'session-expired') {
      throw new XSessionExpiredError()
    }

    if (result.status === 'account-locked') {
      throw new XAccountLockedError()
    }

    if (result.status !== 'rate-limited') {
      return result
    }

    const resumeAt = new Date(result.retryAt ?? Date.now() + RATE_LIMIT_FALLBACK_WAIT_MS)

    await onRateLimited(resumeAt)
    await sleep(resumeAt.getTime() - Date.now(), signal)
  }

  return undefined
}

// Com a fila em segundo plano, a pessoa pode recarregar ou fechar a aba do X no meio: reabre e tenta uma vez de novo.
// Repetir é seguro porque o X responde "não encontrado" para o que já foi removido.
async function sendRecoveringTab(
  xTab: XTabConnection,
  request: RemovalBridgeRequest,
): Promise<RemovalResult> {
  try {
    return await sendBridgeRequest(xTab.tabId, request)
  } catch (error) {
    if (!(error instanceof XTabUnavailableError)) {
      throw error
    }

    xTab.tabId = await prepareXTab()

    return sendBridgeRequest(xTab.tabId, request)
  }
}

function pickInterval(interval: IntervalRange): number {
  return interval.minMs + Math.random() * (interval.maxMs - interval.minMs)
}

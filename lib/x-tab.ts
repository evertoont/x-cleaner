import { browser } from 'wxt/browser'
import type { BridgeRequest, BridgeResponses } from './bridge-messages'
import { XTabUnavailableError } from './errors'

export const X_HOME_URL = 'https://x.com/home'

const X_URL_PATTERN = 'https://x.com/*'
const TAB_LOAD_TIMEOUT_MS = 30_000

export async function findOrOpenXTab(): Promise<number> {
  const [existingTab] = await browser.tabs.query({ url: X_URL_PATTERN })

  if (existingTab?.id !== undefined) {
    return existingTab.id
  }

  const createdTab = await browser.tabs.create({ url: 'about:blank', active: false })

  if (createdTab.id === undefined) {
    throw new XTabUnavailableError()
  }

  return createdTab.id
}

// Só recarrega a aba quando o X Cleaner ainda não responde nela, para não tirar a pessoa da página que está lendo.
export async function prepareXTab(): Promise<number> {
  const tabId = await findOrOpenXTab()

  if (await isBridgeResponsive(tabId)) {
    return tabId
  }

  await navigateXTab(tabId, X_HOME_URL)

  return tabId
}

export async function navigateXTab(tabId: number, url: string): Promise<void> {
  const tabLoaded = waitForTabLoad(tabId)

  try {
    await browser.tabs.update(tabId, { url, autoDiscardable: false })
  } catch {
    throw new XTabUnavailableError()
  }

  await tabLoaded
}

export async function focusTab(tabId: number): Promise<void> {
  try {
    const tab = await browser.tabs.update(tabId, { active: true })

    if (tab?.windowId !== undefined) {
      await browser.windows.update(tab.windowId, { focused: true })
    }
  } catch {
    throw new XTabUnavailableError()
  }
}

export async function focusCurrentTab(): Promise<void> {
  const currentTab = await browser.tabs.getCurrent()

  if (currentTab?.id === undefined) {
    return
  }

  await focusTab(currentTab.id)
}

export async function sendBridgeRequest<Request extends BridgeRequest>(
  tabId: number,
  request: Request,
): Promise<BridgeResponses[Request['type']]> {
  const response = await browser.tabs.sendMessage(tabId, request).catch(() => undefined)

  if (response === undefined) {
    throw new XTabUnavailableError()
  }

  return response
}

function isBridgeResponsive(tabId: number): Promise<boolean> {
  return sendBridgeRequest(tabId, { type: 'ping' })
    .then(() => true)
    .catch(() => false)
}

function waitForTabLoad(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let hasStartedLoading = false

    const timeoutId = setTimeout(() => {
      stopListening()
      reject(new XTabUnavailableError())
    }, TAB_LOAD_TIMEOUT_MS)

    const handleUpdated = (updatedTabId: number, changeInfo: { status?: string }) => {
      if (updatedTabId !== tabId) {
        return
      }

      if (changeInfo.status === 'loading') {
        hasStartedLoading = true
        return
      }

      if (changeInfo.status === 'complete' && hasStartedLoading) {
        stopListening()
        resolve()
      }
    }

    const handleRemoved = (removedTabId: number) => {
      if (removedTabId !== tabId) {
        return
      }

      stopListening()
      reject(new XTabUnavailableError())
    }

    const stopListening = () => {
      clearTimeout(timeoutId)
      browser.tabs.onUpdated.removeListener(handleUpdated)
      browser.tabs.onRemoved.removeListener(handleRemoved)
    }

    browser.tabs.onUpdated.addListener(handleUpdated)
    browser.tabs.onRemoved.addListener(handleRemoved)
  })
}

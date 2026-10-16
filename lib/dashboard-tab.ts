import { browser } from 'wxt/browser'
import { focusTab } from './x-tab'

const DASHBOARD_PATH = '/dashboard.html'

export async function openDashboard(): Promise<void> {
  await browser.tabs.create({ url: browser.runtime.getURL(DASHBOARD_PATH) })
}

export async function focusOrOpenDashboard(): Promise<void> {
  const [dashboardContext] = await findDashboardContexts()

  if (dashboardContext === undefined || dashboardContext.tabId < 0) {
    await openDashboard()
    return
  }

  await focusTab(dashboardContext.tabId)
}

// Ao fechar uma aba, o contexto dela ainda pode aparecer por instantes; por isso a aba fechada é ignorada.
export async function isDashboardOpen(closingTabId?: number): Promise<boolean> {
  const dashboardContexts = await findDashboardContexts()

  return dashboardContexts.some(dashboardContext => dashboardContext.tabId !== closingTabId)
}

function findDashboardContexts() {
  return browser.runtime.getContexts({
    contextTypes: ['TAB'],
    documentUrls: [browser.runtime.getURL(DASHBOARD_PATH)],
  })
}

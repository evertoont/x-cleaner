import { browser } from 'wxt/browser'
import { defineBackground } from 'wxt/utils/define-background'
import { focusOrOpenDashboard, openDashboard } from '../lib/dashboard-tab'
import { removalJobStorage, removalStopRequestStorage } from '../lib/item-storage'
import { abortRemovalJob, resumeRemovalJob, stopIfDashboardClosed } from '../lib/removal-job-runner'

// Ouvintes registrados no topo para que o Chrome acorde o service worker nesses eventos.
export default defineBackground(() => {
  browser.action.onClicked.addListener(() => void openDashboard())
  browser.notifications.onClicked.addListener(handleNotificationClicked)
  browser.alarms.onAlarm.addListener(() => void resumeRemovalJob())
  browser.runtime.onStartup.addListener(() => void resumeRemovalJob())
  browser.tabs.onRemoved.addListener(closedTabId => void stopIfDashboardClosed(closedTabId))

  removalJobStorage.watch(() => void resumeRemovalJob())
  removalStopRequestStorage.watch(isStopRequested => {
    if (isStopRequested) {
      abortRemovalJob()
    }
  })

  void resumeRemovalJob()
})

function handleNotificationClicked(notificationId: string): void {
  void browser.notifications.clear(notificationId)
  void focusOrOpenDashboard()
}

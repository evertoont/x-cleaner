import { browser } from 'wxt/browser'
import { defineBackground } from 'wxt/utils/define-background'

export default defineBackground(() => {
  browser.action.onClicked.addListener(openDashboard)
})

function openDashboard(): void {
  void browser.tabs.create({ url: browser.runtime.getURL('/dashboard.html') })
}

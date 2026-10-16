import { describeRemovalActivity } from './activity'
import { messages } from './i18n'
import { removalJobStorage } from './item-storage'
import { showPageOverlay } from './page-overlay'
import type { PageOverlay } from './page-overlay'
import { requestRemovalStop } from './removal-job-control'
import { toRemovalActivity } from './removal-jobs'
import type { RemovalJob } from './removal-jobs'

// Toda aba do x.com mostra o selo enquanto a fila roda, inclusive com o painel fechado.
export function watchRemovalBadge(): void {
  let badge: PageOverlay | null = null

  const renderBadge = (job: RemovalJob | null) => {
    if (!job) {
      badge?.remove()
      badge = null
      return
    }

    const badgeMessage = messages.overlay.removing(describeRemovalActivity(toRemovalActivity(job)))

    if (badge) {
      badge.updateMessage(badgeMessage)
      return
    }

    badge = showPageOverlay({
      message: badgeMessage,
      stopLabel: messages.overlay.stopRemoval,
      onStop: () => void requestRemovalStop(),
    })
  }

  void removalJobStorage.getValue().then(renderBadge)
  removalJobStorage.watch(storedJob => renderBadge(storedJob))
}

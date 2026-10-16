import { browser } from 'wxt/browser'
import { runAccountRemovals } from './account-removals'
import { ACTION_PEOPLE_LISTS } from './accounts'
import type { Account, PeopleList } from './accounts'
import type { Notice } from './activity'
import { isDashboardOpen } from './dashboard-tab'
import { describeError } from './errors'
import {
  accountListStorages,
  itemsStorage,
  removalJobStorage,
  removalNoticeStorage,
  removalStopRequestStorage,
} from './item-storage'
import type { CapturedItem } from './items'
import {
  applySettlement,
  describeRemovalJobOutcome,
  recordAccountAction,
  recordItemRemoval,
  selectPendingEntries,
} from './removal-jobs'
import type { RemovalJob } from './removal-jobs'
import type { SettledRemoval } from './removal-queue'
import { removeItems } from './remove-items'
import { sleep } from './sleep'

// O Chrome encerra o service worker ocioso (por exemplo, esperando o limite do X); o alarme o acorda
// para retomar a fila salva de onde parou.
const WATCHDOG_ALARM_NAME = 'removal-watchdog'
const WATCHDOG_PERIOD_MINUTES = 1
const NOTIFICATION_ID_PREFIX = 'removal-finished'
const NOTIFICATION_TITLE = 'X Cleaner'
const NOTIFICATION_ICON_PATH = '/icon/128.png'

let activeRunController: AbortController | null = null

export async function resumeRemovalJob(): Promise<void> {
  if (activeRunController) {
    return
  }

  const runController = new AbortController()

  activeRunController = runController

  try {
    await runStoredJob(runController.signal)
  } finally {
    activeRunController = null
  }
}

export function abortRemovalJob(): void {
  activeRunController?.abort()
}

export async function stopIfDashboardClosed(closedTabId: number): Promise<void> {
  const job = await removalJobStorage.getValue()

  if (!job || job.isBackgroundRun) {
    return
  }

  if (await isDashboardOpen(closedTabId)) {
    return
  }

  await removalStopRequestStorage.setValue(true)
}

async function runStoredJob(signal: AbortSignal): Promise<void> {
  const job = await removalJobStorage.getValue()

  if (!job) {
    return
  }

  await browser.alarms.create(WATCHDOG_ALARM_NAME, { periodInMinutes: WATCHDOG_PERIOD_MINUTES })

  const notice = await processJob(job, signal)

  await finishJob(notice)
}

async function processJob(job: RemovalJob, signal: AbortSignal): Promise<Notice> {
  if (await shouldStopBeforeRunning(job)) {
    return describeRemovalJobOutcome(job, true)
  }

  try {
    await waitForRateLimitReset(job, signal)
    await runJobQueue(job, signal)
  } catch (error) {
    console.error(error)
    return { message: describeError(error), tone: 'error' }
  }

  const settledJob = (await removalJobStorage.getValue()) ?? job

  return describeRemovalJobOutcome(settledJob, signal.aborted)
}

async function shouldStopBeforeRunning(job: RemovalJob): Promise<boolean> {
  if (await removalStopRequestStorage.getValue()) {
    return true
  }

  if (job.isBackgroundRun) {
    return false
  }

  return !(await isDashboardOpen())
}

async function waitForRateLimitReset(job: RemovalJob, signal: AbortSignal): Promise<void> {
  if (job.resumeAt === undefined) {
    return
  }

  await sleep(job.resumeAt - Date.now(), signal)
}

async function runJobQueue(job: RemovalJob, signal: AbortSignal): Promise<void> {
  if (job.target === 'items') {
    const storedItems = await itemsStorage.getValue()

    await removeItems({
      items: selectPendingEntries(storedItems, job.pendingKeys),
      signal,
      onItemSettled: settleItem,
      onRateLimited: saveResumeAt,
    })
    return
  }

  const list = ACTION_PEOPLE_LISTS[job.target]
  const storedAccounts = await accountListStorages[list].getValue()

  await runAccountRemovals({
    action: job.target,
    accounts: selectPendingEntries(storedAccounts, job.pendingKeys),
    signal,
    onAccountSettled: (account, removal) => settleAccount(list, account, removal),
    onRateLimited: saveResumeAt,
  })
}

async function settleItem(item: CapturedItem, removal: SettledRemoval): Promise<void> {
  const storedItems = await itemsStorage.getValue()

  await itemsStorage.setValue(applySettlement(storedItems, item.key, removal))
  await updateStoredJob(job => (job.target === 'items' ? recordItemRemoval(job, item, removal) : job))
}

async function settleAccount(
  list: PeopleList,
  account: Account,
  removal: SettledRemoval,
): Promise<void> {
  const accountListStorage = accountListStorages[list]
  const storedAccounts = await accountListStorage.getValue()

  await accountListStorage.setValue(applySettlement(storedAccounts, account.key, removal))
  await updateStoredJob(job =>
    job.target === 'items' ? job : recordAccountAction(job, account, removal),
  )
}

function saveResumeAt(resumeAt: Date): Promise<void> {
  return updateStoredJob(job => ({ ...job, resumeAt: resumeAt.getTime() }))
}

async function updateStoredJob(updateJob: (job: RemovalJob) => RemovalJob): Promise<void> {
  const job = await removalJobStorage.getValue()

  if (!job) {
    return
  }

  await removalJobStorage.setValue(updateJob(job))
}

// O job é apagado por último: enquanto ele existe, o painel não deixa iniciar outra remoção.
async function finishJob(notice: Notice): Promise<void> {
  await browser.alarms.clear(WATCHDOG_ALARM_NAME)
  await removalNoticeStorage.setValue(notice)
  await notifyRemovalFinished(notice)
  await removalStopRequestStorage.setValue(false)
  await removalJobStorage.setValue(null)
}

// Reusar o mesmo ID só atualiza a notificação anterior na central, sem mostrar o pop-up de novo.
async function notifyRemovalFinished(notice: Notice): Promise<void> {
  const notificationId = `${NOTIFICATION_ID_PREFIX}:${Date.now()}`

  try {
    await browser.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: browser.runtime.getURL(NOTIFICATION_ICON_PATH),
      title: NOTIFICATION_TITLE,
      message: notice.message,
    })
  } catch (error) {
    console.error(error)
  }
}

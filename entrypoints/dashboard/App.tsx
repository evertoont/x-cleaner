import { Eraser } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { AccountList } from '../../components/AccountList'
import { AccountSortSelect } from '../../components/AccountSortSelect'
import { ActionBar } from '../../components/ActionBar'
import { ArchiveImport } from '../../components/ArchiveImport'
import { CaptureControls } from '../../components/CaptureControls'
import { FollowerFilterControl } from '../../components/FollowerFilterControl'
import { ItemList } from '../../components/ItemList'
import { KindNav } from '../../components/KindNav'
import { PeopleNav } from '../../components/PeopleNav'
import { presentAccountRemoval, presentPostRemoval } from '../../components/removal-presentations'
import { useAccountList } from '../../hooks/use-account-list'
import { useCapturedItems } from '../../hooks/use-captured-items'
import { useSelection } from '../../hooks/use-selection'
import { useStoredValue } from '../../hooks/use-stored-value'
import { planAccountRemovals } from '../../lib/account-removals'
import {
  countFollowersByFilter,
  filterFollowers,
  matchesFollowerFilter,
  mergeAccounts,
  PEOPLE_LIST_ACTIONS,
  sortAccounts,
} from '../../lib/accounts'
import type { Account, AccountSort, FollowerFilter, PeopleList } from '../../lib/accounts'
import type { Activity, Notice } from '../../lib/activity'
import { mergeArchiveItems, readArchiveFiles } from '../../lib/archive-import'
import { captureItems } from '../../lib/capture-items'
import { CAPTURE_TARGETS, describeCaptureTarget, isItemKind } from '../../lib/capture-modes'
import type { CaptureTarget } from '../../lib/capture-modes'
import { describeError } from '../../lib/errors'
import { formatDayAndTime, formatList, messages } from '../../lib/i18n'
import { removalJobStorage, removalNoticeStorage } from '../../lib/item-storage'
import { countItemsByKind, mergeItems, replaceItemsOfKinds } from '../../lib/items'
import type { CapturedItem, ItemKind } from '../../lib/items'
import type { CaptureResult } from '../../lib/page-capture'
import { clearRemovalNotice, requestRemovalStop, startRemovalJob } from '../../lib/removal-job-control'
import { createAccountRemovalJob, createItemRemovalJob, toRemovalActivity } from '../../lib/removal-jobs'
import { focusCurrentTab } from '../../lib/x-tab'

type DashboardView = { type: 'posts'; kind: ItemKind } | { type: 'people'; list: PeopleList }

type SelectableEntry = Pick<CapturedItem, 'key' | 'status'>

const EMPTY_ACCOUNTS: Account[] = []

export function App() {
  const { items, isLoaded: areItemsLoaded, replaceItems } = useCapturedItems()
  const nonFollowerList = useAccountList('nonFollowers')
  const followerList = useAccountList('followers')
  const postSelection = useSelection()
  const nonFollowerSelection = useSelection()
  const followerSelection = useSelection()
  const [activeView, setActiveView] = useState<DashboardView>({ type: 'posts', kind: 'tweet' })
  const [captureTargets, setCaptureTargets] = useState<CaptureTarget[]>(CAPTURE_TARGETS)
  const [accountSort, setAccountSort] = useState<AccountSort>('recent')
  const [followerFilter, setFollowerFilter] = useState<FollowerFilter>('all')
  const [captureActivity, setCaptureActivity] = useState<Activity>({ type: 'idle' })
  const [notice, setNotice] = useState<Notice | null>(null)
  const { value: removalJob, isLoaded: isRemovalJobLoaded } = useStoredValue(removalJobStorage)
  const { value: removalNotice } = useStoredValue(removalNoticeStorage)
  const abortControllerRef = useRef<AbortController | null>(null)

  const accountLists = { nonFollowers: nonFollowerList, followers: followerList }
  const accountSelections = { nonFollowers: nonFollowerSelection, followers: followerSelection }
  const activeKind = activeView.type === 'posts' ? activeView.kind : undefined
  const activeList = activeView.type === 'people' ? activeView.list : undefined
  const activeSelection = activeList ? accountSelections[activeList] : postSelection
  const activity = removalJob ? toRemovalActivity(removalJob) : captureActivity
  const displayedNotice = notice ?? removalNotice
  const isBusy = activity.type !== 'idle'

  const countsByKind = useMemo(() => countItemsByKind(items), [items])
  const visibleItems = useMemo(
    () => items.filter(item => item.kind === activeKind).sort(compareNewestFirst),
    [items, activeKind],
  )
  const activeAccounts = activeList ? accountLists[activeList].accounts : EMPTY_ACCOUNTS
  const sortedAccounts = useMemo(
    () => sortAccounts(activeAccounts, accountSort),
    [activeAccounts, accountSort],
  )
  const listedAccounts =
    activeList === 'followers' ? filterFollowers(sortedAccounts, followerFilter) : sortedAccounts

  const selectedItems = items.filter(item => postSelection.selectedKeys.has(item.key))
  const selectedCountsByKind = countItemsByKind(selectedItems)
  const selectedAccounts = listedAccounts.filter(account =>
    activeSelection.selectedKeys.has(account.key),
  )

  const visibleEntries: SelectableEntry[] = activeList ? listedAccounts : visibleItems
  const visibleKeys = visibleEntries.map(entry => entry.key)
  const unselectedFailedKeys = visibleEntries
    .filter(entry => entry.status === 'failed' && !activeSelection.selectedKeys.has(entry.key))
    .map(entry => entry.key)
  const isAllVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every(entryKey => activeSelection.selectedKeys.has(entryKey))

  const viewTitle =
    activeView.type === 'posts'
      ? messages.kinds[activeView.kind]
      : messages.people.lists[activeView.list].title
  const removal =
    activeView.type === 'posts'
      ? presentPostRemoval(selectedCountsByKind, activeView.kind)
      : presentAccountRemoval(PEOPLE_LIST_ACTIONS[activeView.list], selectedAccounts)

  function handleToggleCaptureTarget(target: CaptureTarget) {
    setCaptureTargets(currentTargets =>
      currentTargets.includes(target)
        ? currentTargets.filter(currentTarget => currentTarget !== target)
        : [...currentTargets, target],
    )
  }

  async function handleCapture() {
    const targetsToCapture = captureTargets
    const kindsToCapture = targetsToCapture.filter(isItemKind)
    const abortController = new AbortController()

    abortControllerRef.current = abortController
    setNotice(null)
    void clearRemovalNotice()
    setCaptureActivity({ type: 'capturing' })

    try {
      const capture = await captureItems(targetsToCapture, abortController.signal, section =>
        setCaptureActivity({ type: 'capturing', section }),
      )

      await replaceItems(currentItems =>
        capture.wasStopped
          ? mergeItems(currentItems, capture.items)
          : replaceItemsOfKinds(currentItems, kindsToCapture, capture.items),
      )

      if (targetsToCapture.includes('following')) {
        await nonFollowerList.replaceAccounts(currentAccounts =>
          combineCapturedAccounts(currentAccounts, capture.nonFollowers, capture.wasStopped),
        )
      }

      if (targetsToCapture.includes('followers')) {
        await followerList.replaceAccounts(currentAccounts =>
          combineCapturedAccounts(currentAccounts, capture.followers, capture.wasStopped),
        )
      }

      postSelection.clearSelection()
      nonFollowerSelection.clearSelection()
      followerSelection.clearSelection()
      setNotice(describeCaptureOutcome(capture, targetsToCapture))
    } catch (error) {
      console.error(error)
      setNotice({ message: describeError(error), tone: 'error' })
    } finally {
      abortControllerRef.current = null
      await focusCurrentTab().catch(() => undefined)
      setCaptureActivity({ type: 'idle' })
    }
  }

  async function handleImportArchive(archiveFiles: File[]) {
    setNotice(null)
    void clearRemovalNotice()

    try {
      const archiveItems = await readArchiveFiles(archiveFiles)

      await replaceItems(currentItems => mergeArchiveItems(currentItems, archiveItems))
      postSelection.clearSelection()
      setNotice({ message: messages.archive.imported(archiveItems.length), tone: 'info' })
    } catch (error) {
      console.error(error)
      setNotice({ message: describeError(error), tone: 'error' })
    }
  }

  async function handleRemovePosts(isBackgroundRun: boolean) {
    setNotice(null)
    await startRemovalJob(createItemRemovalJob(selectedItems, isBackgroundRun))
  }

  async function handleRemoveAccounts(
    list: PeopleList,
    accountsToRemove: Account[],
    isBackgroundRun: boolean,
  ) {
    const action = PEOPLE_LIST_ACTIONS[list]
    const plan = await planAccountRemovals(action, accountsToRemove)

    if (plan.accountsToProcess.length === 0) {
      setNotice({
        message: messages.accountRemoval.limitReached(formatDayAndTime(plan.quotaResumeAt)),
        tone: 'info',
      })
      return
    }

    setNotice(null)
    await startRemovalJob(createAccountRemovalJob(action, plan, isBackgroundRun))
  }

  function handleRemove(isBackgroundRun: boolean) {
    if (activeView.type === 'people') {
      void handleRemoveAccounts(activeView.list, selectedAccounts, isBackgroundRun)
      return
    }

    void handleRemovePosts(isBackgroundRun)
  }

  function handleChangeFollowerFilter(filter: FollowerFilter) {
    const hiddenKeys = followerList.accounts
      .filter(account => !matchesFollowerFilter(account, filter))
      .map(account => account.key)

    followerSelection.deselectKeys(hiddenKeys)
    setFollowerFilter(filter)
  }

  function handleStop() {
    if (removalJob) {
      void requestRemovalStop()
      return
    }

    abortControllerRef.current?.abort()
  }

  function handleToggleAllVisible() {
    if (isAllVisibleSelected) {
      activeSelection.deselectKeys(visibleKeys)
      return
    }

    activeSelection.selectKeys(visibleKeys)
  }

  const isStorageLoaded =
    areItemsLoaded && nonFollowerList.isLoaded && followerList.isLoaded && isRemovalJobLoaded

  if (!isStorageLoaded) {
    return null
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <p className="brand">
          <Eraser size={18} strokeWidth={1.75} aria-hidden />
          X Cleaner
        </p>

        <KindNav
          activeKind={activeKind}
          countsByKind={countsByKind}
          selectedCountsByKind={selectedCountsByKind}
          onSelectKind={kind => setActiveView({ type: 'posts', kind })}
        />

        <PeopleNav
          activeList={activeList}
          accountCounts={{
            nonFollowers: nonFollowerList.accounts.length,
            followers: followerList.accounts.length,
          }}
          selectedCounts={{
            nonFollowers: countSelectedAccounts(nonFollowerList.accounts, nonFollowerSelection.selectedKeys),
            followers: countSelectedAccounts(followerList.accounts, followerSelection.selectedKeys),
          }}
          onSelectList={list => setActiveView({ type: 'people', list })}
        />

        <CaptureControls
          selectedTargets={captureTargets}
          isBusy={isBusy}
          onToggleTarget={handleToggleCaptureTarget}
          onCapture={handleCapture}
        />

        <ArchiveImport isBusy={isBusy} onImport={handleImportArchive} />

        <p className="sidebar-footnote">{messages.sidebar.footnote}</p>
      </aside>

      <main className="content">
        <div className="content-column">
          <header className="content-header">
            <h1>{viewTitle}</h1>
            <span className="content-count">{visibleEntries.length}</span>
            {activeList && <AccountSortSelect sort={accountSort} onChangeSort={setAccountSort} />}
          </header>

          {activeList === 'followers' && (
            <FollowerFilterControl
              filter={followerFilter}
              countsByFilter={countFollowersByFilter(followerList.accounts)}
              onChangeFilter={handleChangeFollowerFilter}
            />
          )}

          <ActionBar
            activity={activity}
            notice={displayedNotice}
            isRunningInBackground={removalJob?.isBackgroundRun ?? false}
            selectedCount={activeList ? selectedAccounts.length : selectedItems.length}
            unselectedFailedCount={unselectedFailedKeys.length}
            removal={removal}
            isAllVisibleSelected={isAllVisibleSelected}
            hasVisibleItems={visibleEntries.length > 0}
            onToggleAllVisible={handleToggleAllVisible}
            onSelectFailed={() => activeSelection.selectKeys(unselectedFailedKeys)}
            onClearSelection={activeSelection.clearSelection}
            onRemove={handleRemove}
            onStop={handleStop}
          />

          {activeView.type === 'posts' ? (
            <ItemList
              items={visibleItems}
              selectedKeys={postSelection.selectedKeys}
              isSelectionLocked={isBusy}
              emptyTitle={
                items.length === 0
                  ? messages.list.emptyTitle
                  : messages.list.emptyKindTitle(messages.kinds[activeView.kind])
              }
              emptyDescription={
                items.length === 0
                  ? messages.list.emptyDescription
                  : messages.list.emptyKindDescription
              }
              onToggle={postSelection.toggleKey}
            />
          ) : (
            <AccountList
              list={activeView.list}
              accounts={listedAccounts}
              selectedKeys={activeSelection.selectedKeys}
              isSelectionLocked={isBusy}
              emptyTitle={
                activeAccounts.length > 0
                  ? messages.people.noFilterMatchesTitle
                  : messages.people.lists[activeView.list].emptyTitle
              }
              emptyDescription={
                activeAccounts.length > 0
                  ? messages.people.noFilterMatchesDescription
                  : messages.people.lists[activeView.list].emptyDescription
              }
              onToggle={activeSelection.toggleKey}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function compareNewestFirst(firstItem: CapturedItem, secondItem: CapturedItem): number {
  return secondItem.createdAt.localeCompare(firstItem.createdAt)
}

function combineCapturedAccounts(
  currentAccounts: Account[],
  capturedAccounts: Account[],
  wasStopped: boolean,
): Account[] {
  return wasStopped ? mergeAccounts(currentAccounts, capturedAccounts) : capturedAccounts
}

// Contas removidas pelo background somem da lista mas podem continuar na seleção; só contam as que ainda existem.
function countSelectedAccounts(accounts: Account[], selectedKeys: ReadonlySet<string>): number {
  return accounts.filter(account => selectedKeys.has(account.key)).length
}

function describeCaptureOutcome(capture: CaptureResult, capturedTargets: CaptureTarget[]): Notice {
  const fetchedCount = capture.items.length + capture.nonFollowers.length + capture.followers.length
  const fetchedSummary = messages.captureOutcome.fetched(fetchedCount)

  if (capture.wasStopped) {
    return { message: `${messages.captureOutcome.stopped} ${fetchedSummary}`, tone: 'info' }
  }

  if (fetchedCount > 0) {
    return { message: fetchedSummary, tone: 'info' }
  }

  const capturedTargetLabels = CAPTURE_TARGETS.filter(target => capturedTargets.includes(target)).map(
    describeCaptureTarget,
  )

  return {
    message: messages.captureOutcome.nothingFound(formatList(capturedTargetLabels)),
    tone: 'info',
    details: describeCaptureDiagnostics(capture),
  }
}

function describeCaptureDiagnostics(capture: CaptureResult): string {
  const seenOperations =
    capture.seenOperations.join(', ') || messages.captureOutcome.noOperations

  return messages.captureOutcome.diagnostics(capture.timelineResponseCount, seenOperations)
}

import { Eraser } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { ActionBar } from '../../components/ActionBar'
import { CaptureControls } from '../../components/CaptureControls'
import { ItemList } from '../../components/ItemList'
import { KindNav } from '../../components/KindNav'
import { useCapturedItems } from '../../hooks/use-captured-items'
import { useSelection } from '../../hooks/use-selection'
import type { Activity, Notice } from '../../lib/activity'
import { captureItems } from '../../lib/capture-items'
import { describeError } from '../../lib/errors'
import { formatList, messages } from '../../lib/i18n'
import { countItemsByKind, ITEM_KINDS, mergeItems, replaceItemsOfKinds } from '../../lib/items'
import type { CapturedItem, ItemKind } from '../../lib/items'
import type { CaptureResult } from '../../lib/page-capture'
import type { SettledRemoval } from '../../lib/removal-queue'
import { describeRemovalOutcome } from '../../lib/removal-summary'
import { removeItems } from '../../lib/remove-items'
import { focusCurrentTab } from '../../lib/x-tab'

export function App() {
  const { items, isLoaded, replaceItems, removeItem, markItemFailed } = useCapturedItems()
  const { selectedKeys, toggleKey, selectKeys, deselectKeys, clearSelection } = useSelection()
  const [activeKind, setActiveKind] = useState<ItemKind>('tweet')
  const [captureKinds, setCaptureKinds] = useState<ItemKind[]>(ITEM_KINDS)
  const [activity, setActivity] = useState<Activity>({ type: 'idle' })
  const [notice, setNotice] = useState<Notice | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const countsByKind = useMemo(() => countItemsByKind(items), [items])
  const visibleItems = useMemo(
    () => items.filter(item => item.kind === activeKind).sort(compareNewestFirst),
    [items, activeKind],
  )
  const selectedItems = items.filter(item => selectedKeys.has(item.key))
  const selectedCountsByKind = countItemsByKind(selectedItems)

  const visibleKeys = visibleItems.map(item => item.key)
  const unselectedFailedKeys = visibleItems
    .filter(item => item.status === 'failed' && !selectedKeys.has(item.key))
    .map(item => item.key)
  const isAllVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every(itemKey => selectedKeys.has(itemKey))
  const isBusy = activity.type !== 'idle'
  const activeKindLabel = messages.kinds[activeKind]

  function handleToggleCaptureKind(kind: ItemKind) {
    setCaptureKinds(currentKinds =>
      currentKinds.includes(kind)
        ? currentKinds.filter(currentKind => currentKind !== kind)
        : [...currentKinds, kind],
    )
  }

  async function handleCapture() {
    const kindsToCapture = captureKinds
    const abortController = new AbortController()

    abortControllerRef.current = abortController
    setNotice(null)
    setActivity({ type: 'capturing' })

    try {
      const capture = await captureItems(kindsToCapture, abortController.signal, section =>
        setActivity({ type: 'capturing', section }),
      )

      replaceItems(currentItems =>
        capture.wasStopped
          ? mergeItems(currentItems, capture.items)
          : replaceItemsOfKinds(currentItems, kindsToCapture, capture.items),
      )
      clearSelection()
      setNotice(describeCaptureOutcome(capture, kindsToCapture))
    } catch (error) {
      console.error(error)
      setNotice({ message: describeError(error), tone: 'error' })
    } finally {
      abortControllerRef.current = null
      await focusCurrentTab().catch(() => undefined)
      setActivity({ type: 'idle' })
    }
  }

  async function handleRemove() {
    const itemsToRemove = selectedItems
    const abortController = new AbortController()
    const removedItems: CapturedItem[] = []
    let failedCount = 0

    const handleItemSettled = (item: CapturedItem, removal: SettledRemoval) => {
      setActivity(advanceProgress)

      if (removal.status === 'failed') {
        failedCount += 1
        markItemFailed(item.key, removal.message)
        return
      }

      removedItems.push(item)
      removeItem(item.key)
      deselectKeys([item.key])
    }

    abortControllerRef.current = abortController
    setNotice(null)
    setActivity({ type: 'removing', completed: 0, total: itemsToRemove.length })

    try {
      await removeItems({
        items: itemsToRemove,
        signal: abortController.signal,
        onItemSettled: handleItemSettled,
        onRateLimited: resumeAt => setActivity(current => withResumeAt(current, resumeAt)),
      })

      setNotice({
        message: describeRemovalOutcome(
          countItemsByKind(removedItems),
          failedCount,
          abortController.signal.aborted,
        ),
        tone: failedCount > 0 ? 'error' : 'info',
      })
    } catch (error) {
      console.error(error)
      setNotice({ message: describeError(error), tone: 'error' })
    } finally {
      abortControllerRef.current = null
      setActivity({ type: 'idle' })
    }
  }

  function handleStop() {
    abortControllerRef.current?.abort()
  }

  function handleToggleAllVisible() {
    if (isAllVisibleSelected) {
      deselectKeys(visibleKeys)
      return
    }

    selectKeys(visibleKeys)
  }

  if (!isLoaded) {
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
          onSelectKind={setActiveKind}
        />

        <CaptureControls
          selectedKinds={captureKinds}
          isBusy={isBusy}
          onToggleKind={handleToggleCaptureKind}
          onCapture={handleCapture}
        />

        <p className="sidebar-footnote">{messages.sidebar.footnote}</p>
      </aside>

      <main className="content">
        <div className="content-column">
          <header className="content-header">
            <h1>{activeKindLabel}</h1>
            <span className="content-count">{visibleItems.length}</span>
          </header>

          <ActionBar
            activity={activity}
            notice={notice}
            activeKind={activeKind}
            selectedCounts={selectedCountsByKind}
            unselectedFailedCount={unselectedFailedKeys.length}
            isAllVisibleSelected={isAllVisibleSelected}
            hasVisibleItems={visibleItems.length > 0}
            onToggleAllVisible={handleToggleAllVisible}
            onSelectFailed={() => selectKeys(unselectedFailedKeys)}
            onClearSelection={clearSelection}
            onRemove={handleRemove}
            onStop={handleStop}
          />

          <ItemList
            items={visibleItems}
            selectedKeys={selectedKeys}
            isSelectionLocked={isBusy}
            emptyTitle={
              items.length === 0
                ? messages.list.emptyTitle
                : messages.list.emptyKindTitle(activeKindLabel)
            }
            emptyDescription={
              items.length === 0
                ? messages.list.emptyDescription
                : messages.list.emptyKindDescription
            }
            onToggle={toggleKey}
          />
        </div>
      </main>
    </div>
  )
}

function compareNewestFirst(firstItem: CapturedItem, secondItem: CapturedItem): number {
  return secondItem.createdAt.localeCompare(firstItem.createdAt)
}

function advanceProgress(activity: Activity): Activity {
  if (activity.type !== 'removing') {
    return activity
  }

  return { ...activity, completed: activity.completed + 1, resumeAt: undefined }
}

function withResumeAt(activity: Activity, resumeAt: Date): Activity {
  if (activity.type !== 'removing') {
    return activity
  }

  return { ...activity, resumeAt }
}

function describeCaptureOutcome(capture: CaptureResult, capturedKinds: ItemKind[]): Notice {
  const fetchedCount = messages.captureOutcome.fetched(capture.items.length)

  if (capture.wasStopped) {
    return { message: `${messages.captureOutcome.stopped} ${fetchedCount}`, tone: 'info' }
  }

  if (capture.items.length > 0) {
    return { message: fetchedCount, tone: 'info' }
  }

  const capturedKindLabels = ITEM_KINDS.filter(kind => capturedKinds.includes(kind)).map(
    kind => messages.kinds[kind],
  )

  return {
    message: messages.captureOutcome.nothingFound(formatList(capturedKindLabels)),
    tone: 'info',
    details: describeCaptureDiagnostics(capture),
  }
}

function describeCaptureDiagnostics(capture: CaptureResult): string {
  const seenOperations =
    capture.seenOperations.join(', ') || messages.captureOutcome.noOperations

  return messages.captureOutcome.diagnostics(capture.timelineResponseCount, seenOperations)
}

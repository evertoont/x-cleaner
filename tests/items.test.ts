import { describe, expect, it } from 'vitest'
import { createItem, mergeItems, replaceItemsOfKinds } from '../lib/items'
import type { ItemKind } from '../lib/items'

function buildItem(kind: ItemKind, id: string, text = `texto ${id}`) {
  return createItem({ id, kind, text, createdAt: '', authorHandle: 'owner' })
}

describe('replaceItemsOfKinds', () => {
  it('replaces only the captured kinds and keeps the others', () => {
    const currentItems = [buildItem('tweet', '1'), buildItem('tweet', '2'), buildItem('like', '3')]
    const capturedItems = [buildItem('tweet', '4')]

    const result = replaceItemsOfKinds(currentItems, ['tweet'], capturedItems)

    expect(result.map(item => item.key)).toEqual(['like:3', 'tweet:4'])
  })
})

describe('mergeItems', () => {
  it('keeps existing items and adds or updates the captured ones', () => {
    const currentItems = [buildItem('tweet', '1', 'antigo'), buildItem('tweet', '2')]
    const capturedItems = [buildItem('tweet', '1', 'novo'), buildItem('reply', '3')]

    const result = mergeItems(currentItems, capturedItems)

    expect(result.map(item => [item.key, item.text])).toEqual([
      ['tweet:1', 'novo'],
      ['tweet:2', 'texto 2'],
      ['reply:3', 'texto 3'],
    ])
  })
})

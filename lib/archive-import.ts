import { ArchiveFileInvalidError } from './errors'
import { decodeHtmlEntities } from './html-entities'
import { createItem, dedupeItems } from './items'
import type { CapturedItem } from './items'

interface ArchiveTweet {
  id_str: string
  full_text?: string
  created_at?: string
  in_reply_to_status_id_str?: string
  in_reply_to_screen_name?: string
}

// Cada arquivo de dados do X é um script que atribui uma lista: "window.YTD.tweets.part0 = [ ... ]".
const ARCHIVE_ASSIGNMENT_PATTERN = /^\s*window\.YTD\.\w+\.part\d+\s*=\s*/

// O arquivo não marca reposts; eles aparecem como texto "RT @autor: ..." com o ID do próprio repost.
const REPOST_PREFIX_PATTERN = /^RT @(\w+):\s?/

export async function readArchiveFiles(archiveFiles: File[]): Promise<CapturedItem[]> {
  const itemsByFile = await Promise.all(
    archiveFiles.map(async archiveFile => parseArchiveTweets(await archiveFile.text(), archiveFile.name)),
  )

  return itemsByFile.flat()
}

export function parseArchiveTweets(fileText: string, fileName: string): CapturedItem[] {
  const archiveEntries = readArchiveEntries(fileText)

  if (!archiveEntries) {
    throw new ArchiveFileInvalidError(fileName)
  }

  const archiveTweets = archiveEntries
    .map(readArchiveTweet)
    .filter((archiveTweet): archiveTweet is ArchiveTweet => archiveTweet !== undefined)

  if (archiveTweets.length < archiveEntries.length) {
    throw new ArchiveFileInvalidError(fileName)
  }

  return archiveTweets.map(toArchiveItem)
}

export function mergeArchiveItems(
  currentItems: CapturedItem[],
  archiveItems: CapturedItem[],
): CapturedItem[] {
  const listedRepostIds = new Set(
    currentItems.flatMap(item => (item.kind === 'retweet' && item.retweetId ? [item.retweetId] : [])),
  )
  const newArchiveItems = archiveItems.filter(
    archiveItem => !(archiveItem.kind === 'retweet' && listedRepostIds.has(archiveItem.id)),
  )

  // O que já estava na lista prevalece, para não perder falhas de remoção anteriores.
  return dedupeItems([...newArchiveItems, ...currentItems])
}

function readArchiveEntries(fileText: string): unknown[] | undefined {
  const jsonText = fileText.replace(ARCHIVE_ASSIGNMENT_PATTERN, '')

  try {
    const archiveEntries: unknown = JSON.parse(jsonText)

    return Array.isArray(archiveEntries) ? archiveEntries : undefined
  } catch {
    return undefined
  }
}

function readArchiveTweet(archiveEntry: unknown): ArchiveTweet | undefined {
  if (!isRecord(archiveEntry) || !isRecord(archiveEntry.tweet)) {
    return undefined
  }

  const { tweet } = archiveEntry

  return typeof tweet.id_str === 'string' ? (tweet as unknown as ArchiveTweet) : undefined
}

function toArchiveItem(archiveTweet: ArchiveTweet): CapturedItem {
  const text = decodeHtmlEntities(archiveTweet.full_text ?? '')
  const createdAt = readCreatedAt(archiveTweet.created_at)
  const repostMatch = text.match(REPOST_PREFIX_PATTERN)

  if (repostMatch) {
    return createItem({
      id: archiveTweet.id_str,
      kind: 'retweet',
      text: text.slice(repostMatch[0].length),
      createdAt,
      authorHandle: repostMatch[1] ?? '',
      retweetId: archiveTweet.id_str,
    })
  }

  if (archiveTweet.in_reply_to_status_id_str) {
    return createItem({
      id: archiveTweet.id_str,
      kind: 'reply',
      text,
      createdAt,
      authorHandle: '',
      replyToHandle: archiveTweet.in_reply_to_screen_name,
    })
  }

  return createItem({ id: archiveTweet.id_str, kind: 'tweet', text, createdAt, authorHandle: '' })
}

function readCreatedAt(createdAt: string | undefined): string {
  const createdDate = new Date(createdAt ?? '')

  if (Number.isNaN(createdDate.getTime())) {
    return ''
  }

  return createdDate.toISOString()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

import { Heart, MessageSquare, Repeat2, Reply } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ItemKind } from '../lib/items'

export const KIND_ICONS: Record<ItemKind, LucideIcon> = {
  tweet: MessageSquare,
  reply: Reply,
  retweet: Repeat2,
  like: Heart,
}

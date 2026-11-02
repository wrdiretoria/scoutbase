export const STORY_BUCKET = 'feed-stories'
export const STORY_MAX_BYTES = 8 * 1024 * 1024
export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000
export const STORY_TYPES: Record<string, { extension: string; kind: 'image' | 'video' }> = {
  'image/jpeg': { extension: 'jpg', kind: 'image' },
  'image/png': { extension: 'png', kind: 'image' },
  'image/webp': { extension: 'webp', kind: 'image' },
  'video/mp4': { extension: 'mp4', kind: 'video' },
  'video/webm': { extension: 'webm', kind: 'video' },
}
export function matchesStorySignature(bytes: Uint8Array, type: string) {
  const ascii = (start: number, length: number) => String.fromCharCode(...bytes.slice(start, start + length))
  if (type === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (type === 'image/png') return bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)
  if (type === 'image/webp') return ascii(0,4) === 'RIFF' && ascii(8,4) === 'WEBP'
  if (type === 'video/mp4') return ascii(4,4) === 'ftyp' && bytes.length >= 12
  if (type === 'video/webm') return [26,69,223,163].every((v,i) => bytes[i] === v)
  return false
}
export type FeedStory = {
  id: string
  authorId: string
  authorName: string
  avatarUrl: string | null
  mediaType: 'image' | 'video'
  mediaUrl: string
  caption: string
  createdAt: string
  expiresAt: string
  seen: boolean
}

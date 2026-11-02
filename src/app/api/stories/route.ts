import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import { STORY_BUCKET, STORY_MAX_BYTES, STORY_TYPES, matchesStorySignature } from '@/lib/feed-stories'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'private, no-store' }
export async function GET() {
  try {
    const client = await createServerClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Entre para ver as atualizações.' }, { status: 401, headers })
    const admin = createAdminClient()
    const { data: rows, error } = await admin.from('feed_stories').select('id,author_id,storage_path,media_type,caption,created_at,expires_at')
      .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    if (!rows?.length) return NextResponse.json({ stories: [] }, { headers })
    const [profiles, views] = await Promise.all([
      admin.from('profiles').select('id,nome,avatar_url').in('id', [...new Set(rows.map(s => s.author_id))]),
      admin.from('feed_story_views').select('story_id').eq('viewer_id', user.id).in('story_id', rows.map(s => s.id)),
    ])
    if (profiles.error || views.error) throw profiles.error || views.error
    const people = new Map((profiles.data ?? []).map(p => [p.id, p]))
    const seen = new Set((views.data ?? []).map(v => v.story_id))
    const ttl = Math.max(1, Math.min(300, ...rows.map(row => Math.floor((Date.parse(row.expires_at) - Date.now()) / 1000))))
    const { data: mediaLinks, error: signError } = await admin.storage.from(STORY_BUCKET).createSignedUrls(rows.map(row => row.storage_path), ttl)
    if (signError || mediaLinks?.some(link => link.error)) throw signError || new Error('Media signing failed')
    const links = new Map((mediaLinks ?? []).map(link => [link.path, link.signedUrl]))
    const stories = rows.map(row => {
      const author = people.get(row.author_id)
      return { id: row.id, authorId: row.author_id, authorName: author?.nome || 'Pessoa do futebol', avatarUrl: author?.avatar_url ?? null,
        mediaType: row.media_type, mediaUrl: links.get(row.storage_path), caption: row.caption, createdAt: row.created_at, expiresAt: row.expires_at, seen: seen.has(row.id) }
    })
    return NextResponse.json({ stories }, { headers })
  } catch (error) {
    console.error('[stories] list', error)
    return NextResponse.json({ error: 'Não foi possível carregar as atualizações.' }, { status: 503, headers })
  }
}
export async function POST(request: NextRequest) {
  try {
    const client = await createServerClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Entre para publicar.' }, { status: 401 })
    if (Number(request.headers.get('content-length')) > STORY_MAX_BYTES + 65536) return NextResponse.json({ error: 'O arquivo deve ter até 8 MB.' }, { status: 413 })
    const form = await request.formData()
    const file = form.get('file')
    const caption = form.get('caption') ?? ''
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: 'Escolha uma foto ou vídeo.' }, { status: 400 })
    if (typeof caption !== 'string' || caption.trim().length > 240) return NextResponse.json({ error: 'Use uma legenda com até 240 caracteres.' }, { status: 400 })
    const media = STORY_TYPES[file.type]
    if (!media) return NextResponse.json({ error: 'Use JPG, PNG, WebP ou vídeo MP4/WebM.' }, { status: 400 })
    if (file.size > STORY_MAX_BYTES) return NextResponse.json({ error: 'O arquivo deve ter até 8 MB.' }, { status: 413 })
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!matchesStorySignature(bytes, file.type)) return NextResponse.json({ error: 'O conteúdo do arquivo não corresponde ao formato informado.' }, { status: 400 })
    const admin = createAdminClient()
    const { count, error: countError } = await admin.from('feed_stories').select('id', { head: true, count: 'exact' }).eq('author_id', user.id)
      .gt('created_at', new Date(Date.now() - 86400000).toISOString())
    if (countError) throw countError
    if ((count ?? 0) >= 20) return NextResponse.json({ error: 'Você pode publicar até 20 atualizações por dia.' }, { status: 429 })
    const id = crypto.randomUUID()
    const path = `${user.id}/${id}.${media.extension}`
    const { error: uploadError } = await admin.storage.from(STORY_BUCKET).upload(path, bytes, { contentType: file.type, upsert: false, cacheControl: '60' })
    if (uploadError) throw uploadError
    const { error: insertError } = await admin.from('feed_stories').insert({ id, author_id: user.id, storage_path: path, media_type: media.kind, caption: caption.trim() })
    if (insertError) { await admin.storage.from(STORY_BUCKET).remove([path]); throw insertError }
    return NextResponse.json({ id }, { status: 201, headers })
  } catch (error) {
    console.error('[stories] publish', error)
    return NextResponse.json({ error: 'Não foi possível publicar. Tente novamente.' }, { status: 503 })
  }
}

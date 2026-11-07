import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import { getNetworkIds } from '@/lib/network'
import { STORY_LIFETIME_MS, STORY_BUCKET, STORY_MAX_BYTES, STORY_TYPES, matchesStorySignature } from '@/lib/feed-stories'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const headers = { 'Cache-Control': 'private, no-store' }
export async function GET() {
  try {
    const client = await createServerClient()
    const { data: { user } } = await client.auth.getUser()
    const admin = createAdminClient()
    if (!user) {
      // Visitors see only the public athlete directory's recent registrations.
      const since = new Date(Date.now() - STORY_LIFETIME_MS).toISOString()
      const { data, error } = await admin.from('profiles').select('id,nome,avatar_url,criado_em')
        .not('athlete_id', 'is', null).gt('criado_em', since)
        .order('criado_em', { ascending: false }).limit(100)
      if (error) throw error
      const stories = (data ?? []).filter(profile => profile.nome).map(profile => ({
        id: `signup-${profile.id}`, authorId: profile.id,
        authorName: profile.nome.trim().split(/\s+/)[0], avatarUrl: profile.avatar_url,
        expiresAt: new Date(Date.parse(profile.criado_em) + STORY_LIFETIME_MS).toISOString(),
      }))
      return NextResponse.json({ stories }, { headers })
    }
    const { data: rows, error } = await admin.from('feed_stories').select('id,author_id,storage_path,media_type,caption,created_at,expires_at')
      .gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    const since = new Date(Date.now() - STORY_LIFETIME_MS).toISOString()
    const network = await getNetworkIds(admin, user.id)
    const [newAthletes, posts, highlights] = await Promise.all([
      admin.from('profiles').select('id,nome,avatar_url,criado_em').not('athlete_id', 'is', null)
        .gt('criado_em', since).order('criado_em', { ascending: false }).limit(100),
      admin.from('feed_posts').select('id,author_id,body,created_at').in('author_id', network)
        .gt('created_at', since).order('created_at', { ascending: false }).limit(100),
      admin.from('highlights').select('id,profile_id,created_at').in('profile_id', network)
        .gt('created_at', since).order('created_at', { ascending: false }).limit(100),
    ])
    for (const result of [newAthletes, posts, highlights]) {
      if (result.error) console.error('[stories] activity source', result.error.code)
    }
    const activity = [
      ...(newAthletes.data ?? []).map(p => ({ id: `signup-${p.id}`, authorId: p.id, createdAt: p.criado_em, caption: 'Entrou no MeuCraque', href: `/jogador/${p.id}` })),
      ...(posts.data ?? []).map(p => ({ id: `post-${p.id}`, authorId: p.author_id, createdAt: p.created_at, caption: p.body || 'Nova publicação no Feed', href: '/feed' })),
      ...(highlights.data ?? []).map(h => ({ id: `highlight-${h.id}`, authorId: h.profile_id, createdAt: h.created_at, caption: 'Adicionou um novo vídeo', href: `/jogador/${h.profile_id}` })),
    ]
    const authorIds = [...new Set([...(rows ?? []).map(s => s.author_id), ...activity.map(a => a.authorId)])]
    if (!authorIds.length) return NextResponse.json({ stories: [] }, { headers })
    const [profiles, views] = await Promise.all([
      admin.from('profiles').select('id,nome,avatar_url').in('id', authorIds),
      rows?.length ? admin.from('feed_story_views').select('story_id').eq('viewer_id', user.id).in('story_id', rows.map(s => s.id)) : { data: [], error: null },
    ])
    if (profiles.error || views.error) throw profiles.error || views.error
    const people = new Map((profiles.data ?? []).map(p => [p.id, p]))
    const seen = new Set((views.data ?? []).map(v => v.story_id))
    const ttl = Math.max(1, Math.min(300, ...(rows ?? []).map(row => Math.floor((Date.parse(row.expires_at) - Date.now()) / 1000))))
    const { data: mediaLinks, error: signError } = rows?.length ? await admin.storage.from(STORY_BUCKET).createSignedUrls(rows.map(row => row.storage_path), ttl) : { data: [], error: null }
    if (signError || mediaLinks?.some(link => link.error)) throw signError || new Error('Media signing failed')
    const links = new Map((mediaLinks ?? []).map(link => [link.path, link.signedUrl]))
    const stories = (rows ?? []).map(row => {
      const author = people.get(row.author_id)
      return { id: row.id, authorId: row.author_id, authorName: author?.nome || 'Pessoa do futebol', avatarUrl: author?.avatar_url ?? null,
        mediaType: row.media_type, mediaUrl: links.get(row.storage_path), caption: row.caption, createdAt: row.created_at, expiresAt: row.expires_at, seen: seen.has(row.id) }
    })
    const updates = activity.flatMap(item => {
      const author = people.get(item.authorId)
      if (!author?.nome) return []
      return [{ ...item, authorName: author.nome, avatarUrl: author.avatar_url,
        mediaType: 'activity', mediaUrl: '', expiresAt: new Date(Date.parse(item.createdAt) + STORY_LIFETIME_MS).toISOString(), seen: false }]
    })
    return NextResponse.json({ stories: [...stories, ...updates].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)) }, { headers })
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

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase'
import { STORY_BUCKET } from '@/lib/feed-stories'
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await createServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Atualização inválida.' }, { status: 400 })
  const admin = createAdminClient()
  const { data: story, error } = await admin.from('feed_stories').select('storage_path').eq('id', id).eq('author_id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: 'Não foi possível excluir.' }, { status: 503 })
  if (!story) return NextResponse.json({ error: 'Atualização não encontrada.' }, { status: 404 })
  const { error: expireError } = await admin.from('feed_stories').update({ expires_at: new Date().toISOString() }).eq('id', id).eq('author_id', user.id)
  if (expireError) return NextResponse.json({ error: 'Não foi possível excluir.' }, { status: 503 })
  const { error: storageError } = await admin.storage.from(STORY_BUCKET).remove([story.storage_path])
  if (!storageError) await admin.from('feed_stories').delete().eq('id', id).eq('author_id', user.id)
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}

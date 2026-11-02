import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createServerClient } from '@/lib/supabase'
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const client = await createServerClient()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Atualização inválida.' }, { status: 400 })
  const admin = createAdminClient()
  const { data: story, error } = await admin.from('feed_stories').select('id').eq('id', id).gt('expires_at', new Date().toISOString()).maybeSingle()
  if (error) return NextResponse.json({ error: 'Não foi possível registrar a visualização.' }, { status: 503 })
  if (!story) return NextResponse.json({ error: 'Atualização expirada ou removida.' }, { status: 404 })
  const { error: viewError } = await admin.from('feed_story_views').upsert({ story_id: id, viewer_id: user.id }, { onConflict: 'story_id,viewer_id', ignoreDuplicates: true })
  if (viewError) return NextResponse.json({ error: 'Não foi possível registrar a visualização.' }, { status: 503 })
  return NextResponse.json({ ok: true })
}

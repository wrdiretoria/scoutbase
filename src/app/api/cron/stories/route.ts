import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { STORY_BUCKET } from '@/lib/feed-stories'
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  const admin = createAdminClient()
  const { data: expired, error } = await admin.from('feed_stories').select('id,storage_path').lt('expires_at', new Date().toISOString()).limit(100)
  if (error) return NextResponse.json({ error: 'Falha ao buscar expiradas.' }, { status: 503 })
  if (!expired?.length) return NextResponse.json({ removed: 0 })
  const { error: storageError } = await admin.storage.from(STORY_BUCKET).remove(expired.map(s => s.storage_path))
  if (storageError) return NextResponse.json({ error: 'Falha na limpeza de mídia.' }, { status: 503 })
  const { error: deleteError } = await admin.from('feed_stories').delete().in('id', expired.map(s => s.id)).lt('expires_at', new Date().toISOString())
  if (deleteError) return NextResponse.json({ error: 'Falha na limpeza de registros.' }, { status: 503 })
  return NextResponse.json({ removed: expired.length })
}

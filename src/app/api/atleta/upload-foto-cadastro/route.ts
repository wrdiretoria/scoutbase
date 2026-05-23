/**
 * POST /api/atleta/upload-foto-cadastro
 *
 * Usado apenas durante o cadastro do atleta, antes da sessão estar
 * estabilizada no navegador. Recebe o userId via header x-athlete-id
 * e faz o upload usando o admin client (sem RLS).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const MAX_SIZE = 8 * 1024 * 1024 // 8 MB

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-athlete-id')?.trim()
  if (!userId) {
    return NextResponse.json({ error: 'userId ausente.' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })

  const mimeType = file.type || 'image/jpeg'
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG ou WEBP.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 8 MB.' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${userId}.${ext}`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const admin = createAdminClient()

  const { error: upErr } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { contentType: mimeType, upsert: true })

  if (upErr) {
    console.error('[upload-foto-cadastro]', upErr)
    return NextResponse.json({ error: 'Erro ao salvar imagem.' }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)

  // Salva URL no perfil (best-effort — o salvar-perfil faz o mesmo)
  await admin
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)

  return NextResponse.json({ ok: true, url: publicUrl })
}

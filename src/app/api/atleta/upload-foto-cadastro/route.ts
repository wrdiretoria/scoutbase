/**
 * POST /api/atleta/upload-foto-cadastro
 *
 * Usado durante o cadastro do atleta (logo após signUp, antes dos cookies
 * de sessão serem definidos). Autentica via Authorization: Bearer <token>
 * retornado pelo signUp. Usa admin client para o storage — sem RLS.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  if (!token) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: { user }, error: authErr } = await admin.auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: 'Token inválido.' }, { status: 401 })
  }
  const userId = user.id

  let formData: FormData
  try {
    formData = await req.formData()
  } catch (e) {
    console.error('[upload-foto-cadastro] formData parse error:', e)
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
  }

  const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo: 5 MB.' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Valida magic bytes — rejeita qualquer coisa que não seja JPEG, PNG ou WebP
  const magic = buffer.subarray(0, 12)
  const isJpeg = magic[0] === 0xFF && magic[1] === 0xD8 && magic[2] === 0xFF
  const isPng  = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4E && magic[3] === 0x47
  const isWebp = magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46
                && magic[8] === 0x57 && magic[9] === 0x45 && magic[10] === 0x42 && magic[11] === 0x50

  if (!isJpeg && !isPng && !isWebp) {
    return NextResponse.json({ error: 'Formato inválido. Envie JPEG, PNG ou WebP.' }, { status: 400 })
  }

  const path = `${userId}.jpg`

  const { error: upErr } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })

  if (upErr) {
    console.error('[upload-foto-cadastro] storage error:', upErr)
    return NextResponse.json({ error: 'Erro ao salvar imagem.' }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)

  // Salva URL no perfil (best-effort — salvar-perfil também faz isso)
  await admin
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', userId)

  return NextResponse.json({ ok: true, url: publicUrl })
}

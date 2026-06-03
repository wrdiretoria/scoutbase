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

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

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

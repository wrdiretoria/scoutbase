import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // ── Autenticação ──
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  // ── Parse do arquivo ──
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 5 MB.' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Valida magic bytes — file.type vem do cliente e pode ser mentiroso
  const magic = buffer.subarray(0, 12)
  const isJpeg = magic[0] === 0xFF && magic[1] === 0xD8 && magic[2] === 0xFF
  const isPng  = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4E && magic[3] === 0x47
  const isWebp = magic[0] === 0x52 && magic[1] === 0x49 && magic[2] === 0x46 && magic[3] === 0x46
                && magic[8] === 0x57 && magic[9] === 0x45 && magic[10] === 0x42 && magic[11] === 0x50
  const isGif  = magic[0] === 0x47 && magic[1] === 0x49 && magic[2] === 0x46

  if (!isJpeg && !isPng && !isWebp && !isGif) {
    return NextResponse.json({ error: 'Formato inválido. Envie JPEG, PNG, WebP ou GIF.' }, { status: 400 })
  }

  const contentType = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : isWebp ? 'image/webp' : 'image/gif'
  const ext         = isJpeg ? 'jpg'        : isPng ? 'png'        : isWebp ? 'webp'        : 'gif'

  // ── Upload via admin client (service role — sem RLS) ──
  const admin = createAdminClient()
  const path = `${user.id}.${ext}`

  const { error: upErr } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { contentType, upsert: true })

  if (upErr) {
    console.error('[upload-foto] storage error code:', upErr.error)
    return NextResponse.json({ error: 'Erro ao salvar imagem.' }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)

  // ── Salva URL no perfil ──
  await admin
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  return NextResponse.json({ ok: true, url: publicUrl })
}

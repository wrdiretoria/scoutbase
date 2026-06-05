import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const formData = await req.formData()
  const file  = formData.get('file')  as File | null
  const slot  = Number(formData.get('slot'))  // 0, 1, ou 2

  if (!file)                        return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
  if (![0, 1, 2, 3, 4].includes(slot))    return NextResponse.json({ error: 'Slot inválido.' },          { status: 400 })

  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Arquivo muito grande. Máximo 8 MB.' }, { status: 400 })

  const bytes  = await file.arrayBuffer()
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

  const admin = createAdminClient()
  const path  = `galeria/${user.id}/${slot}.${ext}`

  const { error: upErr } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { contentType, upsert: true })

  if (upErr) {
    console.error('[upload-galeria] storage error code:', upErr.error)
    return NextResponse.json({ error: 'Erro ao salvar imagem.' }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)
  const urlComCache = `${publicUrl}?t=${Date.now()}`

  // Lê fotos atuais e atualiza o slot
  const { data: profile } = await admin
    .from('profiles')
    .select('fotos')
    .eq('id', user.id)
    .single()

  const fotosAtual: (string | null)[] = Array.isArray((profile as { fotos?: unknown })?.fotos)
    ? ((profile as { fotos: (string | null)[] }).fotos)
    : [null, null, null, null, null]

  const novas: (string | null)[] = [0,1,2,3,4].map(i => fotosAtual[i] ?? null)
  novas[slot] = urlComCache

  await admin.from('profiles').update({ fotos: novas }).eq('id', user.id)

  return NextResponse.json({ ok: true, url: urlComCache })
}

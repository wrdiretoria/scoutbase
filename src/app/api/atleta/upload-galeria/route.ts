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
  if (![0, 1, 2].includes(slot))    return NextResponse.json({ error: 'Slot inválido.' },          { status: 400 })

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) return NextResponse.json({ error: 'Formato inválido. Use JPG, PNG ou WEBP.' }, { status: 400 })
  if (file.size > 8 * 1024 * 1024)  return NextResponse.json({ error: 'Arquivo muito grande. Máximo 8 MB.' },      { status: 400 })

  const admin = createAdminClient()
  const ext   = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path  = `galeria/${user.id}/${slot}.${ext}`

  const bytes  = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const { error: upErr } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (upErr) {
    console.error('[upload-galeria]', upErr)
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
    : [null, null, null]

  const novas = [fotosAtual[0] ?? null, fotosAtual[1] ?? null, fotosAtual[2] ?? null]
  novas[slot] = urlComCache

  await admin.from('profiles').update({ fotos: novas }).eq('id', user.id)

  return NextResponse.json({ ok: true, url: urlComCache })
}

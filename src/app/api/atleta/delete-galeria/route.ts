import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  const { slot } = await req.json() as { slot: number }
  if (![0, 1, 2].includes(slot)) return NextResponse.json({ error: 'Slot inválido.' }, { status: 400 })

  const admin = createAdminClient()

  // Remove do Storage (tenta jpg, png e webp)
  const exts = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  for (const ext of exts) {
    await admin.storage.from('avatars').remove([`galeria/${user.id}/${slot}.${ext}`])
  }

  // Limpa o slot no profiles
  const { data: profile } = await admin
    .from('profiles')
    .select('fotos')
    .eq('id', user.id)
    .single()

  const fotosAtual: (string | null)[] = Array.isArray((profile as { fotos?: unknown })?.fotos)
    ? ((profile as { fotos: (string | null)[] }).fotos)
    : [null, null, null]

  const novas = [fotosAtual[0] ?? null, fotosAtual[1] ?? null, fotosAtual[2] ?? null]
  novas[slot] = null

  await admin.from('profiles').update({ fotos: novas }).eq('id', user.id)

  return NextResponse.json({ ok: true })
}

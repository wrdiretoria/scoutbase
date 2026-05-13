import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // ── Autenticação ──
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  // ── Apenas treinadores ──
  const { data: perfil } = await supabase
    .from('profiles')
    .select('tipo')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.tipo !== 'treinador') {
    return NextResponse.json({ error: 'Apenas treinadores podem buscar atletas.' }, { status: 403 })
  }

  // ── Normalizar ID ──
  const { atletaId } = await req.json() as { atletaId: string }
  const digitos  = atletaId.replace(/\D/g, '').slice(-5).padStart(5, '0')
  const mcId     = `MC-${digitos}`

  // ── Buscar atleta ──
  const admin = createAdminClient()
  const { data: atleta, error } = await admin
    .from('profiles')
    .select('id, nome, avatar_url, athlete_id, data_nascimento, posicao, cidade')
    .eq('athlete_id', mcId)
    .eq('tipo', 'atleta')
    .single()

  if (error || !atleta) {
    return NextResponse.json({ error: 'Atleta não encontrado. Verifique o ID.' }, { status: 404 })
  }

  return NextResponse.json({
    profileId:  atleta.id,
    athlete_id: atleta.athlete_id,
    nome:       atleta.nome,
    posicao:    (atleta as Record<string, unknown>).posicao as string ?? '',
    cidade:     (atleta as Record<string, unknown>).cidade  as string ?? '',
    avatar_url: atleta.avatar_url,
    dataNasc:   atleta.data_nascimento,
  })
}

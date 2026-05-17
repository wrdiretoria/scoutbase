import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  // ── Autenticação ──
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })

  if (user.user_metadata?.tipo !== 'treinador') {
    return NextResponse.json({ error: 'Apenas treinadores podem buscar atletas.' }, { status: 403 })
  }

  // ── Normalizar ID ──
  const { atletaId } = await req.json() as { atletaId: string }
  const digitos = atletaId.replace(/\D/g, '').slice(-5).padStart(5, '0')
  const mcId    = `MC-${digitos}`

  // ── Buscar perfil pelo MC-ID ──
  const admin = createAdminClient()
  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, athlete_id, data_nascimento, avatar_url')
    .eq('athlete_id', mcId)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: 'Atleta não encontrado. Verifique o ID.' }, { status: 404 })
  }

  // ── Buscar nome, posição e cidade do user_metadata ──
  const { data: { user: atletaUser } } = await admin.auth.admin.getUserById(profile.id as string)
  if (!atletaUser) {
    return NextResponse.json({ error: 'Atleta não encontrado.' }, { status: 404 })
  }

  const atletaMeta = atletaUser.user_metadata as {
    nome?: string; posicao?: string; cidade?: string
  }

  // ── profileId = auth UUID (usado em avaliacoes.aluno_id) ──
  // Isso garante que a avaliação aparece corretamente no perfil do atleta.
  return NextResponse.json({
    profileId:  profile.id,           // ← auth UUID, NOT alunos.id
    athlete_id: profile.athlete_id,
    nome:       atletaMeta.nome    ?? 'Atleta',
    posicao:    atletaMeta.posicao ?? '',
    cidade:     atletaMeta.cidade  ?? '',
    avatar_url: profile.avatar_url ?? null,
    dataNasc:   profile.data_nascimento,
  })
}
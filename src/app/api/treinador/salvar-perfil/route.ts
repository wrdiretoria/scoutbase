import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const {
      userId, bio, especialidade, avatarUrl,
      cidade, pais, anosExp,
      clubeAtual, clubesTrabalhados, certificacoes, conquistas,
      telefone,
      instagram, tiktok, youtube, outras,
    } = await req.json() as {
      userId?:             string
      bio?:                string | null
      especialidade?:      string | null
      avatarUrl?:          string | null
      cidade?:             string | null
      pais?:               string | null
      anosExp?:            string | null
      clubeAtual?:         string | null
      clubesTrabalhados?:  string | null
      certificacoes?:      string | null
      conquistas?:         string | null
      telefone?:           string | null
      instagram?:          string | null
      tiktok?:             string | null
      youtube?:            string | null
      outras?:             string | null
    }

    if (!userId) return NextResponse.json({ error: 'userId ausente.' }, { status: 400 })

    const admin = createAdminClient()

    // ── Atualiza profiles (UPDATE — não cria linha nova, evita erros de NOT NULL)
    const profileUpdate: Record<string, unknown> = {}
    if (bio       !== undefined) profileUpdate.bio        = bio       || null
    if (avatarUrl !== undefined) profileUpdate.avatar_url = avatarUrl || null

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileErr } = await admin
        .from('profiles')
        .update(profileUpdate)
        .eq('id', userId)

      if (profileErr) {
        console.error('[treinador/salvar-perfil] profiles update', profileErr)
        return NextResponse.json({ error: profileErr.message }, { status: 500 })
      }
    }

    // ── Salva campos extras no user_metadata (sem schema migration) ───────────
    const metaUpdate: Record<string, unknown> = {}
    if (especialidade      !== undefined) metaUpdate.especialidade      = especialidade      || null
    if (cidade             !== undefined) metaUpdate.cidade             = cidade             || null
    if (pais               !== undefined) metaUpdate.pais               = pais               || null
    if (anosExp            !== undefined) metaUpdate.anos_exp           = anosExp            || null
    if (clubeAtual         !== undefined) metaUpdate.clube_atual        = clubeAtual         || null
    if (clubesTrabalhados  !== undefined) metaUpdate.clubes_trabalhados = clubesTrabalhados  || null
    if (certificacoes      !== undefined) metaUpdate.certificacoes      = certificacoes      || null
    if (conquistas         !== undefined) metaUpdate.conquistas         = conquistas         || null
    if (telefone           !== undefined) metaUpdate.telefone           = telefone           || null
    if (instagram          !== undefined) metaUpdate.instagram          = instagram          || null
    if (tiktok             !== undefined) metaUpdate.tiktok             = tiktok             || null
    if (youtube            !== undefined) metaUpdate.youtube            = youtube            || null
    if (outras             !== undefined) metaUpdate.outras             = outras             || null

    if (Object.keys(metaUpdate).length > 0) {
      const { error: metaErr } = await admin.auth.admin.updateUserById(userId, {
        user_metadata: metaUpdate,
      })
      if (metaErr) {
        console.error('[treinador/salvar-perfil] metadata update', metaErr)
        // Não fatal — profiles já foi salvo
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[treinador/salvar-perfil] unexpected', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

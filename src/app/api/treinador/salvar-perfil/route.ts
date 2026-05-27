import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const {
      userId, bio, especialidade, avatarUrl,
      cidade, pais, anosExp,
      clubesTrabalhados, certificacoes, conquistas,
      instagram, tiktok, youtube, outras,
    } = await req.json() as {
      userId?:             string
      bio?:                string | null
      especialidade?:      string | null
      avatarUrl?:          string | null
      cidade?:             string | null
      pais?:               string | null
      anosExp?:            string | null
      clubesTrabalhados?:  string | null
      certificacoes?:      string | null
      conquistas?:         string | null
      instagram?:          string | null
      tiktok?:             string | null
      youtube?:            string | null
      outras?:             string | null
    }

    if (!userId) return NextResponse.json({ error: 'userId ausente.' }, { status: 400 })

    const admin = createAdminClient()

    // ── Busca nome do auth (necessário para NOT NULL ao inserir) ──────────────
    const { data: { user: authUser } } = await admin.auth.admin.getUserById(userId)
    const nomeAuth = (authUser?.user_metadata?.nome as string | null) ?? null

    // ── Salva no profiles (só colunas que existem no schema) ──────────────────
    const payload: Record<string, unknown> = { id: userId }
    if (nomeAuth)                 payload.nome       = nomeAuth
    if (bio       !== undefined)  payload.bio        = bio       || null
    if (avatarUrl !== undefined)  payload.avatar_url = avatarUrl || null

    const { error: profileErr } = await admin
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })

    if (profileErr) {
      console.error('[treinador/salvar-perfil] profiles upsert', profileErr)
      return NextResponse.json({ error: profileErr.message }, { status: 500 })
    }

    // ── Salva campos extras no user_metadata (sem schema migration) ───────────
    const metaUpdate: Record<string, unknown> = {}
    if (especialidade      !== undefined) metaUpdate.especialidade      = especialidade      || null
    if (cidade             !== undefined) metaUpdate.cidade             = cidade             || null
    if (pais               !== undefined) metaUpdate.pais               = pais               || null
    if (anosExp            !== undefined) metaUpdate.anos_exp           = anosExp            || null
    if (clubesTrabalhados  !== undefined) metaUpdate.clubes_trabalhados = clubesTrabalhados  || null
    if (certificacoes      !== undefined) metaUpdate.certificacoes      = certificacoes      || null
    if (conquistas         !== undefined) metaUpdate.conquistas         = conquistas         || null
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

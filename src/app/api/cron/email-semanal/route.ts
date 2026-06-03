/**
 * GET /api/cron/email-semanal
 * Chamado pelo Vercel Cron todo domingo às 10h (BRT = 13:00 UTC).
 * Envia resumo semanal para todos os atletas com email cadastrado.
 *
 * Protegido por CRON_SECRET no header Authorization.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'
import { listAllUsers } from '@/lib/auth'
import { fetchOvrMap } from '@/lib/ovr'
import { sendEmail, emailResumSemanal } from '@/lib/email'

// Sugestões de próximo passo baseadas no perfil do atleta
function proximoPasso(meta: Record<string, unknown>, temAvaliacao: boolean): string {
  if (!temAvaliacao)
    return 'Peça para um treinador te avaliar! Compartilhe seu ID e ganhe até +50 pontos no seu OVR.'
  if (!meta.clubes_anteriores)
    return 'Adicione os clubes que você já jogou no seu perfil. Scouts adoram ver a trajetória do atleta.'
  if (!meta.campeonatos)
    return 'Liste os campeonatos que você disputou. Isso aumenta seu OVR e impressiona os scouts.'
  if (!meta.titulos)
    return 'Tem conquistas? Adicione seus títulos no perfil e se destaque no ranking!'
  return 'Continue compartilhando seu perfil! Quanto mais scouts te virem, maiores as chances de ser contratado.'
}

export async function GET(req: NextRequest) {
  // ── Segurança: valida o secret do Vercel Cron ──
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ ok: false, message: 'RESEND_API_KEY não configurada — emails não enviados.' })
  }

  try {
    const admin = createAdminClient()

    // 1. Busca todos os usuários
    const users = await listAllUsers(admin)
    const atletas = users.filter(u =>
      u.user_metadata?.tipo === 'atleta' &&
      u.email &&
      !u.email.includes('example') // filtra contas de teste
    )

    if (atletas.length === 0) {
      return NextResponse.json({ ok: true, enviados: 0, message: 'Nenhum atleta encontrado.' })
    }

    // 2. Busca OVR de todos em paralelo
    const ovrMap = await fetchOvrMap(admin)

    // 3. Busca perfis (athlete_id para OVR lookup)
    const ids = atletas.map(u => u.id)
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, athlete_id')
      .in('id', ids)

    const profileMap = new Map(
      (profiles ?? []).map((p: { id: string; athlete_id: string | null }) => [p.id, p])
    )

    // 4. Verifica quais atletas têm avaliação
    const { data: avsData } = await admin
      .from('avaliacoes')
      .select('aluno_id')
    const comAvaliacao = new Set((avsData ?? []).map((a: { aluno_id: string }) => a.aluno_id))

    // 5. Envia emails em lotes de 10 para não sobrecarregar
    let enviados = 0
    let erros    = 0

    for (const atleta of atletas) {
      if (!atleta.email) continue

      try {
        const meta       = atleta.user_metadata as Record<string, unknown>
        const nome       = (meta.nome        as string)  ?? 'Atleta'
        const visits     = (meta.visit_count  as number) ?? 0
        const favs       = (meta.favorito_count as number) ?? 0
        const profile    = profileMap.get(atleta.id)
        const athleteId  = profile?.athlete_id as string | null
        const ovr        = athleteId ? (ovrMap.get(athleteId) ?? null) : null
        const temAv      = comAvaliacao.has(atleta.id)

        const html = emailResumSemanal({
          atletaNome:    nome,
          atletaId:      atleta.id,
          visitCount:    visits,
          favoritoCount: favs,
          ovr,
          proximoPasso:  proximoPasso(meta, temAv),
        })

        await sendEmail({
          to:      atleta.email,
          subject: `⚽ ${nome.split(' ')[0]}, veja como foi seu perfil essa semana`,
          html,
        })

        enviados++

        // Pequena pausa entre emails para evitar rate limit
        await new Promise(r => setTimeout(r, 120))
      } catch (err) {
        console.error(`[cron] Erro ao enviar para ${atleta.email}:`, err)
        erros++
      }
    }

    console.log(`[cron] Email semanal: ${enviados} enviados, ${erros} erros.`)
    return NextResponse.json({ ok: true, enviados, erros, total: atletas.length })

  } catch (err) {
    console.error('[cron] Erro geral:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}

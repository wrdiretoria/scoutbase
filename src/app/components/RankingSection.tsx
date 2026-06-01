/**
 * RankingSection — top 6 atletas reais do banco (Server Component)
 * Usa AtletaCard padronizado para exibição.
 */

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMap } from '@/lib/ovr'
import AtletaCard from './AtletaCard'

type RankItem = {
  id:        string
  nome:      string
  posicao:   string
  ovr:       number
  avatarUrl: string | null
  fotos:     string[]
  atributos: { vel: number | null; fin: number | null; tec: number | null; vis: number | null; forca: number | null; pos: number | null } | null
}

export default async function RankingSection() {
  let top: RankItem[] = []

  try {
    const admin = createAdminClient()
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const atletaUsers = users.filter(u =>
      u.user_metadata?.tipo === 'atleta' &&
      u.email_confirmed_at != null          // exclui contas sem email verificado (contas de teste/dev)
    )
    const ids = atletaUsers.map(u => u.id)

    const [profilesRes, ovrMap, avsRes] = await Promise.all([
      admin.from('profiles').select('id, athlete_id, avatar_url, fotos').in('id', ids),
      fetchOvrMap(admin),
      admin.from('avaliacoes')
        .select('aluno_id, velocidade, forca, finalizacao, visao_jogo, posicionamento, tecnica')
        .in('aluno_id', ids)
        .order('created_at', { ascending: false }),
    ])

    // Pega a avaliação mais recente por atleta (order desc → primeiro = mais recente)
    const latestAvMap = new Map<string, { velocidade: unknown; forca: unknown; finalizacao: unknown; visao_jogo: unknown; posicionamento: unknown; tecnica: unknown }>()
    for (const av of (avsRes.data ?? [])) {
      if (!latestAvMap.has(av.aluno_id as string)) {
        latestAvMap.set(av.aluno_id as string, av)
      }
    }

    const profileMap = new Map(
      (profilesRes.data ?? []).map((p: {
        id: string
        athlete_id: string | null
        avatar_url: string | null
        fotos: (string | null)[] | null
      }) => [p.id, p])
    )

    top = atletaUsers
      .map(u => {
        const meta       = u.user_metadata as { nome?: string; posicao?: string }
        const profile    = profileMap.get(u.id)
        const athleteId  = (profile?.athlete_id as string | null) ?? null
        const ovr        = athleteId ? (ovrMap.get(athleteId) ?? null) : null
        if (!ovr) return null
        const fotosRaw   = (profile?.fotos as (string | null)[] | null) ?? []
        const av         = latestAvMap.get(u.id)
        return {
          id:        u.id,
          nome:      meta.nome    ?? 'Atleta',
          posicao:   meta.posicao ?? '',
          ovr,
          avatarUrl: (profile?.avatar_url as string | null) ?? null,
          fotos:     fotosRaw.filter((f): f is string => !!f),
          atributos: av ? {
            vel:   (av.velocidade     as number | null) ?? null,
            fin:   (av.finalizacao    as number | null) ?? null,
            tec:   (av.tecnica        as number | null) ?? null,
            vis:   (av.visao_jogo     as number | null) ?? null,
            forca: (av.forca          as number | null) ?? null,
            pos:   (av.posicionamento as number | null) ?? null,
          } : null,
        }
      })
      .filter((a): a is RankItem => a !== null)
      .sort((a, b) => b.ovr - a.ovr)
      .slice(0, 6)
  } catch { /* sem dados — seção esconde */ }

  if (top.length === 0) return null

  return (
    <section style={{ padding: '80px 0 72px', background: '#06100a', overflow: 'hidden' }}>
      <style>{`
        .ranking-scroll::-webkit-scrollbar { display: none; }
        .ranking-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        @media (max-width: 768px) {
          .ranking-title  { font-size: 26px !important; }
          .ranking-scroll { padding: 0 20px 16px !important; }
        }
      `}</style>

      {/* Título */}
      <div style={{ textAlign: 'center', marginBottom: '48px', padding: '0 24px' }}>
        <p style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
          color: '#22c55e', textTransform: 'uppercase', marginBottom: '10px',
        }}>
          ⚡ Ranking Meu Craque
        </p>
        <h2 className="ranking-title" style={{
          fontSize: '34px', fontWeight: 900, letterSpacing: '-0.03em',
          color: 'white', lineHeight: 1.1,
        }}>
          Os craques em evidência
        </h2>
        <p style={{
          margin: '10px auto 0', fontSize: '15px',
          color: 'rgba(255,255,255,0.45)', maxWidth: '420px',
        }}>
          Atletas avaliados por treinadores e vistos por scouts e clubes de futebol.
        </p>
      </div>

      {/* Cards — scroll horizontal */}
      <div className="ranking-scroll" style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        padding: '0 40px 16px',
        overflowX: 'auto',
        maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
      }}>
        {top.map((a, i) => (
          <AtletaCard
            key={a.id}
            nome={a.nome}
            ovr={a.ovr}
            foto={a.fotos[0] ?? a.avatarUrl}
            posicao={a.posicao}
            atributos={a.atributos}
            avaliadoPor={null}
            href={`/jogador/${a.id}`}
            rank={i + 1}
            width="200px"
          />
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link href="/ranking" style={{
          display: 'inline-block', padding: '13px 28px', borderRadius: '14px',
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
          color: '#22c55e', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
        }}>
          Ver ranking completo →
        </Link>
      </div>
    </section>
  )
}

/**
 * RankingSection — top 6 atletas reais do banco (Server Component)
 */

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMap } from '@/lib/ovr'

function getInitials(nome: string): string {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function posAbrev(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

function calcularIdade(dataNasc: string): number {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

function rankColor(rank: number): string {
  if (rank === 1) return '#f59e0b'
  if (rank === 2) return '#94a3b8'
  if (rank === 3) return '#cd7c3e'
  return 'rgba(255,255,255,0.3)'
}

function ovrColor(ovr: number): string {
  if (ovr >= 85) return '#22c55e'
  if (ovr >= 70) return '#f59e0b'
  return '#94a3b8'
}

export default async function RankingSection() {
  type RankItem = {
    id: string; nome: string; posicao: string; cidade: string
    dataNasc: string | null; ovr: number; initials: string
    avatarUrl: string | null; fotos: string[]; pos: string
    athleteId: string | null
  }

  let top: RankItem[] = []

  try {
    const admin = createAdminClient()
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const atletaUsers = users.filter(u => u.user_metadata?.tipo === 'atleta')
    const ids = atletaUsers.map(u => u.id)

    const [profilesRes, ovrMap] = await Promise.all([
      admin.from('profiles').select('id, athlete_id, data_nascimento, avatar_url, fotos').in('id', ids),
      fetchOvrMap(admin),
    ])

    const profileMap = new Map((profilesRes.data ?? []).map((p: { id: string; athlete_id: string | null; data_nascimento: string | null; avatar_url: string | null; fotos: (string | null)[] | null }) => [p.id, p]))

    top = atletaUsers
      .map(u => {
        const meta = u.user_metadata as { nome?: string; posicao?: string; cidade?: string }
        const profile = profileMap.get(u.id)
        const athleteId = (profile?.athlete_id as string | null) ?? null
        const ovr = athleteId ? (ovrMap.get(athleteId) ?? null) : null
        if (!ovr) return null
        const nome = meta.nome ?? 'Atleta'
        const fotosArr = (profile?.fotos as (string | null)[] | null) ?? []
        return {
          id:        u.id,
          nome,
          posicao:   meta.posicao ?? '',
          cidade:    meta.cidade  ?? '',
          dataNasc:  (profile?.data_nascimento as string | null) ?? null,
          ovr,
          initials:  getInitials(nome),
          avatarUrl: (profile?.avatar_url as string | null) ?? null,
          fotos:     fotosArr.filter((f): f is string => !!f),
          pos:       posAbrev(meta.posicao ?? ''),
          athleteId: athleteId ?? null,
        }
      })
      .filter((a): a is RankItem => a !== null)
      .sort((a, b) => b.ovr - a.ovr)
      .slice(0, 6)
  } catch { /* sem dados — seção esconde */ }

  // Não mostra a seção se não há atletas avaliados ainda
  if (top.length === 0) return null

  return (
    <section style={{ padding: '80px 0 72px', background: '#06100a', overflow: 'hidden' }}>
      <style>{`
        .ranking-scroll::-webkit-scrollbar { display: none; }
        .ranking-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .rank-card-link { transition: transform 0.2s, box-shadow 0.2s; text-decoration: none; color: white; display: block; }
        .rank-card-link:hover { transform: translateY(-6px); }
        @media (max-width: 768px) {
          .ranking-title { font-size: 26px !important; }
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
        <p style={{ marginTop: '10px', fontSize: '15px', color: 'rgba(255,255,255,0.45)', maxWidth: '420px', margin: '10px auto 0' }}>
          Atletas avaliados por treinadores e vistos por scouts e clubes de futebol.
        </p>
      </div>

      {/* Cards scroll */}
      <div className="ranking-scroll" style={{
        display: 'flex',
        gap: '16px',
        padding: '0 40px 16px',
        overflowX: 'auto',
        maskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 4%, black 96%, transparent 100%)',
      }}>
        {top.map((a, i) => {
          const rank = i + 1
          const rc = rankColor(rank)
          const oc = ovrColor(a.ovr)
          const idade = a.dataNasc ? calcularIdade(a.dataNasc) : null
          return (
            <Link
              key={a.id}
              href={`/jogador/${a.id}`}
              className="rank-card-link"
              style={{
                flexShrink: 0,
                width: '190px',
                borderRadius: '20px',
                padding: '20px 16px',
                background: rank <= 3
                  ? 'linear-gradient(160deg,rgba(34,197,94,0.07),rgba(34,197,94,0.02))'
                  : 'rgba(255,255,255,0.02)',
                border: rank <= 3
                  ? '1px solid rgba(34,197,94,0.2)'
                  : '1px solid rgba(255,255,255,0.07)',
                boxShadow: rank <= 3
                  ? '0 8px 32px rgba(34,197,94,0.1)'
                  : '0 4px 16px rgba(0,0,0,0.3)',
                position: 'relative',
              }}
            >
              {/* Rank badge */}
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                fontSize: rank <= 3 ? '18px' : '13px',
                fontWeight: 900, color: rc,
                lineHeight: 1,
              }}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
              </div>

              {/* Avatar — fotos[0] > avatarUrl > iniciais */}
              {(() => {
                const photo = a.fotos[0] ?? a.avatarUrl
                return (
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'linear-gradient(135deg,#15803d,#4ade80)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: 900, color: 'white',
                    margin: '8px auto 12px',
                    boxShadow: `0 6px 20px ${oc}40`,
                    overflow: 'hidden',
                    border: `2px solid ${oc}50`,
                  }}>
                    {photo
                      ? <img src={photo} alt={a.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }} />
                      : a.initials}
                  </div>
                )
              })()}

              {/* OVR */}
              <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <div style={{
                  fontSize: '36px', fontWeight: 900, color: oc, lineHeight: 1,
                  textShadow: `0 0 20px ${oc}60`,
                }}>
                  {a.ovr}
                </div>
                <div style={{
                  fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em',
                  color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
                  marginTop: '2px',
                }}>
                  OVR
                </div>
              </div>

              {/* Nome */}
              <div style={{
                fontSize: '13px', fontWeight: 800, color: 'white',
                textAlign: 'center', lineHeight: 1.2,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
                marginBottom: '8px',
              }}>
                {a.nome}
              </div>

              {/* Posição */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {a.pos && (
                  <span style={{
                    fontSize: '10px', fontWeight: 800, color: '#22c55e',
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                    borderRadius: '6px', padding: '2px 8px',
                  }}>
                    {a.pos}
                  </span>
                )}
                {a.cidade && (
                  <span style={{
                    fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600,
                  }}>
                    {a.cidade.split(' ')[0]}
                  </span>
                )}
              </div>

              {/* Idade */}
              {idade && (
                <div style={{
                  marginTop: '8px', textAlign: 'center',
                  fontSize: '10px', color: 'rgba(255,255,255,0.2)',
                }}>
                  {idade} anos
                </div>
              )}

              {/* ID do atleta */}
              {a.athleteId && (
                <div style={{
                  marginTop: '10px', textAlign: 'center',
                  padding: '4px 8px', borderRadius: '6px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.1em',
                }}>
                  ID: {a.athleteId.replace('MC-', '')}
                </div>
              )}
            </Link>
          )
        })}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', marginTop: '36px' }}>
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

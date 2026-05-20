/**
 * TeamOfWeekSection — Top 3 atletas reais por OVR da semana
 * Server Component — busca dados reais do banco
 */

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { fetchOvrMap } from '@/lib/ovr'

function getInitials(nome: string) {
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

const RANKS = [
  {
    label: '🥇 CRAQUE DA SEMANA',
    badgeBg: 'rgba(251,191,36,0.14)', badgeText: '#fbbf24',
    topLine: 'rgba(251,191,36,0.80)',
    borderColor: 'rgba(251,191,36,0.42)',
    boxShadow: '0 0 48px rgba(251,191,36,0.22),0 20px 56px rgba(0,0,0,0.85)',
    avatarGrad: 'linear-gradient(145deg,#7c3300,#fbbf24)',
    cardBg: 'linear-gradient(168deg,#1e1400 0%,#110c00 60%,#080500 100%)',
    featured: true,
  },
  {
    label: '🥈 TOP 2',
    badgeBg: 'rgba(0,255,136,0.10)', badgeText: '#00FF88',
    topLine: 'rgba(0,255,136,0.55)',
    borderColor: 'rgba(0,255,136,0.18)',
    boxShadow: '0 0 28px rgba(0,255,136,0.09),0 16px 48px rgba(0,0,0,0.78)',
    avatarGrad: 'linear-gradient(145deg,#065f28,#00e87a)',
    cardBg: 'linear-gradient(168deg,#0b1c10 0%,#06100a 60%,#040c07 100%)',
    featured: false,
  },
  {
    label: '🥉 TOP 3',
    badgeBg: 'rgba(167,139,250,0.12)', badgeText: '#a78bfa',
    topLine: 'rgba(167,139,250,0.55)',
    borderColor: 'rgba(167,139,250,0.18)',
    boxShadow: '0 0 24px rgba(167,139,250,0.08),0 16px 48px rgba(0,0,0,0.78)',
    avatarGrad: 'linear-gradient(145deg,#3b1b8c,#a78bfa)',
    cardBg: 'linear-gradient(168deg,#0f0a1e 0%,#080612 60%,#050410 100%)',
    featured: false,
  },
]

type TopAtleta = {
  id: string
  nome: string
  posicao: string
  cidade: string
  ovr: number
  avatarUrl: string | null
}

export default async function TeamOfWeekSection() {
  let topAtletas: TopAtleta[] = []

  try {
    const admin = createAdminClient()
    const [usersRes, ovrMap, profilesRes] = await Promise.all([
      admin.auth.admin.listUsers({ perPage: 1000 }),
      fetchOvrMap(admin),
      admin.from('profiles').select('id, athlete_id, avatar_url'),
    ])

    const profileMap = new Map(
      (profilesRes.data ?? []).map((p: { id: string; athlete_id: string | null; avatar_url: string | null }) => [p.id, p])
    )

    topAtletas = (usersRes.data?.users ?? [])
      .filter(u => u.user_metadata?.tipo === 'atleta')
      .map(u => {
        const meta = u.user_metadata as { nome?: string; posicao?: string; cidade?: string }
        const profile = profileMap.get(u.id)
        const athleteId = profile?.athlete_id as string | null
        const ovr = athleteId ? (ovrMap.get(athleteId) ?? null) : null
        if (!ovr) return null
        return {
          id: u.id,
          nome: meta.nome ?? 'Atleta',
          posicao: meta.posicao ?? '',
          cidade: meta.cidade ?? '',
          ovr,
          avatarUrl: (profile?.avatar_url as string | null) ?? null,
        }
      })
      .filter((a): a is TopAtleta => a !== null)
      .sort((a, b) => b.ovr - a.ovr)
      .slice(0, 3)
  } catch { /* fallback: sem dados */ }

  // Se não há atletas avaliados ainda, não renderiza a seção
  if (topAtletas.length === 0) return null

  // Reordena: 2º, 1º, 3º (pódio visual)
  const ordered = topAtletas.length >= 3
    ? [topAtletas[1], topAtletas[0], topAtletas[2]]
    : topAtletas

  const rankMap = [1, 0, 2] // índice no RANKS para cada posição visual

  return (
    <section style={{ padding: '80px 20px', background: '#030905' }}>
      <style>{`
        .tow-card {
          border-radius: 20px;
          cursor: pointer;
          transition: transform .28s ease, box-shadow .28s ease;
          text-decoration: none;
          position: relative;
          overflow: hidden;
          display: block;
        }
        .tow-card:hover { transform: translateY(-6px) scale(1.01); }

        /* foto / bg ocupa o card inteiro */
        .tow-card-bg {
          position: absolute; inset: 0;
          background-size: cover;
          background-position: center top;
          transition: transform .4s ease;
        }
        .tow-card:hover .tow-card-bg { transform: scale(1.04); }

        /* gradiente sobre a foto para legibilidade */
        .tow-card-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(
            to top,
            rgba(0,0,0,0.92) 0%,
            rgba(0,0,0,0.55) 40%,
            rgba(0,0,0,0.12) 70%,
            transparent 100%
          );
        }

        /* conteúdo fica na frente */
        .tow-card-content {
          position: relative; z-index: 2;
          display: flex; flex-direction: column;
          height: 100%;
          padding: 16px 18px 20px;
          justify-content: space-between;
        }

        .tow-grid {
          display: grid;
          grid-template-columns: 1fr 1.14fr 1fr;
          gap: 14px;
          max-width: 900px;
          margin: 0 auto;
          align-items: end;
        }
        @media (max-width: 640px) {
          .tow-grid { grid-template-columns: 1fr !important; align-items: stretch !important; }
        }
      `}</style>

      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(0,255,136,0.55)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Ranking ao vivo
        </div>
        <h2 style={{ margin: 0, fontSize: 'clamp(26px,5vw,40px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
          Top 3 da Plataforma
        </h2>
        <p style={{ margin: '10px 0 0', fontSize: '15px', color: 'rgba(255,255,255,0.38)' }}>
          Os atletas com maior OVR avaliado por treinadores certificados
        </p>
      </div>

      <div className="tow-grid">
        {ordered.map((atleta, vi) => {
          const ri = rankMap[vi] ?? vi
          const rank = RANKS[ri] ?? RANKS[0]
          const initials = getInitials(atleta.nome)
          const pos = posAbrev(atleta.posicao)
          const cardH = rank.featured ? '420px' : '360px'

          return (
            <Link
              key={atleta.id}
              href={`/jogador/${atleta.id}`}
              className="tow-card"
              style={{
                height: cardH,
                border: `1px solid ${rank.borderColor}`,
                boxShadow: rank.boxShadow,
              }}
            >
              {/* Foto de fundo ou gradiente fallback */}
              <div
                className="tow-card-bg"
                style={{
                  backgroundImage: atleta.avatarUrl
                    ? `url(${atleta.avatarUrl})`
                    : rank.avatarGrad,
                  background: atleta.avatarUrl ? undefined : rank.avatarGrad,
                }}
              />

              {/* Overlay escuro */}
              <div className="tow-card-overlay" style={{
                background: `linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.50) 45%, rgba(0,0,0,0.08) 75%, transparent 100%)`,
              }} />

              {/* Se não tem foto: iniciais centralizadas */}
              {!atleta.avatarUrl && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: rank.featured ? '90px' : '76px',
                    height: rank.featured ? '90px' : '76px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.35)',
                    border: `2px solid ${rank.borderColor}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: rank.featured ? '26px' : '22px', fontWeight: 900, color: 'white',
                    marginBottom: '80px',
                  }}>
                    {initials}
                  </div>
                </div>
              )}

              <div className="tow-card-content">
                {/* Topo: badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    background: rank.badgeBg,
                    border: `1px solid ${rank.badgeText}44`,
                    backdropFilter: 'blur(8px)',
                    borderRadius: '20px', padding: '4px 12px',
                    fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em',
                    color: rank.badgeText, textTransform: 'uppercase',
                  }}>
                    {rank.label}
                  </div>
                  {/* OVR badge topo direito */}
                  <div style={{
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                    border: `1px solid ${rank.badgeText}44`,
                    borderRadius: '10px', padding: '4px 10px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: '8px', fontWeight: 800, color: rank.badgeText, letterSpacing: '0.1em' }}>OVR</span>
                    <span style={{ fontSize: rank.featured ? '22px' : '18px', fontWeight: 900, color: rank.badgeText, lineHeight: 1, textShadow: `0 0 20px ${rank.badgeText}88` }}>
                      {atleta.ovr}
                    </span>
                  </div>
                </div>

                {/* Base: nome, posição, cidade, botão */}
                <div>
                  <div style={{ fontSize: rank.featured ? '16px' : '14px', fontWeight: 900, color: 'white', marginBottom: '2px', letterSpacing: '-0.01em' }}>
                    {atleta.nome}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.50)', marginBottom: '12px' }}>
                    {pos}{atleta.cidade ? ` · ${atleta.cidade.split(',')[0]}` : ''}
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    padding: '7px 16px', borderRadius: '10px',
                    background: `${rank.badgeText}18`,
                    border: `1px solid ${rank.badgeText}44`,
                    backdropFilter: 'blur(8px)',
                    fontSize: '11px', fontWeight: 700, color: rank.badgeText,
                  }}>
                    Ver perfil →
                  </div>
                </div>
              </div>

              {/* Top accent line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: rank.topLine, borderRadius: '20px 20px 0 0', zIndex: 3 }} />
            </Link>
          )
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '32px' }}>
        <Link href="/ranking" style={{
          display: 'inline-block', padding: '12px 28px', borderRadius: '14px',
          background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)',
          color: '#00FF88', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
        }}>
          Ver ranking completo →
        </Link>
      </div>
    </section>
  )
}

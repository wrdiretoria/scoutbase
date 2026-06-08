import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { listAllUsers } from '@/lib/auth'

export const revalidate = 120

function getInitials(nome: string) {
  return nome.trim().split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

/** Pontuação por qualificações — quanto maior, mais à frente na lista */
function calcScore(m: Record<string, unknown>, avatarUrl: string | null): number {
  let score = 0
  score += Math.min(parseInt(String(m.anos_exp ?? '0'), 10), 30)
  score += Math.min(String(m.certificacoes ?? '').trim().split('\n').filter(Boolean).length * 10, 20)
  score += Math.min(String(m.clubes_trabalhados ?? '').trim().split('\n').filter(Boolean).length * 5, 20)
  if (avatarUrl)     score += 15
  if (m.especialidade) score += 5
  if (m.cidade)      score += 3
  if (m.clube_atual) score += 5
  return score
}

export default async function TreinadoresSection() {
  const admin = createAdminClient()

  type Treinador = {
    id: string
    nome: string
    initials: string
    cidade: string | null
    clubeAtual: string | null
    avatarUrl: string | null
    especialidade: string | null
    anosExp: number
    certificado: boolean
    score: number
    totalAvaliacoes: number
    totalAtletas: number
  }

  let treinadores: Treinador[] = []

  try {
    const [users, avaliacoesRes] = await Promise.all([
      listAllUsers(admin),
      admin.from('avaliacoes').select('professor_id, aluno_id'),
    ])

    // Monta mapa de avaliações por treinador
    const avalMap = new Map<string, { total: number; atletas: Set<string> }>()
    for (const r of (avaliacoesRes.data ?? []) as { professor_id: string; aluno_id: string }[]) {
      if (!r.professor_id) continue
      if (!avalMap.has(r.professor_id)) avalMap.set(r.professor_id, { total: 0, atletas: new Set() })
      const e = avalMap.get(r.professor_id)!
      e.total++
      e.atletas.add(r.aluno_id)
    }

    const treinadorUsers = users.filter(u => {
      const m = u.user_metadata ?? {}
      if (m.tipo === 'treinador' || m.tipo === 'escola') return true
      const tem = !!(m.clube_atual || m.especialidade || m.anos_exp || m.certificacoes || m.clubes_trabalhados)
      return tem && !m.athlete_id && !m.posicao
    }).slice(0, 20)

    const ids = treinadorUsers.map(u => u.id)
    const { data: profiles } = ids.length > 0
      ? await admin.from('profiles').select('id, avatar_url, clube_atual, nome').in('id', ids)
      : { data: [] }

    const profileMap = new Map(
      (profiles ?? []).map((p: { id: string; avatar_url: string | null; clube_atual: string | null; nome: string | null }) => [p.id, p])
    )

    treinadores = treinadorUsers.map(u => {
      const m = u.user_metadata as Record<string, string | undefined>
      const profile = profileMap.get(u.id) as { avatar_url?: string | null; clube_atual?: string | null; nome?: string | null } | undefined
      const avatarUrl = profile?.avatar_url ?? null
      const av = avalMap.get(u.id)
      const certs = String(m.certificacoes ?? '').trim().split('\n').filter(Boolean)
      return {
        id:              u.id,
        nome:            profile?.nome ?? m.nome ?? 'Treinador',
        initials:        getInitials(m.nome ?? 'T'),
        cidade:          m.cidade ?? null,
        clubeAtual:      profile?.clube_atual ?? m.clube_atual ?? null,
        avatarUrl,
        especialidade:   m.especialidade ?? null,
        anosExp:         parseInt(m.anos_exp ?? '0', 10),
        certificado:     certs.length > 0,
        score:           calcScore(m as Record<string, unknown>, avatarUrl),
        totalAvaliacoes: av?.total ?? 0,
        totalAtletas:    av?.atletas.size ?? 0,
      }
    }).sort((a, b) => b.score - a.score)

  } catch { /* silencioso */ }

  if (treinadores.length === 0) return null

  return (
    <section style={{ background: '#0a0a0a', padding: '28px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <style>{`
        .treinador-card {
          transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
          cursor: pointer;
        }
        .treinador-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0,230,118,0.12);
          border-color: rgba(0,230,118,0.35) !important;
        }
        .treinador-card:active { transform: scale(0.97); }
        @media (max-width: 768px) {
          .treinadores-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            overflow-x: visible !important;
          }
          .treinadores-grid > a { width: 100% !important; flex-shrink: unset !important; }
        }
      `}</style>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.20em', color: '#00e676', textTransform: 'uppercase' }}>
              PARA TREINADORES
            </p>
            <h2 style={{ margin: '0 0 4px', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
              Avalie. Descubra. Desenvolva.
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.38)' }}>
              Treinadores verificados usando a plataforma.
            </p>
          </div>
          <Link href="/treinador/cadastro" style={{
            flexShrink: 0, padding: '10px 20px', borderRadius: '10px',
            border: '1.5px solid rgba(0,230,118,0.35)',
            color: '#00e676', fontSize: '13px', fontWeight: 700,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            Cadastre-se grátis →
          </Link>
        </div>

        {/* Cards — scroll desktop, grid 2 cols mobile */}
        <div className="treinadores-grid" style={{
          display: 'flex', gap: '14px',
          overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none',
        }}>
          {treinadores.map(t => (
            <Link
              key={t.id}
              href={`/treinador/${t.id}`}
              className="treinador-card"
              style={{
                flexShrink: 0,
                width: '200px',
                background: 'linear-gradient(160deg, #0f1a12 0%, #080808 100%)',
                border: '1px solid rgba(0,230,118,0.12)',
                borderRadius: '16px',
                overflow: 'hidden',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {/* Badge verificado */}
              {t.certificado && (
                <div style={{
                  position: 'absolute', top: '10px', right: '10px', zIndex: 2,
                  background: 'rgba(0,230,118,0.15)', border: '1px solid rgba(0,230,118,0.35)',
                  borderRadius: '20px', padding: '2px 8px',
                  fontSize: '9px', fontWeight: 800, color: '#00e676', letterSpacing: '0.08em',
                }}>
                  ✓ VERIFICADO
                </div>
              )}

              {/* Foto */}
              <div style={{
                height: '160px', position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(135deg, #052e16, #0b3d1e)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {t.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.avatarUrl}
                    alt={t.nome}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center center' }}
                  />
                ) : (
                  <span style={{ fontSize: '48px', fontWeight: 900, color: 'rgba(0,230,118,0.35)' }}>
                    {t.initials}
                  </span>
                )}
                {/* Gradiente inferior sobre foto */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                  background: 'linear-gradient(to top, #0f1a12, transparent)',
                  pointerEvents: 'none',
                }} />
              </div>

              {/* Info */}
              <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>

                {/* Nome */}
                <div style={{
                  fontSize: '16px', fontWeight: 900, color: 'white',
                  lineHeight: 1.1, letterSpacing: '-0.01em',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {t.nome}
                </div>

                {/* Cidade */}
                {t.cidade && (
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                    📍 {t.cidade}
                  </div>
                )}

                {/* Especialidade + Exp */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {t.especialidade && (
                    <span style={{
                      fontSize: '9px', fontWeight: 700, color: '#00e676',
                      background: 'rgba(0,230,118,0.10)', border: '1px solid rgba(0,230,118,0.20)',
                      padding: '2px 7px', borderRadius: '20px', letterSpacing: '0.05em',
                    }}>
                      {t.especialidade}
                    </span>
                  )}
                  {t.anosExp > 0 && (
                    <span style={{
                      fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.55)',
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
                      padding: '2px 7px', borderRadius: '20px',
                    }}>
                      {t.anosExp} anos
                    </span>
                  )}
                </div>

                {/* Divisor */}
                <div style={{ height: '1px', background: 'rgba(0,230,118,0.10)', margin: '2px 0' }} />

                {/* Métricas reais */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#00e676', lineHeight: 1 }}>
                      {t.totalAvaliacoes > 0 ? t.totalAvaliacoes : '—'}
                    </div>
                    <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.05em', marginTop: '2px' }}>
                      AVAL.
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#00e676', lineHeight: 1 }}>
                      {t.totalAtletas > 0 ? t.totalAtletas : '—'}
                    </div>
                    <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.30)', letterSpacing: '0.05em', marginTop: '2px' }}>
                      ATLETAS
                    </div>
                  </div>
                </div>

                {/* Clube atual */}
                {t.clubeAtual && (
                  <div style={{
                    fontSize: '10px', color: 'rgba(255,255,255,0.50)', fontWeight: 500,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginTop: '2px',
                  }}>
                    {t.clubeAtual}
                  </div>
                )}

              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  )
}

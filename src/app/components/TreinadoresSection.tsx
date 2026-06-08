import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { listAllUsers } from '@/lib/auth'

export const revalidate = 120

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

/** Pontuação por qualificações — quanto maior, mais à frente na lista */
function calcScore(u: { user_metadata?: Record<string, unknown> }, avatarUrl: string | null): number {
  const m = (u.user_metadata ?? {}) as Record<string, unknown>
  let score = 0

  // Anos de experiência (até 30 pts)
  const anos = parseInt(String(m.anos_exp ?? '0'), 10)
  score += Math.min(anos, 30)

  // Certificações (10 pts cada linha, até 20 pts)
  const certs = String(m.certificacoes ?? '').trim().split('\n').filter(Boolean)
  score += Math.min(certs.length * 10, 20)

  // Clubes trabalhados (5 pts cada, até 20 pts)
  const clubes = String(m.clubes_trabalhados ?? '').trim().split('\n').filter(Boolean)
  score += Math.min(clubes.length * 5, 20)

  // Tem foto (15 pts)
  if (avatarUrl) score += 15

  // Tem especialidade (5 pts)
  if (m.especialidade) score += 5

  // Tem cidade (3 pts)
  if (m.cidade) score += 3

  // Tem clube atual (5 pts)
  if (m.clube_atual) score += 5

  return score
}

export default async function TreinadoresSection() {
  const admin = createAdminClient()

  let treinadores: {
    id: string; nome: string; initials: string
    cidade: string | null; clubeAtual: string | null; avatarUrl: string | null
  }[] = []

  try {
    const users = await listAllUsers(admin)
    const treinadorUsers = users.filter(u => {
      const m = u.user_metadata ?? {}
      // Filtro principal: tipo gravado
      if (m.tipo === 'treinador' || m.tipo === 'escola') return true
      // Fallback: usuários cadastrados pelo fluxo de treinador
      // que não gravaram o campo tipo (ex: cadastros antigos)
      const temDadosTreinador = !!(m.clube_atual || m.especialidade || m.anos_exp || m.certificacoes || m.clubes_trabalhados)
      const naoEAtleta = !m.athlete_id && !m.posicao
      return temDadosTreinador && naoEAtleta
    }).slice(0, 20)

    const ids = treinadorUsers.map(u => u.id)
    const { data: profiles } = ids.length > 0
      ? await admin.from('profiles').select('id, avatar_url, clube_atual').in('id', ids)
      : { data: [] }

    const profileMap = new Map((profiles ?? []).map((p: { id: string; avatar_url: string | null; clube_atual: string | null }) => [p.id, p]))

    treinadores = treinadorUsers.map(u => {
      const meta = u.user_metadata as { nome?: string; cidade?: string }
      const profile = profileMap.get(u.id)
      const avatarUrl = (profile as { avatar_url?: string | null } | undefined)?.avatar_url ?? null
      return {
        id: u.id,
        nome: (profile as { nome?: string } | undefined)?.nome ?? meta.nome ?? 'Treinador',
        initials: getInitials(meta.nome ?? 'T'),
        cidade: meta.cidade ?? null,
        clubeAtual: (profile as { clube_atual?: string | null } | undefined)?.clube_atual ?? null,
        avatarUrl,
        score: calcScore(u, avatarUrl),
      }
    }).sort((a, b) => b.score - a.score)
  } catch { /* silencioso */ }

  if (treinadores.length === 0) return null

  return (
    <section style={{ background: '#0d0d0d', padding: '48px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <style>{`.treinadores-scroll::-webkit-scrollbar { display: none; }`}</style>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(16px,4vw,24px)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.20em', color: '#00e676', textTransform: 'uppercase' }}>
              PARA TREINADORES
            </p>
            <h2 style={{ margin: '0 0 6px', fontSize: 'clamp(20px,3vw,28px)', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
              Avalie. Descubra. Desenvolva.
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.38)' }}>
              Treinadores reais usando a plataforma agora.
            </p>
          </div>
          <Link href="/treinador/cadastro" style={{
            flexShrink: 0, padding: '10px 20px', borderRadius: '10px',
            border: '1.5px solid rgba(0,230,118,0.35)',
            color: '#00e676', fontSize: '13px', fontWeight: 700,
            textDecoration: 'none', whiteSpace: 'nowrap',
            transition: 'background .2s',
          }}>
            Cadastre-se grátis →
          </Link>
        </div>

        {/* Cards scroll horizontal */}
        <div className="treinadores-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
          {treinadores.map(t => (
            <div key={t.id} style={{
              flexShrink: 0, width: '160px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '16px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
              textAlign: 'center',
            }}>
              {/* Avatar */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'linear-gradient(135deg,#052e16,#0b4d26)',
                border: '2px solid rgba(0,230,118,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px', fontWeight: 900, color: '#00e676',
                overflow: 'hidden', position: 'relative', flexShrink: 0,
              }}>
                {t.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.avatarUrl} alt={t.nome} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{t.initials}</span>
                )}
              </div>

              {/* Info */}
              <div>
                <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 700, color: 'white', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '136px' }}>
                  {t.nome.split(' ')[0]}
                </p>
                {t.clubeAtual && (
                  <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#00e676', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '136px' }}>
                    {t.clubeAtual}
                  </p>
                )}
                {t.cidade && (
                  <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '136px' }}>
                    {t.cidade}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

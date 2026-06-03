/**
 * /treinadores — Lista pública de treinadores cadastrados
 * Server Component — busca via admin client (bypass RLS)
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase'
import { listAllUsers } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'Treinadores — Meu Craque',
  description: 'Conheça os treinadores cadastrados na plataforma Meu Craque.',
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

type TreinadorCard = {
  id:              string
  nome:            string
  initials:        string
  cidade:          string | null
  pais:            string | null
  especialidade:   string | null
  categoria:       string | null
  certificacao:    string | null
  anosExp:         string | null
  clubeAtual:      string | null
  avatarUrl:       string | null
  treinadorId:     string | null
  totalAvaliacoes: number
}

export default async function TreinadoresPage() {
  const admin = createAdminClient()

  const users = await listAllUsers(admin)

  const treinadorUsers = users.filter(
    u => u.user_metadata?.tipo === 'treinador' || u.user_metadata?.tipo === 'escola'
  )

  // Busca perfis para avatar e treinadorId
  const ids = treinadorUsers.map(u => u.id)
  const { data: profiles } = ids.length > 0
    ? await admin.from('profiles').select('id, athlete_id, avatar_url').in('id', ids)
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id as string, p]))

  // Conta avaliações por treinador
  const { data: avsCount } = await admin
    .from('avaliacoes')
    .select('professor_id')
    .not('scout_score', 'is', null)

  const countMap = new Map<string, number>()
  for (const av of avsCount ?? []) {
    const pid = av.professor_id as string
    countMap.set(pid, (countMap.get(pid) ?? 0) + 1)
  }

  const treinadores: TreinadorCard[] = treinadorUsers
    .map(u => {
      const meta = u.user_metadata as {
        nome?:               string
        cidade?:             string
        pais?:               string
        pais_nascimento?:    string
        especialidade?:      string
        categoria_trabalho?: string
        certificacao?:       string
        anos_exp?:           string
        experiencia_anos?:   number
        clube_atual?:        string
      }
      const p = profileMap.get(u.id)
      const nome = meta.nome ?? 'Treinador'
      return {
        id:            u.id,
        nome,
        initials:      getInitials(nome),
        cidade:        meta.cidade                                        ?? null,
        pais:          meta.pais_nascimento ?? meta.pais                  ?? null,
        especialidade: meta.especialidade                                  ?? null,
        categoria:     meta.categoria_trabalho                             ?? null,
        certificacao:  meta.certificacao                                   ?? null,
        anosExp:       meta.anos_exp ?? (meta.experiencia_anos != null ? String(meta.experiencia_anos) : null),
        clubeAtual:    meta.clube_atual                                    ?? null,
        avatarUrl:     (p?.avatar_url as string | null) ?? null,
        treinadorId:   (p?.athlete_id as string | null) ?? null,
        totalAvaliacoes: countMap.get(u.id) ?? 0,
      }
    })
    .sort((a, b) => b.totalAvaliacoes - a.totalAvaliacoes)

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif', color: 'white',
    }}>
      {/* Nav */}
      <nav style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, background: 'rgba(6,16,10,0.95)',
        backdropFilter: 'blur(20px)', zIndex: 10,
      }}>
        <Link href="/" style={{ fontSize: '16px', fontWeight: 800, textDecoration: 'none', letterSpacing: '-0.01em' }}>
          ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
        </Link>
        <Link href="/treinador/cadastro" style={{
          padding: '8px 16px', borderRadius: '10px', background: '#22c55e',
          color: 'black', fontWeight: 800, fontSize: '13px', textDecoration: 'none',
        }}>
          Cadastrar como treinador
        </Link>
      </nav>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '36px 20px 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{
            margin: '0 0 8px', fontSize: '11px', fontWeight: 700,
            color: '#22c55e', letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>
            🎽 Plataforma Meu Craque
          </p>
          <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(24px,5vw,34px)', fontWeight: 900, letterSpacing: '-0.03em' }}>
            Treinadores cadastrados
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
            {treinadores.length} treinador{treinadores.length !== 1 ? 'es' : ''} na plataforma
          </p>
        </div>

        {/* Lista */}
        {treinadores.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '56px 24px',
            background: 'rgba(255,255,255,0.02)', borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🎽</p>
            <p style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 700 }}>Nenhum treinador cadastrado ainda.</p>
            <Link href="/treinador/cadastro" style={{
              display: 'inline-block', padding: '12px 24px', borderRadius: '12px',
              background: '#22c55e', color: 'black', fontWeight: 800, fontSize: '14px', textDecoration: 'none',
            }}>
              Seja o primeiro →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {treinadores.map(t => (
              <Link
                key={t.id}
                href={`/treinador/${t.id}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '18px 20px', borderRadius: '16px',
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  transition: 'border-color 0.15s, background 0.15s',
                }}>
                  {/* Avatar */}
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg,#15803d,#4ade80)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 900,
                    border: '2px solid rgba(34,197,94,0.25)',
                    overflow: 'hidden',
                  }}>
                    {t.avatarUrl
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={t.avatarUrl} alt={t.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : t.initials
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>
                        {t.nome}
                      </span>
                      {t.treinadorId && (
                        <span style={{
                          fontSize: '9px', fontWeight: 800, color: '#22c55e',
                          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                          borderRadius: '5px', padding: '1px 6px', letterSpacing: '0.08em',
                        }}>
                          {t.treinadorId.replace(/^[A-Z]+-/, '')}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.42)' }}>
                      {t.cidade && <span>📍 {t.cidade}</span>}
                      {t.categoria && <span>⚽ {t.categoria}</span>}
                      {!t.categoria && t.especialidade && <span>⚽ {t.especialidade}</span>}
                      {t.anosExp && <span>🕐 {t.anosExp} anos exp.</span>}
                      {t.clubeAtual && <span>🏟 {t.clubeAtual}</span>}
                      {t.certificacao && (
                        <span style={{ color: '#fbbf24' }}>🏅 {t.certificacao}</span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ textAlign: 'center', flexShrink: 0 }}>
                    <div style={{ fontSize: '20px', fontWeight: 900, color: '#22c55e', lineHeight: 1 }}>
                      {t.totalAvaliacoes}
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      avaliaç{t.totalAvaliacoes === 1 ? 'ão' : 'ões'}
                    </div>
                  </div>

                  <span style={{ fontSize: '16px', color: 'rgba(34,197,94,0.4)', flexShrink: 0 }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{
          marginTop: '48px', textAlign: 'center',
          padding: '32px 24px', borderRadius: '20px',
          background: 'linear-gradient(135deg,#052e16,#071a0e)',
          border: '1px solid rgba(34,197,94,0.2)',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 900 }}>
            Você é treinador?
          </p>
          <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            Crie seu perfil e seja encontrado por atletas e clubes.
          </p>
          <Link href="/treinador/cadastro" style={{
            display: 'inline-block', padding: '13px 28px', borderRadius: '14px',
            background: '#22c55e', color: 'black', fontWeight: 800,
            fontSize: '15px', textDecoration: 'none',
          }}>
            🎽 Criar perfil de treinador →
          </Link>
        </div>
      </div>
    </main>
  )
}

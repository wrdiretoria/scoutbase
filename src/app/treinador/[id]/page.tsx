/**
 * /treinador/[id] — Perfil público de um treinador
 * Server Component — busca dados via admin client (bypass RLS)
 */

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase'
import { Metadata } from 'next'

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function notaColor(nota: number) {
  if (nota >= 75) return '#22c55e'
  if (nota >= 60) return '#fbbf24'
  if (nota >= 45) return '#f97316'
  return '#ef4444'
}

function notaLabel(nota: number) {
  if (nota >= 75) return 'Destaque'
  if (nota >= 60) return 'Bom'
  if (nota >= 45) return 'Regular'
  return 'Iniciante'
}

function formatarData(dateStr: string) {
  const dias = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  if (dias < 7)  return `${dias}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const admin = createAdminClient()
  const { data: { user } } = await admin.auth.admin.getUserById(id)
  if (!user) return { title: 'Treinador | Meu Craque' }
  const meta = user.user_metadata as { nome?: string; cidade?: string; especialidade?: string }
  const nome = meta.nome ?? 'Treinador'
  return {
    title: `${nome} | Meu Craque`,
    description: `Perfil do treinador ${nome}${meta.cidade ? ` de ${meta.cidade}` : ''}. Avaliações e atletas no Meu Craque.`,
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ id: string }> }

export default async function TreinadorPerfilPublico({ params }: Props) {
  const { id } = await params
  const admin = createAdminClient()

  // 1. Busca dados do treinador
  const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(id)
  if (userErr || !user) notFound()

  const meta = user.user_metadata as {
    nome?:         string
    cidade?:       string
    especialidade?: string
    avatar_url?:   string
    tipo?:         string
    treinadorId?:  string
  }

  // Confirma que é treinador
  if (meta.tipo !== 'treinador' && meta.tipo !== 'escola') notFound()

  const nome         = meta.nome         ?? 'Treinador'
  const cidade       = meta.cidade       ?? null
  const especialidade = meta.especialidade ?? null
  const avatarUrl    = meta.avatar_url   ?? null
  const treinadorId  = meta.treinadorId  ?? null

  // 2. Busca alunos desta escola/treinador
  type Aluno = {
    id:            string
    nome:          string
    posicao:       string | null
    avatar_url:    string | null
    data_nascimento: string | null
  }

  let alunos: Aluno[] = []
  if (treinadorId) {
    const { data } = await admin
      .from('alunos')
      .select('id, nome, posicao, avatar_url, data_nascimento')
      .eq('treinador_id', treinadorId)
      .order('nome')
    alunos = (data ?? []) as Aluno[]
  }

  // 3. Busca avaliações feitas por este treinador (via alunos)
  type Avaliacao = {
    id:         string
    aluno_id:   string
    nota_geral: number
    created_at: string
    aluno_nome: string
    posicao:    string
    avatar_url: string | null
  }

  let avaliacoes: Avaliacao[] = []
  if (alunos.length > 0) {
    const alunoIds = alunos.map(a => a.id)
    const { data } = await admin
      .from('avaliacoes')
      .select('id, aluno_id, nota_geral, created_at')
      .in('aluno_id', alunoIds)
      .order('created_at', { ascending: false })
      .limit(50)

    const alunoMap = new Map(alunos.map(a => [a.id, a]))
    avaliacoes = ((data ?? []) as { id: string; aluno_id: string; nota_geral: number; created_at: string }[])
      .map(av => {
        const aluno = alunoMap.get(av.aluno_id)
        return {
          id:         av.id,
          aluno_id:   av.aluno_id,
          nota_geral: av.nota_geral,
          created_at: av.created_at,
          aluno_nome: aluno?.nome ?? 'Atleta',
          posicao:    aluno?.posicao ?? '',
          avatar_url: aluno?.avatar_url ?? null,
        }
      })
  }

  // 4. Métricas
  const totalAtletas    = alunos.length
  const totalAvaliacoes = avaliacoes.length
  const mediaOvr        = avaliacoes.length > 0
    ? Math.round(avaliacoes.reduce((s, a) => s + a.nota_geral, 0) / avaliacoes.length)
    : null
  const destaques       = avaliacoes.filter(a => a.nota_geral >= 75).length

  // Membro desde
  const membroDesde = new Date(user.created_at).toLocaleDateString('pt-BR', {
    month: 'long', year: 'numeric'
  })

  const initials = getInitials(nome)

  return (
    <main style={{
      background: '#06100a', minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif', color: 'white',
    }}>
      <style>{`
        .tp-stat { transition: transform 0.15s; }
        .tp-stat:hover { transform: translateY(-2px); }
        .tp-av-card { transition: background 0.15s, border-color 0.15s; }
        .tp-av-card:hover { background: rgba(34,197,94,0.06) !important; border-color: rgba(34,197,94,0.25) !important; }
        @media (max-width: 500px) {
          .tp-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky', top: 0, background: 'rgba(6,16,10,0.95)',
        backdropFilter: 'blur(20px)', zIndex: 10,
      }}>
        <Link href="/" style={{ fontSize: '16px', fontWeight: 800, color: 'white', textDecoration: 'none' }}>
          ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
        </Link>
        <Link href="/atleta/cadastro" style={{
          padding: '8px 16px', borderRadius: '10px', background: '#22c55e',
          color: 'black', fontWeight: 800, fontSize: '13px', textDecoration: 'none',
        }}>
          Criar meu perfil
        </Link>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '28px 20px 80px' }}>

        {/* ── Cabeçalho do treinador ── */}
        <div style={{
          padding: '28px 24px', borderRadius: '20px',
          background: 'linear-gradient(135deg,#052e16,#071a0e)',
          border: '1px solid rgba(34,197,94,0.2)', marginBottom: '24px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Orbe decorativo */}
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '140px', height: '140px', borderRadius: '50%',
            background: 'radial-gradient(circle,rgba(34,197,94,0.15),transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', position: 'relative' }}>
            {/* Avatar */}
            <div style={{
              width: '76px', height: '76px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#15803d,#4ade80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: 900,
              boxShadow: '0 0 0 3px rgba(34,197,94,0.4), 0 8px 24px rgba(34,197,94,0.25)',
              overflow: 'hidden',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: '0 0 2px', fontSize: '9px', fontWeight: 800,
                color: '#22c55e', letterSpacing: '0.14em', textTransform: 'uppercase',
              }}>
                🎽 Treinador verificado
              </p>
              <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                {nome}
              </h1>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {cidade && (
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    📍 {cidade}
                  </span>
                )}
                {especialidade && (
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    ⚡ {especialidade}
                  </span>
                )}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                Membro desde {membroDesde}
              </p>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div
          className="tp-stats-grid"
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px', marginBottom: '28px',
          }}
        >
          {[
            { label: 'Atletas', value: totalAtletas,    emoji: '👥', color: '#22c55e' },
            { label: 'Avaliações', value: totalAvaliacoes, emoji: '📋', color: '#60a5fa' },
            { label: 'OVR médio', value: mediaOvr ?? '—', emoji: '⭐', color: '#fbbf24' },
            { label: 'Destaques', value: destaques,     emoji: '🌟', color: '#a78bfa' },
          ].map(stat => (
            <div
              key={stat.label}
              className="tp-stat"
              style={{
                padding: '14px 10px', borderRadius: '14px', textAlign: 'center',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <p style={{ margin: '0 0 4px', fontSize: '18px' }}>{stat.emoji}</p>
              <p style={{ margin: '0 0 2px', fontSize: '20px', fontWeight: 900, color: stat.color }}>{stat.value}</p>
              <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{stat.label}</p>
            </div>
          ))}
        </div>

        {/* ── Avaliações recentes ── */}
        {avaliacoes.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 800, letterSpacing: '-0.01em' }}>
              Avaliações recentes
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {avaliacoes.slice(0, 10).map(av => (
                <div
                  key={av.id}
                  className="tp-av-card"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '14px',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Avatar atleta */}
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg,#1e3a5f,#3b82f6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 900, overflow: 'hidden',
                  }}>
                    {av.avatar_url
                      ? <img src={av.avatar_url} alt={av.aluno_nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : getInitials(av.aluno_nome)}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 2px', fontSize: '14px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {av.aluno_nome}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                      {av.posicao ? `${posAbrev(av.posicao)} · ` : ''}{formatarData(av.created_at)}
                    </p>
                  </div>

                  {/* Nota */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ margin: '0 0 1px', fontSize: '18px', fontWeight: 900, color: notaColor(av.nota_geral), lineHeight: 1 }}>
                      {av.nota_geral}
                    </p>
                    <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {notaLabel(av.nota_geral)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Lista de atletas ── */}
        {alunos.length > 0 && (
          <div style={{ marginBottom: '28px' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: '16px', fontWeight: 800, letterSpacing: '-0.01em' }}>
              Atletas da escola ({totalAtletas})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alunos.slice(0, 20).map(aluno => (
                <div
                  key={aluno.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg,#15803d,#4ade80)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 900, overflow: 'hidden',
                  }}>
                    {aluno.avatar_url
                      ? <img src={aluno.avatar_url} alt={aluno.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : getInitials(aluno.nome)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {aluno.nome}
                    </p>
                    {aluno.posicao && (
                      <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                        {posAbrev(aluno.posicao)}
                      </p>
                    )}
                  </div>
                  <span style={{
                    padding: '3px 9px', borderRadius: '20px', fontSize: '10px', fontWeight: 700,
                    background: 'rgba(34,197,94,0.08)', color: 'rgba(34,197,94,0.7)',
                    border: '1px solid rgba(34,197,94,0.15)',
                  }}>
                    {aluno.posicao ? posAbrev(aluno.posicao) : 'ATL'}
                  </span>
                </div>
              ))}
              {alunos.length > 20 && (
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  + {alunos.length - 20} atletas
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sem dados */}
        {totalAtletas === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            background: 'rgba(255,255,255,0.02)', borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)', marginBottom: '28px',
          }}>
            <p style={{ fontSize: '32px', margin: '0 0 8px' }}>⚽</p>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>
              Nenhum atleta cadastrado ainda.
            </p>
          </div>
        )}

        {/* ── CTA final ── */}
        <div style={{
          padding: '24px', borderRadius: '20px', textAlign: 'center',
          background: 'linear-gradient(135deg,#052e16,#0b1610)',
          border: '1px solid rgba(34,197,94,0.2)',
        }}>
          <p style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 900 }}>
            Você é atleta?
          </p>
          <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>
            Crie seu card gratuito e seja visto por scouts do Brasil.
          </p>
          <Link href="/atleta/cadastro" style={{
            display: 'inline-block', padding: '13px 28px', borderRadius: '14px',
            background: '#22c55e', color: 'black', fontWeight: 800,
            fontSize: '15px', textDecoration: 'none',
          }}>
            ⚽ Criar meu perfil grátis →
          </Link>
        </div>
      </div>
    </main>
  )
}

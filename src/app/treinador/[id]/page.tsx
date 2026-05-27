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

// UUID v4 básico — evita 500 ao receber slugs como "entrar" ou "configurar"
function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  if (!isUuid(id)) return { title: 'Treinador | Meu Craque' }
  try {
    const admin = createAdminClient()
    const { data: { user } } = await admin.auth.admin.getUserById(id)
    if (!user) return { title: 'Treinador | Meu Craque' }
    const meta = user.user_metadata as { nome?: string; cidade?: string }
    const nome = meta.nome ?? 'Treinador'
    const cidade = meta.cidade ?? null
    return {
      title: `${nome} | Meu Craque`,
      description: `Perfil do treinador ${nome}${cidade ? ` de ${cidade}` : ''}. Avaliações e atletas no Meu Craque.`,
    }
  } catch {
    return { title: 'Treinador | Meu Craque' }
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

type Props = { params: Promise<{ id: string }> }

export default async function TreinadorPerfilPublico({ params }: Props) {
  const { id } = await params

  // Evita 500 para slugs inválidos como /treinador/entrar
  if (!isUuid(id)) notFound()

  const admin = createAdminClient()

  // 1. Busca dados do treinador
  let user: Awaited<ReturnType<typeof admin.auth.admin.getUserById>>['data']['user']
  try {
    const res = await admin.auth.admin.getUserById(id)
    if (res.error || !res.data.user) notFound()
    user = res.data.user
  } catch {
    notFound()
  }

  const meta = user.user_metadata as {
    nome?:              string
    cidade?:            string
    pais?:              string
    especialidade?:     string
    avatar_url?:        string
    tipo?:              string
    treinadorId?:       string
    anos_exp?:          string
    clube_atual?:       string
    clubes_trabalhados?: string
    certificacoes?:     string
    conquistas?:        string
    telefone?:          string
    instagram?:         string
    tiktok?:            string
    youtube?:           string
    outras?:            string
  }

  // Confirma que é treinador
  if (meta.tipo !== 'treinador' && meta.tipo !== 'escola') notFound()

  // Busca dados do perfil (profiles tem prioridade sobre user_metadata)
  const { data: profileData } = await admin
    .from('profiles')
    .select('avatar_url, athlete_id, bio')
    .eq('id', id)
    .maybeSingle()
  const p = profileData as Record<string, unknown> | null

  const nome              = meta.nome ?? 'Treinador'
  const cidade            = meta.cidade            ?? null
  const pais              = meta.pais              ?? null
  const especialidade     = meta.especialidade     ?? null
  const anosExp           = meta.anos_exp          ?? null
  const clubeAtual        = meta.clube_atual        ?? null
  const clubesTrabalhados = meta.clubes_trabalhados ?? null
  const certificacoes     = meta.certificacoes     ?? null
  const conquistas        = meta.conquistas        ?? null
  const telefone          = meta.telefone          ?? null
  const instagram         = meta.instagram         ?? null
  const tiktok            = meta.tiktok            ?? null
  const youtube           = meta.youtube           ?? null
  const outras            = meta.outras            ?? null
  const avatarUrl         = (p?.avatar_url as string | null) ?? meta.avatar_url ?? null
  const treinadorId       = (p?.athlete_id as string | null) ?? meta.treinadorId ?? null
  const bio               = (p?.bio        as string | null) ?? null

  // 2. Busca avaliações feitas por este treinador no Meu Craque (professor_id = auth UUID)
  type AvaliacaoRaw = { id: string; aluno_id: string; scout_score: number; created_at: string }
  type Avaliacao = {
    id: string; aluno_id: string; nota_geral: number; created_at: string
    aluno_nome: string; posicao: string; avatar_url: string | null
    athlete_id: string | null
  }

  let avaliacoes: Avaliacao[] = []
  const { data: avsRaw } = await admin
    .from('avaliacoes')
    .select('id, aluno_id, scout_score, created_at')
    .eq('professor_id', id)
    .not('scout_score', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  if (avsRaw && avsRaw.length > 0) {
    // Busca perfil dos atletas avaliados
    const atletaIds = [...new Set((avsRaw as AvaliacaoRaw[]).map(a => a.aluno_id))]
    const { data: perfis } = await admin
      .from('profiles')
      .select('id, athlete_id, avatar_url')
      .in('id', atletaIds)

    // Busca nomes e posição do user_metadata de cada atleta
    const atletaMetaMap = new Map<string, { nome: string; posicao: string; avatar_url: string | null; athlete_id: string | null }>()
    await Promise.all(
      atletaIds.map(async (uid) => {
        try {
          const { data: { user: u } } = await admin.auth.admin.getUserById(uid)
          const p = (perfis ?? []).find(x => x.id === uid)
          atletaMetaMap.set(uid, {
            nome:       (u?.user_metadata?.nome as string) ?? 'Atleta',
            posicao:    (u?.user_metadata?.posicao as string) ?? '',
            avatar_url: (p?.avatar_url as string | null) ?? null,
            athlete_id: (p?.athlete_id as string | null) ?? null,
          })
        } catch { /* silencia */ }
      })
    )

    avaliacoes = (avsRaw as AvaliacaoRaw[]).map(av => {
      const info = atletaMetaMap.get(av.aluno_id)
      return {
        id:         av.id,
        aluno_id:   av.aluno_id,
        nota_geral: av.scout_score,
        created_at: av.created_at,
        aluno_nome: info?.nome      ?? 'Atleta',
        posicao:    info?.posicao   ?? '',
        avatar_url: info?.avatar_url ?? null,
        athlete_id: info?.athlete_id ?? null,
      }
    })
  }

  // 3. Métricas
  const atletasUnicos  = new Set(avaliacoes.map(a => a.aluno_id)).size
  const totalAtletas    = atletasUnicos
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
                {(cidade || pais) && (
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    📍 {[cidade, pais].filter(Boolean).join(', ')}
                  </span>
                )}
                {especialidade && (
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    ⚡ {especialidade}
                  </span>
                )}
                {anosExp && (
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                    🕐 {anosExp} anos de exp.
                  </span>
                )}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                Membro desde {membroDesde}
              </p>
            </div>
          </div>
        </div>

        {/* ── Bio ── */}
        {bio && (
          <div style={{
            padding: '16px 20px', borderRadius: '16px', marginBottom: '20px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sobre</p>
            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7 }}>{bio}</p>
          </div>
        )}

        {/* ── Currículo profissional ── */}
        {(clubeAtual || clubesTrabalhados || certificacoes || conquistas) && (
          <div style={{
            padding: '16px 20px', borderRadius: '16px', marginBottom: '20px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <p style={{ margin: '0 0 14px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              📋 Currículo
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {clubeAtual && (
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Onde trabalha atualmente</p>
                  <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{clubeAtual}</p>
                </div>
              )}
              {clubesTrabalhados && (
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Experiências anteriores</p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{clubesTrabalhados}</p>
                </div>
              )}
              {certificacoes && (
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Certificações e licenças</p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{certificacoes}</p>
                </div>
              )}
              {conquistas && (
                <div>
                  <p style={{ margin: '0 0 3px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Conquistas e títulos</p>
                  <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{conquistas}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Contato e redes ── */}
        {(telefone || instagram || tiktok || youtube || outras) && (
          <div style={{
            padding: '16px 20px', borderRadius: '16px', marginBottom: '20px',
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <p style={{ margin: '0 0 14px', fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              📲 Contato
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {telefone && (
                <a href={`https://wa.me/${telefone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '100px',
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                  color: '#4ade80', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                }}>
                  📞 {telefone}
                </a>
              )}
              {instagram && (
                <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '100px',
                  background: 'rgba(225,48,108,0.08)', border: '1px solid rgba(225,48,108,0.2)',
                  color: '#f9a8d4', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                }}>
                  @{instagram}
                </a>
              )}
              {tiktok && (
                <a href={`https://tiktok.com/@${tiktok}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '100px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                }}>
                  TT @{tiktok}
                </a>
              )}
              {youtube && (
                <a href={`https://youtube.com/@${youtube}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '100px',
                  background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)',
                  color: '#fca5a5', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                }}>
                  YT @{youtube}
                </a>
              )}
              {outras && (
                <a href={outras.startsWith('http') ? outras : `https://${outras}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '100px',
                  background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)',
                  color: '#93c5fd', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
                }}>
                  🔗 {outras.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>
          </div>
        )}

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
              Atletas avaliados
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {avaliacoes.slice(0, 10).map(av => {
                const card = (
                  <div
                    className="tp-av-card"
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px', borderRadius: '14px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      textDecoration: 'none', color: 'inherit',
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

                    {av.athlete_id && (
                      <span style={{ fontSize: '14px', color: 'rgba(34,197,94,0.4)', flexShrink: 0 }}>›</span>
                    )}
                  </div>
                )

                return av.athlete_id ? (
                  <Link key={av.id} href={`/jogador/${av.aluno_id}`} style={{ textDecoration: 'none', display: 'block' }}>
                    {card}
                  </Link>
                ) : (
                  <div key={av.id}>{card}</div>
                )
              })}
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

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

type PerfilBasico = {
  id:           string
  nome:         string
  avatar_url?:  string
  especialidade?: string
  created_at?:  string
}

type AvaliacaoRecente = {
  id:            string
  nota_geral:    number
  created_at:    string
  atleta_nome:   string
  atleta_posicao:string
  atleta_avatar?:string
}

type Metricas = {
  totalAvaliacoes: number
  totalAtletas:    number
  totalDestaques:  number
  semanaCount:     number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function formatarTempo(dateStr?: string): string {
  if (!dateStr) return 'Novo'
  const dias = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (dias < 2)   return 'Novo'
  if (dias < 30)  return `${dias}d`
  if (dias < 365) return `${Math.floor(dias / 30)}m`
  return `${Math.floor(dias / 365)}a`
}

function formatarDataRelativa(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const dias  = Math.floor(diff / 86_400_000)
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  if (dias <  7)  return `${dias}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function notaColor(nota: number): string {
  if (nota >= 75) return '#00FF88'
  if (nota >= 60) return '#fbbf24'
  if (nota >= 45) return '#f97316'
  return '#ef4444'
}

function notaLabel(nota: number): string {
  if (nota >= 75) return 'Destaque'
  if (nota >= 60) return 'Bom'
  if (nota >= 45) return 'Regular'
  return 'Iniciante'
}

// Animated counter hook
function useCounter(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = Date.now()
    const timer = setInterval(() => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      const eased    = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(eased * target))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TreinadorDashboardPage() {
  const router = useRouter()

  const [perfil,   setPerfil]   = useState<PerfilBasico | null>(null)
  const [metricas, setMetricas] = useState<Metricas>({
    totalAvaliacoes: 0, totalAtletas: 0, totalDestaques: 0, semanaCount: 0,
  })
  const [recentes, setRecentes] = useState<AvaliacaoRecente[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // ── Perfil ──
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setPerfil({
        id:           user.id,
        nome:         profile?.nome ?? user.user_metadata?.nome ?? 'Treinador',
        avatar_url:   profile?.avatar_url,
        especialidade:(profile as Record<string, unknown>)?.especialidade as string | undefined
                      ?? user.user_metadata?.especialidade,
        created_at:   user.created_at,
      })

      // ── Métricas & Recentes — graceful fallback ──
      try {
        const semanaPast = new Date(Date.now() - 7 * 86_400_000).toISOString()

        const [
          { count: totAv },
          { data: profileIdRows },
          { count: totDest },
          { count: semana },
        ] = await Promise.all([
          supabase.from('avaliacoes')
            .select('*', { count: 'exact', head: true })
            .eq('treinador_id', user.id),
          supabase.from('avaliacoes')
            .select('profile_id')
            .eq('treinador_id', user.id),
          supabase.from('avaliacoes')
            .select('*', { count: 'exact', head: true })
            .eq('treinador_id', user.id)
            .gte('nota_geral', 75),
          supabase.from('avaliacoes')
            .select('*', { count: 'exact', head: true })
            .eq('treinador_id', user.id)
            .gte('created_at', semanaPast),
        ])

        const uniqueAtletas = new Set((profileIdRows ?? []).map(r => r.profile_id)).size

        setMetricas({
          totalAvaliacoes: totAv     ?? 0,
          totalAtletas:    uniqueAtletas,
          totalDestaques:  totDest   ?? 0,
          semanaCount:     semana    ?? 0,
        })

        // ── Avaliações recentes ──
        const { data: avRecentes } = await supabase
          .from('avaliacoes')
          .select('id, nota_geral, created_at, profile_id')
          .eq('treinador_id', user.id)
          .order('created_at', { ascending: false })
          .limit(6)

        if (avRecentes && avRecentes.length > 0) {
          const pIds = avRecentes.map(a => a.profile_id)
          const { data: atletaProfiles } = await supabase
            .from('profiles')
            .select('id, nome, avatar_url, posicao')
            .in('id', pIds)

          const map = new Map((atletaProfiles ?? []).map(p => [p.id, p]))

          setRecentes(avRecentes.map(av => {
            const at = map.get(av.profile_id) as Record<string, unknown> | undefined
            return {
              id:             av.id,
              nota_geral:     av.nota_geral,
              created_at:     av.created_at,
              atleta_nome:    (at?.nome    as string) ?? 'Atleta',
              atleta_posicao: (at?.posicao as string) ?? '',
              atleta_avatar:  (at?.avatar_url as string) ?? undefined,
            }
          }))
        }
      } catch { /* avaliacoes table not yet created — zeros are honest */ }

      setLoading(false)
    }
    load()
  }, [router])

  // ── Animated counters ─────────────────────────────────────────────────────
  const animAv   = useCounter(metricas.totalAvaliacoes)
  const animAt   = useCounter(metricas.totalAtletas)
  const animDest = useCounter(metricas.totalDestaques)

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ background:'#030a05', minHeight:'100svh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <p style={{ color:'rgba(255,255,255,0.25)', fontFamily:'system-ui', fontSize:'14px' }}>Carregando…</p>
      </main>
    )
  }
  if (!perfil) return null

  const primeiroNome = perfil.nome.split(' ')[0]
  const initials     = getInitials(perfil.nome)
  const tempoNaPlat  = formatarTempo(perfil.created_at)

  const semanaLabel = metricas.semanaCount === 0
    ? 'Nenhuma avaliação esta semana'
    : metricas.semanaCount === 1
    ? '1 atleta avaliado esta semana'
    : `${metricas.semanaCount} atletas avaliados esta semana`

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main style={{
      background:    '#030a05',
      minHeight:     '100svh',
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      padding:       '0 0 72px',
      fontFamily:    'system-ui, sans-serif',
      position:      'relative',
      overflow:      'hidden',
    }}>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes glowBreathe {
          0%,100% { opacity:.65 }
          50%     { opacity:1 }
        }
        @keyframes dotPulse {
          0%,100% { opacity:1;  transform:scale(1)   }
          50%     { opacity:.4; transform:scale(.65) }
        }
        @keyframes ctaGlow {
          0%,100% { box-shadow: 0 0 40px rgba(0,255,136,0.28), 0 6px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25) }
          50%     { box-shadow: 0 0 72px rgba(0,255,136,0.50), 0 6px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25) }
        }
        @keyframes cardReveal {
          from { opacity:0; transform:translateY(8px) }
          to   { opacity:1; transform:translateY(0) }
        }

        .a1 { animation: fadeUp .4s ease forwards 0s;    opacity:0 }
        .a2 { animation: fadeUp .4s ease forwards .08s;  opacity:0 }
        .a3 { animation: fadeUp .4s ease forwards .18s;  opacity:0 }
        .a4 { animation: fadeUp .4s ease forwards .30s;  opacity:0 }
        .a5 { animation: fadeUp .4s ease forwards .45s;  opacity:0 }
        .a6 { animation: fadeUp .4s ease forwards .60s;  opacity:0 }
        .a7 { animation: fadeUp .4s ease forwards .78s;  opacity:0 }

        .cta-btn {
          width: 100%;
          padding: 20px 24px;
          border-radius: 18px;
          border: none;
          background: linear-gradient(135deg, #00e87a, #00FF88 55%, #22c55e);
          color: #020d04;
          font-weight: 900;
          font-size: 17px;
          cursor: pointer;
          font-family: system-ui, sans-serif;
          letter-spacing: 0.025em;
          animation: ctaGlow 3.5s ease-in-out infinite;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          transition: transform .15s, opacity .2s;
          text-decoration: none;
        }
        .cta-btn:active { transform: scale(0.98); opacity: .9 }
        .cta-btn:hover  { text-decoration: none }

        .card-atleta {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 13px 15px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          transition: background .2s, border-color .2s;
        }
        .card-atleta:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(255,255,255,0.11);
        }

        .quick-link {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          text-decoration: none;
          transition: background .2s, border-color .2s;
        }
        .quick-link:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(0,255,136,0.18);
        }
      `}</style>

      {/* ── Atmosfera ── */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        {/* glow top-center */}
        <div style={{
          position:'absolute', top:'-22%', left:'50%', transform:'translateX(-50%)',
          width:'900px', height:'700px', borderRadius:'50%',
          background:'radial-gradient(ellipse,rgba(0,255,136,0.09) 0%,transparent 60%)',
          animation:'glowBreathe 7s ease-in-out infinite',
        }} />
        {/* glow bottom-right */}
        <div style={{
          position:'absolute', bottom:'-15%', right:'-30%',
          width:'600px', height:'600px', borderRadius:'50%',
          background:'radial-gradient(ellipse,rgba(0,255,136,0.04) 0%,transparent 65%)',
        }} />
        {/* tactical grid */}
        <div style={{
          position:'absolute', inset:0,
          backgroundImage:
            'linear-gradient(rgba(0,255,136,0.018) 1px,transparent 1px),' +
            'linear-gradient(90deg,rgba(0,255,136,0.018) 1px,transparent 1px)',
          backgroundSize:'52px 52px',
        }} />
      </div>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'420px', padding:'0 20px' }}>

        {/* ══════════════════════════════════════
            TOP NAV
        ══════════════════════════════════════ */}
        <div className="a1" style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'26px 0 20px',
        }}>
          {/* Logo */}
          <span style={{ fontSize:'16px', fontWeight:900, color:'white', letterSpacing:'-0.02em' }}>
            ⚽ MEU <span style={{ color:'#22c55e' }}>CRAQUE</span>
          </span>

          {/* Avatar → perfil */}
          <Link href="/treinador/perfil" style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            width:'38px', height:'38px', borderRadius:'50%',
            overflow:'hidden', flexShrink:0,
            border:'2px solid rgba(0,255,136,0.35)',
            background: perfil.avatar_url ? 'transparent' : 'linear-gradient(135deg,#166534,#22c55e)',
            textDecoration:'none',
            boxShadow:'0 0 14px rgba(0,255,136,0.2)',
          }}>
            {perfil.avatar_url
              ? <img src={perfil.avatar_url} alt={perfil.nome} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <span style={{ fontSize:'13px', fontWeight:900, color:'white' }}>{initials}</span>
            }
          </Link>
        </div>

        {/* ══════════════════════════════════════
            WELCOME
        ══════════════════════════════════════ */}
        <div className="a2" style={{ marginBottom:'30px' }}>
          <h1 style={{
            margin:'0 0 8px',
            fontSize:'30px', fontWeight:900, letterSpacing:'-0.035em', lineHeight:1.08, color:'white',
          }}>
            Bem-vindo de volta,<br />
            <span style={{ color:'#00FF88' }}>{primeiroNome}.</span>
          </h1>
          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
            {metricas.semanaCount > 0 && (
              <span style={{
                display:'inline-block', width:'6px', height:'6px', borderRadius:'50%',
                background:'#00FF88', boxShadow:'0 0 8px #00FF88',
                animation:'dotPulse 2.2s ease-in-out infinite', flexShrink:0,
              }} />
            )}
            <p style={{
              margin:0, fontSize:'14px', fontWeight:500,
              color: metricas.semanaCount > 0 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.28)',
            }}>
              {semanaLabel}
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════
            CARD DE REPUTAÇÃO
        ══════════════════════════════════════ */}
        <div className="a3" style={{ marginBottom:'22px' }}>

          {/* Label */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
            <p style={{
              margin:0, fontSize:'9px', fontWeight:800, letterSpacing:'0.16em',
              color:'rgba(255,255,255,0.22)', textTransform:'uppercase',
            }}>
              Reputação no futebol
            </p>
            {metricas.totalAvaliacoes > 0 && (
              <div style={{
                display:'inline-flex', alignItems:'center', gap:'5px',
                padding:'3px 10px', borderRadius:'100px',
                background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.2)',
              }}>
                <span style={{
                  width:'4px', height:'4px', borderRadius:'50%',
                  background:'#00FF88', boxShadow:'0 0 5px #00FF88',
                  animation:'dotPulse 2s ease-in-out infinite',
                  display:'inline-block',
                }} />
                <span style={{ fontSize:'9px', fontWeight:800, color:'#00FF88', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                  Ativo
                </span>
              </div>
            )}
          </div>

          {/* 2×2 grid */}
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 1fr',
            gap:'1px',
            background:'rgba(255,255,255,0.07)',
            border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:'20px',
            overflow:'hidden',
          }}>
            {[
              {
                value:   animAv,
                label:   'Avaliações',
                sub:     'realizadas',
                accent:  metricas.totalAvaliacoes > 0,
                icon:    '📋',
                isText:  false,
              },
              {
                value:   animAt,
                label:   'Atletas',
                sub:     'descobertos',
                accent:  metricas.totalAtletas > 0,
                icon:    '⚽',
                isText:  false,
              },
              {
                value:   animDest,
                label:   'Destaques',
                sub:     '≥ 75 de nota',
                accent:  metricas.totalDestaques > 0,
                icon:    '⭐',
                isText:  false,
              },
              {
                value:   tempoNaPlat,
                label:   'Na plataforma',
                sub:     '',
                accent:  false,
                icon:    '🏆',
                isText:  true,
              },
            ].map((m, i) => (
              <div key={i} style={{
                background:'#060f09', padding:'20px 18px',
                display:'flex', flexDirection:'column',
                position:'relative', overflow:'hidden',
              }}>
                {/* accent line when value > 0 */}
                {m.accent && (
                  <div style={{
                    position:'absolute', top:0, left:0, right:0, height:'2px',
                    background:'linear-gradient(90deg,transparent,#00FF88,transparent)',
                  }} />
                )}
                <span style={{ fontSize:'16px', marginBottom:'8px', opacity:.65 }}>{m.icon}</span>
                <span style={{
                  fontSize:           m.isText ? '20px' : '36px',
                  fontWeight:         900,
                  color:              m.accent ? '#00FF88' : 'white',
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight:         1,
                  letterSpacing:      '-0.03em',
                  textShadow:         m.accent ? '0 0 24px rgba(0,255,136,0.45)' : 'none',
                  marginBottom:       '6px',
                }}>
                  {m.value}
                </span>
                <span style={{
                  fontSize:'10px', fontWeight:700, letterSpacing:'0.08em',
                  color:'rgba(255,255,255,0.32)', textTransform:'uppercase',
                }}>
                  {m.label}
                </span>
                {m.sub && (
                  <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.16)', marginTop:'2px' }}>
                    {m.sub}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Zero-state message */}
        {metricas.totalAvaliacoes === 0 && (
          <div className="a3" style={{
            display:'flex', alignItems:'center', gap:'12px',
            padding:'14px 18px',
            background:'rgba(0,255,136,0.04)',
            border:'1px solid rgba(0,255,136,0.10)',
            borderRadius:'14px',
            marginBottom:'22px',
          }}>
            <span style={{ fontSize:'20px', flexShrink:0 }}>🎯</span>
            <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.36)', lineHeight:1.65 }}>
              Faça sua primeira avaliação para começar a{' '}
              <span style={{ color:'rgba(0,255,136,0.65)', fontWeight:700 }}>construir reputação no futebol.</span>
            </p>
          </div>
        )}

        {/* ══════════════════════════════════════
            BOTÃO PRINCIPAL — CTA
        ══════════════════════════════════════ */}
        <div className="a4" style={{ marginBottom:'32px' }}>
          <Link href="/treinador/avaliar" className="cta-btn">
            <span style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <span style={{ fontSize:'22px' }}>🔍</span>
              <span>Avaliar novo atleta</span>
            </span>
            <span style={{ fontSize:'22px', opacity:.55 }}>→</span>
          </Link>
        </div>

        {/* ══════════════════════════════════════
            AVALIADOS RECENTEMENTE
        ══════════════════════════════════════ */}
        {recentes.length > 0 && (
          <div className="a5" style={{ marginBottom:'28px' }}>
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              marginBottom:'14px',
            }}>
              <p style={{
                margin:0, fontSize:'9px', fontWeight:800, letterSpacing:'0.16em',
                color:'rgba(255,255,255,0.22)', textTransform:'uppercase',
              }}>
                Avaliados recentemente
              </p>
              <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.16)', fontWeight:600 }}>
                {recentes.length} {recentes.length === 1 ? 'atleta' : 'atletas'}
              </span>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
              {recentes.map((av, idx) => {
                const cor       = notaColor(av.nota_geral)
                const label     = notaLabel(av.nota_geral)
                const dataRel   = formatarDataRelativa(av.created_at)
                const atletaIn  = getInitials(av.atleta_nome)
                const delay     = `${0.48 + idx * 0.06}s`

                return (
                  <div
                    key={av.id}
                    className="card-atleta"
                    style={{ animation:`cardReveal .4s ease forwards ${delay}`, opacity:0 }}
                  >
                    {/* Foto / Iniciais */}
                    <div style={{
                      width:'46px', height:'46px', borderRadius:'50%', flexShrink:0,
                      background: av.atleta_avatar ? 'transparent' : 'linear-gradient(145deg,#166534,#22c55e,#4ade80)',
                      overflow:'hidden',
                      border:`1.5px solid ${cor}40`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {av.atleta_avatar
                        ? <img src={av.atleta_avatar} alt={av.atleta_nome} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ fontSize:'14px', fontWeight:900, color:'white' }}>{atletaIn}</span>
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{
                        margin:'0 0 4px', fontSize:'14px', fontWeight:700, color:'white',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      }}>
                        {av.atleta_nome}
                      </p>
                      <div style={{ display:'flex', alignItems:'center', gap:'7px' }}>
                        {av.atleta_posicao && (
                          <span style={{
                            fontSize:'10px', fontWeight:700,
                            color:'rgba(255,255,255,0.35)',
                            textTransform:'uppercase', letterSpacing:'0.06em',
                          }}>
                            {av.atleta_posicao}
                          </span>
                        )}
                        {av.atleta_posicao && (
                          <span style={{ color:'rgba(255,255,255,0.12)', fontSize:'10px' }}>·</span>
                        )}
                        <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.22)', fontWeight:500 }}>
                          {dataRel}
                        </span>
                      </div>
                    </div>

                    {/* Nota badge */}
                    <div style={{
                      flexShrink:0,
                      width:'50px', height:'50px', borderRadius:'13px',
                      background:`${cor}14`,
                      border:`1px solid ${cor}35`,
                      display:'flex', flexDirection:'column',
                      alignItems:'center', justifyContent:'center', gap:'2px',
                    }}>
                      <span style={{
                        fontSize:'18px', fontWeight:900, color:cor, lineHeight:1,
                        letterSpacing:'-0.03em',
                        textShadow:`0 0 14px ${cor}55`,
                      }}>
                        {av.nota_geral}
                      </span>
                      <span style={{
                        fontSize:'7px', fontWeight:800, letterSpacing:'0.04em',
                        color:`${cor}99`, textTransform:'uppercase',
                      }}>
                        {label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            ACESSO RÁPIDO
        ══════════════════════════════════════ */}
        <div className="a6" style={{ marginBottom:'28px' }}>
          <p style={{
            margin:'0 0 12px', fontSize:'9px', fontWeight:800, letterSpacing:'0.16em',
            color:'rgba(255,255,255,0.22)', textTransform:'uppercase',
          }}>
            Acesso rápido
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
            {[
              {
                icon:  '👤',
                label: 'Meu currículo',
                sub:   'Perfil, bio e credenciais',
                href:  '/treinador/perfil',
                glow:  false,
              },
              {
                icon:  '📊',
                label: 'Nova avaliação',
                sub:   'Avaliar atleta por ID',
                href:  '/treinador/avaliar',
                glow:  true,
              },
            ].map((item, i) => (
              <Link key={i} href={item.href} className="quick-link">
                <div style={{
                  width:'42px', height:'42px', borderRadius:'13px', flexShrink:0,
                  background: item.glow ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.04)',
                  border:     item.glow ? '1px solid rgba(0,255,136,0.22)' : '1px solid rgba(255,255,255,0.08)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'20px',
                }}>
                  {item.icon}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ margin:'0 0 2px', fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.72)' }}>
                    {item.label}
                  </p>
                  <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.24)' }}>
                    {item.sub}
                  </p>
                </div>
                <span style={{ color:'rgba(255,255,255,0.18)', fontSize:'20px', flexShrink:0 }}>›</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="a7" style={{ textAlign:'center', paddingTop:'4px' }}>
          <p style={{ margin:0, fontSize:'10px', color:'rgba(255,255,255,0.1)' }}>
            ⚽ MEU <span style={{ color:'rgba(0,255,136,0.3)' }}>CRAQUE</span> · Construindo o futebol brasileiro.
          </p>
        </div>

      </div>
    </main>
  )
}

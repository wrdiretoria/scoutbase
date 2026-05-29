'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import TreinadorBottomNav from '@/components/TreinadorBottomNav'

// ── Types ─────────────────────────────────────────────────────────────────────

type Perfil = {
  id:            string
  nome:          string
  avatar_url?:   string
  especialidade?: string
  cidade?:       string
  treinadorId?:  string
  created_at?:   string
}

type Metricas = {
  totalAvaliacoes: number
  totalAtletas:    number
  totalDestaques:  number
  semanaCount:     number
}

type AvaliacaoRecente = {
  id:             string
  aluno_id:       string
  nota_geral:     number
  created_at:     string
  atleta_nome:    string
  atleta_posicao: string
  atleta_avatar?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function notaColor(nota: number) {
  if (nota >= 75) return '#00FF88'
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

function formatarDataRelativa(dateStr: string) {
  const dias = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  if (dias < 7)  return `${dias}d atrás`
  return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function useCounter(target: number, duration = 1000): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    const start = Date.now()
    const timer = setInterval(() => {
      const p = Math.min((Date.now() - start) / duration, 1)
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

// ── Trainer Card ──────────────────────────────────────────────────────────────

function TrainerCard({ perfil, av, at, dest, uploadingFoto }: { perfil: Perfil; av: number; at: number; dest: number; uploadingFoto?: boolean }) {
  const initials = getInitials(perfil.nome)
  const firstName = perfil.nome.split(' ')[0]
  const lastName  = perfil.nome.split(' ').slice(1).join(' ')

  return (
    <div style={{ position: 'relative', width: '260px', margin: '0 auto' }}>

      {/* Ambient glow behind card */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '340px', height: '440px',
        background: 'radial-gradient(ellipse, rgba(251,191,36,0.28) 0%, rgba(217,119,6,0.12) 40%, transparent 70%)',
        animation: 'cardGlow 4s ease-in-out infinite',
        pointerEvents: 'none',
        borderRadius: '50%',
      }} />

      {/* Border gradient wrapper */}
      <div style={{
        padding: '1.5px',
        background: 'linear-gradient(160deg, #fbbf24 0%, #92400e 40%, #fbbf24 70%, #78350f 100%)',
        borderRadius: '22px',
        boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(251,191,36,0.18)',
        animation: 'cardFloat 5s ease-in-out infinite',
        position: 'relative',
      }}>
        {/* Card body */}
        <div style={{
          background: 'linear-gradient(165deg, #1a0c00 0%, #2e1800 35%, #1a0c00 70%, #0d0700 100%)',
          borderRadius: '20px',
          overflow: 'hidden',
          position: 'relative',
        }}>

          {/* Shimmer sweep */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(105deg, transparent 35%, rgba(255,210,80,0.07) 50%, transparent 65%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 4s linear infinite',
          }} />

          {/* Inner corner lights */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '120px',
            background: 'radial-gradient(ellipse at 50% -20%, rgba(251,191,36,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Gold top stripe */}
          <div style={{ height: '3px', background: 'linear-gradient(90deg, #78350f, #fbbf24 25%, #f59e0b 75%, #78350f)' }} />

          {/* Header: level badge */}
          <div style={{ padding: '16px 20px 0', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
              borderRadius: '100px', padding: '4px 14px',
            }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 6px #fbbf24', display: 'inline-block', animation: 'dotPulse 2s ease-in-out infinite' }} />
              <span style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.2em', color: '#fbbf24', textTransform: 'uppercase' }}>
                Treinador de Futebol
              </span>
            </div>
          </div>

          {/* Photo — label nativo abre o seletor em qualquer browser/mobile */}
          <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'center' }}>
            <label htmlFor="treinador-foto-input" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '110px', height: '110px', borderRadius: '50%',
              background: perfil.avatar_url ? 'transparent' : 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #fbbf24 100%)',
              border: '3px solid rgba(251,191,36,0.55)',
              boxShadow: '0 0 0 6px rgba(251,191,36,0.06), 0 20px 40px rgba(0,0,0,0.6)',
              overflow: 'hidden',
              position: 'relative',
              cursor: uploadingFoto ? 'wait' : 'pointer',
            }}>
              {perfil.avatar_url
                ? <img src={perfil.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{initials}</div>
                    <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>sem foto</div>
                  </div>
                )
              }
              {/* overlay câmera — só aparece quando não há foto ou durante upload */}
              {(!perfil.avatar_url || uploadingFoto) && (
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  background: uploadingFoto ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '22px' }}>{uploadingFoto ? '⏳' : '📷'}</span>
                </div>
              )}
            </label>
          </div>

          {/* Name */}
          <div style={{ padding: '16px 20px 0', textAlign: 'center' }}>
            <p style={{ margin: '0 0 2px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
              {firstName}
            </p>
            <h2 style={{
              margin: '0 0 6px', fontSize: lastName.length > 10 ? '20px' : '24px',
              fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05,
              color: 'white',
              textShadow: '0 0 30px rgba(251,191,36,0.15)',
            }}>
              {lastName || firstName}
            </h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.32)', letterSpacing: '0.02em' }}>
              {perfil.especialidade
                ? <>
                    <span style={{ color: 'rgba(251,191,36,0.55)', fontWeight: 600 }}>{perfil.especialidade}</span>
                    {perfil.cidade ? <span style={{ color: 'rgba(255,255,255,0.2)' }}> · {perfil.cidade}</span> : null}
                  </>
                : <span style={{ color: 'rgba(255,255,255,0.18)' }}>Especialidade não definida</span>
              }
            </p>
          </div>

          {/* Divider */}
          <div style={{ margin: '18px 20px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.18), transparent)' }} />

          {/* Stats row */}
          <div style={{ padding: '0 16px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { val: av,   label: 'Avaliações' },
              { val: at,   label: 'Atletas'    },
              { val: dest, label: 'Destaques'  },
            ].map((s, i) => (
              <div key={i} style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(251,191,36,0.09)',
                borderRadius: '12px',
                padding: '10px 6px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {s.val > 0 && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)',
                  }} />
                )}
                <div style={{
                  fontSize: '26px', fontWeight: 900, lineHeight: 1,
                  letterSpacing: '-0.04em',
                  color: s.val > 0 ? '#fbbf24' : 'rgba(255,255,255,0.15)',
                  textShadow: s.val > 0 ? '0 0 20px rgba(251,191,36,0.6)' : 'none',
                }}>
                  {s.val}
                </div>
                <div style={{
                  fontSize: '7.5px', fontWeight: 800, letterSpacing: '0.08em',
                  color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', marginTop: '5px',
                }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom watermark + ID */}
          <div style={{
            padding: '10px 20px',
            borderTop: '1px solid rgba(251,191,36,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            {perfil.treinadorId && (
              <span style={{ fontSize: '11px', fontWeight: 900, color: 'rgba(251,191,36,0.7)', letterSpacing: '0.12em' }}>
                ID: {perfil.treinadorId.replace('TR-', '')}
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TreinadorDashboardPage() {
  const router = useRouter()

  const [perfil,        setPerfil]        = useState<Perfil | null>(null)
  const [metricas,      setMetricas]      = useState<Metricas>({ totalAvaliacoes: 0, totalAtletas: 0, totalDestaques: 0, semanaCount: 0 })
  const [recentes,      setRecentes]      = useState<AvaliacaoRecente[]>([])
  const [loading,       setLoading]       = useState(true)
  const [solicitacoes,  setSolicitacoes]  = useState<{ atletaId: string; atletaNome: string; atletaMcId: string; ts: string }[]>([])
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFoto(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/atleta/upload-foto', { method: 'POST', body: fd })
      const json = await res.json() as { ok?: boolean; url?: string; error?: string }
      if (!res.ok || !json.url) { alert(json.error ?? 'Erro ao enviar foto.'); return }
      setPerfil(prev => prev ? { ...prev, avatar_url: json.url } : prev)
    } finally {
      setUploadingFoto(false)
      if (fotoInputRef.current) fotoInputRef.current.value = ''
    }
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      const p = profile as Record<string, unknown> | null

      setPerfil({
        id:            user.id,
        nome:          (p?.nome as string) ?? user.user_metadata?.nome ?? 'Treinador',
        avatar_url:    p?.avatar_url as string | undefined,
        especialidade: (p?.especialidade as string | undefined) ?? user.user_metadata?.especialidade,
        cidade:        p?.cidade as string | undefined,
        treinadorId:   p?.athlete_id as string | undefined,
        created_at:    user.created_at,
      })

      try {
        const semanaPast = new Date(Date.now() - 7 * 86_400_000).toISOString()

        const [
          { count: totAv },
          { data: profileIdRows },
          { count: totDest },
          { count: semana },
        ] = await Promise.all([
          supabase.from('avaliacoes').select('*', { count: 'exact', head: true }).eq('professor_id', user.id),
          supabase.from('avaliacoes').select('aluno_id').eq('professor_id', user.id),
          supabase.from('avaliacoes').select('*', { count: 'exact', head: true }).eq('professor_id', user.id).gte('scout_score', 75),
          supabase.from('avaliacoes').select('*', { count: 'exact', head: true }).eq('professor_id', user.id).gte('created_at', semanaPast),
        ])

        const uniqueAtletas = new Set((profileIdRows ?? []).map(r => r.aluno_id)).size
        setMetricas({ totalAvaliacoes: totAv ?? 0, totalAtletas: uniqueAtletas, totalDestaques: totDest ?? 0, semanaCount: semana ?? 0 })

        const { data: avRecentes } = await supabase
          .from('avaliacoes').select('id, scout_score, created_at, aluno_id')
          .eq('professor_id', user.id).order('created_at', { ascending: false }).limit(5)

        if (avRecentes?.length) {
          // aluno_id = auth UUID (Meu Craque) — busca via API admin
          const ids = avRecentes.map(a => a.aluno_id)
          const res = await fetch('/api/atleta/nomes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids }),
          })
          const nomes: { id: string; nome: string; posicao: string; avatar_url: string | null }[] =
            res.ok ? await res.json() : []
          const nomeMap = new Map(nomes.map(n => [n.id, n]))

          setRecentes(avRecentes.map(av => {
            const at = nomeMap.get(av.aluno_id)
            return {
              id:             av.id,
              aluno_id:       av.aluno_id,
              nota_geral:     av.scout_score,
              created_at:     av.created_at,
              atleta_nome:    at?.nome      ?? 'Atleta',
              atleta_posicao: at?.posicao   ?? '',
              atleta_avatar:  at?.avatar_url ?? undefined,
            }
          }))
        }
      } catch { /* avaliacoes table may not exist yet */ }

      // ── Solicitações pendentes ──
      try {
        const solRes = await fetch('/api/convite/listar')
        if (solRes.ok) {
          const solJson = await solRes.json() as { solicitacoes: { atletaId: string; atletaNome: string; atletaMcId: string; ts: string }[] }
          setSolicitacoes(solJson.solicitacoes ?? [])
        }
      } catch { /* ignorar */ }

      setLoading(false)
    }
    load()
  }, [router])

  const animAv   = useCounter(metricas.totalAvaliacoes, 1200)
  const animAt   = useCounter(metricas.totalAtletas,    1200)
  const animDest = useCounter(metricas.totalDestaques,  1200)

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ background: '#080400', minHeight: '100dvh', fontFamily: 'system-ui, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`.skel{background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);background-size:200% 100%;animation:skelShimmer 1.4s infinite}@keyframes skelShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
        <div style={{ width: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="skel" style={{ width: '260px', height: '420px', borderRadius: '22px' }} />
          <div className="skel" style={{ width: '100%', height: '64px', borderRadius: '18px' }} />
        </div>
      </main>
    )
  }
  if (!perfil) return null

  const primeiroNome  = perfil.nome.split(' ')[0]
  const profileComplete = !!(perfil.avatar_url && perfil.especialidade)

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <main style={{
      background: '#080400',
      minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 0 calc(80px + env(safe-area-inset-bottom))',
      fontFamily: 'system-ui, sans-serif',
    }}>

      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes cardGlow  { 0%,100%{opacity:.7} 50%{opacity:1} }
        @keyframes shimmer   { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes dotPulse  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.65)} }
        @keyframes ctaPulse  {
          0%,100%{box-shadow:0 0 40px rgba(251,191,36,0.25),0 8px 32px rgba(0,0,0,0.6)}
          50%    {box-shadow:0 0 70px rgba(251,191,36,0.45),0 8px 32px rgba(0,0,0,0.6)}
        }
        @keyframes cardReveal { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

        .a1  { animation:fadeUp .5s ease forwards 0s;    opacity:0 }
        .a2  { animation:fadeUp .5s ease forwards .1s;   opacity:0 }
        .a3  { animation:fadeUp .5s ease forwards .25s;  opacity:0 }
        .a4  { animation:fadeUp .5s ease forwards .42s;  opacity:0 }
        .a5  { animation:fadeUp .5s ease forwards .60s;  opacity:0 }
        .a6  { animation:fadeUp .5s ease forwards .78s;  opacity:0 }

        .skel{background:linear-gradient(90deg,rgba(255,255,255,0.04) 25%,rgba(255,255,255,0.08) 50%,rgba(255,255,255,0.04) 75%);background-size:200% 100%;animation:skelShimmer 1.4s infinite}
        @keyframes skelShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

        .cta-avaliar {
          display:flex; align-items:center; justify-content:space-between; gap:12px;
          width:100%; padding:20px 24px; border-radius:18px; border:none;
          background:linear-gradient(135deg, #d97706 0%, #fbbf24 50%, #d97706 100%);
          color:#1a0800; font-weight:900; font-size:17px; cursor:pointer;
          font-family:system-ui,sans-serif; text-decoration:none;
          animation:ctaPulse 3s ease-in-out infinite;
          transition:transform .1s, opacity .15s;
          min-height:64px;
        }
        .cta-avaliar:active { transform:scale(0.97); opacity:.88; transition:transform .08s; }

        .av-card {
          display:flex; align-items:center; gap:14px;
          padding:14px 15px; background:rgba(255,255,255,0.025);
          border:1px solid rgba(255,255,255,0.07); border-radius:16px;
          transition:background .2s, border-color .2s; min-height:72px;
        }
        .av-card:hover  { background:rgba(255,255,255,0.045); border-color:rgba(251,191,36,0.18); }
        .av-card:active { transform:scale(.99); opacity:.88; transition:transform .08s; }

        .quick-btn {
          display:flex; align-items:center; gap:14px;
          padding:15px 16px; background:rgba(255,255,255,0.025);
          border:1px solid rgba(255,255,255,0.07); border-radius:16px;
          text-decoration:none;
          transition:background .2s, border-color .2s; min-height:56px;
        }
        .quick-btn:hover  { background:rgba(255,255,255,0.05); border-color:rgba(251,191,36,0.2); }
        .quick-btn:active { transform:scale(.98); opacity:.88; transition:transform .08s; }
      `}</style>

      {/* ── Atmospheric background ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
          width: '900px', height: '800px', borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.07) 0%, rgba(217,119,6,0.04) 40%, transparent 65%)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage:
            'linear-gradient(rgba(251,191,36,0.015) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(251,191,36,0.015) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px', padding: '0 20px' }}>

        {/* ── Top nav ── */}
        <div className="a1" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 'calc(26px + env(safe-area-inset-top))', paddingBottom: '20px',
        }}>
          <span style={{ fontSize: '15px', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
            ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
          </span>
          <Link href="/treinador/perfil" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden',
            border: '2px solid rgba(251,191,36,0.4)', textDecoration: 'none', flexShrink: 0,
            background: perfil.avatar_url ? 'transparent' : 'linear-gradient(135deg,#92400e,#d97706)',
            boxShadow: '0 0 14px rgba(251,191,36,0.2)',
          }}>
            {perfil.avatar_url
              ? <img src={perfil.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: '12px', fontWeight: 900, color: 'white' }}>{getInitials(perfil.nome)}</span>
            }
          </Link>
        </div>

        {/* ── Welcome ── */}
        <div className="a2" style={{ textAlign: 'center', marginBottom: '28px' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
            {metricas.semanaCount > 0
              ? `🔥 ${metricas.semanaCount} avaliação${metricas.semanaCount > 1 ? 'ões' : ''} essa semana`
              : 'Bem-vindo de volta'}
          </p>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, letterSpacing: '-0.035em', color: 'white', lineHeight: 1.1 }}>
            {primeiroNome},<br />
            <span style={{ color: '#fbbf24' }}>este é seu cartão.</span>
          </h1>
        </div>

        {/* ── THE CARD ── */}
        <div className="a3" style={{ marginBottom: '32px' }}>
          {/* Input oculto para foto — label no TrainerCard aponta para este id */}
          <input
            id="treinador-foto-input"
            ref={fotoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploadingFoto}
            style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
            onChange={handleFotoChange}
          />
          <TrainerCard perfil={perfil} av={animAv} at={animAt} dest={animDest} uploadingFoto={uploadingFoto} />
        </div>

        {/* ── Compartilhar card ── */}
        <div className="a4" style={{ marginBottom: '14px' }}>
          <Link href="/treinador/compartilhar" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '13px', borderRadius: '16px', textDecoration: 'none',
            background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
            fontSize: '14px', fontWeight: 800, color: '#fbbf24',
            transition: 'background .2s',
          }}>
            <span>📲</span>
            <span>Compartilhar meu card</span>
          </Link>
        </div>

        {/* ── Complete profile nudge ── */}
        {!profileComplete && (
          <div className="a4" style={{ marginBottom: '20px' }}>
            <Link href="/treinador/configurar" style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 18px',
              background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)',
              borderRadius: '16px', textDecoration: 'none',
              transition: 'background .2s',
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>✦</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 700, color: 'rgba(251,191,36,0.8)' }}>Complete seu perfil</p>
                <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>Adicione foto, especialidade e bio para ser encontrado por escolas</p>
              </div>
              <span style={{ color: 'rgba(251,191,36,0.35)', fontSize: '18px', flexShrink: 0 }}>›</span>
            </Link>
          </div>
        )}

        {/* ── CTA: avaliar atleta ── */}
        <div className="a4" style={{ marginBottom: '32px' }}>
          <Link href="/treinador/avaliar" className="cta-avaliar">
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>🔍</span>
              <span>Avaliar novo atleta</span>
            </span>
            <span style={{ fontSize: '22px', opacity: .45 }}>→</span>
          </Link>
        </div>

        {/* ── Solicitações pendentes ── */}
        {solicitacoes.length > 0 && (
          <div className="a4" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
                Solicitações de avaliação
              </p>
              <div style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
                background: 'rgba(251,191,36,0.15)', color: '#fbbf24',
                border: '1px solid rgba(251,191,36,0.25)',
              }}>
                {solicitacoes.length} pendente{solicitacoes.length !== 1 ? 's' : ''}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {solicitacoes.map((sol) => {
                const dias = Math.floor((Date.now() - new Date(sol.ts).getTime()) / 86_400_000)
                const quando = dias === 0 ? 'Hoje' : dias === 1 ? 'Ontem' : `${dias}d atrás`
                const initials = sol.atletaNome.split(' ').slice(0,2).map((n: string) => n[0] ?? '').join('').toUpperCase()
                return (
                  <Link
                    key={sol.atletaId}
                    href={`/treinador/avaliar?id=${sol.atletaMcId}`}
                    className="av-card"
                    style={{ textDecoration: 'none', color: 'white', borderColor: 'rgba(251,191,36,0.2)' }}
                  >
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(145deg,#166534,#22c55e)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '14px', fontWeight: 900, color: 'white',
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 3px', fontSize: '14px', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {sol.atletaNome}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(251,191,36,0.7)', letterSpacing: '0.06em' }}>
                          {sol.atletaMcId}
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '10px' }}>·</span>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>{quando}</span>
                      </div>
                    </div>
                    <div style={{
                      flexShrink: 0, padding: '7px 12px', borderRadius: '10px',
                      background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
                      fontSize: '12px', fontWeight: 800, color: '#fbbf24',
                    }}>
                      Avaliar →
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Zero state ── */}
        {metricas.totalAvaliacoes === 0 && (
          <div className="a5" style={{
            padding: '16px 20px', background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', marginBottom: '28px',
            display: 'flex', gap: '14px', alignItems: 'center',
          }}>
            <span style={{ fontSize: '24px', flexShrink: 0 }}>🎯</span>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.28)', lineHeight: 1.7 }}>
              Faça sua primeira avaliação e comece a{' '}
              <span style={{ color: 'rgba(251,191,36,0.6)', fontWeight: 700 }}>construir sua reputação no futebol.</span>
              {' '}Cada nota conta.
            </p>
          </div>
        )}

        {/* ── Recentes ── */}
        {recentes.length > 0 && (
          <div className="a5" style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <p style={{ margin: 0, fontSize: '9px', fontWeight: 800, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>
                Avaliados recentemente
              </p>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.14)', fontWeight: 600 }}>
                {recentes.length} atleta{recentes.length > 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {recentes.map((av, idx) => {
                const cor      = notaColor(av.nota_geral)
                const label    = notaLabel(av.nota_geral)
                const dataRel  = formatarDataRelativa(av.created_at)
                const atInit   = getInitials(av.atleta_nome)
                return (
                  <Link key={av.id} href={`/jogador/${av.aluno_id}`} className="av-card"
                    style={{ animation: `cardReveal .4s ease forwards ${0.6 + idx * 0.06}s`, opacity: 0, textDecoration: 'none', color: 'white' }}>
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                      background: av.atleta_avatar ? 'transparent' : 'linear-gradient(145deg,#166534,#22c55e)',
                      overflow: 'hidden', border: `1.5px solid ${cor}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {av.atleta_avatar
                        ? <img src={av.atleta_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '14px', fontWeight: 900, color: 'white' }}>{atInit}</span>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {av.atleta_nome}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {av.atleta_posicao && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                            {av.atleta_posicao}
                          </span>
                        )}
                        {av.atleta_posicao && <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: '10px' }}>·</span>}
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>{dataRel}</span>
                      </div>
                    </div>
                    <div style={{
                      flexShrink: 0, width: '50px', height: '50px', borderRadius: '13px',
                      background: `${cor}14`, border: `1px solid ${cor}35`,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                    }}>
                      <span style={{ fontSize: '18px', fontWeight: 900, color: cor, lineHeight: 1, letterSpacing: '-0.03em', textShadow: `0 0 14px ${cor}55` }}>
                        {av.nota_geral}
                      </span>
                      <span style={{ fontSize: '7px', fontWeight: 800, color: `${cor}99`, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {label}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Quick actions ── */}
        <div className="a6" style={{ marginBottom: '28px' }}>
          <p style={{ margin: '0 0 12px', fontSize: '9px', fontWeight: 800, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>
            Acesso rápido
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { icon: '👤', label: 'Meu currículo', sub: 'Perfil, bio e credenciais', href: '/treinador/perfil' },
              { icon: '📊', label: 'Nova avaliação', sub: 'Avaliar atleta pelo ID',   href: '/treinador/avaliar' },
            ].map((item, i) => (
              <Link key={i} href={item.href} className="quick-btn">
                <div style={{
                  width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                  background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{item.label}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.22)' }}>{item.sub}</p>
                </div>
                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '20px', flexShrink: 0 }}>›</span>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ textAlign: 'center', paddingTop: '4px' }}>
          <p style={{ margin: 0, fontSize: '9px', color: 'rgba(255,255,255,0.06)', letterSpacing: '0.1em' }}>
            ⚽ MEUCRAQUE.com · CONSTRUINDO O FUTEBOL BRASILEIRO
          </p>
        </div>

      </div>

      <TreinadorBottomNav />
    </main>
  )
}
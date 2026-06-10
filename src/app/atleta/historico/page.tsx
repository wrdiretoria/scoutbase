'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import AtletaBottomNav from '@/components/AtletaBottomNav'

// ── Types ─────────────────────────────────────────────────────────────────────

type DadosPerfil = {
  nome:      string
  posicao:   string
  cidade:    string
  athleteId: string
  avatarUrl: string
  temFoto:   boolean
  temBio:    boolean
  temFisico: boolean
  temClube:  boolean
  criadoEm:  string
}

type AvaliacaoCompleta = {
  id:                  string
  velocidade:          number
  visao_jogo:          number
  forca:               number
  finalizacao:         number
  posicionamento:      number
  tecnica:             number
  nota_geral:          number
  observacao:          string | null
  created_at:          string
  professor_id:        string
  treinador_nome:      string
}

type Plataforma = 'youtube' | 'tiktok' | 'instagram' | 'vimeo'

type Highlight = {
  id:            string
  url:           string
  plataforma:    Plataforma
  titulo:        string | null
  thumbnail_url: string | null
  video_id:      string
  created_at:    string
}

type EventoCriacao = {
  tipo:    'criacao'
  date:    string
}
type EventoAvaliacao = {
  tipo:        'avaliacao'
  date:        string
  av:          AvaliacaoCompleta
  ovrAvAntes:  number
  ovrAvDepois: number
  isFirst:     boolean
}
type EventoHighlight = {
  tipo: 'highlight'
  date: string
  hl:   Highlight
}
type Evento = EventoCriacao | EventoAvaliacao | EventoHighlight

function getPlatformInfo(p: Plataforma): { label: string; bg: string } {
  return {
    youtube:   { label: 'YouTube',   bg: '#FF0000' },
    tiktok:    { label: 'TikTok',    bg: '#010101' },
    instagram: { label: 'Instagram', bg: '#E1306C' },
    vimeo:     { label: 'Vimeo',     bg: '#1AB7EA' },
  }[p]
}

function getThumbnail(hl: Highlight): string {
  if (hl.thumbnail_url) return hl.thumbnail_url
  if (hl.plataforma === 'youtube') return `https://img.youtube.com/vi/${hl.video_id}/hqdefault.jpg`
  return ''
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function calcularOVRPerfil(t: {
  temFoto: boolean; temBio: boolean; temFisico: boolean; temClube: boolean
}): number {
  let s = 0.50
  if (t.temFoto)   s += 0.15
  if (t.temBio)    s += 0.15
  if (t.temFisico) s += 0.10
  if (t.temClube)  s += 0.10
  return Math.round(Math.min(s, 1.0) * 50)
}

function notaColor(n: number): string {
  if (n >= 80) return '#00FF88'
  if (n >= 65) return '#22c55e'
  if (n >= 50) return '#eab308'
  return '#f97316'
}

function notaLabel(n: number): string {
  if (n >= 80) return 'Excepcional'
  if (n >= 65) return 'Muito Bom'
  if (n >= 50) return 'Bom'
  return 'Regular'
}

function formatarData(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

// Animated counter
function useCounter(target: number, delay = 0, duration = 900): number {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const t = setTimeout(() => {
      const start = Date.now()
      const frame = setInterval(() => {
        const p = Math.min((Date.now() - start) / duration, 1)
        setV(Math.round((1 - Math.pow(1 - p, 3)) * target))
        if (p >= 1) clearInterval(frame)
      }, 16)
      return () => clearInterval(frame)
    }, delay)
    return () => clearTimeout(t)
  }, [target, delay, duration])
  return v
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AtletaHistoricoPage() {
  const router = useRouter()

  const [dados,      setDados]      = useState<DadosPerfil | null>(null)
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoCompleta[]>([])
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const m = user.user_metadata as Record<string, string>
      if (m?.tipo !== 'atleta') { router.push('/login'); return }

      // ── Perfil ──
      const { data: profile } = await supabase
        .from('profiles')
        .select('bio, altura, peso, pe_dominante, clube_atual, athlete_id, avatar_url')
        .eq('id', user.id)
        .single()

      const p = profile as Record<string, unknown> | null
      const temFoto   = !!(p?.avatar_url)
      const temBio    = !!((p?.bio as string)?.trim())
      const temFisico = !!(p?.altura && p?.peso)
      const temClube  = !!((p?.clube_atual as string)?.trim())

      setDados({
        nome:      m.nome     ?? 'Atleta',
        posicao:   m.posicao  ?? '',
        cidade:    m.cidade   ?? '',
        athleteId: (p?.athlete_id as string) ?? '',
        avatarUrl: (p?.avatar_url as string) ?? '',
        temFoto, temBio, temFisico, temClube,
        criadoEm:  user.created_at,
      })

      // ── Avaliações (todas, ordem cronológica) ──
      try {
        const { data: avs } = await supabase
          .from('avaliacoes')
          .select('*')
          .eq('aluno_id', user.id)
          .order('created_at', { ascending: true })

        if (avs && avs.length > 0) {
          const trIds = [...new Set(avs.map(a => a.professor_id))]
          const { data: treinadores } = await supabase
            .from('profiles')
            .select('id, nome')
            .in('id', trIds)

          const trMap = new Map((treinadores ?? []).map(t => [t.id, t.nome as string]))
          setAvaliacoes(avs.map(av => ({
            ...(av as AvaliacaoCompleta),
            treinador_nome: trMap.get(av.professor_id) ?? 'Treinador',
          })))
        }
      } catch { /* tabela ainda não criada */ }

      // ── Highlights ──
      try {
        const res = await fetch('/api/atleta/highlights')
        if (res.ok) {
          const json = await res.json() as { highlights: Highlight[] }
          // API retorna em DESC, vamos deixar em ASC para misturar na timeline
          setHighlights((json.highlights ?? []).reverse())
        }
      } catch { /* tabela highlights não criada ainda */ }

      setLoading(false)
    }
    load()
  }, [router])

  // ── Derived values ────────────────────────────────────────────────────────
  const ovrPerfil    = dados ? calcularOVRPerfil(dados) : 0
  const ovrAvaliacao = avaliacoes.length > 0
    ? Math.round((avaliacoes[avaliacoes.length - 1].nota_geral / 100) * 50)
    : 0
  const ovrTotal     = ovrPerfil + ovrAvaliacao

  const animOvr = useCounter(ovrTotal, 400, 1000)

  // ── Loading — skeleton ───────────────────────────────────────────────────
  if (loading) {
    return (
      <main style={{ background:'#06100a', minHeight:'100dvh', fontFamily:'system-ui, sans-serif' }}>
        {/* Nav */}
        <nav style={{ padding:'16px 20px', paddingTop:'calc(16px + env(safe-area-inset-top))', display:'flex', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="skel" style={{ width:52, height:14, borderRadius:6, marginRight:'auto' }} />
          <div className="skel" style={{ width:72, height:16, borderRadius:6, margin:'0 auto', position:'absolute', left:'50%', transform:'translateX(-50%)' }} />
          <div style={{ width:60 }} />
        </nav>
        <div style={{ maxWidth:'480px', margin:'0 auto', padding:'32px 20px 88px' }}>
          {/* Hero OVR */}
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <div className="skel" style={{ width:60, height:60, borderRadius:'50%', margin:'0 auto 14px' }} />
            <div className="skel" style={{ width:120, height:14, borderRadius:6, margin:'0 auto 8px' }} />
            <div className="skel" style={{ width:180, height:26, borderRadius:8, margin:'0 auto 24px' }} />
            <div className="skel" style={{ width:200, height:108, borderRadius:22, margin:'0 auto', display:'inline-block' }} />
          </div>
          {/* Divider */}
          <div className="skel" style={{ height:1, marginBottom:32 }} />
          {/* Timeline event 1 */}
          <div style={{ display:'flex', gap:20, marginBottom:28 }}>
            <div className="skel" style={{ width:10, height:10, borderRadius:'50%', marginTop:6, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div className="skel" style={{ width:'40%', height:12, borderRadius:6, marginBottom:8 }} />
              <div className="skel" style={{ height:90, borderRadius:16 }} />
            </div>
          </div>
          {/* Timeline event 2 */}
          <div style={{ display:'flex', gap:20, marginBottom:28 }}>
            <div className="skel" style={{ width:16, height:16, borderRadius:'50%', marginTop:4, flexShrink:0 }} />
            <div style={{ flex:1 }}>
              <div className="skel" style={{ width:'35%', height:12, borderRadius:6, marginBottom:8 }} />
              <div className="skel" style={{ height:220, borderRadius:18 }} />
            </div>
          </div>
        </div>
      </main>
    )
  }
  if (!dados) return null

  const initials = getInitials(dados.nome)

  // ── Build timeline events ─────────────────────────────────────────────────
  const eventos: Evento[] = [{ tipo: 'criacao', date: dados.criadoEm }]

  avaliacoes.forEach((av, idx) => {
    eventos.push({
      tipo:        'avaliacao',
      date:        av.created_at,
      av,
      ovrAvAntes:  idx === 0 ? 0 : Math.round((avaliacoes[idx - 1].nota_geral / 100) * 50),
      ovrAvDepois: Math.round((av.nota_geral / 100) * 50),
      isFirst:     idx === 0,
    })
  })

  highlights.forEach(hl => {
    eventos.push({ tipo: 'highlight', date: hl.created_at, hl })
  })

  // Ordena cronológico (exceto o criacao que fica no início garantido)
  eventos.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Profile milestones (unlocked achievements on the profile card)
  const milestones = [
    dados.temFoto   && { icon: '📸', label: 'Foto adicionada' },
    dados.temBio    && { icon: '📝', label: 'Apresentação escrita' },
    dados.temFisico && { icon: '💪', label: 'Dados físicos registrados' },
    dados.temClube  && { icon: '⚽', label: 'Clube registrado' },
  ].filter(Boolean) as { icon: string; label: string }[]

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main style={{ background:'#06100a', minHeight:'100dvh', fontFamily:'system-ui, sans-serif', color:'white', overscrollBehaviorY:'none' }}>

      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(14px) }
          to   { opacity:1; transform:translateY(0) }
        }
        @keyframes lineGrow {
          from { transform:scaleY(0) }
          to   { transform:scaleY(1) }
        }
        @keyframes glowDot {
          0%,100% { box-shadow: 0 0 0 0 rgba(0,255,136,0.5) }
          50%     { box-shadow: 0 0 0 8px rgba(0,255,136,0) }
        }
        @keyframes nowBlink {
          0%,100% { opacity:1; transform:scale(1) }
          50%     { opacity:.35; transform:scale(.7) }
        }
        @keyframes heroReveal {
          from { opacity:0; transform:scale(.92) }
          to   { opacity:1; transform:scale(1) }
        }
        @keyframes ovrIn {
          from { opacity:0; transform:translateY(8px) scale(.95) }
          to   { opacity:1; transform:translateY(0) scale(1) }
        }
        @keyframes progressFill {
          from { width:0 }
          to   { width:100% }
        }

        .ev0  { animation: fadeUp .45s ease forwards 0s;    opacity:0 }
        .ev1  { animation: fadeUp .45s ease forwards .1s;   opacity:0 }
        .ev2  { animation: fadeUp .45s ease forwards .22s;  opacity:0 }
        .ev3  { animation: fadeUp .45s ease forwards .36s;  opacity:0 }
        .ev4  { animation: fadeUp .45s ease forwards .52s;  opacity:0 }
        .ev5  { animation: fadeUp .45s ease forwards .68s;  opacity:0 }
        .ev6  { animation: fadeUp .45s ease forwards .84s;  opacity:0 }
        .evN  { animation: fadeUp .45s ease forwards .96s;  opacity:0 }

        .attr-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 9px 12px;
          border-radius: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
        }
        /* ── Back link press ── */
        a[href="/atleta/perfil"]:active { opacity:.7; transition:opacity .1s; }

        .bar-track {
          height: 3px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          overflow: hidden;
          flex: 1;
          margin: 0 8px;
        }
        .bar-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 1.2s cubic-bezier(.22,1,.36,1);
        }
      `}</style>

      {/* ── Atmosfera: glow top ── */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <div style={{
          position:'absolute', top:'-15%', left:'50%', transform:'translateX(-50%)',
          width:'700px', height:'600px', borderRadius:'50%',
          background:'radial-gradient(ellipse,rgba(0,255,136,0.07) 0%,transparent 60%)',
        }} />
      </div>

      {/* ── Nav ── */}
      <nav style={{
        position:'relative', zIndex:1,
        padding:'16px 20px',
        paddingTop:'calc(16px + env(safe-area-inset-top))',
        display:'flex', alignItems:'center',
        borderBottom:'1px solid rgba(255,255,255,0.06)',
      }}>
        <Link href="/atleta/perfil" style={{
          fontSize:'13px', fontWeight:700,
          color:'rgba(255,255,255,0.35)', textDecoration:'none',
          display:'flex', alignItems:'center', gap:'6px',
          width:'60px',
        }}>
          ← Perfil
        </Link>
        <span style={{
          flex:1, textAlign:'center',
          fontSize:'14px', fontWeight:800, color:'white', letterSpacing:'-0.01em',
        }}>
          Trajetória
        </span>
        <div style={{ width:'60px' }} />
      </nav>

      <div style={{ position:'relative', zIndex:1, maxWidth:'480px', margin:'0 auto', padding:'32px 20px', paddingBottom:'calc(88px + env(safe-area-inset-bottom))' }}>

        {/* ══════════════════════════════════════
            HERO — OVR + Identidade
        ══════════════════════════════════════ */}
        <div style={{
          textAlign:'center', marginBottom:'44px',
          animation:'heroReveal .5s ease forwards',
        }}>
          {/* Avatar */}
          <div style={{
            width:'60px', height:'60px', borderRadius:'50%',
            margin:'0 auto 14px',
            background: dados.avatarUrl ? 'transparent' : 'linear-gradient(135deg,#15803d,#4ade80)',
            overflow:'hidden',
            border:'2px solid rgba(0,255,136,0.35)',
            boxShadow:'0 0 28px rgba(0,255,136,0.22)',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            {dados.avatarUrl
              ? <img src={dados.avatarUrl} alt={dados.nome} style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 15%' }} />
              : <span style={{ fontSize:'20px', fontWeight:900 }}>{initials}</span>
            }
          </div>

          <p style={{ margin:'0 0 2px', fontSize:'12px', fontWeight:700, letterSpacing:'0.1em', color:'rgba(255,255,255,0.35)', textTransform:'uppercase' }}>
            Trajetória de
          </p>
          <h1 style={{ margin:'0 0 24px', fontSize:'24px', fontWeight:900, letterSpacing:'-0.025em', color:'white' }}>
            {dados.nome}
          </h1>

          {/* OVR atual */}
          <div style={{
            display:'inline-flex', flexDirection:'column', alignItems:'center',
            padding:'22px 44px 18px',
            background:'rgba(0,255,136,0.06)',
            border:'1px solid rgba(0,255,136,0.2)',
            borderRadius:'22px',
            animation:'ovrIn .55s ease forwards .35s', opacity:0,
          }}>
            <span style={{
              fontSize:'64px', fontWeight:900, lineHeight:1,
              letterSpacing:'-0.05em', color:'#00FF88',
              textShadow:'0 0 48px rgba(0,255,136,0.55)',
              fontVariantNumeric:'tabular-nums',
            }}>
              {animOvr}
            </span>
            <span style={{ fontSize:'9px', fontWeight:800, letterSpacing:'0.18em', color:'rgba(0,255,136,0.5)', textTransform:'uppercase', marginTop:'6px' }}>
              OVR atual
            </span>

            {/* Breakdown */}
            {ovrTotal > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginTop:'14px' }}>
                <div style={{ textAlign:'center' }}>
                  <span style={{ display:'block', fontSize:'13px', fontWeight:800, color:'rgba(255,255,255,0.5)', fontVariantNumeric:'tabular-nums' }}>
                    {ovrPerfil}
                  </span>
                  <span style={{ fontSize:'8px', color:'rgba(255,255,255,0.22)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700 }}>Perfil</span>
                </div>
                <span style={{ color:'rgba(255,255,255,0.2)', fontSize:'14px' }}>+</span>
                <div style={{ textAlign:'center' }}>
                  <span style={{ display:'block', fontSize:'13px', fontWeight:800, color: ovrAvaliacao > 0 ? '#00FF88' : 'rgba(255,255,255,0.2)', fontVariantNumeric:'tabular-nums' }}>
                    {ovrAvaliacao}
                  </span>
                  <span style={{ fontSize:'8px', color: ovrAvaliacao > 0 ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.15)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700 }}>
                    Avaliação
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Divisor timeline ── */}
        <div style={{
          display:'flex', alignItems:'center', gap:'10px', marginBottom:'32px',
          animation:'fadeUp .4s ease forwards .55s', opacity:0,
        }}>
          <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }} />
          <span style={{ fontSize:'9px', fontWeight:800, letterSpacing:'0.18em', color:'rgba(255,255,255,0.2)', textTransform:'uppercase' }}>
            Linha do tempo oficial
          </span>
          <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }} />
        </div>

        {/* ══════════════════════════════════════
            TIMELINE
        ══════════════════════════════════════ */}
        <div style={{ position:'relative' }}>

          {/* Linha vertical */}
          <div style={{
            position:'absolute', left:'14px', top:'10px', bottom:'10px',
            width:'1.5px',
            background:'linear-gradient(to bottom,rgba(0,255,136,0.45),rgba(0,255,136,0.08) 75%,transparent)',
            transformOrigin:'top',
            animation:'lineGrow 1s ease forwards .6s',
            transform:'scaleY(0)',
          }} />

          <div style={{ display:'flex', flexDirection:'column' }}>

            {eventos.map((ev, idx) => {
              const evClass = `ev${Math.min(idx + 1, 6)}`

              /* ── CRIAÇÃO ── */
              if (ev.tipo === 'criacao') {
                return (
                  <div key="criacao" className={evClass} style={{ display:'flex', gap:'20px', paddingBottom:'28px' }}>

                    {/* Dot */}
                    <div style={{ flexShrink:0, width:'28px', display:'flex', justifyContent:'center' }}>
                      <div style={{
                        width:'10px', height:'10px', borderRadius:'50%', marginTop:'6px',
                        background:'rgba(0,255,136,0.45)',
                        border:'1.5px solid rgba(0,255,136,0.25)',
                        boxShadow:'0 0 8px rgba(0,255,136,0.2)',
                      }} />
                    </div>

                    {/* Card */}
                    <div style={{ flex:1 }}>
                      <p style={{ margin:'0 0 6px', fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.28)', letterSpacing:'0.03em' }}>
                        {formatarData(ev.date)}
                      </p>
                      <div style={{
                        background:'rgba(255,255,255,0.025)',
                        border:'1px solid rgba(255,255,255,0.08)',
                        borderRadius:'16px', padding:'16px',
                      }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom: milestones.length > 0 ? '14px' : 0 }}>
                          <div style={{
                            width:'36px', height:'36px', borderRadius:'10px', flexShrink:0,
                            background:'rgba(0,255,136,0.08)',
                            border:'1px solid rgba(0,255,136,0.15)',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'18px',
                          }}>
                            ⚽
                          </div>
                          <div>
                            <p style={{ margin:'0 0 2px', fontSize:'14px', fontWeight:800, color:'white' }}>Perfil criado</p>
                            <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.3)' }}>
                              {[dados.posicao, dados.cidade].filter(Boolean).join(' · ') || 'MeuCraque'}
                            </p>
                          </div>
                        </div>

                        {/* Conquistas desbloqueadas */}
                        {milestones.length > 0 && (
                          <>
                            <div style={{ height:'1px', background:'rgba(255,255,255,0.06)', marginBottom:'12px' }} />
                            <p style={{ margin:'0 0 8px', fontSize:'9px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.22)', textTransform:'uppercase' }}>
                              Conquistas desbloqueadas
                            </p>
                            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                              {milestones.map(m => (
                                <div key={m.label} style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                                  <div style={{
                                    width:'18px', height:'18px', borderRadius:'50%', flexShrink:0,
                                    background:'rgba(0,255,136,0.1)',
                                    border:'1px solid rgba(0,255,136,0.22)',
                                    display:'flex', alignItems:'center', justifyContent:'center',
                                    fontSize:'9px', color:'#00FF88', fontWeight:900,
                                  }}>
                                    ✓
                                  </div>
                                  <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.5)', fontWeight:500 }}>{m.label}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }

              /* ── AVALIAÇÃO ── */
              if (ev.tipo === 'avaliacao') {
                const { av, ovrAvAntes, ovrAvDepois, isFirst } = ev
                const cor   = notaColor(av.nota_geral)
                const label = notaLabel(av.nota_geral)
                const delta = ovrAvDepois - ovrAvAntes
                const ovrAntes  = ovrPerfil + ovrAvAntes
                const ovrDepois = ovrPerfil + ovrAvDepois

                const ATTRS = [
                  { icon:'⚡', label:'Velocidade',   v: av.velocidade },
                  { icon:'👁', label:'Visão',         v: av.visao_jogo },
                  { icon:'💪', label:'Força',         v: av.forca },
                  { icon:'🎯', label:'Finalização',   v: av.finalizacao },
                  { icon:'🧠', label:'Int. Tática',   v: av.posicionamento },
                  { icon:'⚽', label:'Técnica',       v: av.tecnica },
                ]

                return (
                  <div key={av.id} className={evClass} style={{ display:'flex', gap:'20px', paddingBottom:'28px' }}>

                    {/* Dot — maior, glowing */}
                    <div style={{ flexShrink:0, width:'28px', display:'flex', justifyContent:'center', paddingTop:'4px' }}>
                      <div style={{
                        width:'16px', height:'16px', borderRadius:'50%',
                        background:'#00FF88',
                        border:'2px solid rgba(0,255,136,0.4)',
                        boxShadow:'0 0 16px rgba(0,255,136,0.6), 0 0 32px rgba(0,255,136,0.25)',
                        animation:'glowDot 3s ease-in-out infinite',
                      }} />
                    </div>

                    {/* Card */}
                    <div style={{ flex:1 }}>
                      <p style={{ margin:'0 0 6px', fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.28)', letterSpacing:'0.03em' }}>
                        {formatarData(av.created_at)}
                      </p>

                      <div style={{
                        background:`${cor}08`,
                        border:`1px solid ${cor}30`,
                        borderRadius:'18px', overflow:'hidden',
                      }}>

                        {/* ── Header ── */}
                        <div style={{
                          padding:'16px 18px',
                          background:`${cor}06`,
                          borderBottom:`1px solid ${cor}18`,
                          display:'flex', alignItems:'center', justifyContent:'space-between', gap:'12px',
                        }}>
                          <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                            <div style={{
                              width:'36px', height:'36px', borderRadius:'50%', flexShrink:0,
                              background:'#00FF88',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:'16px', fontWeight:900, color:'#020d04',
                              boxShadow:'0 0 16px rgba(0,255,136,0.5)',
                            }}>
                              🏆
                            </div>
                            <div>
                              <p style={{ margin:'0 0 2px', fontSize:'11px', fontWeight:800, color:'#00FF88', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                                {isFirst ? 'Primeira avaliação oficial' : 'Avaliação oficial'}
                              </p>
                              <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.4)' }}>
                                {av.treinador_nome}
                              </p>
                            </div>
                          </div>

                          {/* Nota badge */}
                          <div style={{
                            flexShrink:0, textAlign:'center',
                            width:'52px', height:'52px', borderRadius:'13px',
                            background:`${cor}14`, border:`1.5px solid ${cor}35`,
                            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'2px',
                          }}>
                            <span style={{ fontSize:'20px', fontWeight:900, color:cor, lineHeight:1, letterSpacing:'-0.03em', textShadow:`0 0 16px ${cor}66` }}>
                              {av.nota_geral}
                            </span>
                            <span style={{ fontSize:'7px', fontWeight:800, color:`${cor}99`, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                              {label}
                            </span>
                          </div>
                        </div>

                        {/* ── OVR Progressão ── */}
                        <div style={{
                          padding:'16px 18px',
                          borderBottom:`1px solid ${cor}14`,
                        }}>
                          <p style={{ margin:'0 0 12px', fontSize:'9px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.25)', textTransform:'uppercase' }}>
                            Evolução do OVR
                          </p>
                          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>

                            {/* Antes */}
                            <div style={{
                              flexShrink:0, textAlign:'center',
                              padding:'10px 14px', borderRadius:'12px',
                              background:'rgba(255,255,255,0.04)',
                              border:'1px solid rgba(255,255,255,0.08)',
                            }}>
                              <span style={{ display:'block', fontSize:'22px', fontWeight:900, color:'rgba(255,255,255,0.5)', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>
                                {ovrAntes}
                              </span>
                              <span style={{ fontSize:'8px', color:'rgba(255,255,255,0.2)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600 }}>antes</span>
                            </div>

                            {/* Barra de progressão */}
                            <div style={{ flex:1, position:'relative' }}>
                              <div style={{
                                height:'4px', background:'rgba(255,255,255,0.07)',
                                borderRadius:'2px', overflow:'hidden',
                              }}>
                                <div style={{
                                  height:'100%', borderRadius:'2px',
                                  background:`linear-gradient(90deg,rgba(255,255,255,0.12),${cor})`,
                                  animation:'progressFill 1.2s cubic-bezier(.22,1,.36,1) forwards .8s',
                                  width:0,
                                }} />
                              </div>
                              <div style={{
                                position:'absolute', top:'-16px', left:'50%',
                                transform:'translateX(-50%)',
                                fontSize:'14px', color:cor,
                              }}>→</div>
                              {/* Delta badge */}
                              {delta !== 0 && (
                                <div style={{
                                  position:'absolute', bottom:'-20px', left:'50%',
                                  transform:'translateX(-50%)',
                                  padding:'2px 8px', borderRadius:'100px',
                                  background: delta > 0 ? 'rgba(0,255,136,0.12)' : 'rgba(239,68,68,0.12)',
                                  border:`1px solid ${delta > 0 ? 'rgba(0,255,136,0.3)' : 'rgba(239,68,68,0.3)'}`,
                                  whiteSpace:'nowrap',
                                }}>
                                  <span style={{ fontSize:'10px', fontWeight:900, color: delta > 0 ? '#00FF88' : '#ef4444' }}>
                                    {delta > 0 ? `+${delta}` : delta}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Depois */}
                            <div style={{
                              flexShrink:0, textAlign:'center',
                              padding:'10px 14px', borderRadius:'12px',
                              background:`${cor}12`, border:`1.5px solid ${cor}35`,
                            }}>
                              <span style={{ display:'block', fontSize:'22px', fontWeight:900, color:cor, lineHeight:1, fontVariantNumeric:'tabular-nums', textShadow:`0 0 16px ${cor}55` }}>
                                {ovrDepois}
                              </span>
                              <span style={{ fontSize:'8px', color:`${cor}90`, textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700 }}>depois</span>
                            </div>

                          </div>
                        </div>

                        {/* ── Atributos 2×3 ── */}
                        <div style={{ padding:'14px 18px', borderBottom: av.observacao ? `1px solid ${cor}14` : 'none' }}>
                          <p style={{ margin:'0 0 10px', fontSize:'9px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.22)', textTransform:'uppercase' }}>
                            Atributos técnicos desbloqueados
                          </p>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px' }}>
                            {ATTRS.map(a => {
                              const aColor = notaColor(a.v)
                              return (
                                <div key={a.label} className="attr-row">
                                  <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                                    <span style={{ fontSize:'13px' }}>{a.icon}</span>
                                    <span style={{ fontSize:'10px', fontWeight:600, color:'rgba(255,255,255,0.38)', letterSpacing:'0.03em' }}>{a.label}</span>
                                  </div>
                                  <span style={{ fontSize:'15px', fontWeight:900, color:aColor, fontVariantNumeric:'tabular-nums', textShadow:`0 0 8px ${aColor}44` }}>
                                    {a.v}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* ── Observação ── */}
                        {av.observacao && (
                          <div style={{ padding:'14px 18px' }}>
                            <p style={{ margin:'0 0 8px', fontSize:'9px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.22)', textTransform:'uppercase' }}>
                              Observação do treinador
                            </p>
                            <p style={{
                              margin:0, fontSize:'13px', lineHeight:1.8,
                              color:'rgba(255,255,255,0.58)', fontStyle:'italic',
                              paddingLeft:'12px',
                              borderLeft:'2px solid rgba(0,255,136,0.28)',
                            }}>
                              "{av.observacao}"
                            </p>
                          </div>
                        )}

                      </div>
                    </div>
                  </div>
                )
              }

              /* ── HIGHLIGHT ── */
              if (ev.tipo === 'highlight') {
                const { hl } = ev
                const platform = getPlatformInfo(hl.plataforma)
                const thumb = getThumbnail(hl)

                return (
                  <div key={`hl-${hl.id}`} className={evClass} style={{ display:'flex', gap:'20px', paddingBottom:'28px' }}>

                    {/* Dot — médio, colorido com a cor da plataforma */}
                    <div style={{ flexShrink:0, width:'28px', display:'flex', justifyContent:'center', paddingTop:'4px' }}>
                      <div style={{
                        width:'12px', height:'12px', borderRadius:'50%',
                        background: platform.bg,
                        border:`2px solid ${platform.bg}66`,
                        boxShadow:`0 0 10px ${platform.bg}55`,
                      }} />
                    </div>

                    {/* Card */}
                    <div style={{ flex:1 }}>
                      <p style={{ margin:'0 0 6px', fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.28)', letterSpacing:'0.03em' }}>
                        {formatarData(hl.created_at)}
                      </p>

                      <a href={hl.url} target="_blank" rel="noreferrer" style={{ textDecoration:'none', display:'block' }}>
                        <div style={{
                          borderRadius:'14px', overflow:'hidden',
                          background:'rgba(255,255,255,0.025)',
                          border:'1px solid rgba(255,255,255,0.08)',
                          transition:'border-color .2s',
                        }}>
                          {/* Thumbnail compacta */}
                          <div style={{ position:'relative', aspectRatio:'16/9', background:'#0a120e', maxHeight:'120px', overflow:'hidden' }}>
                            {thumb ? (
                              <img src={thumb} alt={hl.titulo ?? platform.label} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            ) : (
                              <div style={{
                                width:'100%', height:'100%',
                                background:`linear-gradient(135deg,${platform.bg}22,rgba(0,0,0,0.5))`,
                                display:'flex', alignItems:'center', justifyContent:'center',
                                fontSize:'28px',
                              }}>
                                🎬
                              </div>
                            )}
                            {/* Platform badge */}
                            <div style={{
                              position:'absolute', top:'6px', left:'6px',
                              padding:'2px 7px', borderRadius:'100px', background: platform.bg,
                            }}>
                              <span style={{ fontSize:'9px', fontWeight:800, color:'white' }}>{platform.label}</span>
                            </div>
                            {/* Play icon overlay */}
                            <div style={{
                              position:'absolute', inset:0,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              background:'rgba(0,0,0,0.2)',
                            }}>
                              <div style={{
                                width:'32px', height:'32px', borderRadius:'50%',
                                background:'rgba(0,0,0,0.6)',
                                display:'flex', alignItems:'center', justifyContent:'center',
                                border:'1px solid rgba(255,255,255,0.2)',
                              }}>
                                <span style={{ fontSize:'12px', marginLeft:'2px' }}>▶</span>
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div style={{ padding:'8px 12px', display:'flex', alignItems:'center', gap:'8px' }}>
                            <div style={{ width:'6px', height:'6px', borderRadius:'50%', background: platform.bg, flexShrink:0 }} />
                            <p style={{ margin:0, flex:1, fontSize:'11px', fontWeight:600, color:'rgba(255,255,255,0.42)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                              {hl.titulo ?? `Highlight · ${platform.label}`}
                            </p>
                            <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.2)', flexShrink:0 }}>↗</span>
                          </div>
                        </div>
                      </a>
                    </div>
                  </div>
                )
              }

              return null
            })}

            {/* ── AGORA — marcador pulsante ── */}
            <div className="evN" style={{ display:'flex', gap:'20px' }}>
              <div style={{ flexShrink:0, width:'28px', display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div style={{
                  width:'10px', height:'10px', borderRadius:'50%',
                  background:'#00FF88',
                  boxShadow:'0 0 10px rgba(0,255,136,0.8), 0 0 20px rgba(0,255,136,0.4)',
                  animation:'nowBlink 1.6s ease-in-out infinite',
                }} />
              </div>
              <div style={{ paddingTop:'0px' }}>
                <span style={{ fontSize:'12px', fontWeight:800, color:'rgba(0,255,136,0.75)', letterSpacing:'0.08em', textTransform:'uppercase' }}>
                  Agora
                </span>
                <p style={{ margin:'4px 0 0', fontSize:'12px', color:'rgba(255,255,255,0.28)', lineHeight:1.6, maxWidth:'280px' }}>
                  {avaliacoes.length === 0
                    ? 'Sua carreira começa com a primeira avaliação oficial.'
                    : avaliacoes.length === 1
                    ? 'Uma avaliação registrada. Sua trajetória está em construção.'
                    : `${avaliacoes.length} avaliações na plataforma. Continue evoluindo.`
                  }
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════
            EMPTY STATE — sem avaliação
        ══════════════════════════════════════ */}
        {avaliacoes.length === 0 && (
          <div style={{
            marginTop:'36px',
            padding:'24px 20px',
            background:'rgba(0,255,136,0.04)',
            border:'1px solid rgba(0,255,136,0.12)',
            borderRadius:'20px',
            textAlign:'center',
            animation:'fadeUp .5s ease forwards .9s', opacity:0,
          }}>
            <div style={{
              width:'52px', height:'52px', borderRadius:'50%', margin:'0 auto 14px',
              background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.2)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px',
            }}>
              🔒
            </div>
            <p style={{ margin:'0 0 6px', fontSize:'15px', fontWeight:800, color:'rgba(255,255,255,0.7)' }}>
              Aguardando primeira avaliação
            </p>
            <p style={{ margin:'0 0 20px', fontSize:'12px', color:'rgba(255,255,255,0.28)', lineHeight:1.7, maxWidth:'260px', marginLeft:'auto', marginRight:'auto' }}>
              Compartilhe seu ID com um treinador para desbloquear atributos e registrar sua evolução.
            </p>
            {dados.athleteId && (
              <div style={{
                display:'inline-flex', alignItems:'center', gap:'10px',
                padding:'12px 24px', borderRadius:'14px',
                background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.25)',
              }}>
                <span style={{ fontSize:'10px', fontWeight:700, color:'rgba(0,255,136,0.55)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Seu ID</span>
                <span style={{ fontSize:'20px', fontWeight:900, color:'#00FF88', letterSpacing:'0.08em', fontVariantNumeric:'tabular-nums' }}>
                  {dados.athleteId}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Voltar */}
        <div style={{ marginTop:'40px', textAlign:'center' }}>
          <Link href="/atleta/perfil" style={{ fontSize:'13px', fontWeight:700, color:'rgba(255,255,255,0.25)', textDecoration:'none' }}>
            ← Voltar ao perfil
          </Link>
        </div>

        {/* Footer */}
        <p style={{ marginTop:'28px', fontSize:'10px', color:'rgba(255,255,255,0.1)', textAlign:'center' }}>
          ⚽ MEUCRAQUE.com · Sua carreira, registrada.
        </p>

      </div>
      <AtletaBottomNav />
    </main>
  )
}
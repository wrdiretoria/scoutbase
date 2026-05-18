'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import TreinadorBottomNav from '@/components/TreinadorBottomNav'

// ── Types ─────────────────────────────────────────────────────────────────────

type AtletaInfo = {
  profileId:  string
  athlete_id: string
  nome:       string
  posicao:    string
  cidade:     string
  avatar_url: string
  dataNasc:   string
}

type Notas = {
  velocidade:         number
  visao:              number
  forca:              number
  finalizacao:        number
  inteligenciaTatica: number
  tecnica:            number
}

type Step = 'buscar' | 'confirmar' | 'avaliar' | 'observacao' | 'sucesso'

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcularCategoria(dataNasc?: string): string {
  if (!dataNasc) return ''
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  if (idade <= 11) return 'Sub-11'
  if (idade <= 13) return 'Sub-13'
  if (idade <= 15) return 'Sub-15'
  if (idade <= 17) return 'Sub-17'
  if (idade <= 20) return 'Sub-20'
  return 'Adulto'
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function posLabel(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? (pos ? pos.slice(0, 3).toUpperCase() : '—')
}

function notaLabel(n: number): string {
  if (n === 0)  return '—'
  if (n <= 20)  return 'Fraco'
  if (n <= 40)  return 'Regular'
  if (n <= 60)  return 'Bom'
  if (n <= 80)  return 'Muito Bom'
  return 'Excelente'
}

function notaColor(n: number): string {
  if (n === 0)  return 'rgba(255,255,255,0.2)'
  if (n <= 20)  return '#ef4444'
  if (n <= 40)  return '#f59e0b'
  if (n <= 60)  return '#eab308'
  if (n <= 80)  return '#22c55e'
  return '#00FF88'
}

function segmentColor(idx: number): string {
  // Gradiente natural: vermelho → âmbar → amarelo → verde → neon
  const palette = [
    '#ef4444', '#f97316', '#f59e0b',
    '#eab308', '#84cc16',
    '#22c55e', '#16a34a',
    '#4ade80', '#00e87a', '#00FF88',
  ]
  return palette[idx] ?? '#00FF88'
}

function calcularNotaGeral(notas: Notas): number {
  const vals = Object.values(notas)
  const preenchidos = vals.filter(v => v > 0)
  if (preenchidos.length === 0) return 0
  return Math.round(preenchidos.reduce((a, b) => a + b, 0) / preenchidos.length)
}

function calcularNotaFinal(notas: Notas): number {
  const vals = Object.values(notas)
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
}

// ── Segment Bar ───────────────────────────────────────────────────────────────

function SegmentBar({
  icon, label, value, onChange,
}: {
  icon: string; label: string; value: number; onChange: (v: number) => void
}) {
  const SEGS   = 10
  const filled = Math.round(value / 10)  // 0–10

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>
          <span style={{
            fontSize: '11px', fontWeight: 800,
            color: 'rgba(255,255,255,0.6)', letterSpacing: '0.10em', textTransform: 'uppercase',
          }}>
            {label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
            color: filled > 0 ? segmentColor(filled - 1) : 'rgba(255,255,255,0.18)',
            transition: 'color 0.2s',
          }}>
            {notaLabel(value)}
          </span>
          <span style={{
            fontSize: '18px', fontWeight: 900,
            color: filled > 0 ? segmentColor(filled - 1) : 'rgba(255,255,255,0.12)',
            fontVariantNumeric: 'tabular-nums', minWidth: '28px', textAlign: 'right',
            transition: 'color 0.2s',
          }}>
            {filled > 0 ? value : '—'}
          </span>
        </div>
      </div>

      {/* Segments */}
      <div style={{ display: 'flex', gap: '3px' }}>
        {Array.from({ length: SEGS }, (_, i) => {
          const isActive = i < filled
          const color    = isActive ? segmentColor(i) : 'rgba(255,255,255,0.055)'
          return (
            <button
              key={i}
              onClick={() => onChange((i + 1) * 10)}
              style={{
                flex: 1, height: '32px', borderRadius: '5px', border: 'none',
                background: color, cursor: 'pointer',
                transition: 'background 0.12s ease, box-shadow 0.12s ease',
                boxShadow: isActive ? `0 0 7px ${color}99` : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Animated counter ──────────────────────────────────────────────────────────

function useCounter(target: number, delay = 300, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => {
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        setValue(Math.round((1 - Math.pow(1 - p, 3)) * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [target, delay, duration])
  return value
}

// ── Page ──────────────────────────────────────────────────────────────────────

const ATRIBUTOS: { key: keyof Notas; icon: string; label: string }[] = [
  { key: 'velocidade',         icon: '⚡', label: 'Velocidade'      },
  { key: 'visao',              icon: '👁', label: 'Visão de Jogo'   },
  { key: 'forca',              icon: '💪', label: 'Força Física'    },
  { key: 'finalizacao',        icon: '🎯', label: 'Finalização'     },
  { key: 'inteligenciaTatica', icon: '🧠', label: 'Int. Tática'    },
  { key: 'tecnica',            icon: '⚽', label: 'Técnica'         },
]

const NOTAS_VAZIAS: Notas = {
  velocidade: 0, visao: 0, forca: 0,
  finalizacao: 0, inteligenciaTatica: 0, tecnica: 0,
}

function AvaliarPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // ── Treinador ──
  const [treinadorNome,  setTreinadorNome]  = useState('')
  const [nomeEscola,     setNomeEscola]     = useState('')

  // ── Flow ──
  const [step,       setStep]       = useState<Step>('buscar')
  const [atletaId,   setAtletaId]   = useState(() => searchParams.get('id') ?? '')
  const [atleta,     setAtleta]     = useState<AtletaInfo | null>(null)
  const [notas,      setNotas]      = useState<Notas>(NOTAS_VAZIAS)
  const [observacao, setObservacao] = useState('')
  const [notaFinal,  setNotaFinal]  = useState(0)

  // ── UI ──
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const notaGeral    = calcularNotaGeral(notas)
  const notaGerAnim  = useCounter(step === 'sucesso' ? notaFinal : 0, 400, 1100)
  const todasPreench = Object.values(notas).every(v => v > 0)

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Load trainer info ──
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setTreinadorNome(user.user_metadata?.nome ?? 'Treinador')
      setNomeEscola(user.user_metadata?.nome_escola ?? '')
    }
    load()
  }, [router])

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleBuscar(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res  = await fetch('/api/treinador/buscar-atleta', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ atletaId }),
    })
    const data = await res.json() as AtletaInfo & { error?: string }
    if (!res.ok || data.error) {
      setError(data.error ?? 'Atleta não encontrado.')
      setLoading(false)
      return
    }
    setAtleta(data)
    setLoading(false)
    setStep('confirmar')
  }

  async function handleFinalizar() {
    if (!atleta || !todasPreench) return
    setLoading(true)
    setError(null)
    const res  = await fetch('/api/treinador/avaliar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: atleta.profileId, ...notas, observacao }),
    })
    const data = await res.json() as { ok?: boolean; notaGeral?: number; error?: string }
    if (!res.ok || data.error) {
      setError(data.error ?? 'Erro ao registrar avaliação.')
      setLoading(false)
      return
    }
    setNotaFinal(data.notaGeral ?? calcularNotaFinal(notas))
    setLoading(false)
    setStep('sucesso')
  }

  function resetar() {
    setAtleta(null)
    setAtletaId('')
    setNotas(NOTAS_VAZIAS)
    setObservacao('')
    setNotaFinal(0)
    setError(null)
    setStep('buscar')
  }

  function setNota(key: keyof Notas, val: number) {
    setNotas(prev => ({ ...prev, [key]: val }))
  }

  // ── Shared visual atoms ───────────────────────────────────────────────────

  const hoje = new Date().toLocaleDateString('pt-BR')
  const categoria = atleta ? calcularCategoria(atleta.dataNasc) : ''
  const initials  = atleta ? getInitials(atleta.nome) : ''

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main style={{
      background: '#030a05',
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '28px 20px',
      paddingTop: 'max(28px, env(safe-area-inset-top))',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
      fontFamily: 'system-ui, sans-serif',
      position: 'relative',
      overflow: 'hidden',
      overscrollBehaviorY: 'none',
    }}>

      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes glowIn  { from{opacity:0} to{opacity:1} }
        @keyframes stampIn {
          0%   { opacity:0; transform:scale(0.7) rotate(-4deg) }
          70%  { opacity:1; transform:scale(1.04) rotate(1deg) }
          100% { opacity:1; transform:scale(1)    rotate(0deg) }
        }
        @keyframes ringPop {
          0%   { transform:scale(0.8); opacity:0 }
          60%  { transform:scale(1.12); opacity:1 }
          100% { transform:scale(1);   opacity:1 }
        }
        @keyframes dotPulse {
          0%,100%{ opacity:1; transform:scale(1)   }
          50%    { opacity:.4; transform:scale(.65) }
        }

        .fade-page { animation: fadeUp .45s ease forwards; }
        .stamp     { animation: stampIn .7s cubic-bezier(.22,.68,0,1.2) forwards .3s; opacity:0 }
        .ring-pop  { animation: ringPop .7s cubic-bezier(.22,.68,0,1.2) forwards .5s; opacity:0 }

        textarea:focus { outline:none; border-color:rgba(0,255,136,0.3) !important; }
        textarea { resize: none; }

        .seg-btn:hover { filter: brightness(1.25); }

        .btn-primary {
          width:100%; padding:17px; border-radius:14px; border:none;
          background: linear-gradient(135deg,#00e87a,#00FF88 55%,#22c55e);
          color:#020d04; font-weight:900; font-size:16px; min-height:56px;
          cursor:pointer; font-family:system-ui,sans-serif; letter-spacing:0.04em;
          box-shadow:0 0 40px rgba(0,255,136,0.3),0 4px 16px rgba(0,0,0,0.4),
                     inset 0 1px 0 rgba(255,255,255,0.25);
          transition:opacity .2s,transform .15s;
        }
        .btn-primary:disabled { opacity:.45; cursor:not-allowed; }
        .btn-primary:active:not(:disabled) { opacity:.88; transform:scale(0.97); transition:transform .08s,opacity .08s; }

        .btn-ghost {
          width:100%; padding:15px; border-radius:13px;
          border:1px solid rgba(255,255,255,0.09); background:transparent;
          color:rgba(255,255,255,0.4); font-size:14px; font-weight:600;
          cursor:pointer; font-family:system-ui,sans-serif;
          min-height:52px;
          transition:border-color .2s,color .2s,transform .08s;
        }
        .btn-ghost:hover  { border-color:rgba(255,255,255,0.2); color:rgba(255,255,255,0.65); }
        .btn-ghost:active { transform:scale(.98); opacity:.85; }
      `}</style>

      {/* Atmosphere */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}>
        <div style={{
          position:'absolute', top:'-20%', left:'50%', transform:'translateX(-50%)',
          width:'800px', height:'600px', borderRadius:'50%',
          background:'radial-gradient(ellipse,rgba(0,255,136,0.07) 0%,transparent 60%)',
          animation:'glowIn 1.2s ease forwards',
        }} />
      </div>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'400px' }}>

        {/* ── Header ── */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          marginBottom:'32px',
        }}>
          <button
            onClick={() => step === 'buscar' ? router.push('/treinador/perfil') : resetar()}
            style={{
              background:'none', border:'none', cursor:'pointer',
              color:'rgba(255,255,255,0.32)', fontSize:'13px', fontWeight:600,
              fontFamily:'system-ui', padding:0,
            }}
          >
            ← {step === 'buscar' ? 'Meu perfil' : 'Nova avaliação'}
          </button>
          <Link href="/" style={{ fontSize:'13px', fontWeight:800, color:'white', textDecoration:'none', opacity:0.5 }}>
            ⚽ MEU <span style={{ color:'#22c55e' }}>CRAQUE</span>
          </Link>
          <div style={{ width:'80px' }} />
        </div>

        {/* ════════════════════════════════════════
            STEP: BUSCAR
        ════════════════════════════════════════ */}
        {step === 'buscar' && (
          <div className="fade-page">

            <div style={{ marginBottom:'32px' }}>
              <div style={{
                display:'inline-flex', alignItems:'center', gap:'7px',
                padding:'5px 14px', borderRadius:'100px', marginBottom:'14px',
                background:'rgba(0,255,136,0.08)', border:'1px solid rgba(0,255,136,0.2)',
              }}>
                <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:'#00FF88', boxShadow:'0 0 8px #00FF88', animation:'dotPulse 2s ease-in-out infinite' }} />
                <span style={{ fontSize:'10px', fontWeight:800, letterSpacing:'0.14em', color:'rgba(0,255,136,0.8)', textTransform:'uppercase' }}>
                  Avaliação oficial
                </span>
              </div>
              <h1 style={{
                margin:'0 0 8px', fontSize:'28px', fontWeight:900, color:'white', letterSpacing:'-0.03em',
              }}>
                Buscar atleta
              </h1>
              <p style={{ margin:0, fontSize:'14px', color:'rgba(255,255,255,0.35)', lineHeight:1.6 }}>
                Digite o ID do atleta para iniciar<br />o relatório técnico oficial.
              </p>
            </div>

            <form onSubmit={handleBuscar} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div>
                <label style={{
                  display:'block', fontSize:'11px', fontWeight:700,
                  color:'rgba(255,255,255,0.4)', letterSpacing:'0.10em',
                  textTransform:'uppercase', marginBottom:'10px',
                }}>
                  ID do Atleta
                </label>

                <div style={{ position:'relative' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    required
                    value={atletaId}
                    onChange={e => setAtletaId(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="00000"
                    maxLength={5}
                    style={{
                      width:'100%', padding:'16px',
                      boxSizing:'border-box', borderRadius:'14px',
                      background:'rgba(255,255,255,0.05)',
                      border:'1px solid rgba(255,255,255,0.1)',
                      color:'white', fontSize:'22px', fontWeight:900,
                      letterSpacing:'0.14em', outline:'none',
                      fontFamily:'system-ui, sans-serif',
                      fontVariantNumeric:'tabular-nums',
                    }}
                  />
                </div>

                <p style={{ margin:'8px 0 0', fontSize:'11px', color:'rgba(255,255,255,0.22)' }}>
                  O atleta encontra o ID no próprio perfil.
                </p>
              </div>

              {error && (
                <div style={{
                  padding:'12px 16px', borderRadius:'12px',
                  background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                  fontSize:'13px', color:'#f87171',
                }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading || atletaId.length < 4}>
                {loading ? 'Buscando…' : 'Buscar atleta →'}
              </button>
            </form>

            {/* Exemplo visual */}
            <div style={{
              marginTop:'28px', padding:'16px 18px', borderRadius:'14px',
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)',
              display:'flex', alignItems:'center', gap:'14px',
            }}>
              <div style={{
                width:'40px', height:'40px', borderRadius:'10px', flexShrink:0,
                background:'rgba(0,255,136,0.07)', border:'1px solid rgba(0,255,136,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px',
              }}>
                📋
              </div>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.5)' }}>
                  O que é avaliado?
                </p>
                <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.25)', lineHeight:1.5 }}>
                  Velocidade · Visão · Força · Finalização<br />Int. Tática · Técnica
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP: CONFIRMAR ATLETA
        ════════════════════════════════════════ */}
        {step === 'confirmar' && atleta && (
          <div className="fade-page">
            <div style={{ marginBottom:'24px' }}>
              <p style={{
                margin:'0 0 6px', fontSize:'11px', fontWeight:700,
                letterSpacing:'0.14em', color:'rgba(0,255,136,0.7)', textTransform:'uppercase',
              }}>
                Atleta encontrado
              </p>
              <h1 style={{ margin:0, fontSize:'24px', fontWeight:900, color:'white', letterSpacing:'-0.03em' }}>
                Confirme o atleta
              </h1>
            </div>

            {/* Card do atleta — confirmação */}
            <div style={{
              borderRadius:'20px', overflow:'hidden',
              background:'linear-gradient(160deg,#122018 0%,#0a1912 45%,#050e08 100%)',
              border:'1px solid rgba(0,255,136,0.18)',
              boxShadow:'0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(0,255,136,0.06)',
              marginBottom:'20px',
            }}>
              {/* Área da foto */}
              <div style={{ position:'relative', height:'200px', overflow:'hidden' }}>
                {atleta.avatar_url ? (
                  <img
                    src={atleta.avatar_url} alt={atleta.nome}
                    style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 18%', filter:'contrast(1.05)' }}
                  />
                ) : (
                  <div style={{
                    width:'100%', height:'100%',
                    background:'linear-gradient(160deg,#1a3828 0%,#0e2018 50%,#040c07 100%)',
                    display:'flex', alignItems:'center', justifyContent:'center', position:'relative',
                  }}>
                    <div style={{
                      position:'absolute', inset:0,
                      background:'radial-gradient(ellipse 65% 55% at 50% 45%,rgba(0,255,136,0.12) 0%,transparent 70%)',
                    }} />
                    <div style={{
                      position:'relative', zIndex:1,
                      width:'88px', height:'88px', borderRadius:'50%',
                      background:'linear-gradient(145deg,#1a7a42,#22c55e)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'30px', fontWeight:900, color:'white',
                      boxShadow:'0 0 40px rgba(0,255,136,0.4)',
                    }}>
                      {initials}
                    </div>
                  </div>
                )}
                {/* Overlays */}
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(5,14,8,1) 0%,rgba(5,14,8,0.75) 30%,transparent 65%)' }} />
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right,rgba(5,14,8,0.45) 0%,transparent 40%)' }} />

                {/* Categoria */}
                {categoria && (
                  <div style={{
                    position:'absolute', top:'14px', right:'14px', zIndex:3,
                    background:'rgba(0,0,0,0.6)', backdropFilter:'blur(16px)',
                    border:'1px solid rgba(0,255,136,0.4)', borderRadius:'8px',
                    padding:'4px 10px', fontSize:'10px', fontWeight:800,
                    color:'#00FF88', letterSpacing:'0.10em',
                  }}>
                    {categoria}
                  </div>
                )}

                {/* Nome */}
                <div style={{ position:'absolute', bottom:0, left:0, right:0, zIndex:3, padding:'0 18px 16px' }}>
                  <p style={{ margin:'0 0 2px', fontSize:'26px', fontWeight:900, color:'white', letterSpacing:'-0.03em', lineHeight:1, textShadow:'0 2px 16px rgba(0,0,0,0.9)' }}>
                    {atleta.nome.split(' ')[0]}
                  </p>
                  {atleta.nome.split(' ').slice(1).join(' ') && (
                    <p style={{ margin:0, fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.45)', textTransform:'uppercase', letterSpacing:'0.14em' }}>
                      {atleta.nome.split(' ').slice(1).join(' ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Faixa info */}
              <div style={{ padding:'14px 18px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{
                  display:'inline-flex', alignItems:'center',
                  background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.25)',
                  borderRadius:'8px', padding:'5px 12px',
                }}>
                  <span style={{ fontSize:'12px', fontWeight:900, color:'#00FF88', letterSpacing:'0.10em' }}>
                    {posLabel(atleta.posicao)}
                  </span>
                </div>
                <div style={{ textAlign:'right' }}>
                  <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                    ID
                  </span>
                  <p style={{ margin:0, fontSize:'15px', fontWeight:900, color:'white', letterSpacing:'0.10em', fontVariantNumeric:'tabular-nums' }}>
                    {atleta.athlete_id.replace('MC-', '')}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <button className="btn-primary" onClick={() => setStep('avaliar')}>
                ✔ É este atleta — iniciar avaliação
              </button>
              <button className="btn-ghost" onClick={resetar}>
                ← Buscar outro atleta
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP: AVALIAR ATRIBUTOS
        ════════════════════════════════════════ */}
        {step === 'avaliar' && atleta && (
          <div className="fade-page">

            {/* Mini header do atleta */}
            <div style={{
              display:'flex', alignItems:'center', gap:'14px',
              padding:'14px 16px', borderRadius:'14px', marginBottom:'24px',
              background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
            }}>
              {atleta.avatar_url ? (
                <img src={atleta.avatar_url} alt={atleta.nome} style={{ width:'44px', height:'44px', borderRadius:'50%', objectFit:'cover', objectPosition:'center 15%', flexShrink:0 }} />
              ) : (
                <div style={{ width:'44px', height:'44px', borderRadius:'50%', background:'linear-gradient(145deg,#1a7a42,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px', fontWeight:900, color:'white', flexShrink:0 }}>
                  {initials}
                </div>
              )}
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ margin:0, fontSize:'15px', fontWeight:800, color:'white', letterSpacing:'-0.01em' }}>
                  {atleta.nome}
                </p>
                <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.35)' }}>
                  {atleta.posicao || 'Atleta'}{categoria ? ` · ${categoria}` : ''}
                </p>
              </div>
              {/* Nota parcial */}
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <span style={{ fontSize:'10px', fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', display:'block' }}>
                  Nota
                </span>
                <span style={{
                  fontSize:'22px', fontWeight:900, fontVariantNumeric:'tabular-nums',
                  color: notaGeral > 0 ? notaColor(notaGeral) : 'rgba(255,255,255,0.15)',
                  transition:'color 0.3s',
                }}>
                  {notaGeral > 0 ? notaGeral : '—'}
                </span>
              </div>
            </div>

            {/* Título */}
            <div style={{ marginBottom:'24px' }}>
              <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(0,255,136,0.6)', textTransform:'uppercase' }}>
                Relatório técnico
              </p>
              <h2 style={{ margin:0, fontSize:'20px', fontWeight:900, color:'white', letterSpacing:'-0.02em' }}>
                Avalie cada atributo
              </h2>
            </div>

            {/* Barras */}
            <div style={{
              display:'flex', flexDirection:'column', gap:'0',
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'18px', overflow:'hidden', marginBottom:'20px',
            }}>
              {ATRIBUTOS.map((attr, i) => (
                <div
                  key={attr.key}
                  style={{
                    padding:'18px 18px',
                    borderBottom: i < ATRIBUTOS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  <SegmentBar
                    icon={attr.icon}
                    label={attr.label}
                    value={notas[attr.key]}
                    onChange={val => setNota(attr.key, val)}
                  />
                </div>
              ))}
            </div>

            {/* Aviso se não preencheu todos */}
            {!todasPreench && (
              <p style={{ margin:'0 0 16px', fontSize:'12px', color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
                Avalie todos os {ATRIBUTOS.length} atributos para continuar
              </p>
            )}

            <button
              className="btn-primary"
              onClick={() => setStep('observacao')}
              disabled={!todasPreench}
            >
              Próximo: observação →
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP: OBSERVAÇÃO + ASSINATURA
        ════════════════════════════════════════ */}
        {step === 'observacao' && atleta && (
          <div className="fade-page">

            <div style={{ marginBottom:'24px' }}>
              <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(0,255,136,0.6)', textTransform:'uppercase' }}>
                Relatório técnico
              </p>
              <h2 style={{ margin:'0 0 4px', fontSize:'20px', fontWeight:900, color:'white', letterSpacing:'-0.02em' }}>
                Observação e assinatura
              </h2>
              <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.3)' }}>
                Nota geral: <span style={{ color: notaColor(notaGeral), fontWeight:800 }}>{notaGeral}/100</span>
              </p>
            </div>

            {/* Observação */}
            <div style={{ marginBottom:'20px' }}>
              <label style={{
                display:'block', fontSize:'11px', fontWeight:700,
                color:'rgba(255,255,255,0.4)', letterSpacing:'0.10em',
                textTransform:'uppercase', marginBottom:'10px',
              }}>
                Observação do treinador
                <span style={{ fontWeight:500, color:'rgba(255,255,255,0.2)', marginLeft:'8px', letterSpacing:0, textTransform:'none', fontSize:'10px' }}>
                  (opcional)
                </span>
              </label>
              <textarea
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                placeholder="Descreva as principais qualidades e pontos de desenvolvimento do atleta…"
                rows={5}
                style={{
                  width:'100%', padding:'14px 16px',
                  boxSizing:'border-box', borderRadius:'14px',
                  background:'rgba(255,255,255,0.04)',
                  border:'1px solid rgba(255,255,255,0.09)',
                  color:'rgba(255,255,255,0.75)', fontSize:'16px', lineHeight:1.7,
                  fontFamily:'system-ui, sans-serif', transition:'border-color .2s',
                }}
              />
            </div>

            {/* Resumo dos atributos */}
            <div style={{
              marginBottom:'20px', padding:'16px',
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'14px',
            }}>
              <p style={{ margin:'0 0 12px', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.28)', textTransform:'uppercase' }}>
                Resumo
              </p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
                {ATRIBUTOS.map(attr => (
                  <div key={attr.key} style={{ display:'flex', flexDirection:'column', gap:'2px' }}>
                    <span style={{ fontSize:'9px', fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                      {attr.label.split(' ')[0]}
                    </span>
                    <span style={{
                      fontSize:'16px', fontWeight:900, fontVariantNumeric:'tabular-nums',
                      color: notaColor(notas[attr.key]),
                    }}>
                      {notas[attr.key]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assinatura oficial */}
            <div className="stamp" style={{
              marginBottom:'24px', padding:'20px',
              background:'rgba(0,255,136,0.04)',
              border:'1px solid rgba(0,255,136,0.18)',
              borderRadius:'16px', position:'relative', overflow:'hidden',
            }}>
              {/* Marca d'água sutil */}
              <div style={{
                position:'absolute', top:'50%', right:'16px', transform:'translateY(-50%)',
                fontSize:'56px', opacity:0.04, lineHeight:1, pointerEvents:'none',
              }}>
                ✓
              </div>

              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
                <div>
                  <p style={{ margin:'0 0 2px', fontSize:'9px', fontWeight:800, letterSpacing:'0.18em', color:'rgba(0,255,136,0.55)', textTransform:'uppercase' }}>
                    Avaliação oficial
                  </p>
                  <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.3)', fontWeight:500 }}>
                    Meu Craque · {hoje}
                  </p>
                </div>
                <div style={{
                  width:'32px', height:'32px', borderRadius:'50%',
                  background:'rgba(0,255,136,0.12)', border:'1px solid rgba(0,255,136,0.3)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'16px',
                }}>
                  ✓
                </div>
              </div>

              <div style={{ height:'1px', background:'rgba(0,255,136,0.12)', marginBottom:'14px' }} />

              <p style={{ margin:'0 0 2px', fontSize:'11px', color:'rgba(255,255,255,0.3)', fontWeight:500 }}>
                Avaliado por
              </p>
              <p style={{ margin:'0 0 2px', fontSize:'16px', fontWeight:800, color:'white', letterSpacing:'-0.01em' }}>
                {treinadorNome}
              </p>
              {nomeEscola && (
                <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>
                  {nomeEscola}
                </p>
              )}
            </div>

            {error && (
              <div style={{
                marginBottom:'16px', padding:'12px 16px', borderRadius:'12px',
                background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                fontSize:'13px', color:'#f87171',
              }}>
                {error}
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <button className="btn-primary" onClick={handleFinalizar} disabled={loading}>
                {loading ? 'Registrando…' : '✔ Finalizar avaliação oficial'}
              </button>
              <button className="btn-ghost" onClick={() => setStep('avaliar')}>
                ← Rever atributos
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP: SUCESSO
        ════════════════════════════════════════ */}
        {step === 'sucesso' && atleta && (
          <div className="fade-page" style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>

            {/* Selo de aprovação */}
            <div className="ring-pop" style={{
              width:'100px', height:'100px', borderRadius:'50%', marginBottom:'24px',
              background:'linear-gradient(145deg,rgba(0,255,136,0.15),rgba(0,255,136,0.05))',
              border:'2px solid rgba(0,255,136,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 60px rgba(0,255,136,0.25), 0 0 120px rgba(0,255,136,0.10)',
            }}>
              <div style={{
                fontSize:'42px', lineHeight:1,
              }}>✓</div>
            </div>

            <p style={{ margin:'0 0 4px', fontSize:'11px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(0,255,136,0.7)', textTransform:'uppercase' }}>
              Avaliação registrada
            </p>
            <h1 style={{ margin:'0 0 8px', fontSize:'26px', fontWeight:900, color:'white', letterSpacing:'-0.03em' }}>
              Relatório oficial
            </h1>
            <p style={{ margin:'0 0 32px', fontSize:'14px', color:'rgba(255,255,255,0.35)', lineHeight:1.65 }}>
              O perfil de <strong style={{ color:'rgba(255,255,255,0.65)' }}>{atleta.nome.split(' ')[0]}</strong> foi<br />
              atualizado com sua avaliação técnica.
            </p>

            {/* Nota geral animada */}
            <div style={{
              width:'100%', padding:'24px', borderRadius:'20px', marginBottom:'28px',
              background:'rgba(0,255,136,0.04)', border:'1px solid rgba(0,255,136,0.15)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div style={{ textAlign:'left' }}>
                <p style={{ margin:'0 0 2px', fontSize:'10px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(255,255,255,0.3)', textTransform:'uppercase' }}>
                  Nota geral
                </p>
                <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.25)' }}>
                  {atleta.nome} · {hoje}
                </p>
              </div>
              <div style={{
                fontSize:'52px', fontWeight:900,
                color: notaColor(notaFinal),
                fontVariantNumeric:'tabular-nums', lineHeight:1,
                textShadow:`0 0 40px ${notaColor(notaFinal)}66`,
              }}>
                {notaGerAnim}
              </div>
            </div>

            {/* Resumo visual final */}
            <div style={{
              width:'100%', padding:'16px', borderRadius:'16px', marginBottom:'28px',
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)',
              display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px',
            }}>
              {ATRIBUTOS.map(attr => (
                <div key={attr.key} style={{ display:'flex', flexDirection:'column', gap:'2px', alignItems:'center' }}>
                  <span style={{ fontSize:'14px' }}>{attr.icon}</span>
                  <span style={{ fontSize:'16px', fontWeight:900, color: notaColor(notas[attr.key]), fontVariantNumeric:'tabular-nums' }}>
                    {notas[attr.key]}
                  </span>
                  <span style={{ fontSize:'9px', fontWeight:600, color:'rgba(255,255,255,0.25)', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                    {attr.label.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'10px' }}>
              <button className="btn-primary" onClick={resetar}>
                + Avaliar outro atleta
              </button>
              <Link href="/treinador/perfil" style={{ textDecoration:'none' }}>
                <button className="btn-ghost">
                  Ir para meu perfil →
                </button>
              </Link>
            </div>

            <p style={{ marginTop:'24px', fontSize:'10px', color:'rgba(255,255,255,0.1)' }}>
              ⚽ MEU <span style={{ color:'rgba(0,255,136,0.3)' }}>CRAQUE</span> · Construindo o futebol brasileiro.
            </p>
          </div>
        )}

      </div>
      <TreinadorBottomNav />
    </main>
  )
}

export default function AvaliarPage() {
  return (
    <Suspense>
      <AvaliarPageInner />
    </Suspense>
  )
}
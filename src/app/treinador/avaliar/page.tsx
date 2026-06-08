'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import TreinadorBottomNav from '@/components/TreinadorBottomNav'
import {
  VARIANTES, BLOCO_PERFIL,
  getVariante, getTodasPerguntas, calcScoutScore,
  type VarianteKey, type QuestionDef,
} from '@/lib/questionnaire'

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

type Step = 'buscar' | 'confirmar' | 'avaliar' | 'observacao' | 'sucesso'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getIdadeExata(dataNasc?: string): number {
  if (!dataNasc) return 0
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

function calcularCategoria(dataNasc?: string): string {
  if (!dataNasc) return ''
  const i = getIdadeExata(dataNasc)
  if (i <= 7)  return 'Sub-7'
  if (i <= 8)  return 'Sub-8'
  if (i <= 9)  return 'Sub-9'
  if (i <= 10) return 'Sub-10'
  if (i <= 11) return 'Sub-11'
  if (i <= 12) return 'Sub-12'
  if (i <= 13) return 'Sub-13'
  if (i <= 14) return 'Sub-14'
  if (i <= 15) return 'Sub-15'
  if (i <= 16) return 'Sub-16'
  if (i <= 17) return 'Sub-17'
  if (i <= 18) return 'Sub-18'
  if (i <= 19) return 'Sub-19'
  if (i <= 20) return 'Sub-20'
  return 'Sub-20+'
}

// Fase descritiva para exibição
function getFaseLabel(dataNasc?: string): { fase: string; cor: string; bg: string; borda: string } {
  if (!dataNasc) return { fase: '—', cor: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.04)', borda: 'rgba(255,255,255,0.1)' }
  const i = getIdadeExata(dataNasc)
  if (i <= 10) return { fase: 'INICIAÇÃO · Sub-7 ao Sub-10',    cor: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  borda: 'rgba(96,165,250,0.25)'  }
  if (i <= 14) return { fase: 'FORMAÇÃO · Sub-11 ao Sub-14',    cor: '#a78bfa', bg: 'rgba(167,139,250,0.08)', borda: 'rgba(167,139,250,0.25)' }
  if (i <= 17) return { fase: 'COMPETIÇÃO · Sub-15 ao Sub-17',  cor: '#fb923c', bg: 'rgba(251,146,60,0.08)',  borda: 'rgba(251,146,60,0.25)'  }
  return           { fase: 'SUB-20 · Elite Pré-Profissional',   cor: '#00FF88', bg: 'rgba(0,255,136,0.08)',   borda: 'rgba(0,255,136,0.3)'    }
}

// Posição em português completo + ícone
function getPosicaoInfo(pos: string): { nome: string; icone: string; grupo: string } {
  const map: Record<string, { nome: string; icone: string; grupo: string }> = {
    'Goleiro':          { nome: 'Goleiro',          icone: '🧤', grupo: 'Defensor' },
    'Zagueiro':         { nome: 'Zagueiro',          icone: '🛡', grupo: 'Defensor' },
    'Lateral Direito':  { nome: 'Lateral Direito',   icone: '➡', grupo: 'Defensor' },
    'Lateral Esquerdo': { nome: 'Lateral Esquerdo',  icone: '⬅', grupo: 'Defensor' },
    'Volante':          { nome: 'Volante',            icone: '⚙', grupo: 'Meio-campo' },
    'Meia':             { nome: 'Meia',               icone: '🎯', grupo: 'Meio-campo' },
    'Meia-Atacante':    { nome: 'Meia-Atacante',     icone: '⚡', grupo: 'Meio-campo' },
    'Ponta Direita':    { nome: 'Ponta Direita',      icone: '💨', grupo: 'Atacante' },
    'Ponta Esquerda':   { nome: 'Ponta Esquerda',     icone: '💨', grupo: 'Atacante' },
    'Atacante':         { nome: 'Atacante',           icone: '🔥', grupo: 'Atacante' },
    'Centro-Avante':    { nome: 'Centro-Avante',      icone: '⚽', grupo: 'Atacante' },
  }
  return map[pos] ?? { nome: pos, icone: '⚽', grupo: 'Atleta' }
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

const NOTA_LABELS = ['', 'Fraco', 'Regular', 'Bom', 'Muito Bom', 'Excelente']
const NOTA_COLORS = ['rgba(255,255,255,0.18)', '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#00FF88']

function notaLabel(n: number): string { return NOTA_LABELS[n] ?? '—' }
function notaColor(n: number): string {
  // para score 0-100
  if (n === 0)  return 'rgba(255,255,255,0.2)'
  if (n >= 80)  return '#00FF88'
  if (n >= 60)  return '#22c55e'
  if (n >= 40)  return '#eab308'
  if (n >= 20)  return '#f59e0b'
  return '#ef4444'
}

function calcGeral(notas: Record<string, number>): number {
  const vals = Object.values(notas).filter(v => v > 0)
  if (vals.length === 0) return 0
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.round(((avg - 1) / 4) * 100)
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

// ── Segment Bar 1–5 ───────────────────────────────────────────────────────────

function SegmentBar({
  icon, label, value, onChange,
}: {
  icon: string; label: string; value: number; onChange: (v: number) => void
}) {
  const SEGS = 5

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '14px', lineHeight: 1 }}>{icon}</span>
          <span style={{
            fontSize: '11px', fontWeight: 800,
            color: 'rgba(255,255,255,0.6)', letterSpacing: '0.09em', textTransform: 'uppercase',
          }}>
            {label}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {value > 0 && (
            <span style={{
              fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
              color: NOTA_COLORS[value],
              transition: 'color 0.2s',
            }}>
              {notaLabel(value)}
            </span>
          )}
          <span style={{
            fontSize: '17px', fontWeight: 900, fontVariantNumeric: 'tabular-nums',
            minWidth: '18px', textAlign: 'right',
            color: value > 0 ? NOTA_COLORS[value] : 'rgba(255,255,255,0.12)',
            transition: 'color 0.2s',
          }}>
            {value > 0 ? value : '—'}
          </span>
        </div>
      </div>

      {/* 5 segmentos */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {Array.from({ length: SEGS }, (_, i) => {
          const seg = i + 1          // 1–5
          const isActive = value >= seg
          const color = isActive ? NOTA_COLORS[seg] : 'rgba(255,255,255,0.055)'
          return (
            <button
              key={i}
              className="seg-btn"
              onClick={() => onChange(seg)}
              style={{
                flex: 1, height: '34px', borderRadius: '6px', border: 'none',
                background: color, cursor: 'pointer',
                transition: 'background 0.12s, box-shadow 0.12s',
                boxShadow: isActive ? `0 0 8px ${color}88` : 'none',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, count, total }: {
  title: string; subtitle?: string; count: number; total: number
}) {
  const done = total === count
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 18px',
      background: done ? 'rgba(0,255,136,0.06)' : 'rgba(255,255,255,0.03)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div>
        <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: done ? '#00FF88' : 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
            {subtitle}
          </p>
        )}
      </div>
      <div style={{
        padding: '3px 10px', borderRadius: '100px', fontSize: '10px', fontWeight: 800,
        background: done ? 'rgba(0,255,136,0.12)' : 'rgba(255,255,255,0.06)',
        color: done ? '#00FF88' : 'rgba(255,255,255,0.35)',
        border: done ? '1px solid rgba(0,255,136,0.25)' : '1px solid rgba(255,255,255,0.08)',
        letterSpacing: '0.06em',
      }}>
        {count}/{total} {done ? '✓' : ''}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

function AvaliarPageInner() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [treinadorNome, setTreinadorNome] = useState('')
  const [nomeEscola,    setNomeEscola]    = useState('')

  const [step,       setStep]       = useState<Step>('buscar')
  const [atletaId,   setAtletaId]   = useState(() => searchParams.get('id') ?? '')
  const [atleta,     setAtleta]     = useState<AtletaInfo | null>(null)
  const [notas,      setNotas]      = useState<Record<string, number>>({})
  const [observacao, setObservacao] = useState('')
  const [notaFinal,  setNotaFinal]  = useState(0)

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const notaGerAnim = useCounter(step === 'sucesso' ? notaFinal : 0, 400, 1100)
  const inputRef    = useRef<HTMLInputElement>(null)

  // Variante determinada pelo atleta (dataNasc + posicao)
  const variante: VarianteKey = atleta?.dataNasc && atleta?.posicao
    ? getVariante(atleta.dataNasc, atleta.posicao)
    : 'iniciacao'

  const blocoA         = VARIANTES[variante].blocoA
  const blocoC         = VARIANTES[variante].blocoC
  const varianteLabel  = VARIANTES[variante].label
  const todasPerguntas = atleta ? getTodasPerguntas(variante) : []
  const totalPerguntas = todasPerguntas.length  // 20

  const faseInfo    = atleta?.dataNasc ? getFaseLabel(atleta.dataNasc) : null
  const posInfo     = atleta?.posicao  ? getPosicaoInfo(atleta.posicao) : null

  // Contagens por bloco
  const contTecnico  = blocoA.filter(q => (notas[q.key] ?? 0) > 0).length
  const contPerfil   = BLOCO_PERFIL.filter(q => (notas[q.key] ?? 0) > 0).length
  const contContexto = blocoC.filter(q => (notas[q.key] ?? 0) > 0).length
  const totalPreench = contTecnico + contPerfil + contContexto
  const todasPreench = atleta ? totalPreench === totalPerguntas : false

  const notaGeral = calcGeral(notas)

  const hoje       = new Date().toLocaleDateString('pt-BR')
  const categoria  = atleta ? calcularCategoria(atleta.dataNasc) : ''
  const initials   = atleta ? getInitials(atleta.nome) : ''

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

  // Reset notas quando atleta muda
  useEffect(() => { setNotas({}) }, [atleta])

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
    const res = await fetch('/api/treinador/avaliar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId:  atleta.profileId,
        respostas:  notas,
        variante,
        observacao,
      }),
    })
    const data = await res.json() as { ok?: boolean; notaGeral?: number; error?: string }
    if (!res.ok || data.error) {
      setError(data.error ?? 'Erro ao registrar avaliação.')
      setLoading(false)
      return
    }
    setNotaFinal(data.notaGeral ?? calcScoutScore(notas, variante))
    setLoading(false)
    setStep('sucesso')
  }

  function resetar() {
    setAtleta(null)
    setAtletaId('')
    setNotas({})
    setObservacao('')
    setNotaFinal(0)
    setError(null)
    setStep('buscar')
  }

  function setNota(key: string, val: number) {
    setNotas(prev => ({ ...prev, [key]: val }))
  }

  // Top 3 pontos fortes para o sucesso
  const pontosFortes = atleta
    ? [...todasPerguntas]
        .filter(q => (notas[q.key] ?? 0) >= 4)
        .sort((a, b) => (notas[b.key] ?? 0) - (notas[a.key] ?? 0))
        .slice(0, 3)
    : [] as QuestionDef[]

  const aMelhorar = atleta
    ? [...todasPerguntas]
        .filter(q => (notas[q.key] ?? 0) > 0 && (notas[q.key] ?? 0) <= 2)
        .sort((a, b) => (notas[a.key] ?? 0) - (notas[b.key] ?? 0))
        .slice(0, 3)
    : [] as QuestionDef[]

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

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:'420px' }}>

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
            ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
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
              <h1 style={{ margin:'0 0 8px', fontSize:'28px', fontWeight:900, color:'white', letterSpacing:'-0.03em' }}>
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
                <p style={{ margin:'8px 0 0', fontSize:'11px', color:'rgba(255,255,255,0.22)' }}>
                  O atleta encontra o ID no próprio perfil.
                </p>
              </div>

              {error && (
                <div style={{ padding:'12px 16px', borderRadius:'12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', fontSize:'13px', color:'#f87171' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading || atletaId.length < 4}>
                {loading ? 'Buscando…' : 'Buscar atleta →'}
              </button>
            </form>

            <div style={{
              marginTop:'28px', padding:'16px 18px', borderRadius:'14px',
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)',
              display:'flex', alignItems:'center', gap:'14px',
            }}>
              <div style={{
                width:'40px', height:'40px', borderRadius:'10px', flexShrink:0,
                background:'rgba(0,255,136,0.07)', border:'1px solid rgba(0,255,136,0.15)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px',
              }}>📋</div>
              <div>
                <p style={{ margin:'0 0 2px', fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.5)' }}>
                  Questionário personalizado
                </p>
                <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.25)', lineHeight:1.5 }}>
                  20 perguntas · Escala 1–5 · Adaptado à<br />
                  fase etária e posição do atleta
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
            <div style={{ marginBottom:'20px' }}>
              <p style={{ margin:'0 0 6px', fontSize:'11px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(0,255,136,0.7)', textTransform:'uppercase' }}>
                Atleta encontrado
              </p>
              <h1 style={{ margin:'0 0 4px', fontSize:'24px', fontWeight:900, color:'white', letterSpacing:'-0.03em' }}>
                Confirme antes de avaliar
              </h1>
              <p style={{ margin:0, fontSize:'13px', color:'rgba(255,255,255,0.3)', lineHeight:1.5 }}>
                O questionário é gerado automaticamente com base na posição e idade do atleta. Verifique os dados abaixo.
              </p>
            </div>

            {/* Card do atleta */}
            <div style={{
              borderRadius:'16px', overflow:'hidden',
              background:'linear-gradient(160deg,#122018 0%,#0a1912 45%,#050e08 100%)',
              border:'1px solid rgba(0,255,136,0.18)',
              boxShadow:'0 20px 50px rgba(0,0,0,0.8)',
              marginBottom:'14px',
            }}>
              <div style={{ position:'relative', height:'140px', overflow:'hidden' }}>
                {atleta.avatar_url ? (
                  <img src={atleta.avatar_url} alt={atleta.nome}
                    style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 18%' }} />
                ) : (
                  <div style={{ width:'100%', height:'100%', background:'linear-gradient(160deg,#1a3828 0%,#050e08 100%)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ width:'64px', height:'64px', borderRadius:'50%', background:'linear-gradient(145deg,#1a7a42,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', fontWeight:900, color:'white' }}>
                      {initials}
                    </div>
                  </div>
                )}
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(5,14,8,1) 0%,rgba(5,14,8,0.55) 40%,transparent 70%)' }} />
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'0 16px 12px', display:'flex', alignItems:'flex-end', justifyContent:'space-between' }}>
                  <div>
                    <p style={{ margin:0, fontSize:'20px', fontWeight:900, color:'white', lineHeight:1, textShadow:'0 2px 12px rgba(0,0,0,0.9)' }}>{atleta.nome.split(' ')[0]}</p>
                    {atleta.nome.split(' ').slice(1).join(' ') && (
                      <p style={{ margin:0, fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.12em' }}>{atleta.nome.split(' ').slice(1).join(' ')}</p>
                    )}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <span style={{ fontSize:'9px', color:'rgba(255,255,255,0.3)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', display:'block' }}>ID</span>
                    <span style={{ fontSize:'14px', fontWeight:900, color:'white', letterSpacing:'0.10em' }}>{atleta.athlete_id.replace('MC-', '')}</span>
                  </div>
                </div>
              </div>
              <div style={{ padding:'10px 16px 12px', display:'flex', alignItems:'center', gap:'8px' }}>
                <span style={{ fontSize:'18px' }}>{posInfo?.icone}</span>
                <span style={{ fontSize:'13px', fontWeight:800, color:'white' }}>{atleta.posicao}</span>
                <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.3)', fontWeight:500 }}>·</span>
                <span style={{ fontSize:'12px', fontWeight:700, color:'rgba(255,255,255,0.5)' }}>{categoria}</span>
                <span style={{ fontSize:'12px', color:'rgba(255,255,255,0.25)', marginLeft:'auto' }}>{getIdadeExata(atleta.dataNasc)} anos</span>
              </div>
            </div>

            {/* ⚠️ BANNER DE ATENÇÃO — Questionário que será aplicado */}
            {faseInfo && posInfo && (
              <div style={{
                borderRadius:'16px', overflow:'hidden',
                border:`1.5px solid ${faseInfo.borda}`,
                marginBottom:'16px',
              }}>
                {/* Cabeçalho vermelho de atenção */}
                <div style={{
                  padding:'10px 16px',
                  background:'rgba(239,68,68,0.12)',
                  borderBottom:'1px solid rgba(239,68,68,0.2)',
                  display:'flex', alignItems:'center', gap:'8px',
                }}>
                  <span style={{ fontSize:'15px' }}>⚠️</span>
                  <span style={{ fontSize:'11px', fontWeight:900, color:'#f87171', letterSpacing:'0.10em', textTransform:'uppercase' }}>
                    Verifique o questionário antes de continuar
                  </span>
                </div>

                {/* Posição + Fase */}
                <div style={{ padding:'14px 16px', background:faseInfo.bg }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                    <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:`${faseInfo.borda}30`, border:`1px solid ${faseInfo.borda}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>
                      {posInfo.icone}
                    </div>
                    <div>
                      <p style={{ margin:0, fontSize:'16px', fontWeight:900, color:'white', letterSpacing:'-0.01em' }}>
                        {atleta.posicao}
                      </p>
                      <p style={{ margin:0, fontSize:'11px', fontWeight:700, color:faseInfo.cor, letterSpacing:'0.06em' }}>
                        {faseInfo.fase}
                      </p>
                    </div>
                  </div>

                  <div style={{ height:'1px', background:'rgba(255,255,255,0.06)', marginBottom:'12px' }} />

                  <p style={{ margin:'0 0 8px', fontSize:'10px', fontWeight:800, color:'rgba(255,255,255,0.3)', letterSpacing:'0.12em', textTransform:'uppercase' }}>
                    As 20 perguntas serão:
                  </p>

                  <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                    {[
                      { icone:'⚽', bloco:'Bloco A — Técnico', qtd:'10 perguntas', desc:`Fundamentos específicos de ${atleta.posicao}`, cor:'#60a5fa' },
                      { icone:'🎭', bloco:'Bloco B — Perfil',  qtd:'6 perguntas',  desc:'Personalidade e comportamento (igual para todos)', cor:'#a78bfa' },
                      { icone:'💪', bloco:'Bloco C — Físico',  qtd:'4 perguntas',  desc:`Condicionamento físico para ${posInfo.grupo}`, cor:faseInfo.cor },
                    ].map(b => (
                      <div key={b.bloco} style={{
                        display:'flex', alignItems:'center', gap:'10px',
                        padding:'8px 12px', borderRadius:'10px',
                        background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
                      }}>
                        <span style={{ fontSize:'14px', flexShrink:0 }}>{b.icone}</span>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ margin:0, fontSize:'11px', fontWeight:800, color:'rgba(255,255,255,0.7)' }}>{b.bloco}</p>
                          <p style={{ margin:0, fontSize:'10px', color:'rgba(255,255,255,0.3)', lineHeight:1.4 }}>{b.desc}</p>
                        </div>
                        <span style={{
                          flexShrink:0, padding:'2px 8px', borderRadius:'100px',
                          background:`${b.cor}18`, border:`1px solid ${b.cor}40`,
                          fontSize:'10px', fontWeight:800, color:b.cor,
                        }}>{b.qtd}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    marginTop:'12px', padding:'10px 12px', borderRadius:'10px',
                    background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)',
                  }}>
                    <p style={{ margin:0, fontSize:'11px', color:'#f87171', fontWeight:700, lineHeight:1.5 }}>
                      🚫 Se a posição ou categoria estiver errada, <strong>não avalie</strong>. Peça ao atleta para corrigir o cadastro primeiro — uma avaliação errada prejudica o OVR do atleta.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              <button className="btn-primary" onClick={() => setStep('avaliar')}>
                ✔ Dados corretos — iniciar avaliação
              </button>
              <button className="btn-ghost" onClick={resetar}>
                ← Buscar outro atleta
              </button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            STEP: AVALIAR — 20 perguntas
        ════════════════════════════════════════ */}
        {step === 'avaliar' && atleta && (
          <div className="fade-page">

            {/* ══ STICKY CONTEXT HEADER ══ */}
            <div style={{
              position:'sticky', top:0, zIndex:50,
              marginLeft:'-24px', marginRight:'-24px', marginBottom:'16px',
              paddingLeft:'24px', paddingRight:'24px',
              paddingTop:'12px', paddingBottom:'12px',
              background:'rgba(5,14,8,0.96)',
              backdropFilter:'blur(20px)',
              borderBottom:`1px solid ${faseInfo?.borda ?? 'rgba(0,255,136,0.15)'}`,
            }}>
              {/* Linha 1: Atleta + Progresso */}
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                {atleta.avatar_url
                  ? <img src={atleta.avatar_url} alt={atleta.nome} style={{ width:'36px', height:'36px', borderRadius:'50%', objectFit:'cover', objectPosition:'center 15%', flexShrink:0 }} />
                  : <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(145deg,#1a7a42,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:900, color:'white', flexShrink:0 }}>{initials}</div>
                }
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:'14px', fontWeight:800, color:'white', letterSpacing:'-0.01em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{atleta.nome}</p>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <span style={{ fontSize:'9px', fontWeight:700, letterSpacing:'0.10em', textTransform:'uppercase', color:'rgba(255,255,255,0.25)', display:'block' }}>Progresso</span>
                  <span style={{ fontSize:'16px', fontWeight:900, fontVariantNumeric:'tabular-nums', color: totalPreench === totalPerguntas ? '#00FF88' : 'rgba(255,255,255,0.5)' }}>
                    {totalPreench}/{totalPerguntas}
                  </span>
                </div>
              </div>

              {/* Linha 2: Posição + Fase — DESTAQUE */}
              <div style={{
                display:'flex', alignItems:'center', gap:'8px',
                padding:'6px 12px', borderRadius:'8px',
                background: faseInfo ? `${faseInfo.bg}` : 'rgba(0,255,136,0.05)',
                border: `1px solid ${faseInfo?.borda ?? 'rgba(0,255,136,0.2)'}`,
              }}>
                <span style={{ fontSize:'14px', flexShrink:0 }}>{posInfo?.icone}</span>
                <span style={{ fontSize:'11px', fontWeight:900, color:'white' }}>{atleta.posicao}</span>
                <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)' }}>·</span>
                <span style={{ fontSize:'11px', fontWeight:700, color: faseInfo?.cor ?? '#00FF88' }}>{faseInfo?.fase}</span>
                {categoria && (
                  <>
                    <span style={{ fontSize:'10px', color:'rgba(255,255,255,0.3)' }}>·</span>
                    <span style={{ fontSize:'10px', fontWeight:700, color:'rgba(255,255,255,0.45)', letterSpacing:'0.06em' }}>{categoria}</span>
                  </>
                )}
              </div>
            </div>

            {/* Título */}
            <div style={{ marginBottom:'16px' }}>
              <p style={{ margin:'0 0 2px', fontSize:'11px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(0,255,136,0.6)', textTransform:'uppercase' }}>
                Relatório técnico
              </p>
              <h2 style={{ margin:'0 0 4px', fontSize:'20px', fontWeight:900, color:'white', letterSpacing:'-0.02em' }}>
                Avalie cada atributo
              </h2>
            </div>

            {/* ── Bloco A: Técnico ── */}
            <div style={{
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'18px', overflow:'hidden', marginBottom:'12px',
            }}>
              <SectionHeader
                title="⚽ Bloco A — Técnico (10 perguntas)"
                subtitle={`Específico para ${atleta.posicao} · ${faseInfo?.fase ?? varianteLabel}`}
                count={contTecnico}
                total={blocoA.length}
              />
              {blocoA.map((attr, i) => (
                <div key={attr.key} style={{
                  padding:'16px 18px',
                  borderBottom: i < blocoA.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <SegmentBar icon={attr.icon} label={attr.label} value={notas[attr.key] ?? 0} onChange={val => setNota(attr.key, val)} />
                </div>
              ))}
            </div>

            {/* ── Bloco B: Perfil ── */}
            <div style={{
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'18px', overflow:'hidden', marginBottom:'12px',
            }}>
              <SectionHeader
                title="🎭 Bloco B — Perfil (6 perguntas)"
                subtitle="Comportamento e personalidade — igual para todas as posições"
                count={contPerfil}
                total={BLOCO_PERFIL.length}
              />
              {BLOCO_PERFIL.map((attr, i) => (
                <div key={attr.key} style={{
                  padding:'16px 18px',
                  borderBottom: i < BLOCO_PERFIL.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <SegmentBar icon={attr.icon} label={attr.label} value={notas[attr.key] ?? 0} onChange={val => setNota(attr.key, val)} />
                </div>
              ))}
            </div>

            {/* ── Bloco C: Contextual ── */}
            <div style={{
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'18px', overflow:'hidden', marginBottom:'20px',
            }}>
              <SectionHeader
                title="💪 Bloco C — Físico (4 perguntas)"
                subtitle={`Condicionamento físico para ${posInfo?.grupo ?? atleta.posicao} · ${faseInfo?.fase ?? ''}`}
                count={contContexto}
                total={blocoC.length}
              />
              {blocoC.map((attr, i) => (
                <div key={attr.key} style={{
                  padding:'16px 18px',
                  borderBottom: i < blocoC.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <SegmentBar icon={attr.icon} label={attr.label} value={notas[attr.key] ?? 0} onChange={val => setNota(attr.key, val)} />
                </div>
              ))}
            </div>

            {!todasPreench && (
              <p style={{ margin:'0 0 16px', fontSize:'12px', color:'rgba(255,255,255,0.3)', textAlign:'center' }}>
                Avalie todos os {totalPerguntas} atributos para continuar — faltam {totalPerguntas - totalPreench}
              </p>
            )}

            <button className="btn-primary" onClick={() => setStep('observacao')} disabled={!todasPreench}>
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

            <div style={{ marginBottom:'20px' }}>
              <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:'rgba(255,255,255,0.4)', letterSpacing:'0.10em', textTransform:'uppercase', marginBottom:'10px' }}>
                Observação do treinador
                <span style={{ fontWeight:500, color:'rgba(255,255,255,0.2)', marginLeft:'8px', letterSpacing:0, textTransform:'none', fontSize:'10px' }}>(opcional)</span>
              </label>
              <textarea
                value={observacao}
                onChange={e => setObservacao(e.target.value)}
                placeholder="Descreva as principais qualidades e pontos de desenvolvimento do atleta…"
                rows={5}
                style={{
                  width:'100%', padding:'14px 16px', boxSizing:'border-box', borderRadius:'14px',
                  background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)',
                  color:'rgba(255,255,255,0.75)', fontSize:'16px', lineHeight:1.7,
                  fontFamily:'system-ui, sans-serif', transition:'border-color .2s',
                }}
              />
            </div>

            {/* Resumo compacto por bloco */}
            <div style={{
              marginBottom:'20px', padding:'16px',
              background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)',
              borderRadius:'14px',
            }}>
              <p style={{ margin:'0 0 12px', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(255,255,255,0.28)', textTransform:'uppercase' }}>
                Resumo — 20 atributos avaliados
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {/* Médias por bloco */}
                {[
                  { label: '⚽ Técnico',    qs: blocoA },
                  { label: '🎭 Perfil',     qs: BLOCO_PERFIL },
                  { label: '💪 Contextual', qs: blocoC },
                ].map(({ label, qs }) => {
                  const vals = qs.map(q => notas[q.key] ?? 0).filter(v => v > 0)
                  const avg  = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
                  const pct  = avg > 0 ? Math.round(((avg - 1) / 4) * 100) : 0
                  return (
                    <div key={label} style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                      <span style={{ fontSize:'11px', color:'rgba(255,255,255,0.45)', minWidth:'90px' }}>{label}</span>
                      <div style={{ flex:1, height:'4px', background:'rgba(255,255,255,0.07)', borderRadius:'2px', overflow:'hidden' }}>
                        <div style={{ height:'100%', background: notaColor(pct), width:`${pct}%`, borderRadius:'2px' }} />
                      </div>
                      <span style={{ fontSize:'13px', fontWeight:900, color: notaColor(pct), minWidth:'28px', textAlign:'right', fontVariantNumeric:'tabular-nums' }}>
                        {pct || '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Assinatura oficial */}
            <div className="stamp" style={{
              marginBottom:'24px', padding:'20px',
              background:'rgba(0,255,136,0.04)', border:'1px solid rgba(0,255,136,0.18)',
              borderRadius:'16px', position:'relative', overflow:'hidden',
            }}>
              <div style={{ position:'absolute', top:'50%', right:'16px', transform:'translateY(-50%)', fontSize:'56px', opacity:0.04, lineHeight:1, pointerEvents:'none' }}>✓</div>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'14px' }}>
                <div>
                  <p style={{ margin:'0 0 2px', fontSize:'9px', fontWeight:800, letterSpacing:'0.18em', color:'rgba(0,255,136,0.55)', textTransform:'uppercase' }}>Avaliação oficial</p>
                  <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.3)', fontWeight:500 }}>Meu Craque · {hoje}</p>
                </div>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'rgba(0,255,136,0.12)', border:'1px solid rgba(0,255,136,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>✓</div>
              </div>
              <div style={{ height:'1px', background:'rgba(0,255,136,0.12)', marginBottom:'14px' }} />
              <p style={{ margin:'0 0 2px', fontSize:'11px', color:'rgba(255,255,255,0.3)', fontWeight:500 }}>Avaliado por</p>
              <p style={{ margin:'0 0 2px', fontSize:'16px', fontWeight:800, color:'white', letterSpacing:'-0.01em' }}>{treinadorNome}</p>
              {nomeEscola && <p style={{ margin:0, fontSize:'12px', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>{nomeEscola}</p>}
            </div>

            {error && (
              <div style={{ marginBottom:'16px', padding:'12px 16px', borderRadius:'12px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', fontSize:'13px', color:'#f87171' }}>
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

            <div className="ring-pop" style={{
              width:'100px', height:'100px', borderRadius:'50%', marginBottom:'24px',
              background:'linear-gradient(145deg,rgba(0,255,136,0.15),rgba(0,255,136,0.05))',
              border:'2px solid rgba(0,255,136,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 60px rgba(0,255,136,0.25), 0 0 120px rgba(0,255,136,0.10)',
            }}>
              <div style={{ fontSize:'42px', lineHeight:1 }}>✓</div>
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
              width:'100%', padding:'24px', borderRadius:'20px', marginBottom:'16px',
              background:'rgba(0,255,136,0.04)', border:'1px solid rgba(0,255,136,0.15)',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <div style={{ textAlign:'left' }}>
                <p style={{ margin:'0 0 2px', fontSize:'10px', fontWeight:700, letterSpacing:'0.14em', color:'rgba(255,255,255,0.3)', textTransform:'uppercase' }}>Nota geral</p>
                <p style={{ margin:0, fontSize:'11px', color:'rgba(255,255,255,0.25)' }}>{atleta.nome} · {hoje}</p>
              </div>
              <div style={{ fontSize:'52px', fontWeight:900, color: notaColor(notaFinal), fontVariantNumeric:'tabular-nums', lineHeight:1, textShadow:`0 0 40px ${notaColor(notaFinal)}66` }}>
                {notaGerAnim}
              </div>
            </div>

            {/* Pontos fortes */}
            {pontosFortes.length > 0 && (
              <div style={{ width:'100%', padding:'16px', borderRadius:'16px', marginBottom:'12px', background:'rgba(0,255,136,0.04)', border:'1px solid rgba(0,255,136,0.15)', textAlign:'left' }}>
                <p style={{ margin:'0 0 10px', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(0,255,136,0.6)', textTransform:'uppercase' }}>
                  ✦ Pontos fortes
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {pontosFortes.map(q => (
                    <div key={q.key} style={{
                      display:'flex', alignItems:'center', gap:'5px',
                      padding:'5px 12px', borderRadius:'100px', fontSize:'12px', fontWeight:700,
                      background:'rgba(0,255,136,0.1)', border:'1px solid rgba(0,255,136,0.2)',
                      color:'#00FF88',
                    }}>
                      <span>{q.icon}</span>
                      <span>{q.label}</span>
                      <span style={{ opacity:0.7 }}>·{notas[q.key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* A melhorar */}
            {aMelhorar.length > 0 && (
              <div style={{ width:'100%', padding:'16px', borderRadius:'16px', marginBottom:'20px', background:'rgba(239,68,68,0.03)', border:'1px solid rgba(239,68,68,0.12)', textAlign:'left' }}>
                <p style={{ margin:'0 0 10px', fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', color:'rgba(239,68,68,0.7)', textTransform:'uppercase' }}>
                  ▲ Precisa melhorar
                </p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                  {aMelhorar.map(q => (
                    <div key={q.key} style={{
                      display:'flex', alignItems:'center', gap:'5px',
                      padding:'5px 12px', borderRadius:'100px', fontSize:'12px', fontWeight:700,
                      background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.18)',
                      color:'#f87171',
                    }}>
                      <span>{q.icon}</span>
                      <span>{q.label}</span>
                      <span style={{ opacity:0.7 }}>·{notas[q.key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
              ⚽ MEUCRAQUE.com · Construindo o futebol brasileiro.
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

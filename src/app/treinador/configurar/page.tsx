'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const ESPECIALIDADES = [
  'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Adulto',
  'Preparação Física', 'Goleiros', 'Polivalente',
]

type Step = 'foto' | 'identidade' | 'bio' | 'redes' | 'concluido'

const STEPS: Step[] = ['foto', 'identidade', 'bio', 'redes']
const STEP_NUM: Record<Step, number> = { foto: 1, identidade: 2, bio: 3, redes: 4, concluido: 4 }

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

// ── Animated counter ──────────────────────────────────────────────────────────
function useCounter(target: number, delay = 300, duration = 800) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (target === 0) return
    const t = setTimeout(() => {
      const s = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - s) / duration, 1)
        setV(Math.round((1 - Math.pow(1 - p, 3)) * target))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, delay)
    return () => clearTimeout(t)
  }, [target, delay, duration])
  return v
}

/** Comprime a imagem para JPEG no browser antes do upload */
async function compressImage(file: File, maxPx = 900, quality = 0.82): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1)
      const w = Math.round(img.width  * ratio)
      const h = Math.round(img.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      canvas.toBlob(blob => resolve(blob ?? file), 'image/jpeg', quality)
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

export default function TreinadorConfigurarPage() {
  const router  = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [userId,      setUserId]      = useState('')
  const [nome,        setNome]        = useState('')
  const [step,        setStep]        = useState<Step>('foto')
  const [saving,      setSaving]      = useState(false)
  const [saveErr,     setSaveErr]     = useState<string | null>(null)
  const [authReady,   setAuthReady]   = useState(false)

  // form fields
  const [fotoPreview,    setFotoPreview]    = useState<string | null>(null)
  const [fotoFile,       setFotoFile]       = useState<File | null>(null)
  const [especialidade,  setEspec]          = useState('')
  const [cidade,         setCidade]         = useState('')
  const [anosExp,        setAnosExp]        = useState('')
  const [bio,            setBio]            = useState('')
  const [instagram,      setInstagram]      = useState('')
  const [youtube,        setYoutube]        = useState('')
  const [savedAvatarUrl, setSavedAvatarUrl] = useState<string | null>(null)
  const [treinadorId,    setTreinadorId]    = useState<string | null>(null)

  // completion counters (all zero = new trainer)
  const animAval = useCounter(step === 'concluido' ? 0 : 0, 600)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      setNome(user.user_metadata?.nome ?? 'Treinador')

      // Busca dados existentes do banco para pré-popular o formulário
      const { data: profile } = await supabase
        .from('profiles')
        .select('athlete_id, bio, especialidade, cidade, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        const p = profile as Record<string, unknown>
        if (p.athlete_id)   setTreinadorId(p.athlete_id as string)
        if (p.bio)          setBio(p.bio as string)
        if (p.especialidade) setEspec(p.especialidade as string)
        if (p.cidade)       setCidade(p.cidade as string)
        if (p.avatar_url)   setSavedAvatarUrl(p.avatar_url as string)
      }

      setAuthReady(true)
    }
    init()
  }, [router])

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setFotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadFoto(): Promise<string | null> {
    if (!fotoFile) return null
    try {
      const compressed = await compressImage(fotoFile)
      const fd = new FormData()
      fd.append('file', new File([compressed], 'photo.jpg', { type: 'image/jpeg' }))
      const res = await fetch('/api/atleta/upload-foto', { method: 'POST', body: fd })
      if (!res.ok) return null
      const json = await res.json() as { url?: string }
      return json.url ?? null
    } catch {
      return null
    }
  }

  async function handleConcluir() {
    setSaving(true)
    setSaveErr(null)

    try {
      let avatarUrl = savedAvatarUrl
      if (fotoFile) {
        avatarUrl = await uploadFoto()
        if (avatarUrl) setSavedAvatarUrl(avatarUrl)
      }

      const res = await fetch('/api/treinador/salvar-perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          avatarUrl,
          especialidade: especialidade || null,
          cidade:        cidade        || null,
          bio:           bio           || null,
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(json.error ?? 'Não foi possível salvar. Tente novamente.')
      }

      setStep('concluido')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.'
      console.error('[treinador/configurar]', err)
      setSaveErr(msg)
    } finally {
      setSaving(false)
    }
  }

  const primeiroNome = nome.split(' ')[0]
  const initials     = getInitials(nome)
  const stepNum      = STEP_NUM[step]

  if (!authReady) {
    return <main style={{ background: '#030a05', minHeight: '100dvh' }} />
  }

  // ── STYLES ────────────────────────────────────────────────────────────────────
  const inp: React.CSSProperties = {
    width: '100%', padding: '14px 16px', borderRadius: '12px',
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: 'white', fontSize: '16px', outline: 'none',
    fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box',
    transition: 'border-color .2s',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 700,
    color: 'rgba(255,255,255,0.4)', marginBottom: '8px',
    letterSpacing: '0.08em', textTransform: 'uppercase',
  }

  // ── RENDER ────────────────────────────────────────────────────────────────────
  return (
    <main style={{
      background: '#030a05', minHeight: '100dvh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '0 20px 48px',
      paddingTop: 'max(32px, env(safe-area-inset-top))',
      fontFamily: 'system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(.88)} to{opacity:1;transform:scale(1)} }
        @keyframes glow     { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes shimmer  { 0%{left:-60%} 100%{left:160%} }
        @keyframes cardDrop {
          0%  {opacity:0;transform:translateY(60px) scale(.88)}
          65% {opacity:1;transform:translateY(-6px) scale(1.02)}
          100%{opacity:1;transform:translateY(0)   scale(1)}
        }
        @keyframes burst {
          0%  {opacity:0;transform:scale(.5)}
          60% {opacity:1;transform:scale(1.12)}
          100%{opacity:1;transform:scale(1)}
        }
        .step-in { animation: fadeUp .4s ease forwards; opacity:0 }
        input:focus, textarea:focus, select:focus {
          border-color: rgba(251,191,36,0.5) !important;
          box-shadow: 0 0 0 3px rgba(251,191,36,0.08) !important;
          outline: none;
        }
        .btn-primary {
          width:100%; padding:17px; border-radius:14px; border:none;
          background: linear-gradient(135deg,#d97706,#f59e0b 55%,#fbbf24);
          color:#1c0a00; font-weight:900; font-size:16px; cursor:pointer;
          font-family:system-ui,sans-serif; letter-spacing:.03em;
          box-shadow:0 0 32px rgba(251,191,36,0.35),0 6px 24px rgba(0,0,0,0.5);
          transition:opacity .15s, transform .1s;
          min-height:56px;
        }
        .btn-primary:active  { opacity:.88; transform:scale(.97); }
        .btn-primary:disabled{ opacity:.5; cursor:not-allowed; }
        .btn-ghost {
          background:none; border:none; cursor:pointer;
          color:rgba(255,255,255,0.3); font-size:13px; font-weight:600;
          font-family:system-ui,sans-serif; padding:8px 0;
          transition:color .2s;
        }
        .btn-ghost:hover { color:rgba(255,255,255,.55); }
      `}</style>

      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* ── Logo ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '16px', fontWeight: 900, color: 'white' }}>
            ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
          </span>
        </div>

        {/* ══════════════════════════════════
            STEPS 1-4
        ══════════════════════════════════ */}
        {step !== 'concluido' && (
          <>
            {/* Progress */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'rgba(251,191,36,.7)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Etapa {stepNum} de 4
                </span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.2)', fontWeight: 600 }}>
                  {Math.round((stepNum / 4) * 100)}%
                </span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,.07)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '4px',
                  background: 'linear-gradient(90deg,#d97706,#fbbf24)',
                  width: `${(stepNum / 4) * 100}%`,
                  transition: 'width .5s cubic-bezier(.22,1,.36,1)',
                  boxShadow: '0 0 8px rgba(251,191,36,.6)',
                }} />
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════
            STEP 1 — FOTO
        ══════════════════════════════════ */}
        {step === 'foto' && (
          <div className="step-in">
            <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 900, color: 'white', letterSpacing: '-.03em', lineHeight: 1.1 }}>
              {primeiroNome}, vamos<br />
              <span style={{ color: '#fbbf24' }}>montar seu perfil.</span>
            </h1>
            <p style={{ margin: '0 0 32px', fontSize: '14px', color: 'rgba(255,255,255,.35)', lineHeight: 1.6 }}>
              Treinadores com foto recebem <strong style={{ color: 'rgba(251,191,36,.7)' }}>3× mais avaliações</strong>.
            </p>

            {/* Upload area — label nativo garante abertura em iOS/Android */}
            <label htmlFor="cfg-foto-input" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '160px', height: '160px', borderRadius: '50%', margin: '0 auto 28px',
              border: (fotoPreview || savedAvatarUrl) ? '3px solid rgba(251,191,36,.6)' : '2px dashed rgba(255,255,255,.18)',
              cursor: 'pointer', overflow: 'hidden', position: 'relative',
              background: (fotoPreview || savedAvatarUrl) ? 'transparent' : 'rgba(255,255,255,.03)',
              boxShadow: (fotoPreview || savedAvatarUrl) ? '0 0 40px rgba(251,191,36,.25)' : 'none',
              transition: 'border-color .2s, box-shadow .3s',
            }}>
              <input
                id="cfg-foto-input"
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
                onChange={handleFotoChange}
              />
              {(fotoPreview || savedAvatarUrl) ? (
                <img
                  src={fotoPreview ?? savedAvatarUrl ?? ''}
                  alt="preview"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>📸</div>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>Toque para adicionar</span>
                </div>
              )}
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn-primary" onClick={() => setStep('identidade')}>
                {(fotoPreview || savedAvatarUrl) ? 'Continuar →' : 'Pular por agora →'}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            STEP 2 — IDENTIDADE
        ══════════════════════════════════ */}
        {step === 'identidade' && (
          <div className="step-in">
            <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-.03em' }}>
              Sua <span style={{ color: '#fbbf24' }}>identidade</span>
            </h1>
            <p style={{ margin: '0 0 28px', fontSize: '14px', color: 'rgba(255,255,255,.3)', lineHeight: 1.6 }}>
              Isso aparece no seu card. Seja preciso.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={lbl}>Especialidade</label>
                <select
                  value={especialidade}
                  onChange={e => setEspec(e.target.value)}
                  style={{ ...inp, appearance: 'none', cursor: 'pointer' }}
                >
                  <option value="" style={{ background: '#1a1a1a', color: 'rgba(255,255,255,0.4)' }}>Selecione...</option>
                  {ESPECIALIDADES.map(e => (
                    <option key={e} value={e} style={{ background: '#1a1a1a', color: 'white' }}>{e}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={lbl}>Cidade</label>
                <input
                  type="text" value={cidade}
                  onChange={e => setCidade(e.target.value)}
                  placeholder="Ex: São Paulo – SP"
                  style={inp}
                />
              </div>

              <div>
                <label style={lbl}>Anos de experiência</label>
                <input
                  type="number" value={anosExp} min="0" max="50"
                  onChange={e => setAnosExp(e.target.value)}
                  placeholder="Ex: 8"
                  style={inp}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '28px' }}>
              <button className="btn-primary" onClick={() => setStep('bio')} disabled={!especialidade}>
                Continuar →
              </button>
              <button className="btn-ghost" onClick={() => setStep('foto')}>← Voltar</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            STEP 3 — BIO
        ══════════════════════════════════ */}
        {step === 'bio' && (
          <div className="step-in">
            <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-.03em' }}>
              Sua <span style={{ color: '#fbbf24' }}>história</span>
            </h1>
            <p style={{ margin: '0 0 28px', fontSize: '14px', color: 'rgba(255,255,255,.3)', lineHeight: 1.6 }}>
              Conte o que te torna um bom treinador. Atletas vão ler isso.
            </p>

            <div>
              <label style={lbl}>Bio profissional</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Treinador de futebol com foco em desenvolvimento de jovens talentos. Trabalho com..."
                maxLength={280}
                rows={5}
                style={{
                  ...inp, resize: 'vertical', minHeight: '130px',
                  lineHeight: '1.6', paddingTop: '14px',
                }}
              />
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,.2)', textAlign: 'right' }}>
                {bio.length}/280
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '24px' }}>
              <button className="btn-primary" onClick={() => setStep('redes')}>
                Continuar →
              </button>
              <button className="btn-ghost" onClick={() => setStep('identidade')}>← Voltar</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            STEP 4 — REDES
        ══════════════════════════════════ */}
        {step === 'redes' && (
          <div className="step-in">
            <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 900, color: 'white', letterSpacing: '-.03em' }}>
              Suas <span style={{ color: '#fbbf24' }}>redes</span>
            </h1>
            <p style={{ margin: '0 0 28px', fontSize: '14px', color: 'rgba(255,255,255,.3)', lineHeight: 1.6 }}>
              Atletas e clubes vão te pesquisar. Facilite.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={lbl}>Instagram</label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,.35)', fontSize: '15px', fontWeight: 700,
                  }}>@</span>
                  <input
                    type="text" value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    placeholder="seu.usuario"
                    style={{ ...inp, paddingLeft: '36px' }}
                  />
                </div>
              </div>

              <div>
                <label style={lbl}>YouTube</label>
                <input
                  type="url" value={youtube}
                  onChange={e => setYoutube(e.target.value)}
                  placeholder="youtube.com/c/seucanal"
                  style={inp}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '28px' }}>
              {saveErr && (
                <p style={{
                  margin: 0, padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  fontSize: '13px', color: '#f87171', lineHeight: 1.5,
                }}>
                  {saveErr}
                </p>
              )}
              <button
                className="btn-primary"
                onClick={handleConcluir}
                disabled={saving}
              >
                {saving ? 'Salvando...' : '🏆 Finalizar perfil →'}
              </button>
              <button className="btn-ghost" onClick={() => { if (!saving) setStep('bio') }}>← Voltar</button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════
            CONCLUSÃO — CARD REVEAL
        ══════════════════════════════════ */}
        {step === 'concluido' && (
          <div style={{ textAlign: 'center' }}>

            {/* Título */}
            <div style={{ animation: 'fadeUp .5s ease forwards .1s', opacity: 0, marginBottom: '32px' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '5px 14px', borderRadius: '100px', marginBottom: '16px',
                background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.25)',
              }}>
                <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.12em', color: 'rgba(251,191,36,.85)', textTransform: 'uppercase' }}>
                  Perfil ativo
                </span>
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(28px,8vw,36px)', fontWeight: 900, color: 'white', letterSpacing: '-.04em', lineHeight: 1.05 }}>
                Bem-vindo ao<br />
                <span style={{ color: '#fbbf24', textShadow: '0 0 40px rgba(251,191,36,.5)' }}>jogo, {primeiroNome}.</span>
              </h1>
            </div>

            {/* Trainer Card */}
            <div style={{ animation: 'cardDrop .9s cubic-bezier(.22,.68,0,1.1) forwards .35s', opacity: 0, marginBottom: '28px' }}>

              {/* Glow atrás do card */}
              <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                <div style={{
                  position: 'absolute', inset: '-30px', zIndex: 0, borderRadius: '60px',
                  background: 'radial-gradient(ellipse,rgba(251,191,36,.2) 0%,transparent 65%)',
                  filter: 'blur(20px)',
                }} />

                {/* O Card */}
                <div style={{
                  position: 'relative', zIndex: 1, width: '100%', borderRadius: '28px',
                  overflow: 'hidden',
                  background: 'linear-gradient(170deg,#1c1200 0%,#120c00 40%,#050300 100%)',
                  boxShadow: [
                    '0 0 0 1px rgba(251,191,36,.3)',
                    '0 0 0 2px rgba(0,0,0,.9)',
                    '0 36px 80px rgba(0,0,0,.98)',
                    '0 0 80px rgba(251,191,36,.1)',
                  ].join(','),
                }}>

                  {/* Stripe topo dourada */}
                  <div style={{
                    height: '4px',
                    background: 'linear-gradient(90deg,transparent,#d97706 20%,#fbbf24 50%,#d97706 80%,transparent)',
                    boxShadow: '0 0 12px rgba(251,191,36,.5)',
                  }} />

                  {/* Shimmer */}
                  <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute', top: '-20%', bottom: '-20%', width: '40%',
                      background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.045),transparent)',
                      transform: 'skewX(-12deg)',
                      animation: 'shimmer 1.2s cubic-bezier(.4,0,.2,1) forwards .9s',
                      left: '-60%',
                    }} />
                  </div>

                  {/* Badge TREINADOR */}
                  <div style={{ padding: '18px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px', borderRadius: '8px',
                      background: 'rgba(251,191,36,.12)', border: '1px solid rgba(251,191,36,.3)',
                    }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '.12em', color: '#fbbf24', textTransform: 'uppercase' }}>
                        👨‍🏫 Treinador
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,.2)', fontWeight: 600 }}>Meu Craque</span>
                  </div>

                  {/* Foto + Info */}
                  <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Avatar */}
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '50%', flexShrink: 0,
                      overflow: 'hidden', border: '2px solid rgba(251,191,36,.4)',
                      background: savedAvatarUrl || fotoPreview ? 'transparent' : 'linear-gradient(145deg,#78350f,#d97706)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 24px rgba(251,191,36,.2)',
                    }}>
                      {(savedAvatarUrl || fotoPreview) ? (
                        <img
                          src={savedAvatarUrl ?? fotoPreview ?? ''}
                          alt={nome}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%' }}
                        />
                      ) : (
                        <span style={{ fontSize: '24px', fontWeight: 900, color: 'white' }}>{initials}</span>
                      )}
                    </div>

                    {/* Nome e dados */}
                    <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                      <p style={{
                        margin: '0 0 4px', fontSize: '22px', fontWeight: 900, color: 'white',
                        letterSpacing: '-.035em', lineHeight: 1, whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        textShadow: '0 2px 20px rgba(0,0,0,.9)',
                      }}>{nome.split(' ')[0]}</p>
                      {nome.split(' ').length > 1 && (
                        <p style={{
                          margin: '0 0 6px', fontSize: '10px', fontWeight: 700,
                          color: 'rgba(255,255,255,.4)', textTransform: 'uppercase', letterSpacing: '.12em',
                        }}>
                          {nome.split(' ').slice(1).join(' ')}
                        </p>
                      )}
                      {especialidade && (
                        <div style={{
                          display: 'inline-flex', padding: '3px 10px', borderRadius: '7px',
                          background: 'rgba(251,191,36,.1)', border: '1px solid rgba(251,191,36,.22)',
                        }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#fbbf24', letterSpacing: '.06em' }}>
                            {especialidade}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cidade + anos exp */}
                  {(cidade || anosExp) && (
                    <div style={{ padding: '10px 20px 0', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {cidade && (
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>
                          📍 {cidade}
                        </span>
                      )}
                      {anosExp && (
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.3)', fontWeight: 600 }}>
                          · {anosExp} {Number(anosExp) === 1 ? 'ano' : 'anos'} de exp.
                        </span>
                      )}
                    </div>
                  )}

                  {/* Divisor */}
                  <div style={{ margin: '16px 20px 0', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(251,191,36,.3),transparent)' }} />

                  {/* Métricas */}
                  <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-around' }}>
                    {[
                      { val: '0', label: 'Avaliações' },
                      { val: '0', label: 'Atletas'    },
                      { val: '0', label: 'Destaques'  },
                    ].map((m, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 2px', fontSize: '22px', fontWeight: 900, color: 'white', lineHeight: 1, letterSpacing: '-.03em' }}>
                          {m.val}
                        </p>
                        <p style={{ margin: 0, fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
                          {m.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Watermark */}
                  <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right,transparent,rgba(251,191,36,.1))' }} />
                    <span style={{ fontSize: '8px', fontWeight: 800, letterSpacing: '.22em', color: 'rgba(251,191,36,.2)', textTransform: 'uppercase' }}>
                      Meu Craque
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left,transparent,rgba(251,191,36,.1))' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── ID do treinador ── */}
            {treinadorId && (
              <div style={{ animation: 'fadeUp .5s ease forwards 1.05s', opacity: 0, marginBottom: '24px', textAlign: 'center' }}>
                <p style={{ margin: '0 0 6px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>
                  Seu ID de treinador
                </p>
                <p style={{ margin: '0 0 4px', fontSize: '44px', fontWeight: 900, color: 'white', letterSpacing: '0.1em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {treinadorId.replace('TR-', '')}
                </p>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'rgba(251,191,36,0.6)', letterSpacing: '0.05em' }}>
                  TR-{treinadorId.replace('TR-', '')}
                </p>
                <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,150,0,0.65)', fontWeight: 600 }}>
                  ⚠️ Guarde este número — atletas usam ele para te encontrar
                </p>
              </div>
            )}

            {/* Mensagem */}
            <p style={{ animation: 'fadeUp .5s ease forwards 1.1s', opacity: 0, margin: '0 0 28px', fontSize: '14px', color: 'rgba(255,255,255,.3)', lineHeight: 1.7 }}>
              Seu perfil está no ar.<br />
              <span style={{ color: 'rgba(251,191,36,.55)', fontWeight: 700 }}>Atletas já podem te encontrar.</span>
            </p>

            {/* CTAs */}
            <div style={{ animation: 'fadeUp .5s ease forwards 1.25s', opacity: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn-primary"
                onClick={() => router.push('/treinador/dashboard')}
              >
                Ir para meu dashboard →
              </button>
            </div>

          </div>
        )}

      </div>
    </main>
  )
}
'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { getInitials, calcularCategoria, posAbrev, calcularIdade } from '@/lib/cardUtils'
import { generateCard } from '@/lib/canvasCard'

function useCounter(target: number, delay = 400, duration = 900) {
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

// ── Main ──────────────────────────────────────────────────────────────────────

function CompartilharContent() {
  const router    = useRouter()
  const params    = useSearchParams()

  // Auth guard
  useEffect(() => {
    import('@/lib/supabase').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data: { user } }) => {
        if (!user) router.replace('/login')
        else if (user.user_metadata?.tipo !== 'atleta') router.replace('/login')
      })
    })
  }, [router])

  const nome      = params.get('nome')      ?? 'Atleta'
  const posicao   = params.get('posicao')   ?? ''
  const cidade    = params.get('cidade')    ?? ''
  const dataNasc  = params.get('dataNasc')  ?? ''
  const uid       = params.get('uid')       ?? ''
  const athleteId = params.get('athleteId') ?? ''
  const avatarUrl = params.get('avatarUrl') ?? ''

  const categoria    = dataNasc ? calcularCategoria(dataNasc) : ''
  const initials     = getInitials(nome)
  const idNumerico   = athleteId.replace('MC-', '')
  const primeiroNome = nome.split(' ')[0]
  const sobrenome    = nome.split(' ').slice(1).join(' ')

  // OVR real buscado da API — não há fallback local (evita valor falso)
  const [realOvr, setRealOvr]     = useState<number | null>(null)
  const [hasEvaluation, setHasEval] = useState(false)

  // Canvas preview (modelo QR code 400×560)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasReady, setCanvasReady] = useState(false)

  // Pré-carrega avatar como data URL (sem CORS na hora de desenhar no canvas)
  const [avatarDataUrl, setAvatarDataUrl] = useState<string>('')
  useEffect(() => {
    if (!avatarUrl) return
    fetch(avatarUrl)
      .then(r => r.blob())
      .then(blob => new Promise<string>((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result as string)
        reader.onerror = rej
        reader.readAsDataURL(blob)
      }))
      .then(dataUrl => setAvatarDataUrl(dataUrl))
      .catch(() => { /* usa URL original como fallback */ })
  }, [avatarUrl])

  // OVR: apenas o valor real calculado por lib/ovr.ts (perfil + avaliações)
  const ovr          = realOvr
  const ovrAnim      = useCounter(ovr ?? 0, 600, 1000)
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing'>('idle')
  const [shareErr,   setShareErr]    = useState<string | null>(null)

  // Busca OVR real + verifica se há avaliação real
  useEffect(() => {
    if (!athleteId) return
    fetch(`/api/atleta/ovr?athleteId=${encodeURIComponent(athleteId)}`)
      .then(r => r.json())
      .then(d => { if (typeof d.ovr === 'number') setRealOvr(d.ovr) })
      .catch(() => {})
  }, [athleteId])

  useEffect(() => {
    if (!uid) return
    import('@/lib/supabase').then(({ createClient }) => {
      createClient()
        .from('avaliacoes')
        .select('id', { count: 'exact', head: true })
        .eq('aluno_id', uid)
        .then(({ count }) => setHasEval((count ?? 0) > 0))
        .catch(() => {})
    })
  }, [uid])

  // Gera o canvas (modelo com QR) quando todos os dados estiverem prontos
  const idade = dataNasc ? calcularIdade(dataNasc) : null
  const profileUrl = uid ? `${typeof window !== 'undefined' ? window.location.origin : 'https://meucraque.com'}/jogador/${uid}` : ''

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !uid) return
    setCanvasReady(false)
    let cancelled = false
    generateCard(canvas, {
      nome,
      pos:           posAbrev(posicao),
      posicao,
      ovr:           realOvr,
      hasEvaluation,
      categoria:     dataNasc ? calcularCategoria(dataNasc) : null,
      fotoUrl:       avatarDataUrl || avatarUrl || null,
      initials:      getInitials(nome),
      athleteId:     athleteId || null,
      cidade:        cidade || null,
      idade,
      profileUrl,
    }).then(() => { if (!cancelled) setCanvasReady(true) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, realOvr, hasEvaluation, avatarDataUrl, avatarUrl])
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    setShareStatus('sharing')
    setShareErr(null)
    try {
      const canvas = canvasRef.current
      if (!canvas) return
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob falhou')), 'image/png')
      )
      const fileName = `${nome.replace(/\s+/g, '_')}_MeuCraque.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${nome} · Meu Craque`, text: `⚽ OVR ${ovr ?? '?'} · ${posicao}${cidade ? ` · ${cidade}` : ''}` })
      } else if (navigator.share) {
        await navigator.share({ title: `${nome} · Meu Craque`, url: `${window.location.origin}/jogador/${uid}` })
      } else {
        const url = URL.createObjectURL(blob)
        const a = Object.assign(document.createElement('a'), { href: url, download: fileName })
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setShareErr('Erro ao compartilhar. Tente "Copiar link do perfil" abaixo.')
        console.error('[compartilhar/handleShare]', err)
      }
    } finally {
      setShareStatus('idle')
    }
  }

  async function handleCopy() {
    const link = `${window.location.origin}/jogador/${uid}`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true); setTimeout(() => setCopied(false), 3000)
    } catch {
      // Fallback: mostra link para cópia manual
      prompt('Copie o link do seu perfil:', link)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main style={{
      background: '#030a05',
      minHeight: '100svh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '28px 20px',
      paddingTop: 'max(28px, env(safe-area-inset-top))',
      paddingBottom: 'max(40px, env(safe-area-inset-bottom))',
      fontFamily: 'system-ui, sans-serif',
    }}>

      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardReveal{
          0%  {opacity:0;transform:translateY(56px) scale(.86)}
          65% {opacity:1;transform:translateY(-6px)  scale(1.02)}
          100%{opacity:1;transform:translateY(0)     scale(1)}
        }
        @keyframes glowBreath{0%,100%{opacity:.6;transform:scale(1)}50%{opacity:1;transform:scale(1.1)}}
        @keyframes shimmerCard{0%{left:-60%}100%{left:160%}}
        @keyframes dotPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.65)}}
        @keyframes cardPulse{
          0%,100%{box-shadow:0 0 0 1px rgba(0,255,136,.22),0 0 60px rgba(0,255,136,.1),0 40px 100px rgba(0,0,0,.98)}
          50%    {box-shadow:0 0 0 1px rgba(0,255,136,.4), 0 0 100px rgba(0,255,136,.25),0 40px 100px rgba(0,0,0,.98)}
        }

        .a1{animation:fadeUp .5s ease forwards .05s;opacity:0}
        .a2{animation:fadeUp .5s ease forwards .1s;opacity:0}
        .a3{animation:cardReveal .95s cubic-bezier(.22,.68,0,1.1) forwards .3s;opacity:0}
        .a4{animation:fadeUp .5s ease forwards 1.05s;opacity:0}
        .a5{animation:fadeUp .5s ease forwards 1.2s;opacity:0}

        .card-pulse{animation:cardPulse 4.5s ease-in-out infinite 2s}

        .btn-primary{
          width:100%;padding:17px;border-radius:15px;border:none;
          background:linear-gradient(135deg,#00e87a,#00FF88 55%,#22c55e);
          color:#020d04;font-weight:900;font-size:17px;letter-spacing:.03em;
          cursor:pointer;font-family:system-ui,sans-serif;
          box-shadow:0 0 48px rgba(0,255,136,.4),0 6px 24px rgba(0,0,0,.5);
          transition:opacity .2s,transform .15s;
        }
        .btn-primary:active{opacity:.88;transform:scale(.98)}
        .btn-glass{
          width:100%;padding:14px;border-radius:13px;
          border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);
          color:rgba(255,255,255,.6);font-size:15px;font-weight:700;
          cursor:pointer;font-family:system-ui,sans-serif;
          transition:border-color .2s,background .2s,color .2s;
        }
        .btn-glass:hover{border-color:rgba(255,255,255,.2);background:rgba(255,255,255,.07);color:rgba(255,255,255,.85)}
        .btn-glass:active{transform:scale(.99)}
        .btn-ghost{
          width:100%;padding:13px;border-radius:13px;
          border:1px solid rgba(255,255,255,.06);background:transparent;
          color:rgba(255,255,255,.28);font-size:14px;font-weight:600;
          cursor:pointer;font-family:system-ui,sans-serif;
          transition:border-color .2s,color .2s;
        }
        .btn-ghost:hover{border-color:rgba(255,255,255,.14);color:rgba(255,255,255,.48)}
      `}</style>

      {/* Atmosfera */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
          width: '800px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(ellipse,rgba(0,255,136,.09) 0%,transparent 60%)',
          animation: 'glowBreath 6s ease-in-out infinite',
        }} />
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Header */}
        <div className="a1" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'rgba(255,255,255,.35)', fontSize: '13px', fontWeight: 600, fontFamily: 'system-ui,sans-serif' }}>
            ← Voltar
          </button>
          <Link href="/" style={{ fontSize: '14px', fontWeight: 800, color: 'white', textDecoration: 'none', opacity: .55 }}>
            ⚽ <span style={{ color: '#00ff87' }}>MEUCRAQUE</span><span style={{ color: 'white' }}>.com</span>
          </Link>
          <div style={{ width: '60px' }} />
        </div>

        {/* Título */}
        <div className="a2" style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '12px',
            padding: '5px 14px', borderRadius: '100px',
            background: 'rgba(0,255,136,.08)', border: '1px solid rgba(0,255,136,.2)',
          }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#00FF88', boxShadow: '0 0 8px #00FF88', animation: 'dotPulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '.14em', color: 'rgba(0,255,136,.85)', textTransform: 'uppercase' }}>Card Oficial</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(30px,9vw,38px)', fontWeight: 900, color: 'white', letterSpacing: '-.04em', lineHeight: 1.05 }}>
            Minha jornada<br />
            <span style={{ color: '#00FF88', textShadow: '0 0 40px rgba(0,255,136,.5)' }}>começou.</span>
          </h1>
        </div>

        {/* ══════════ CARD OFICIAL (canvas 400×560 com QR code) ══════════ */}
        <div className="a3" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={{ position: 'relative', width: 'min(320px,92vw)' }}>

            {/* Glow atrás */}
            <div style={{
              position: 'absolute', inset: '-40px', zIndex: 0, borderRadius: '60px',
              background: 'radial-gradient(ellipse,rgba(0,255,136,.18) 0%,transparent 65%)',
              filter: 'blur(24px)',
            }} />

            {/* Canvas preview */}
            <div style={{ position: 'relative', zIndex: 1, borderRadius: '22px', overflow: 'hidden', boxShadow: '0 0 56px rgba(0,255,136,0.18), 0 24px 64px rgba(0,0,0,0.80)' }}>
              <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 'auto', opacity: canvasReady ? 1 : 0, transition: 'opacity .35s ease' }} />
              {!canvasReady && (
                <div style={{ position: 'absolute', inset: 0, background: '#080f0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', minHeight: '220px' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', border: '2.5px solid rgba(0,255,136,0.3)', borderTopColor: '#00FF88', animation: 'cardSpin .7s linear infinite' }} />
                  <style>{`@keyframes cardSpin { to { transform: rotate(360deg) } }`}</style>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontFamily: 'system-ui' }}>Gerando card…</p>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* ID do atleta — abaixo do card */}
        {idNumerico && (
          <div className="a4" style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 18px', borderRadius: '100px', marginBottom: '20px',
            background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)',
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,.25)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>ID</span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: 'rgba(255,255,255,.55)', letterSpacing: '0.14em', fontVariantNumeric: 'tabular-nums' }}>{idNumerico}</span>
          </div>
        )}

        {/* Frase */}
        <p className="a4" style={{ margin: '0 0 28px', fontSize: '13px', color: 'rgba(255,255,255,.27)', textAlign: 'center', lineHeight: 1.7 }}>
          Pronto para o mundo ver.<br />
          <span style={{ color: 'rgba(0,255,136,.55)', fontWeight: 700 }}>Compartilhe com treinadores, amigos e clubes.</span>
        </p>

        {/* Erro de compartilhamento */}
        {shareErr && (
          <div className="a5" style={{
            width: '100%', marginBottom: '6px',
            padding: '11px 14px', borderRadius: '12px',
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#f87171', fontWeight: 600 }}>
              ⚠️ {shareErr}
            </p>
          </div>
        )}

        {/* Ações */}
        <div className="a5" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button className="btn-primary" onClick={handleShare} disabled={shareStatus === 'sharing'} style={{ opacity: shareStatus === 'sharing' ? .7 : 1 }}>
            {shareStatus === 'sharing' ? 'Gerando card…' : '📲 Compartilhar card'}
          </button>
          <button className="btn-ghost" onClick={handleCopy}>
            {copied ? '✓ Link copiado!' : '🔗 Copiar link do perfil'}
          </button>
        </div>

        <div style={{ width: '100%', marginTop: '28px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,.04)' }} />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,.13)', fontWeight: 600, letterSpacing: '.08em' }}>ou continue</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,.04)' }} />
        </div>

        <Link href="/atleta/perfil" style={{ marginTop: '14px', display: 'block', width: '100%', textAlign: 'center', fontSize: '14px', fontWeight: 700, color: 'rgba(255,255,255,.32)', textDecoration: 'none' }}>
          Ver perfil completo →
        </Link>

        <p style={{ marginTop: '28px', fontSize: '10px', color: 'rgba(255,255,255,.07)', textAlign: 'center' }}>
          ⚽ MEUCRAQUE.com · Você é o próximo.
        </p>
      </div>
    </main>
  )
}

export default function CompartilharPage() {
  return (
    <Suspense fallback={
      <main style={{ background: '#030a05', minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,.3)', fontFamily: 'system-ui' }}>Carregando…</p>
      </main>
    }>
      <CompartilharContent />
    </Suspense>
  )
}
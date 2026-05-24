'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// ── Canvas helper ─────────────────────────────────────────────────────────────

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y,     x + w, y + r,     r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x,     y + h, x,     y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y,         x + r, y,             r)
  ctx.closePath()
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcularCategoria(dataNasc: string): string {
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

function posLabel(pos: string): string {
  const map: Record<string, string> = {
    'Goleiro': 'GK', 'Lateral Direito': 'LD', 'Lateral Esquerdo': 'LE',
    'Zagueiro': 'ZG', 'Volante': 'VOL', 'Meia': 'MEI',
    'Meia-Atacante': 'MAT', 'Ponta Direita': 'PD', 'Ponta Esquerda': 'PE',
    'Atacante': 'ATA', 'Centro-Avante': 'CA',
  }
  return map[pos] ?? pos.slice(0, 3).toUpperCase()
}

function getInitials(nome: string) {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function calcularOVR(temFoto: boolean, temPosicao: boolean, temCidade: boolean, temDataNasc: boolean): number {
  let ovr = 62
  if (temFoto)     ovr += 14
  if (temPosicao)  ovr += 10
  if (temCidade)   ovr +=  5
  if (temDataNasc) ovr +=  4
  return Math.min(ovr, 95)
}

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

  // Hooks de estado — DEVEM vir antes de qualquer uso
  const [realOvr, setRealOvr]   = useState<number | null>(null)

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

  // OVR: real (avaliações) tem prioridade; completude de perfil como fallback
  const ovrBase      = calcularOVR(!!avatarUrl, !!posicao, !!cidade, !!dataNasc)
  const ovr          = realOvr ?? ovrBase
  const ovrAnim      = useCounter(ovr, 600, 1000)
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing'>('idle')
  const [shareErr,   setShareErr]    = useState<string | null>(null)

  // Busca OVR real das avaliações
  useEffect(() => {
    if (!athleteId) return
    fetch(`/api/atleta/ovr?athleteId=${encodeURIComponent(athleteId)}`)
      .then(r => r.json())
      .then(d => { if (typeof d.ovr === 'number') setRealOvr(d.ovr) })
      .catch(() => {/* mantém OVR de completude */})
  }, [athleteId])
  const [copied, setCopied] = useState(false)

  // ── Geração do card via Canvas 2D (sem html2canvas) ────────────────────────

  async function generateCard(): Promise<HTMLCanvasElement> {
    const W = 600, H = 800
    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')!

    // Clip com bordas arredondadas
    ctx.save()
    rrect(ctx, 0, 0, W, H, 40)
    ctx.clip()

    // ── Background ─────────────────────────────────────────────────────────
    const src = avatarDataUrl || avatarUrl
    if (src) {
      const img = new Image()
      img.src = src
      await new Promise<void>(res => { img.onload = () => res(); img.onerror = () => res() })
      if (img.naturalWidth > 0) {
        const ir = img.naturalWidth / img.naturalHeight, cr = W / H
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
        if (ir > cr) { sw = img.naturalHeight * cr; sx = (img.naturalWidth - sw) / 2 }
        else         { sh = img.naturalWidth  / cr; sy = (img.naturalHeight - sh) / 2 * 0.3 }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)
      }
    } else {
      // Gradiente escuro + círculo com iniciais
      const bg = ctx.createLinearGradient(0, 0, W, H)
      bg.addColorStop(0, '#1a3828'); bg.addColorStop(0.5, '#0e2018'); bg.addColorStop(1, '#040c07')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
      ctx.beginPath(); ctx.arc(W/2, H*0.42, W*0.22, 0, Math.PI*2)
      const cg = ctx.createLinearGradient(W*0.28, H*0.2, W*0.72, H*0.64)
      cg.addColorStop(0, '#1a7a42'); cg.addColorStop(0.5, '#22c55e'); cg.addColorStop(1, '#4ade80')
      ctx.fillStyle = cg; ctx.fill()
      ctx.font = `900 ${Math.round(W * 0.15)}px system-ui`
      ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(initials, W/2, H*0.42)
      ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
    }

    // ── Overlay cinematográfico ─────────────────────────────────────────────
    const ov = ctx.createLinearGradient(0, 0, 0, H)
    ov.addColorStop(0,    'rgba(0,0,0,0.55)')
    ov.addColorStop(0.30, 'rgba(0,0,0,0.10)')
    ov.addColorStop(0.55, 'rgba(0,0,0,0.00)')
    ov.addColorStop(0.65, 'rgba(0,0,0,0.15)')
    ov.addColorStop(1.00, 'rgba(0,0,0,0.92)')
    ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H)
    ctx.restore() // fim do clip arredondado

    // ── OVR ────────────────────────────────────────────────────────────────
    ctx.save()
    ctx.font = '900 104px system-ui'; ctx.fillStyle = 'white'
    ctx.shadowColor = 'rgba(0,0,0,0.9)'; ctx.shadowBlur = 20
    ctx.fillText(String(ovr), 32, 116)
    ctx.font = '900 20px system-ui'; ctx.fillStyle = '#00FF88'
    ctx.shadowColor = 'rgba(0,255,136,0.7)'; ctx.shadowBlur = 12
    ctx.fillText('OVR', 34, 142)
    ctx.restore()

    // ── Badge Meu Craque (brasão de clube) ────────────────────────────────
    {
      const bx = 32, by = 162, bw = 64, bh = 64, br = 12
      ctx.save()
      rrect(ctx, bx, by, bw, bh, br)
      const bg = ctx.createLinearGradient(bx, by, bx + bw, by + bh)
      bg.addColorStop(0, '#16a34a'); bg.addColorStop(1, '#15803d')
      ctx.fillStyle = bg; ctx.fill()
      ctx.shadowColor = 'rgba(0,255,136,0.5)'; ctx.shadowBlur = 16
      ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.shadowBlur = 0
      // Letra "M"
      ctx.font = '900 34px Arial Black, system-ui'
      ctx.fillStyle = 'white'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('M', bx + bw / 2, by + bh / 2 - 7)
      // "MEU CRAQUE" texto pequeno
      ctx.font = '700 9px system-ui'
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.fillText('MEU CRAQUE', bx + bw / 2, by + bh - 12)
      ctx.restore()
    }

    // ── Categoria badge (top right) ─────────────────────────────────────────
    if (categoria) {
      ctx.save()
      ctx.font = '800 17px system-ui'
      const tw = ctx.measureText(categoria).width
      const bw = tw + 24, bh = 30, bx = W - bw - 20, by = 20
      rrect(ctx, bx, by, bw, bh, 9)
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fill()
      ctx.strokeStyle = 'rgba(0,255,136,0.4)'; ctx.lineWidth = 1.5; ctx.stroke()
      ctx.fillStyle = '#00FF88'; ctx.shadowColor = 'rgba(0,255,136,0.6)'; ctx.shadowBlur = 12
      ctx.textAlign = 'center'; ctx.fillText(categoria, bx + bw/2, by + 21)
      ctx.restore()
    }

    // ── Nome (bottom) ───────────────────────────────────────────────────────
    ctx.save()
    ctx.font = `900 ${Math.min(76, Math.round(W * 0.12))}px system-ui`
    ctx.fillStyle = 'white'; ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 24
    ctx.fillText(primeiroNome, 32, H - 150)
    if (sobrenome) {
      ctx.font = '700 20px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.shadowBlur = 0
      ctx.fillText(sobrenome.toUpperCase(), 34, H - 120)
    }

    // ── Posição badge ────────────────────────────────────────────────────────
    if (posicao) {
      ctx.shadowBlur = 0; ctx.font = '800 17px system-ui'
      const ptw = ctx.measureText(posicao).width
      const pbw = ptw + 24, pbh = 28, pbx = 32, pby = H - 98
      rrect(ctx, pbx, pby, pbw, pbh, 8)
      ctx.fillStyle = 'rgba(0,255,136,0.12)'; ctx.fill()
      ctx.strokeStyle = 'rgba(0,255,136,0.3)'; ctx.lineWidth = 1; ctx.stroke()
      ctx.fillStyle = '#00FF88'; ctx.fillText(posicao, pbx + 12, pby + 19)
      if (cidade) {
        ctx.font = '600 15px system-ui'; ctx.fillStyle = 'rgba(255,255,255,0.38)'
        ctx.fillText(`· ${cidade}`, pbx + pbw + 10, pby + 19)
      }
    }
    ctx.restore()

    // ── ID watermark ──────────────────────────────────────────────────────────
    const ly = H - 46
    ctx.save()
    const lg1 = ctx.createLinearGradient(32, 0, W/2 - 52, 0)
    lg1.addColorStop(0, 'rgba(0,0,0,0)'); lg1.addColorStop(1, 'rgba(255,255,255,0.08)')
    ctx.strokeStyle = lg1; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(32, ly); ctx.lineTo(W/2 - 52, ly); ctx.stroke()
    const lg2 = ctx.createLinearGradient(W/2 + 52, 0, W - 32, 0)
    lg2.addColorStop(0, 'rgba(255,255,255,0.08)'); lg2.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.strokeStyle = lg2
    ctx.beginPath(); ctx.moveTo(W/2 + 52, ly); ctx.lineTo(W - 32, ly); ctx.stroke()
    ctx.font = '900 21px system-ui'; ctx.fillStyle = 'rgba(0,255,136,0.7)'
    ctx.textAlign = 'center'; ctx.fillText(idNumerico ? `ID: ${idNumerico}` : 'Meu Craque', W/2, H - 24)
    ctx.restore()

    // ── Corner accents ────────────────────────────────────────────────────────
    ctx.save(); ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(0,255,136,0.75)'
    ctx.beginPath(); ctx.moveTo(2, 28); ctx.lineTo(2, 12); ctx.arcTo(2, 2, 12, 2, 10); ctx.lineTo(28, 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W-2, 28); ctx.lineTo(W-2, 12); ctx.arcTo(W-2, 2, W-12, 2, 10); ctx.lineTo(W-28, 2); ctx.stroke()
    ctx.strokeStyle = 'rgba(0,255,136,0.3)'
    ctx.beginPath(); ctx.moveTo(2, H-28); ctx.lineTo(2, H-12); ctx.arcTo(2, H-2, 12, H-2, 10); ctx.lineTo(28, H-2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(W-2, H-28); ctx.lineTo(W-2, H-12); ctx.arcTo(W-2, H-2, W-12, H-2, 10); ctx.lineTo(W-28, H-2); ctx.stroke()
    ctx.restore()

    return canvas
  }

  async function handleShare() {
    setShareStatus('sharing')
    setShareErr(null)
    try {
      const canvas = await generateCard()
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob(b => b ? res(b) : rej(new Error('toBlob falhou')), 'image/png')
      )
      const fileName = `${nome.replace(/\s+/g, '_')}_MeuCraque.png`
      const file = new File([blob], fileName, { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        // Compartilha como imagem (iOS/Android)
        await navigator.share({ files: [file], title: `${nome} · Meu Craque`, text: `⚽ OVR ${ovr} · ${posicao}${cidade ? ` · ${cidade}` : ''}` })
      } else if (navigator.share) {
        // Compartilha como link (desktop/fallback)
        await navigator.share({ title: `${nome} · Meu Craque`, url: `${window.location.origin}/jogador/${uid}` })
      } else {
        // Download direto
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
            ⚽ MEU <span style={{ color: '#22c55e' }}>CRAQUE</span>
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

        {/* ══════════ O CARD FIFA ══════════ */}
        <div className="a3" style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={{ position: 'relative' }}>

            {/* Glow atrás */}
            <div style={{
              position: 'absolute', inset: '-40px', zIndex: 0, borderRadius: '60px',
              background: 'radial-gradient(ellipse,rgba(0,255,136,.18) 0%,transparent 65%)',
              filter: 'blur(24px)',
            }} />

            {/* Corner accents */}
            <div style={{ position: 'relative', width: 'min(320px,92vw)', zIndex: 1 }}>
              {[
                { top: -1, left: -1,     borderTop:    '1.5px solid rgba(0,255,136,.75)', borderLeft:   '1.5px solid rgba(0,255,136,.75)', borderTopLeftRadius:     '24px' },
                { top: -1, right: -1,    borderTop:    '1.5px solid rgba(0,255,136,.75)', borderRight:  '1.5px solid rgba(0,255,136,.75)', borderTopRightRadius:    '24px' },
                { bottom: -1, left: -1,  borderBottom: '1.5px solid rgba(0,255,136,.3)',  borderLeft:   '1.5px solid rgba(0,255,136,.3)',  borderBottomLeftRadius:  '24px' },
                { bottom: -1, right: -1, borderBottom: '1.5px solid rgba(0,255,136,.3)',  borderRight:  '1.5px solid rgba(0,255,136,.3)',  borderBottomRightRadius: '24px' },
              ].map((s, i) => <div key={i} style={{ position: 'absolute', width: '20px', height: '20px', zIndex: 20, pointerEvents: 'none', ...s }} />)}

              {/* ── CARD BODY ── */}
              <div className="card-pulse" style={{
                width: '100%', borderRadius: '24px', overflow: 'hidden',
                position: 'relative',
                aspectRatio: '3 / 4',
              }}>

                {/* FOTO — 100% do card */}
                {/* avatarDataUrl = data URL pré-carregado; avatarUrl = fallback de exibição */}
                {(avatarDataUrl || avatarUrl) ? (
                  <img
                    src={avatarDataUrl || avatarUrl} alt={nome}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 15%', display: 'block' }}
                  />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(160deg, #1a3828 0%, #0e2018 50%, #040c07 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 55% at 50% 45%,rgba(0,255,136,.14) 0%,transparent 70%)' }} />
                    <div style={{
                      position: 'relative', zIndex: 1,
                      width: '42%', aspectRatio: '1',
                      borderRadius: '50%',
                      background: 'linear-gradient(145deg,#1a7a42,#22c55e,#4ade80)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'clamp(28px,10vw,36px)', fontWeight: 900, color: 'white',
                      boxShadow: '0 0 0 1px rgba(0,255,136,.3),0 0 60px rgba(0,255,136,.45)',
                    }}>
                      {initials}
                    </div>
                  </div>
                )}

                {/* Overlay gradientes cinematográficos */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.55) 0%, rgba(0,0,0,.1) 30%, transparent 55%, rgba(0,0,0,.15) 65%, rgba(0,0,0,.92) 100%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,.35) 0%, transparent 25%, transparent 75%, rgba(0,0,0,.25) 100%)' }} />

                {/* Sheen sweep único ao entrar */}
                <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', overflow: 'hidden' }}>
                  <div style={{
                    position: 'absolute', top: '-20%', bottom: '-20%', width: '45%',
                    background: 'linear-gradient(90deg,transparent,rgba(255,255,255,.07),transparent)',
                    transform: 'skewX(-12deg)', left: '-60%',
                    animation: 'shimmerCard 1s cubic-bezier(.4,0,.2,1) forwards 1.8s',
                  }} />
                </div>

                {/* ── TOP LEFT: OVR + badge Meu Craque ── */}
                <div style={{ position: 'absolute', top: '16px', left: '18px', zIndex: 10 }}>
                  <div style={{
                    fontSize: '52px', fontWeight: 900, color: 'white', lineHeight: 1,
                    letterSpacing: '-0.04em',
                    textShadow: '0 2px 20px rgba(0,0,0,.9), 0 0 40px rgba(0,255,136,.25)',
                    fontVariantNumeric: 'tabular-nums',
                  }}>
                    {ovrAnim}
                  </div>
                  <div style={{
                    fontSize: '11px', fontWeight: 900, color: '#00FF88',
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    textShadow: '0 0 12px rgba(0,255,136,.7)',
                    marginTop: '2px',
                  }}>
                    OVR
                  </div>
                  {/* Badge Meu Craque — como brasão de clube */}
                  <div style={{
                    marginTop: '10px',
                    width: '34px', height: '34px', borderRadius: '8px',
                    background: 'linear-gradient(145deg, #16a34a, #15803d)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 0 1px rgba(255,255,255,0.18), 0 0 16px rgba(0,255,136,0.35), 0 2px 8px rgba(0,0,0,0.6)',
                    flexDirection: 'column', gap: '0px',
                  }}>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: 'white', lineHeight: 1, fontFamily: 'Arial Black, system-ui', letterSpacing: '-0.02em' }}>M</span>
                    <span style={{ fontSize: '4.5px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.06em', lineHeight: 1, marginTop: '1px', textTransform: 'uppercase' }}>MEU CRAQUE</span>
                  </div>
                </div>

                {/* ── TOP RIGHT: Categoria ── */}
                {categoria && (
                  <div style={{
                    position: 'absolute', top: '16px', right: '16px', zIndex: 10,
                    background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(0,255,136,.4)', borderRadius: '9px',
                    padding: '4px 11px',
                    fontSize: '10px', fontWeight: 800, color: '#00FF88', letterSpacing: '0.1em',
                    textShadow: '0 0 12px rgba(0,255,136,.6)',
                  }}>
                    {categoria}
                  </div>
                )}

                {/* ── BOTTOM: Nome + info ── */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: '0 18px 20px' }}>
                  <p style={{
                    margin: '0 0 2px',
                    fontSize: 'clamp(26px,8vw,32px)', fontWeight: 900, color: 'white',
                    letterSpacing: '-0.04em', lineHeight: 1,
                    textShadow: '0 2px 24px rgba(0,0,0,.95)',
                  }}>
                    {primeiroNome}
                  </p>
                  {sobrenome && (
                    <p style={{
                      margin: '0 0 10px', fontSize: '11px', fontWeight: 700,
                      color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '0.16em',
                    }}>
                      {sobrenome}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {posicao && (
                      <div style={{
                        background: 'linear-gradient(135deg,rgba(0,255,136,.16),rgba(0,255,136,.07))',
                        border: '1px solid rgba(0,255,136,.3)', borderRadius: '7px',
                        padding: '4px 12px',
                        fontSize: '11px', fontWeight: 900, color: '#00FF88', letterSpacing: '0.09em',
                      }}>
                        {posicao}
                      </div>
                    )}
                    {cidade && (
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,.38)', fontWeight: 600 }}>
                        · {cidade}
                      </span>
                    )}
                  </div>

                  {/* Watermark */}
                  <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right,transparent,rgba(255,255,255,.08))' }} />
                    <span style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '0.18em', color: 'rgba(0,255,136,0.7)' }}>
                      {idNumerico ? `ID: ${idNumerico}` : 'Meu Craque'}
                    </span>
                    <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left,transparent,rgba(255,255,255,.08))' }} />
                  </div>
                </div>

              </div>{/* end card body */}
            </div>{/* end card wrapper */}
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
          ⚽ MEU <span style={{ color: 'rgba(0,255,136,.25)' }}>CRAQUE</span> · Você é o próximo.
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
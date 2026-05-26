'use client'

import { useEffect, useRef, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

type Tier = 'bronze' | 'prata' | 'ouro'

export type CardShareProps = {
  nome:      string
  pos:       string        // abreviado: 'ATA', 'GK', etc.
  ovr:       number | null
  categoria: string | null
  fotoUrl:   string | null // primeira foto (pode ser de CDN externo)
  initials:  string
  athleteId: string | null // 'MC-XXXXX'
}

// ── Tier config ────────────────────────────────────────────────────────────────

const TIER: Record<Tier, { label: string; main: string; glow: string; bg1: string; bg2: string }> = {
  bronze: { label: '🥉 BRONZE', main: '#C47830', glow: 'rgba(196,120,48,0.40)', bg1: '#140800', bg2: '#221200' },
  prata:  { label: '🥈 PRATA',  main: '#A8B8CC', glow: 'rgba(168,184,204,0.35)', bg1: '#0d1018', bg2: '#141e2c' },
  ouro:   { label: '🥇 OURO',   main: '#F5C400', glow: 'rgba(245,196,0,0.40)',   bg1: '#120e00', bg2: '#201a00' },
}

function getTier(ovr: number | null): Tier {
  if (!ovr || ovr < 70) return 'bronze'
  if (ovr < 85)          return 'prata'
  return 'ouro'
}

// ── Canvas helpers ─────────────────────────────────────────────────────────────

/** Traça um retângulo arredondado como path (sem fill/stroke) */
function rrPath(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y);    ctx.arcTo(x + w, y,     x + w, y + r,     r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h);    ctx.arcTo(x,     y + h, x,     y + h - r, r)
  ctx.lineTo(x,     y + r);    ctx.arcTo(x,     y,     x + r, y,         r)
  ctx.closePath()
}

// ── Card generation ────────────────────────────────────────────────────────────

async function generateCard(
  canvas: HTMLCanvasElement,
  opts: CardShareProps,
): Promise<void> {
  const ctx = canvas.getContext('2d')!
  const W = 360, H = 510
  canvas.width = W
  canvas.height = H

  const tier = getTier(opts.ovr)
  const c    = TIER[tier]
  const M    = 14  // margem
  const PHOTO_H = 295

  // ── Tenta carregar a foto com CORS ──────────────────────────────────────────
  let img: HTMLImageElement | null = null
  if (opts.fotoUrl) {
    img = await new Promise<HTMLImageElement | null>(res => {
      const el = new Image()
      el.crossOrigin = 'anonymous'
      el.onload  = () => res(el)
      el.onerror = () => res(null)
      el.src = opts.fotoUrl!
    })
  }

  // ── Clip para forma de card arredondada ─────────────────────────────────────
  ctx.save()
  rrPath(ctx, 0, 0, W, H, 18)
  ctx.clip()

  // Fundo
  const bgGrad = ctx.createLinearGradient(0, 0, W * 0.6, H)
  bgGrad.addColorStop(0,   c.bg1)
  bgGrad.addColorStop(0.5, c.bg2)
  bgGrad.addColorStop(1,   c.bg1)
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, W, H)

  // Textura de grade sutil
  ctx.save()
  ctx.globalAlpha = 0.045
  ctx.strokeStyle = c.main
  ctx.lineWidth   = 0.5
  for (let x = 0; x <= W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
  ctx.restore()

  // ── Zona da foto ─────────────────────────────────────────────────────────────
  if (img) {
    // Cover-fit — leve bias pro topo (rosto)
    const scale = Math.max(W / img.width, PHOTO_H / img.height)
    const dw = img.width * scale, dh = img.height * scale
    const dx = (W - dw) / 2
    const dy = Math.min(0, (PHOTO_H - dh) * 0.12)
    ctx.drawImage(img, dx, dy, dw, dh)

    // Overlay de leitura (fundo → panel)
    const ov = ctx.createLinearGradient(0, PHOTO_H * 0.45, 0, PHOTO_H)
    ov.addColorStop(0, 'transparent')
    ov.addColorStop(0.6, c.bg2 + 'cc')
    ov.addColorStop(1,   c.bg2)
    ctx.fillStyle = ov
    ctx.fillRect(0, 0, W, PHOTO_H)
  } else {
    // Sem foto — iniciais com halo radial
    ctx.fillStyle = c.bg2
    ctx.fillRect(0, 0, W, PHOTO_H)

    const cx = W / 2, cy = PHOTO_H * 0.46
    const radGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90)
    radGrad.addColorStop(0, c.glow)
    radGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = radGrad
    ctx.fillRect(0, 0, W, PHOTO_H)

    ctx.beginPath(); ctx.arc(cx, cy, 64, 0, Math.PI * 2)
    ctx.fillStyle   = c.main + '18'; ctx.fill()
    ctx.strokeStyle = c.main + '55'; ctx.lineWidth = 2; ctx.stroke()

    ctx.fillStyle    = c.main
    ctx.font         = `bold 48px system-ui, -apple-system, sans-serif`
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(opts.initials, cx, cy)
  }

  // ── Painel inferior ───────────────────────────────────────────────────────────
  // Funde foto → painel
  const blend = ctx.createLinearGradient(0, PHOTO_H - 20, 0, PHOTO_H + 10)
  blend.addColorStop(0, c.bg2)
  blend.addColorStop(1, c.bg1)
  ctx.fillStyle = blend
  ctx.fillRect(0, PHOTO_H - 20, W, 30)
  ctx.fillStyle = c.bg1
  ctx.fillRect(0, PHOTO_H, W, H - PHOTO_H)

  // ── Molduras de canto ─────────────────────────────────────────────────────────
  const CL = 26, CW = 2.5
  ctx.strokeStyle = c.main; ctx.lineWidth = CW; ctx.lineCap = 'square'
  // TL
  ctx.beginPath(); ctx.moveTo(M+CL, M); ctx.lineTo(M, M); ctx.lineTo(M, M+CL); ctx.stroke()
  // TR
  ctx.beginPath(); ctx.moveTo(W-M-CL, M); ctx.lineTo(W-M, M); ctx.lineTo(W-M, M+CL); ctx.stroke()
  // BL
  ctx.beginPath(); ctx.moveTo(M+CL, H-M); ctx.lineTo(M, H-M); ctx.lineTo(M, H-M-CL); ctx.stroke()
  // BR
  ctx.beginPath(); ctx.moveTo(W-M-CL, H-M); ctx.lineTo(W-M, H-M); ctx.lineTo(W-M, H-M-CL); ctx.stroke()

  // ── Barra do topo ─────────────────────────────────────────────────────────────
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle    = 'rgba(255,255,255,0.30)'
  ctx.font         = `bold 8.5px system-ui, sans-serif`
  ctx.textAlign    = 'left'
  ctx.fillText('MEU CRAQUE', M + 4, M + 18)

  ctx.fillStyle = c.main
  ctx.textAlign = 'right'
  ctx.fillText(c.label, W - M - 4, M + 18)

  // ── OVR (grande, com glow) ────────────────────────────────────────────────────
  const OVR_Y = PHOTO_H + 18
  ctx.fillStyle    = c.main + '88'
  ctx.font         = `bold 8px system-ui, sans-serif`
  ctx.textAlign    = 'left'
  ctx.fillText('OVR', M + 6, OVR_Y + 12)

  ctx.shadowColor = c.main; ctx.shadowBlur = 14
  ctx.fillStyle   = c.main
  ctx.font        = `bold 58px system-ui, sans-serif`
  ctx.fillText(opts.ovr ? String(opts.ovr) : '—', M + 4, OVR_Y + 68)
  ctx.shadowBlur  = 0

  // ── Badge de posição ──────────────────────────────────────────────────────────
  const PW = 58, PH = 24, PX = W - M - PW - 4, PY = OVR_Y + 6
  rrPath(ctx, PX, PY, PW, PH, 6)
  ctx.fillStyle = c.main + '1a'; ctx.fill()
  ctx.strokeStyle = c.main + '55'; ctx.lineWidth = 1
  rrPath(ctx, PX, PY, PW, PH, 6); ctx.stroke()
  ctx.fillStyle    = c.main
  ctx.font         = `bold 12px system-ui, sans-serif`
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(opts.pos.toUpperCase(), PX + PW / 2, PY + PH / 2)

  // ── Linha separadora ──────────────────────────────────────────────────────────
  const SEP_Y = PHOTO_H + 84
  ctx.strokeStyle = c.main + '28'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(M + 4, SEP_Y); ctx.lineTo(W - M - 4, SEP_Y); ctx.stroke()

  // ── Nome ─────────────────────────────────────────────────────────────────────
  const NAME_Y = SEP_Y + 23
  ctx.fillStyle    = 'white'
  ctx.font         = `bold 20px system-ui, sans-serif`
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'alphabetic'
  let displayNome  = opts.nome
  while (ctx.measureText(displayNome).width > W - M * 2 - 10 && displayNome.length > 4) {
    displayNome = displayNome.slice(0, -1)
  }
  if (displayNome !== opts.nome) displayNome += '…'
  ctx.fillText(displayNome, M + 4, NAME_Y)

  // Subtítulo
  const SUB_Y = NAME_Y + 18
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font      = `500 11px system-ui, sans-serif`
  const sub = [opts.pos, opts.categoria].filter(Boolean).join(' · ')
  ctx.fillText(sub, M + 4, SUB_Y)

  // ID do atleta (canto direito)
  if (opts.athleteId) {
    ctx.fillStyle = c.main + '55'
    ctx.font      = `600 9px system-ui, sans-serif`
    ctx.textAlign = 'right'
    ctx.fillText(opts.athleteId, W - M - 4, SUB_Y)
  }

  // Watermark
  ctx.fillStyle = 'rgba(255,255,255,0.08)'
  ctx.font      = `500 8px system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText('meucraque.com.br', W / 2, H - M - 2)

  ctx.restore()

  // ── Borda externa com glow ────────────────────────────────────────────────────
  ctx.save()
  ctx.shadowColor = c.main; ctx.shadowBlur = 14
  rrPath(ctx, 1.5, 1.5, W - 3, H - 3, 17)
  ctx.strokeStyle = c.main + '70'; ctx.lineWidth = 2.5; ctx.stroke()
  ctx.shadowBlur  = 0
  ctx.restore()
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function CardShare(props: CardShareProps) {
  const [open,  setOpen]  = useState(false)
  const [ready, setReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const tier = getTier(props.ovr)
  const c    = TIER[tier]

  // Gera o card assim que o modal abre (canvas já está no DOM)
  useEffect(() => {
    if (!open) return
    setReady(false)
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return
    generateCard(canvas, props).then(() => {
      if (!cancelled) setReady(true)
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.download = `card-${props.nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  // Cor de fundo do botão trigger por tier
  const triggerRgb = tier === 'ouro' ? '245,196,0' : tier === 'prata' ? '168,184,204' : '196,120,48'

  return (
    <>
      {/* ── Botão trigger ──────────────────────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', padding: '13px 16px',
          borderRadius: '14px',
          background: `rgba(${triggerRgb},0.07)`,
          border: `1.5px solid ${c.main}40`,
          color: c.main,
          fontWeight: 800, fontSize: '14px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          letterSpacing: '0.02em',
          transition: 'background .18s, border-color .18s',
          fontFamily: 'system-ui, sans-serif',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `rgba(${triggerRgb},0.13)` }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `rgba(${triggerRgb},0.07)` }}
      >
        {/* Card icon */}
        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ flexShrink: 0 }}>
          <rect x="2" y="5" width="20" height="14" rx="3"/>
          <path strokeLinecap="round" d="M2 10h20"/>
        </svg>
        Compartilhar meu card
        <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.65, letterSpacing: '0.08em' }}>
          {c.label.split(' ')[1]}
        </span>
      </button>

      {/* ── Modal overlay ──────────────────────────────────────────────────── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: c.main, letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'system-ui, sans-serif' }}>
                  {c.label} · {props.ovr ? `OVR ${props.ovr}` : 'Sem avaliação'}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: '16px', fontWeight: 800, color: 'white', fontFamily: 'system-ui, sans-serif' }}>
                  Meu Card
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.55)',
                  fontSize: '20px', lineHeight: 1,
                  cursor: 'pointer', fontFamily: 'system-ui, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            {/* Preview do card */}
            <div style={{
              position: 'relative', width: '100%',
              borderRadius: '20px', overflow: 'hidden',
              boxShadow: `0 0 48px ${c.glow}, 0 24px 64px rgba(0,0,0,0.75)`,
            }}>
              <canvas
                ref={canvasRef}
                style={{
                  display: 'block', width: '100%', height: 'auto',
                  opacity: ready ? 1 : 0,
                  transition: 'opacity .35s ease',
                }}
              />
              {/* Skeleton enquanto gera */}
              {!ready && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: '#0d1107',
                  border: `1px solid ${c.main}25`,
                  borderRadius: '20px',
                  minHeight: '220px',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: '10px',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: `2.5px solid ${c.main}55`,
                    borderTopColor: c.main,
                    animation: 'cardShareSpin .8s linear infinite',
                  }} />
                  <style>{`@keyframes cardShareSpin { to { transform: rotate(360deg) } }`}</style>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontFamily: 'system-ui, sans-serif' }}>
                    Gerando card...
                  </p>
                </div>
              )}
            </div>

            {/* Botão download */}
            <button
              onClick={handleDownload}
              disabled={!ready}
              style={{
                width: '100%', padding: '14px 16px',
                borderRadius: '14px',
                background: ready
                  ? `linear-gradient(135deg, ${c.bg2} 0%, ${c.main}bb 100%)`
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${ready ? c.main + '70' : 'rgba(255,255,255,0.07)'}`,
                color: ready ? 'white' : 'rgba(255,255,255,0.18)',
                fontWeight: 800, fontSize: '14px',
                cursor: ready ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all .2s',
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '0.03em',
              }}
            >
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              {ready ? 'Baixar PNG' : 'Gerando...'}
            </button>

            {/* Dica */}
            <p style={{
              margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.18)',
              textAlign: 'center', fontFamily: 'system-ui, sans-serif',
            }}>
              Salve o PNG e compartilhe no story, status ou WhatsApp
            </p>
          </div>
        </div>
      )}
    </>
  )
}

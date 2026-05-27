'use client'

import { useEffect, useRef, useState } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────────

export type CardShareProps = {
  nome:       string
  pos:        string        // abreviado: 'ZAG', 'ATA', etc.
  posicao:    string        // completo: 'Zagueiro', 'Atacante', etc.
  ovr:        number | null
  categoria:  string | null
  fotoUrl:    string | null
  initials:   string
  athleteId:  string | null  // 'MC-XXXXX'
  cidade:     string | null
  idade:      number | null
  profileUrl: string
}

// ── Canvas helpers ─────────────────────────────────────────────────────────────

function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y,     x + w, y + r,     r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x,     y + h, x,     y + h - r, r)
  ctx.lineTo(x,     y + r); ctx.arcTo(x,     y,     x + r, y,         r)
  ctx.closePath()
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(res => {
    const el = new Image()
    el.crossOrigin = 'anonymous'
    el.onload  = () => res(el)
    el.onerror = () => res(null)
    el.src = src
  })
}

/** Desenha um QR code pattern simples em canvas */
function drawQRPattern(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const cell = size / 9
  ctx.fillStyle = '#080f0a'
  rrPath(ctx, x, y, size, size, 4)
  ctx.fill()
  ctx.fillStyle = color

  function block(cx: number, cy: number, w = 1, h = 1) {
    ctx.fillRect(x + cx * cell + 0.5, y + cy * cell + 0.5, w * cell - 1, h * cell - 1)
  }

  // Finder patterns
  block(0,0,3,1); block(0,1,1,1); block(2,1,1,1); block(0,2,3,1)
  block(6,0,3,1); block(6,1,1,1); block(8,1,1,1); block(6,2,3,1)
  block(0,6,3,1); block(0,7,1,1); block(2,7,1,1); block(0,8,3,1)
  block(1,1); block(7,1); block(1,7)

  // Data cells
  const d: [number,number][] = [[4,1],[4,2],[3,3],[5,3],[4,4],[1,4],[3,4],[6,4],[8,4],[1,5],[3,5],[5,5],[7,5],[4,6],[6,6],[8,6],[3,7],[5,7],[8,7],[4,8],[6,8],[7,8]]
  for (const [cx, cy] of d) block(cx, cy)
}

// ── Card generation ────────────────────────────────────────────────────────────

async function generateCard(canvas: HTMLCanvasElement, opts: CardShareProps): Promise<void> {
  const ctx = canvas.getContext('2d')!
  const W = 400, H = 500
  canvas.width  = W
  canvas.height = H

  const GREEN = '#00FF88'
  const DARK  = '#080f0a'

  // ── Clip round card ───────────────────────────────────────────────────────
  ctx.save()
  rrPath(ctx, 0, 0, W, H, 22)
  ctx.clip()

  // ── Background ────────────────────────────────────────────────────────────
  ctx.fillStyle = DARK
  ctx.fillRect(0, 0, W, H)

  // Grid sutil
  ctx.save()
  ctx.globalAlpha = 0.025
  ctx.strokeStyle = GREEN
  ctx.lineWidth   = 0.5
  for (let xi = 0; xi <= W; xi += 32) { ctx.beginPath(); ctx.moveTo(xi,0); ctx.lineTo(xi,H); ctx.stroke() }
  for (let yi = 0; yi <= H; yi += 32) { ctx.beginPath(); ctx.moveTo(0,yi); ctx.lineTo(W,yi); ctx.stroke() }
  ctx.restore()

  // ── Foto ─────────────────────────────────────────────────────────────────
  const PHOTO_H = 285
  let img: HTMLImageElement | null = null
  if (opts.fotoUrl) img = await loadImage(opts.fotoUrl)

  if (img) {
    const scale = Math.max(W / img.width, PHOTO_H / img.height)
    const dw = img.width  * scale
    const dh = img.height * scale
    const dx = (W - dw) / 2
    const dy = Math.min(0, (PHOTO_H - dh) * 0.1)
    ctx.drawImage(img, dx, dy, dw, dh)

    // Overlay: topo → transparente, base → escuro
    const ov = ctx.createLinearGradient(0, 0, 0, PHOTO_H)
    ov.addColorStop(0,    'rgba(8,15,10,0.68)')
    ov.addColorStop(0.30, 'rgba(8,15,10,0.08)')
    ov.addColorStop(0.60, 'rgba(8,15,10,0.18)')
    ov.addColorStop(1,    'rgba(8,15,10,0.94)')
    ctx.fillStyle = ov
    ctx.fillRect(0, 0, W, PHOTO_H)
  } else {
    // Sem foto — fundo radial + iniciais
    const bg = ctx.createRadialGradient(W/2, PHOTO_H*0.44, 0, W/2, PHOTO_H*0.44, 180)
    bg.addColorStop(0, '#0e2016'); bg.addColorStop(1, DARK)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, PHOTO_H)

    ctx.shadowColor = GREEN; ctx.shadowBlur = 22
    ctx.fillStyle   = GREEN + '1e'
    ctx.beginPath(); ctx.arc(W/2, PHOTO_H*0.44, 72, 0, Math.PI*2); ctx.fill()
    ctx.strokeStyle = GREEN + '55'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(W/2, PHOTO_H*0.44, 72, 0, Math.PI*2); ctx.stroke()
    ctx.shadowBlur = 0

    ctx.fillStyle    = GREEN
    ctx.font         = 'bold 52px system-ui, -apple-system, sans-serif'
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(opts.initials, W/2, PHOTO_H*0.44)
  }

  // ── Panel inferior ─────────────────────────────────────────────────────────
  const PANEL_Y = PHOTO_H - 10
  const fade = ctx.createLinearGradient(0, PANEL_Y - 36, 0, PANEL_Y + 8)
  fade.addColorStop(0, 'rgba(8,15,10,0)'); fade.addColorStop(1, DARK)
  ctx.fillStyle = fade
  ctx.fillRect(0, PANEL_Y - 36, W, 44)
  ctx.fillStyle = DARK
  ctx.fillRect(0, PANEL_Y, W, H - PANEL_Y)

  // ── Borda neon verde ───────────────────────────────────────────────────────
  ctx.save()
  ctx.shadowColor = GREEN; ctx.shadowBlur = 28
  rrPath(ctx, 1.5, 1.5, W - 3, H - 3, 21)
  ctx.strokeStyle = GREEN + '72'; ctx.lineWidth = 2.5; ctx.stroke()
  ctx.shadowBlur = 0
  ctx.restore()

  // ── Logo "MEU CRAQUE" (topo esquerdo) ─────────────────────────────────────
  ctx.save()
  ctx.shadowColor = GREEN; ctx.shadowBlur = 8
  ctx.fillStyle   = GREEN + '22'
  ctx.strokeStyle = GREEN + '66'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(26, 26, 12, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()
  ctx.shadowBlur = 0
  ctx.fillStyle    = GREEN
  ctx.font         = 'bold 11px system-ui, sans-serif'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('M', 26, 26)
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle    = 'rgba(255,255,255,0.90)'
  ctx.font         = 'bold 9px system-ui, sans-serif'
  ctx.fillText('MEU', 42, 23)
  ctx.fillStyle = GREEN
  ctx.fillText('CRAQUE', 42, 34)
  ctx.restore()

  // ── Badge "VALIDADO" (topo direito) ───────────────────────────────────────
  if (opts.ovr) {
    const bw = 98, bh = 54, bx = W - bw - 14, by = 8
    ctx.save()
    ctx.fillStyle   = 'rgba(0,0,0,0.55)'
    rrPath(ctx, bx, by, bw, bh, 8); ctx.fill()
    ctx.strokeStyle = GREEN + '44'; ctx.lineWidth = 1
    rrPath(ctx, bx, by, bw, bh, 8); ctx.stroke()
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle    = GREEN
    ctx.font         = 'bold 13px system-ui, sans-serif'
    ctx.fillText('✓', bx + bw / 2, by + 6)
    ctx.fillStyle = 'rgba(255,255,255,0.68)'
    ctx.font      = 'bold 7px system-ui, sans-serif'
    ctx.fillText('VALIDADO POR',      bx + bw / 2, by + 22)
    ctx.fillText('TREINADOR OFICIAL', bx + bw / 2, by + 32)
    ctx.fillStyle = GREEN
    ctx.fillText('★  ★  ★',          bx + bw / 2, by + 42)
    ctx.restore()
  }

  // ── OVR (esquerda, sobreposto à foto) ─────────────────────────────────────
  ctx.save()
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle    = 'rgba(255,255,255,0.52)'
  ctx.font         = 'bold 12px system-ui, sans-serif'
  ctx.fillText('OVR', 20, 68)
  ctx.shadowColor  = GREEN; ctx.shadowBlur = 26
  ctx.fillStyle    = GREEN
  ctx.font         = 'bold 84px system-ui, -apple-system, sans-serif'
  ctx.fillText(opts.ovr ? String(opts.ovr) : '—', 12, 80)
  ctx.shadowBlur = 0
  ctx.restore()

  // ── Nome (parte inferior da foto) ─────────────────────────────────────────
  const parts     = opts.nome.trim().split(' ')
  const lastName  = (parts.length > 1 ? parts[parts.length - 1] : opts.nome).toUpperCase()
  const firstName = (parts.length > 1 ? parts.slice(0, -1).join(' ') : '').toUpperCase()
  const NAME_Y    = PHOTO_H - 60

  ctx.save()
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'alphabetic'
  if (firstName) {
    ctx.fillStyle = 'rgba(255,255,255,0.88)'
    ctx.font      = 'bold 22px system-ui, sans-serif'
    ctx.fillText(firstName, 20, NAME_Y)
  }
  ctx.shadowColor = GREEN; ctx.shadowBlur = 14
  ctx.fillStyle   = GREEN
  ctx.font        = 'bold 44px system-ui, -apple-system, sans-serif'
  let ln = lastName
  while (ctx.measureText(ln).width > W - 28 && ln.length > 3) ln = ln.slice(0, -1)
  if (ln !== lastName) ln += '…'
  ctx.fillText(ln, 18, NAME_Y + (firstName ? 45 : 0))
  ctx.shadowBlur = 0
  ctx.restore()

  // ── Panel content ─────────────────────────────────────────────────────────
  const CY = PANEL_Y + 12

  // ID box
  const QR_SIZE   = 56
  const QR_X      = W - 14 - QR_SIZE
  const ID_BOX_W  = QR_X - 16 - 10
  const ID_BOX_H  = QR_SIZE

  ctx.save()
  ctx.fillStyle   = 'rgba(255,255,255,0.030)'
  rrPath(ctx, 16, CY, ID_BOX_W, ID_BOX_H, 8); ctx.fill()
  ctx.strokeStyle = GREEN + '28'; ctx.lineWidth = 1
  rrPath(ctx, 16, CY, ID_BOX_W, ID_BOX_H, 8); ctx.stroke()
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'top'
  ctx.fillStyle    = 'rgba(255,255,255,0.36)'
  ctx.font         = 'bold 9px system-ui, sans-serif'
  ctx.fillText('ID ÚNICO', 26, CY + 10)
  ctx.fillStyle = GREEN
  ctx.font      = 'bold 19px system-ui, -apple-system, sans-serif'
  ctx.fillText(opts.athleteId ?? '—', 26, CY + 27)
  ctx.restore()

  // QR code
  let qrDrawn = false
  if (opts.profileUrl) {
    const api = `https://api.qrserver.com/v1/create-qr-code/?size=112x112&data=${encodeURIComponent(opts.profileUrl)}&color=00FF88&bgcolor=080f0a&margin=2`
    const qrImg = await loadImage(api)
    if (qrImg) {
      ctx.save()
      rrPath(ctx, QR_X, CY, QR_SIZE, QR_SIZE, 4)
      ctx.clip()
      ctx.drawImage(qrImg, QR_X, CY, QR_SIZE, QR_SIZE)
      ctx.restore()
      qrDrawn = true
    }
  }
  if (!qrDrawn) {
    drawQRPattern(ctx, QR_X, CY, QR_SIZE, GREEN + 'cc')
  }

  // ── Stats bar ─────────────────────────────────────────────────────────────
  const SY = CY + ID_BOX_H + 10
  const SH = 50

  ctx.save()
  ctx.fillStyle   = 'rgba(255,255,255,0.025)'
  rrPath(ctx, 16, SY, W - 32, SH, 8); ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
  rrPath(ctx, 16, SY, W - 32, SH, 8); ctx.stroke()

  const cols = [
    { label: 'POSIÇÃO', val: (opts.posicao || opts.pos).toUpperCase() },
    { label: 'IDADE',   val: opts.idade ? `${opts.idade} ANOS` : (opts.categoria ?? '—').toUpperCase() },
    { label: 'CIDADE',  val: ((opts.cidade ?? '').split(',')[0] || '—').toUpperCase(), flag: true },
  ]
  const colW = (W - 32) / 3
  cols.forEach((s, i) => {
    const cx = 16 + i * colW + colW / 2
    if (i > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      ctx.beginPath(); ctx.moveTo(16 + i * colW, SY + 7); ctx.lineTo(16 + i * colW, SY + SH - 7); ctx.stroke()
    }
    ctx.textAlign    = 'center'
    ctx.textBaseline = 'top'
    ctx.fillStyle    = GREEN + '72'
    ctx.font         = 'bold 7.5px system-ui, sans-serif'
    ctx.fillText(s.label, cx, SY + 6)
    ctx.fillStyle = 'rgba(255,255,255,0.88)'
    ctx.font      = 'bold 10.5px system-ui, sans-serif'
    let v = s.val
    while (ctx.measureText(v).width > colW - 10 && v.length > 2) v = v.slice(0, -1)
    if (v !== s.val) v += '.'
    ctx.fillText(v, cx, SY + 19)
    if (s.flag) {
      ctx.font = '13px system-ui, sans-serif'
      ctx.fillText('🇧🇷', cx, SY + 33)
    }
  })
  ctx.restore()

  // ── Botão CTA ─────────────────────────────────────────────────────────────
  const BY = SY + SH + 10
  const BH = 42

  ctx.save()
  const btnG = ctx.createLinearGradient(16, BY, W - 16, BY + BH)
  btnG.addColorStop(0, '#00ee7e'); btnG.addColorStop(1, '#00c855')
  ctx.fillStyle = btnG
  rrPath(ctx, 16, BY, W - 32, BH, 11); ctx.fill()
  ctx.fillStyle    = '#020c05'
  ctx.font         = 'bold 13px system-ui, -apple-system, sans-serif'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('VER PERFIL COMPLETO  →', W / 2, BY + BH / 2)
  ctx.restore()

  // ── Watermark ─────────────────────────────────────────────────────────────
  ctx.fillStyle    = 'rgba(255,255,255,0.07)'
  ctx.font         = '8px system-ui, sans-serif'
  ctx.textAlign    = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('meucraque.com', W / 2, H - 6)

  ctx.restore() // restore clip
}

// ── Componente principal ───────────────────────────────────────────────────────

export default function CardShare(props: CardShareProps) {
  const [open,  setOpen]  = useState(false)
  const [ready, setReady] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

  return (
    <>
      {/* ── Botão trigger ── */}
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', padding: '13px 16px',
          borderRadius: '14px',
          background: 'rgba(0,255,136,0.07)',
          border: '1.5px solid rgba(0,255,136,0.28)',
          color: '#00FF88',
          fontWeight: 800, fontSize: '14px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          letterSpacing: '0.02em',
          transition: 'background .18s',
          fontFamily: 'system-ui, sans-serif',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,255,136,0.13)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,255,136,0.07)')}
      >
        <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ flexShrink: 0 }}>
          <rect x="2" y="5" width="20" height="14" rx="3"/>
          <path strokeLinecap="round" d="M2 10h20"/>
        </svg>
        Meu Card
        {props.ovr && (
          <span style={{ fontSize: '11px', fontWeight: 700, opacity: 0.6 }}>
            OVR {props.ovr}
          </span>
        )}
      </button>

      {/* ── Modal ── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '20px', overflowY: 'auto',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, color: 'rgba(0,255,136,0.7)', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'system-ui' }}>
                  {props.ovr ? `OVR ${props.ovr}` : 'Sem avaliação'}
                </p>
                <p style={{ margin: '3px 0 0', fontSize: '16px', fontWeight: 800, color: 'white', fontFamily: 'system-ui' }}>
                  Meu Card
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.55)', fontSize: '20px',
                  cursor: 'pointer', fontFamily: 'system-ui',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >×</button>
            </div>

            {/* Canvas preview */}
            <div style={{
              position: 'relative', width: '100%',
              borderRadius: '22px', overflow: 'hidden',
              boxShadow: '0 0 56px rgba(0,255,136,0.22), 0 24px 64px rgba(0,0,0,0.80)',
            }}>
              <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: 'auto', opacity: ready ? 1 : 0, transition: 'opacity .35s ease' }}
              />
              {!ready && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: '#080f0a',
                  border: '1px solid rgba(0,255,136,0.18)',
                  borderRadius: '22px', minHeight: '220px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    border: '2.5px solid rgba(0,255,136,0.3)',
                    borderTopColor: '#00FF88',
                    animation: 'cardSpin .7s linear infinite',
                  }} />
                  <style>{`@keyframes cardSpin { to { transform: rotate(360deg) } }`}</style>
                  <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.25)', fontFamily: 'system-ui' }}>
                    Gerando card...
                  </p>
                </div>
              )}
            </div>

            {/* Download button */}
            <button
              onClick={handleDownload}
              disabled={!ready}
              style={{
                width: '100%', padding: '14px 16px',
                borderRadius: '14px',
                background: ready
                  ? 'linear-gradient(135deg,#00ee7e 0%,#00c855 100%)'
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${ready ? 'rgba(0,255,136,0.5)' : 'rgba(255,255,255,0.07)'}`,
                color: ready ? '#020c05' : 'rgba(255,255,255,0.18)',
                fontWeight: 800, fontSize: '14px',
                cursor: ready ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all .2s',
                fontFamily: 'system-ui',
              }}
            >
              <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2} style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              {ready ? 'Baixar PNG' : 'Gerando...'}
            </button>

            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.16)', textAlign: 'center', fontFamily: 'system-ui' }}>
              Salve o PNG e compartilhe no story, status ou WhatsApp
            </p>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * canvasCard.ts — Geração do card oficial do atleta (400×560px, Canvas 2D).
 * Usado por CardShare.tsx (modal em /jogador/[id]), atleta/compartilhar e atleta/perfil.
 * Modelo único com QR code, badge condicional e OVR real.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type CanvasCardProps = {
  nome:          string
  pos:           string        // abreviado: 'GK', 'ATA', etc.
  posicao:       string        // completo: 'Goleiro', 'Atacante', etc.
  ovr:           number | null
  hasEvaluation: boolean       // true → mostra badge "VALIDADO POR TREINADOR OFICIAL"
  categoria:     string | null
  fotoUrl:       string | null
  initials:      string
  athleteId:     string | null // 'MC-XXXXX'
  cidade:        string | null
  idade:         number | null
  profileUrl:    string        // URL para o QR code
}

// ── Helpers internos ───────────────────────────────────────────────────────────

function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y,     x + w, y + r,     r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x,     y + h, x,     y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y,         x + r, y,             r)
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

// ── generateCard (função principal exportada) ──────────────────────────────────

export async function generateCard(canvas: HTMLCanvasElement, opts: CanvasCardProps): Promise<void> {
  const ctx = canvas.getContext('2d')!
  const W = 400, H = 560
  canvas.width  = W
  canvas.height = H

  const GREEN = '#00FF88'
  const DARK  = '#060d08'

  // ── Clip round card ───────────────────────────────────────────────────────
  ctx.save()
  rrPath(ctx, 0, 0, W, H, 22)
  ctx.clip()

  // ── Fundo base ───────────────────────────────────────────────────────────
  ctx.fillStyle = DARK
  ctx.fillRect(0, 0, W, H)

  // ── FOTO preenche o card inteiro ──────────────────────────────────────────
  let img: HTMLImageElement | null = null
  if (opts.fotoUrl) img = await loadImage(opts.fotoUrl)

  if (img) {
    const scale = Math.max(W / img.width, H / img.height)
    const dw = img.width  * scale
    const dh = img.height * scale
    const dx = (W - dw) / 2
    const dy = Math.min(0, (H - dh) * 0.12)
    ctx.drawImage(img, dx, dy, dw, dh)

    const topOv = ctx.createLinearGradient(0, 0, 0, 120)
    topOv.addColorStop(0,    'rgba(4,10,6,0.70)')
    topOv.addColorStop(0.60, 'rgba(4,10,6,0.08)')
    topOv.addColorStop(1,    'rgba(4,10,6,0)')
    ctx.fillStyle = topOv
    ctx.fillRect(0, 0, W, 120)

    const ovrOv = ctx.createLinearGradient(0, 0, 155, 0)
    ovrOv.addColorStop(0,   'rgba(4,10,6,0.36)')
    ovrOv.addColorStop(1,   'rgba(4,10,6,0)')
    ctx.fillStyle = ovrOv
    ctx.fillRect(0, 55, 155, 140)

    const botOv = ctx.createLinearGradient(0, H - 320, 0, H)
    botOv.addColorStop(0,    'rgba(4,10,6,0)')
    botOv.addColorStop(0.11, 'rgba(4,10,6,0.08)')
    botOv.addColorStop(0.33, 'rgba(4,10,6,0.78)')
    botOv.addColorStop(0.52, 'rgba(4,10,6,0.92)')
    botOv.addColorStop(0.68, 'rgba(4,10,6,0.97)')
    botOv.addColorStop(1,    'rgba(4,10,6,0.99)')
    ctx.fillStyle = botOv
    ctx.fillRect(0, H - 320, W, 320)
  } else {
    const bg = ctx.createRadialGradient(W/2, H*0.36, 0, W/2, H*0.36, 220)
    bg.addColorStop(0, '#0e2016'); bg.addColorStop(1, DARK)
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    ctx.save()
    ctx.globalAlpha = 0.03
    ctx.strokeStyle = GREEN; ctx.lineWidth = 0.5
    for (let xi = 0; xi <= W; xi += 32) { ctx.beginPath(); ctx.moveTo(xi,0); ctx.lineTo(xi,H); ctx.stroke() }
    for (let yi = 0; yi <= H; yi += 32) { ctx.beginPath(); ctx.moveTo(0,yi); ctx.lineTo(W,yi); ctx.stroke() }
    ctx.restore()

    ctx.shadowColor = GREEN; ctx.shadowBlur = 28
    ctx.fillStyle   = GREEN + '18'
    ctx.beginPath(); ctx.arc(W/2, H*0.36, 80, 0, Math.PI*2); ctx.fill()
    ctx.strokeStyle = GREEN + '44'; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(W/2, H*0.36, 80, 0, Math.PI*2); ctx.stroke()
    ctx.shadowBlur = 0
    ctx.fillStyle    = GREEN
    ctx.font         = 'bold 58px system-ui, -apple-system, sans-serif'
    ctx.textAlign    = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(opts.initials, W/2, H*0.36)

    const botOv2 = ctx.createLinearGradient(0, H - 240, 0, H)
    botOv2.addColorStop(0, 'rgba(4,10,6,0)'); botOv2.addColorStop(1, 'rgba(4,10,6,0.92)')
    ctx.fillStyle = botOv2; ctx.fillRect(0, H - 240, W, 240)
  }

  // ── Borda neon verde ───────────────────────────────────────────────────────
  ctx.save()
  ctx.shadowColor = GREEN; ctx.shadowBlur = 32
  rrPath(ctx, 1.5, 1.5, W - 3, H - 3, 21)
  ctx.strokeStyle = GREEN + '78'; ctx.lineWidth = 2.5; ctx.stroke()
  ctx.shadowBlur = 0
  ctx.restore()

  // ── Logo "MEU CRAQUE" (topo esquerdo) ─────────────────────────────────────
  ctx.save()
  ctx.fillStyle   = GREEN + '20'
  ctx.strokeStyle = GREEN + '60'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(26, 26, 12, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()
  ctx.fillStyle    = GREEN
  ctx.font         = 'bold 11px system-ui, sans-serif'
  ctx.textAlign    = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('M', 26, 26)
  ctx.textAlign    = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillStyle    = 'rgba(255,255,255,0.92)'
  ctx.font         = 'bold 9px system-ui, sans-serif'
  ctx.fillText('MEU', 42, 23)
  ctx.fillStyle = GREEN
  ctx.fillText('CRAQUE', 42, 34)
  ctx.restore()

  // ── Badge "VALIDADO" — só quando há avaliação real ────────────────────────
  if (opts.hasEvaluation) {
    const bw = 96, bh = 54, bx = W - bw - 14, by = 8
    ctx.save()
    ctx.fillStyle   = 'rgba(2,8,4,0.65)'
    rrPath(ctx, bx, by, bw, bh, 8); ctx.fill()
    ctx.strokeStyle = GREEN + '44'; ctx.lineWidth = 1
    rrPath(ctx, bx, by, bw, bh, 8); ctx.stroke()
    ctx.textAlign    = 'center'; ctx.textBaseline = 'top'
    ctx.fillStyle    = GREEN
    ctx.font         = 'bold 13px system-ui, sans-serif'
    ctx.fillText('✓', bx + bw / 2, by + 6)
    ctx.fillStyle = 'rgba(255,255,255,0.65)'
    ctx.font      = 'bold 7px system-ui, sans-serif'
    ctx.fillText('VALIDADO POR',      bx + bw / 2, by + 22)
    ctx.fillText('TREINADOR OFICIAL', bx + bw / 2, by + 32)
    ctx.fillStyle = GREEN
    ctx.fillText('★  ★  ★',          bx + bw / 2, by + 42)
    ctx.restore()
  }

  // ── OVR ───────────────────────────────────────────────────────────────────
  ctx.save()
  ctx.textAlign    = 'left'; ctx.textBaseline = 'top'
  ctx.fillStyle    = 'rgba(255,255,255,0.55)'
  ctx.font         = 'bold 12px system-ui, sans-serif'
  ctx.fillText('OVR', 20, 66)
  ctx.shadowColor  = GREEN; ctx.shadowBlur = 28
  ctx.fillStyle    = GREEN
  ctx.font         = 'bold 88px system-ui, -apple-system, sans-serif'
  ctx.fillText(opts.ovr ? String(opts.ovr) : '—', 10, 78)
  ctx.shadowBlur = 0
  ctx.restore()

  // ── Nome ──────────────────────────────────────────────────────────────────
  const parts    = opts.nome.trim().split(' ')
  const lastName  = (parts.length > 1 ? parts[parts.length - 1] : opts.nome).toUpperCase()
  const firstName = (parts.length > 1 ? parts.slice(0, -1).join(' ') : '').toUpperCase()
  const NAME_Y   = H - 238

  ctx.save()
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  if (firstName) {
    ctx.fillStyle = 'rgba(255,255,255,0.90)'
    ctx.font      = 'bold 23px system-ui, sans-serif'
    ctx.fillText(firstName, 20, NAME_Y)
  }
  ctx.shadowColor = GREEN; ctx.shadowBlur = 16
  ctx.fillStyle   = GREEN
  ctx.font        = 'bold 46px system-ui, -apple-system, sans-serif'
  let ln = lastName
  while (ctx.measureText(ln).width > W - 28 && ln.length > 3) ln = ln.slice(0, -1)
  if (ln !== lastName) ln += '…'
  ctx.fillText(ln, 18, NAME_Y + (firstName ? 47 : 0))
  ctx.shadowBlur = 0
  ctx.restore()

  // ── ID + QR ────────────────────────────────────────────────────────────────
  const CY      = H - 178
  const QR_SIZE = 56
  const QR_X    = W - 14 - QR_SIZE
  const IB_W    = QR_X - 16 - 10

  ctx.save()
  ctx.fillStyle   = 'rgba(2,8,4,0.60)'
  rrPath(ctx, 16, CY, IB_W, QR_SIZE, 8); ctx.fill()
  ctx.strokeStyle = GREEN + '30'; ctx.lineWidth = 1
  rrPath(ctx, 16, CY, IB_W, QR_SIZE, 8); ctx.stroke()
  ctx.textAlign    = 'left'; ctx.textBaseline = 'top'
  ctx.fillStyle    = 'rgba(255,255,255,0.38)'
  ctx.font         = 'bold 9px system-ui, sans-serif'
  ctx.fillText('ID ÚNICO', 26, CY + 11)
  ctx.fillStyle = GREEN
  ctx.font      = 'bold 19px system-ui, -apple-system, sans-serif'
  ctx.fillText((opts.athleteId ?? '—').replace(/^[A-Z]+-/, ''), 26, CY + 28)
  ctx.restore()

  // QR code
  let qrDrawn = false
  if (opts.profileUrl) {
    const api = `https://api.qrserver.com/v1/create-qr-code/?size=112x112&data=${encodeURIComponent(opts.profileUrl)}&color=00FF88&bgcolor=060d08&margin=2`
    const qrImg = await loadImage(api)
    if (qrImg) {
      ctx.save()
      rrPath(ctx, QR_X, CY, QR_SIZE, QR_SIZE, 4); ctx.clip()
      ctx.drawImage(qrImg, QR_X, CY, QR_SIZE, QR_SIZE)
      ctx.restore(); qrDrawn = true
    }
  }
  if (!qrDrawn) drawQRPattern(ctx, QR_X, CY, QR_SIZE, GREEN + 'cc')

  // ── Stats bar ─────────────────────────────────────────────────────────────
  const SY = CY + QR_SIZE + 9
  const SH = 50

  ctx.save()
  ctx.fillStyle   = 'rgba(2,8,4,0.58)'
  rrPath(ctx, 16, SY, W - 32, SH, 8); ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
  rrPath(ctx, 16, SY, W - 32, SH, 8); ctx.stroke()

  const cols = [
    { label: 'POSIÇÃO', val: (opts.posicao || opts.pos).toUpperCase() },
    { label: 'IDADE',   val: opts.idade ? `${opts.idade} ANOS` : (opts.categoria ?? '—').toUpperCase() },
    { label: 'CIDADE',  val: ((opts.cidade ?? '').split(',')[0] || '—').toUpperCase() },
  ]
  const colW = (W - 32) / 3
  cols.forEach((s, i) => {
    const cx = 16 + i * colW + colW / 2
    if (i > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.beginPath(); ctx.moveTo(16 + i * colW, SY + 7); ctx.lineTo(16 + i * colW, SY + SH - 7); ctx.stroke()
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillStyle = GREEN + '70'
    ctx.font      = 'bold 7.5px system-ui, sans-serif'
    ctx.fillText(s.label, cx, SY + 6)
    ctx.fillStyle = 'rgba(255,255,255,0.90)'
    ctx.font      = 'bold 10.5px system-ui, sans-serif'
    let v = s.val
    while (ctx.measureText(v).width > colW - 10 && v.length > 2) v = v.slice(0, -1)
    if (v !== s.val) v += '.'
    ctx.fillText(v, cx, SY + 20)
  })
  ctx.restore()

  // ── Botão CTA ─────────────────────────────────────────────────────────────
  const BY = SY + SH + 9
  const BH = 42

  ctx.save()
  const btnG = ctx.createLinearGradient(16, BY, W - 16, BY + BH)
  btnG.addColorStop(0, '#00ee7e'); btnG.addColorStop(1, '#00c855')
  ctx.fillStyle = btnG
  rrPath(ctx, 16, BY, W - 32, BH, 11); ctx.fill()
  ctx.fillStyle    = '#020c05'
  ctx.font         = 'bold 13px system-ui, -apple-system, sans-serif'
  ctx.textAlign    = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('VER PERFIL COMPLETO  →', W / 2, BY + BH / 2)
  ctx.restore()

  // ── Watermark ─────────────────────────────────────────────────────────────
  ctx.fillStyle    = 'rgba(255,255,255,0.07)'
  ctx.font         = '8px system-ui, sans-serif'
  ctx.textAlign    = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('meucraque.com', W / 2, H - 6)

  ctx.restore() // restore clip
}

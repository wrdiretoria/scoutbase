/**
 * canvasCard.ts — Card oficial do atleta estilo FIFA Ultimate Team.
 * 400×580px, Canvas 2D. Tier automático pelo OVR.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type CanvasCardProps = {
  nome:          string
  pos:           string        // abreviado: 'GK', 'ATA', etc.
  posicao:       string        // completo: 'Goleiro', 'Atacante', etc.
  ovr:           number | null
  hasEvaluation: boolean
  categoria:     string | null
  fotoUrl:       string | null
  initials:      string
  athleteId:     string | null // 'MC-XXXXX'
  cidade:        string | null
  idade:         number | null
  profileUrl:    string
  // Stats individuais (opcionais — escala 0-10)
  statPac?:      number | null  // velocidade
  statSho?:      number | null  // finalizacao
  statPas?:      number | null  // visao_jogo
  statDri?:      number | null  // tecnica
  statDef?:      number | null  // posicionamento
  statPhy?:      number | null  // forca
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function rrPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y,     x + w, y + r,     r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x,     y + h, x,     y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y,         x + r, y,             r)
  ctx.closePath()
}

function octPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cut: number) {
  ctx.beginPath()
  ctx.moveTo(x + cut, y)
  ctx.lineTo(x + w - cut, y)
  ctx.lineTo(x + w, y + cut)
  ctx.lineTo(x + w, y + h - cut)
  ctx.lineTo(x + w - cut, y + h)
  ctx.lineTo(x + cut, y + h)
  ctx.lineTo(x, y + h - cut)
  ctx.lineTo(x, y + cut)
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
  ctx.fillStyle = '#050a06'
  rrPath(ctx, x, y, size, size, 3)
  ctx.fill()
  ctx.fillStyle = color
  function block(cx: number, cy: number, w = 1, h = 1) {
    ctx.fillRect(x + cx * cell + 0.5, y + cy * cell + 0.5, w * cell - 1, h * cell - 1)
  }
  block(0,0,3,1); block(0,1,1,1); block(2,1,1,1); block(0,2,3,1)
  block(6,0,3,1); block(6,1,1,1); block(8,1,1,1); block(6,2,3,1)
  block(0,6,3,1); block(0,7,1,1); block(2,7,1,1); block(0,8,3,1)
  block(1,1); block(7,1); block(1,7)
  const d: [number,number][] = [[4,1],[4,2],[3,3],[5,3],[4,4],[1,4],[3,4],[6,4],[8,4],[1,5],[3,5],[5,5],[7,5],[4,6],[6,6],[8,6],[3,7],[5,7],[8,7],[4,8],[6,8],[7,8]]
  for (const [cx, cy] of d) block(cx, cy)
}

function drawBrazilFlag(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Verde
  ctx.fillStyle = '#009c3b'
  rrPath(ctx, x, y, w, h, 2)
  ctx.fill()
  // Losango amarelo
  ctx.fillStyle = '#ffdf00'
  ctx.beginPath()
  ctx.moveTo(x + w * 0.5, y + h * 0.08)
  ctx.lineTo(x + w * 0.96, y + h * 0.5)
  ctx.lineTo(x + w * 0.5, y + h * 0.92)
  ctx.lineTo(x + w * 0.04, y + h * 0.5)
  ctx.closePath()
  ctx.fill()
  // Círculo azul
  ctx.fillStyle = '#002776'
  ctx.beginPath()
  ctx.arc(x + w * 0.5, y + h * 0.5, h * 0.28, 0, Math.PI * 2)
  ctx.fill()
  // Faixa branca
  ctx.strokeStyle = 'white'
  ctx.lineWidth = h * 0.07
  ctx.beginPath()
  ctx.arc(x + w * 0.5, y + h * 1.1, h * 0.72, Math.PI * 1.18, Math.PI * 1.82)
  ctx.stroke()
}

// ── generateCard ───────────────────────────────────────────────────────────────

export async function generateCard(canvas: HTMLCanvasElement, opts: CanvasCardProps): Promise<void> {
  const ctx = canvas.getContext('2d')!
  const W = 400, H = 580
  canvas.width  = W
  canvas.height = H

  const GREEN = '#00FF88'

  // Tier
  const ovr = opts.ovr ?? 0
  let TIER_COLOR: string, TIER_GLOW: string, TIER_LABEL: string
  if (ovr >= 80) {
    TIER_COLOR = '#d4a017'; TIER_GLOW = '#f5c842'; TIER_LABEL = 'CARD OURO'
  } else if (ovr >= 50) {
    TIER_COLOR = '#a8a8a5'; TIER_GLOW = '#d0d0cc'; TIER_LABEL = 'CARD PRATA'
  } else {
    TIER_COLOR = '#D85A30'; TIER_GLOW = '#f07040'; TIER_LABEL = 'CARD BRONZE'
  }

  // ── 1. Fundo preto ────────────────────────────────────────────────────────
  ctx.fillStyle = '#050a06'
  ctx.fillRect(0, 0, W, H)

  // ── Helper cristal (reutilizado antes e depois da foto) ───────────────────
  const SC = { x: W * 0.74, y: H * 0.28 }

  function drawCrystal(angle: number, len: number, wid: number, alpha: number, blend = false) {
    ctx.save()
    if (blend) ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = alpha
    ctx.translate(SC.x, SC.y)
    ctx.rotate(angle)
    ctx.shadowColor = GREEN; ctx.shadowBlur = 30
    const g = ctx.createLinearGradient(0, 0, 0, len)
    g.addColorStop(0,    '#00ffaa')
    g.addColorStop(0.35, GREEN + 'dd')
    g.addColorStop(0.70, GREEN + '55')
    g.addColorStop(1,    'transparent')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(-wid / 2, len * 0.25)
    ctx.lineTo(0, len)
    ctx.lineTo(wid / 2, len * 0.25)
    ctx.closePath()
    ctx.fill()
    // Linha central brilhante
    ctx.shadowBlur = 12
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len * 0.55); ctx.stroke()
    ctx.restore()
  }

  // Cristais de fundo (baixa intensidade, antes da foto)
  const crystalsBg: [number, number, number, number][] = [
    [-0.25, 200, 22, 0.35],
    [ 0.18, 230, 26, 0.40],
    [ 0.65, 170, 18, 0.30],
    [-0.75, 145, 15, 0.25],
    [ 1.15, 130, 13, 0.22],
    [-1.25, 115, 12, 0.20],
    [ 1.65, 100, 10, 0.18],
    [-1.70,  92,  9, 0.16],
  ]
  for (const [a, l, w, al] of crystalsBg) drawCrystal(a, l, w, al)

  // ── 3. Foto ────────────────────────────────────────────────────────────────
  let img: HTMLImageElement | null = null
  if (opts.fotoUrl) img = await loadImage(opts.fotoUrl)

  const PHOTO_H = H * 0.66

  if (img) {
    const scale = Math.max(W / img.width, PHOTO_H / img.height)
    const dw = img.width  * scale
    const dh = img.height * scale
    const dx = (W - dw) / 2
    const dy = (PHOTO_H - dh) * 0.08

    ctx.save()
    ctx.beginPath(); ctx.rect(0, 44, W, PHOTO_H - 44); ctx.clip()
    ctx.drawImage(img, dx, dy, dw, dh)

    // Gradientes sobre a foto
    const topG = ctx.createLinearGradient(0, 44, 0, 160)
    topG.addColorStop(0, 'rgba(5,10,6,0.88)'); topG.addColorStop(1, 'rgba(5,10,6,0)')
    ctx.fillStyle = topG; ctx.fillRect(0, 44, W, 116)

    const leftG = ctx.createLinearGradient(0, 0, 180, 0)
    leftG.addColorStop(0, 'rgba(5,10,6,0.80)'); leftG.addColorStop(1, 'rgba(5,10,6,0)')
    ctx.fillStyle = leftG; ctx.fillRect(0, 44, 180, PHOTO_H)

    const botG = ctx.createLinearGradient(0, PHOTO_H - 200, 0, PHOTO_H)
    botG.addColorStop(0,    'rgba(5,10,6,0)')
    botG.addColorStop(0.40, 'rgba(5,10,6,0.65)')
    botG.addColorStop(0.75, 'rgba(5,10,6,0.94)')
    botG.addColorStop(1,    'rgba(5,10,6,1)')
    ctx.fillStyle = botG; ctx.fillRect(0, PHOTO_H - 200, W, 200)
    ctx.restore()
  } else {
    // Sem foto — iniciais
    ctx.save()
    ctx.shadowColor = GREEN; ctx.shadowBlur = 44
    ctx.fillStyle   = GREEN + '14'
    ctx.beginPath(); ctx.arc(W / 2, H * 0.30, 92, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = GREEN + '55'; ctx.lineWidth = 2.5; ctx.stroke()
    ctx.shadowBlur  = 0
    ctx.fillStyle   = GREEN
    ctx.font        = 'bold 66px system-ui, sans-serif'
    ctx.textAlign   = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(opts.initials, W / 2, H * 0.30)
    ctx.restore()
  }

  // ── 3b. Cristais em alta intensidade SOBRE a foto ─────────────────────────
  const crystalsFg: [number, number, number, number][] = [
    [-0.25, 195, 22, 0.90],
    [ 0.18, 225, 26, 1.00],
    [ 0.65, 168, 18, 0.80],
    [-0.75, 140, 15, 0.65],
    [ 1.15, 128, 13, 0.60],
    [-1.25, 112, 12, 0.55],
    [ 1.65,  98, 10, 0.48],
    [-1.70,  90,  9, 0.42],
    [ 2.10,  78,  8, 0.35],
    [-2.20,  72,  7, 0.30],
  ]
  for (const [a, l, w, al] of crystalsFg) drawCrystal(a, l, w, al, true)

  // Sparkles brilhantes
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  const sparks: [number, number, number][] = [
    [W * 0.83, H * 0.07, 3.5], [W * 0.65, H * 0.04, 2.5],
    [W * 0.91, H * 0.17, 2.5], [W * 0.55, H * 0.12, 2],
    [W * 0.79, H * 0.41, 2.5], [W * 0.93, H * 0.37, 2],
    [W * 0.46, H * 0.07, 2],   [W * 0.96, H * 0.49, 2],
    [W * 0.70, H * 0.52, 1.8], [W * 0.88, H * 0.55, 1.5],
  ]
  for (const [sx, sy, sr] of sparks) {
    ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 14
    ctx.fillStyle   = 'rgba(255,255,255,0.95)'
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill()
    // Cruz de luz
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(sx - sr * 3, sy); ctx.lineTo(sx + sr * 3, sy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(sx, sy - sr * 3); ctx.lineTo(sx, sy + sr * 3); ctx.stroke()
  }
  ctx.restore()

  // ── 4. Borda octagonal com brilho tier ────────────────────────────────────
  ctx.save()
  const P = 7, CUT = 22

  // Glow externo
  ctx.shadowColor = TIER_GLOW; ctx.shadowBlur = 28
  ctx.strokeStyle = TIER_COLOR; ctx.lineWidth = 2.5
  octPath(ctx, P, P, W - P * 2, H - P * 2, CUT); ctx.stroke()

  // Linha interna fina
  ctx.shadowBlur  = 10
  ctx.strokeStyle = TIER_COLOR + '50'; ctx.lineWidth = 1
  const P2 = 13
  octPath(ctx, P2, P2, W - P2 * 2, H - P2 * 2, CUT - 5); ctx.stroke()
  ctx.restore()

  // ── 5. Header "CARD OURO" ─────────────────────────────────────────────────
  ctx.save()
  // Fundo semitransparente no topo
  const hg = ctx.createLinearGradient(0, 0, 0, 46)
  hg.addColorStop(0, 'rgba(5,10,6,0.95)'); hg.addColorStop(1, 'rgba(5,10,6,0)')
  ctx.fillStyle = hg; ctx.fillRect(0, 0, W, 60)

  const midY = 25
  // Linhas decorativas
  ctx.strokeStyle = TIER_COLOR + '70'; ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.moveTo(22, midY); ctx.lineTo(108, midY); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W - 108, midY); ctx.lineTo(W - 22, midY); ctx.stroke()
  // Losangos nas pontas
  for (const lx of [108, W - 108]) {
    ctx.save()
    ctx.translate(lx, midY)
    ctx.rotate(Math.PI / 4)
    ctx.strokeStyle = TIER_COLOR; ctx.lineWidth = 1.2
    ctx.strokeRect(-3.5, -3.5, 7, 7)
    ctx.restore()
  }

  ctx.shadowColor = TIER_GLOW; ctx.shadowBlur = 18
  ctx.fillStyle   = TIER_COLOR
  ctx.font        = 'bold 15px system-ui, sans-serif'
  ctx.textAlign   = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(TIER_LABEL, W / 2, midY)
  ctx.restore()

  // ── 6. Logo MC (topo esquerda) ────────────────────────────────────────────
  ctx.save()
  const MCX = 20, MCY = 52
  ctx.shadowColor = GREEN; ctx.shadowBlur = 14
  ctx.fillStyle   = GREEN + '22'
  ctx.strokeStyle = GREEN + '80'; ctx.lineWidth = 1.8
  ctx.beginPath(); ctx.arc(MCX + 16, MCY + 16, 16, 0, Math.PI * 2)
  ctx.fill(); ctx.stroke()
  ctx.shadowBlur  = 0
  ctx.fillStyle   = GREEN
  ctx.font        = 'bold 11px system-ui, sans-serif'
  ctx.textAlign   = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('MC', MCX + 16, MCY + 16)
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.font      = 'bold 8px system-ui, sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('MEU', MCX + 37, MCY + 13)
  ctx.fillStyle = GREEN
  ctx.fillText('CRAQUE', MCX + 37, MCY + 25)
  ctx.restore()

  // ── 7. OVR ────────────────────────────────────────────────────────────────
  ctx.save()
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(255,255,255,0.50)'
  ctx.font      = 'bold 12px system-ui, sans-serif'
  ctx.fillText('OVR', 22, 104)
  ctx.shadowColor = GREEN; ctx.shadowBlur = 36
  ctx.fillStyle   = GREEN
  ctx.font        = 'bold 86px system-ui, -apple-system, sans-serif'
  ctx.fillText(opts.ovr ? String(opts.ovr) : '—', 12, 116)
  ctx.restore()

  // ── 8. Nome ───────────────────────────────────────────────────────────────
  const parts     = opts.nome.trim().split(' ')
  const lastName  = (parts.length > 1 ? parts[parts.length - 1] : opts.nome).toUpperCase()
  const firstName = (parts.length > 1 ? parts.slice(0, -1).join(' ') : '').toUpperCase()
  const NAME_Y    = H - 248

  ctx.save()
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  if (firstName) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.font      = 'bold 22px system-ui, sans-serif'
    ctx.fillText(firstName, 18, NAME_Y)
  }
  ctx.shadowColor = GREEN; ctx.shadowBlur = 20
  ctx.fillStyle   = GREEN
  ctx.font        = 'bold 50px system-ui, -apple-system, sans-serif'
  let ln = lastName
  while (ctx.measureText(ln).width > W - 30 && ln.length > 3) ln = ln.slice(0, -1)
  if (ln !== lastName) ln += '…'
  ctx.fillText(ln, 16, NAME_Y + (firstName ? 50 : 0))
  ctx.shadowBlur = 0
  ctx.restore()

  // ── 9. Barra ID + Bandeira + QR ──────────────────────────────────────────
  const ID_Y    = H - 182
  const ID_H    = 46
  const QR_SIZE = 42
  const QR_X    = W - 14 - QR_SIZE

  ctx.save()
  ctx.fillStyle   = 'rgba(0,0,0,0.60)'
  rrPath(ctx, 14, ID_Y, W - 28, ID_H, 8); ctx.fill()
  ctx.strokeStyle = TIER_COLOR + '45'; ctx.lineWidth = 1
  rrPath(ctx, 14, ID_Y, W - 28, ID_H, 8); ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,0.38)'
  ctx.font      = 'bold 8px system-ui, sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  ctx.fillText('ID ÚNICO', 24, ID_Y + 9)
  ctx.fillStyle = GREEN
  ctx.font      = 'bold 18px system-ui, sans-serif'
  ctx.fillText((opts.athleteId ?? '—').replace(/^[A-Z]+-/, ''), 24, ID_Y + 21)

  // Divisor
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(94, ID_Y + 8); ctx.lineTo(94, ID_Y + ID_H - 8); ctx.stroke()

  // Bandeira + BRASIL
  drawBrazilFlag(ctx, 102, ID_Y + ID_H / 2 - 9, 24, 17)
  ctx.fillStyle = 'rgba(255,255,255,0.70)'
  ctx.font      = 'bold 11px system-ui, sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText('BRASIL', 132, ID_Y + ID_H / 2)

  // QR code
  const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=84x84&data=${encodeURIComponent(opts.profileUrl)}&color=00FF88&bgcolor=050a06&margin=1`
  const qrImg = await loadImage(qrApi)
  if (qrImg) {
    ctx.save()
    rrPath(ctx, QR_X, ID_Y + 3, QR_SIZE, ID_H - 6, 4); ctx.clip()
    ctx.drawImage(qrImg, QR_X, ID_Y + 3, QR_SIZE, ID_H - 6)
    ctx.restore()
  } else {
    drawQRPattern(ctx, QR_X, ID_Y + 3, QR_SIZE - 2, GREEN + 'cc')
  }
  ctx.restore()

  // ── 10. Stats (6 atributos) ───────────────────────────────────────────────
  const STATS_Y = ID_Y + ID_H + 6
  const STATS_H = 46

  ctx.save()
  ctx.fillStyle   = 'rgba(0,0,0,0.60)'
  rrPath(ctx, 14, STATS_Y, W - 28, STATS_H, 8); ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
  rrPath(ctx, 14, STATS_Y, W - 28, STATS_H, 8); ctx.stroke()

  const toStat = (v: number | null | undefined) => v ? Math.min(99, Math.round(v * 9.9)) : null
  const statVals = [
    { label: 'PAC', val: toStat(opts.statPac) },
    { label: 'SHO', val: toStat(opts.statSho) },
    { label: 'PAS', val: toStat(opts.statPas) },
    { label: 'DRI', val: toStat(opts.statDri) },
    { label: 'DEF', val: toStat(opts.statDef) },
    { label: 'PHY', val: toStat(opts.statPhy) },
  ]
  const hasStats = statVals.some(s => s.val !== null)

  if (hasStats) {
    const cw = (W - 28) / 6
    statVals.forEach((s, i) => {
      const cx = 14 + i * cw + cw / 2
      if (i > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'
        ctx.beginPath(); ctx.moveTo(14 + i * cw, STATS_Y + 8); ctx.lineTo(14 + i * cw, STATS_Y + STATS_H - 8); ctx.stroke()
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(255,255,255,0.42)'
      ctx.font      = 'bold 8px system-ui, sans-serif'
      ctx.fillText(s.label, cx, STATS_Y + 7)
      ctx.shadowColor = GREEN; ctx.shadowBlur = 10
      ctx.fillStyle   = GREEN
      ctx.font        = 'bold 17px system-ui, sans-serif'
      ctx.fillText(s.val !== null ? String(s.val) : '—', cx, STATS_Y + 19)
      ctx.shadowBlur  = 0
    })
  } else {
    ctx.fillStyle    = 'rgba(255,255,255,0.22)'
    ctx.font         = '10px system-ui, sans-serif'
    ctx.textAlign    = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('Aguardando avaliação de treinador', W / 2, STATS_Y + STATS_H / 2)
  }
  ctx.restore()

  // ── 11. Rodapé (posição, idade, cidade) ───────────────────────────────────
  const FOOT_Y = STATS_Y + STATS_H + 6
  const FOOT_H = 44

  ctx.save()
  ctx.fillStyle   = 'rgba(0,0,0,0.60)'
  rrPath(ctx, 14, FOOT_Y, W - 28, FOOT_H, 8); ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
  rrPath(ctx, 14, FOOT_Y, W - 28, FOOT_H, 8); ctx.stroke()

  const footCols = [
    { icon: '⚽', label: 'POSIÇÃO', val: (opts.posicao || opts.pos).toUpperCase() },
    { icon: '📅', label: 'IDADE',   val: opts.idade ? `${opts.idade} ANOS` : (opts.categoria ?? '—').toUpperCase() },
    { icon: '📍', label: 'CIDADE',  val: ((opts.cidade ?? '').split(',')[0] || '—').toUpperCase() },
  ]
  const fw = (W - 28) / 3
  footCols.forEach((s, i) => {
    const cx = 14 + i * fw + fw / 2
    if (i > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'
      ctx.beginPath(); ctx.moveTo(14 + i * fw, FOOT_Y + 8); ctx.lineTo(14 + i * fw, FOOT_Y + FOOT_H - 8); ctx.stroke()
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    // Ícone
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillText((s as typeof footCols[0]).icon, cx, FOOT_Y + 5)
    ctx.fillStyle = 'rgba(255,255,255,0.38)'
    ctx.font      = 'bold 7px system-ui, sans-serif'
    ctx.fillText(s.label, cx, FOOT_Y + 18)
    ctx.fillStyle = 'rgba(255,255,255,0.88)'
    ctx.font      = 'bold 11px system-ui, sans-serif'
    let v = s.val
    while (ctx.measureText(v).width > fw - 8 && v.length > 2) v = v.slice(0, -1)
    if (v !== s.val) v += '.'
    ctx.fillText(v, cx, FOOT_Y + 28)
  })
  ctx.restore()

  // ── 12. Tagline ───────────────────────────────────────────────────────────
  const TAG_Y = FOOT_Y + FOOT_H + 8
  ctx.save()
  ctx.strokeStyle = GREEN + '38'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(18, TAG_Y + 7); ctx.lineTo(105, TAG_Y + 7); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W - 105, TAG_Y + 7); ctx.lineTo(W - 18, TAG_Y + 7); ctx.stroke()

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  // Calcular largura total do texto misto
  const part1 = 'NASCIDO PARA FAZER '
  const part2 = 'HISTÓRIA'
  ctx.font = 'italic bold 10px system-ui, sans-serif'
  const w1 = ctx.measureText(part1).width
  const w2 = ctx.measureText(part2).width
  const totalW = w1 + w2
  const startX = W / 2 - totalW / 2

  ctx.textAlign = 'left'
  ctx.fillStyle = 'rgba(255,255,255,0.50)'
  ctx.fillText(part1, startX, TAG_Y + 7)
  ctx.fillStyle = GREEN
  ctx.fillText(part2, startX + w1, TAG_Y + 7)
  ctx.restore()

  // ── 13. Watermark ────────────────────────────────────────────────────────
  ctx.fillStyle    = 'rgba(255,255,255,0.06)'
  ctx.font         = '8px system-ui, sans-serif'
  ctx.textAlign    = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('meucraque.com', W / 2, H - 5)
}

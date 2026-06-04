/**
 * canvasCard.ts — Card premium Meu Craque.
 * Inspirado em cartas lendárias EA FC / FIFA Ultimate Team.
 * 400 × 700 px, Canvas 2D.
 */

export type CanvasCardProps = {
  nome:          string
  pos:           string
  posicao:       string
  ovr:           number | null
  hasEvaluation: boolean
  categoria:     string | null
  fotoUrl:       string | null
  initials:      string
  athleteId:     string | null
  cidade:        string | null
  idade:         number | null
  profileUrl:    string
  statPac?:      number | null
  statSho?:      number | null
  statPas?:      number | null
  statDri?:      number | null
  statDef?:      number | null
  statPhy?:      number | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(res => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => res(img)
    img.onerror = () => res(null)
    img.src = src
  })
}

function hexPath(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30)
    i === 0 ? ctx.moveTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
            : ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a))
  }
  ctx.closePath()
}

function octPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: number) {
  ctx.beginPath()
  ctx.moveTo(x + c, y);         ctx.lineTo(x + w - c, y)
  ctx.lineTo(x + w, y + c);     ctx.lineTo(x + w, y + h - c)
  ctx.lineTo(x + w - c, y + h); ctx.lineTo(x + c, y + h)
  ctx.lineTo(x, y + h - c);     ctx.lineTo(x, y + c)
  ctx.closePath()
}

function drawQRPattern(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  const cell = size / 9
  ctx.fillStyle = '#050505'
  ctx.beginPath(); ctx.rect(x, y, size, size); ctx.fill()
  ctx.fillStyle = color
  function b(cx: number, cy: number, w = 1, h = 1) {
    ctx.fillRect(x + cx * cell + 0.5, y + cy * cell + 0.5, w * cell - 1, h * cell - 1)
  }
  b(0,0,3,1);b(0,1,1);b(2,1);b(0,2,3)
  b(6,0,3,1);b(6,1);b(8,1);b(6,2,3)
  b(0,6,3,1);b(0,7);b(2,7);b(0,8,3)
  b(1,1);b(7,1);b(1,7)
  const d:[number,number][] = [[4,1],[4,2],[3,3],[5,3],[4,4],[1,4],[3,4],[6,4],[8,4],[1,5],[3,5],[5,5],[7,5],[4,6],[6,6],[3,7],[5,7],[4,8],[6,8]]
  for (const [cx,cy] of d) b(cx,cy)
}

function drawBrazilFlag(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.save()
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  ctx.fillStyle = '#009c3b'; ctx.fillRect(x, y, w, h)
  ctx.fillStyle = '#ffdf00'
  ctx.beginPath()
  ctx.moveTo(x + w * 0.5, y + h * 0.08); ctx.lineTo(x + w * 0.96, y + h * 0.5)
  ctx.lineTo(x + w * 0.5, y + h * 0.92); ctx.lineTo(x + w * 0.04, y + h * 0.5)
  ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#002776'
  ctx.beginPath(); ctx.arc(x + w * 0.5, y + h * 0.5, h * 0.28, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

// ── generateCard ───────────────────────────────────────────────────────────────

export async function generateCard(canvas: HTMLCanvasElement, opts: CanvasCardProps): Promise<void> {
  const ctx = canvas.getContext('2d')!
  const W = 400, H = 700
  canvas.width = W; canvas.height = H

  const GOLD  = '#d4a017'
  const GOLDF = '#f5c842'
  const GREEN = '#00FF88'
  const NEON  = '#00ff66'
  const BG    = '#050505'

  // Tier
  const ovr = opts.ovr ?? 0
  let TC: string, TG: string, TL: string
  if      (ovr >= 80) { TC = GOLD;    TG = GOLDF;   TL = 'CARD OURO'   }
  else if (ovr >= 50) { TC = '#a8a9ac'; TG = '#d8d8d8'; TL = 'CARD PRATA' }
  else                { TC = '#cd7f32'; TG = '#e8a060'; TL = 'CARD BRONZE' }

  // ── 1. FUNDO PRETO ────────────────────────────────────────────────────────
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)

  // ── 2. FUNDO TECNOLÓGICO ──────────────────────────────────────────────────

  // Grade de pontos verdes (profundidade)
  ctx.save()
  ctx.globalAlpha = 0.04
  for (let xi = 20; xi < W; xi += 28) {
    for (let yi = 20; yi < H; yi += 28) {
      ctx.fillStyle = GREEN
      ctx.beginPath(); ctx.arc(xi, yi, 0.8, 0, Math.PI * 2); ctx.fill()
    }
  }
  ctx.restore()

  // Linhas energéticas diagonais
  ctx.save()
  ctx.globalAlpha = 0.06
  ctx.strokeStyle = GREEN; ctx.lineWidth = 0.5
  for (let i = -H; i < W + H; i += 44) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H * 0.7, H); ctx.stroke()
  }
  ctx.restore()

  // Glow radial no centro (profundidade 3D)
  ctx.save()
  const radBg = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, 260)
  radBg.addColorStop(0,   `${GREEN}0a`)
  radBg.addColorStop(0.5, `${GREEN}04`)
  radBg.addColorStop(1,   'transparent')
  ctx.fillStyle = radBg; ctx.fillRect(0, 0, W, H)
  ctx.restore()

  // ── 3. CRISTAIS DE CANTO ──────────────────────────────────────────────────

  function drawCrystal(bx: number, by: number, angle: number, len: number, wid: number, alpha: number) {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(bx, by); ctx.rotate(angle)
    ctx.shadowColor = GREEN; ctx.shadowBlur = 18
    const g = ctx.createLinearGradient(0, 0, 0, len)
    g.addColorStop(0,    GREEN + 'ee')
    g.addColorStop(0.4,  GREEN + '88')
    g.addColorStop(0.75, GREEN + '22')
    g.addColorStop(1,    'transparent')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(0, 0); ctx.lineTo(-wid / 2, len * 0.3)
    ctx.lineTo(0, len); ctx.lineTo(wid / 2, len * 0.3)
    ctx.closePath(); ctx.fill()
    ctx.restore()
  }

  // Cristais no canto superior direito
  const CX = W - 30, CY = 60
  ;[[-0.3,130,16,0.55],[0.15,155,20,0.65],[0.65,110,13,0.45],[-0.85,95,11,0.38],[1.2,80,9,0.30]].forEach(([a,l,w,al]) => drawCrystal(CX,CY,a,l,w,al))

  // Cristais no canto inferior direito (menores)
  const CX2 = W - 20, CY2 = H - 80
  ;[[0.3,90,11,0.30],[-0.2,75,9,0.25],[0.8,65,8,0.20]].forEach(([a,l,w,al]) => drawCrystal(CX2,CY2,a,l,w,al))

  // Partículas luminosas verdes
  ctx.save()
  const ptPositions = [
    [W*0.85,H*0.06,2.2],[W*0.92,H*0.12,1.8],[W*0.78,H*0.04,1.5],
    [W*0.97,H*0.20,1.6],[W*0.88,H*0.28,1.4],[W*0.93,H*0.08,2.0],
    [W*0.75,H*0.16,1.3],[W*0.82,H*0.22,1.5],[W*0.96,H*0.35,1.2],
  ]
  for (const [px,py,pr] of ptPositions) {
    ctx.globalAlpha = 0.7
    ctx.shadowColor = GREEN; ctx.shadowBlur = 10
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()

  // ── 4. MOLDURA DUPLA PREMIUM ──────────────────────────────────────────────

  // Camada 1 — borda exterior com glow tier
  ctx.save()
  octPath(ctx, 6, 6, W - 12, H - 12, 28)
  ctx.shadowColor = TG; ctx.shadowBlur = 32
  ctx.strokeStyle = TC; ctx.lineWidth = 3; ctx.stroke()
  ctx.restore()

  // Camada 2 — borda interior verde neon fina
  ctx.save()
  octPath(ctx, 13, 13, W - 26, H - 26, 22)
  ctx.shadowColor = GREEN; ctx.shadowBlur = 12
  ctx.strokeStyle = GREEN + '55'; ctx.lineWidth = 1; ctx.stroke()
  ctx.restore()

  // Cantos facetados — losangos decorativos
  ctx.save()
  const cornerPts = [[W/2, 6], [W - 6, H/2], [W/2, H - 6], [6, H/2]]
  for (const [cx, cy] of cornerPts) {
    ctx.save()
    ctx.translate(cx, cy); ctx.rotate(Math.PI / 4)
    ctx.shadowColor = TG; ctx.shadowBlur = 16
    ctx.strokeStyle = TC; ctx.lineWidth = 1.5
    ctx.strokeRect(-4, -4, 8, 8)
    ctx.fillStyle = BG; ctx.fillRect(-3, -3, 6, 6)
    ctx.restore()
  }
  // Linha decorativa horizontal no topo e base
  ctx.shadowColor = TC; ctx.shadowBlur = 8
  ctx.strokeStyle = TC + '60'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(60, 18); ctx.lineTo(W - 60, 18); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(60, H - 18); ctx.lineTo(W - 60, H - 18); ctx.stroke()
  ctx.restore()

  // ── 5. BADGE HEXAGONAL "CARD OURO" ────────────────────────────────────────
  const BHX = W / 2, BHY = 38, BHR = 26
  ctx.save()
  // Glow externo do hexágono
  hexPath(ctx, BHX, BHY, BHR + 4)
  ctx.shadowColor = TG; ctx.shadowBlur = 20; ctx.strokeStyle = TC + '55'; ctx.lineWidth = 2; ctx.stroke()
  // Hexágono principal
  hexPath(ctx, BHX, BHY, BHR)
  ctx.fillStyle = BG; ctx.fill()
  ctx.shadowColor = TG; ctx.shadowBlur = 14; ctx.strokeStyle = TC; ctx.lineWidth = 1.8; ctx.stroke()
  // Texto do tier
  ctx.shadowColor = TG; ctx.shadowBlur = 10
  ctx.fillStyle = TC
  ctx.font = 'bold 8.5px system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(TL, BHX, BHY)
  ctx.restore()

  // ── 6. FOTO ────────────────────────────────────────────────────────────────
  let img: HTMLImageElement | null = null
  if (opts.fotoUrl) img = await loadImage(opts.fotoUrl)

  const PHOTO_TOP = 64, PHOTO_H = 420

  if (img) {
    ctx.save()
    // Clip à zona da foto
    octPath(ctx, 14, PHOTO_TOP, W - 28, PHOTO_H, 8)
    ctx.clip()
    const scale = Math.max((W - 28) / img.width, PHOTO_H / img.height)
    const dw = img.width * scale, dh = img.height * scale
    const dx = (W - dw) / 2, dy = PHOTO_TOP + (PHOTO_H - dh) * 0.08
    ctx.drawImage(img, dx, dy, dw, dh)

    // Overlay cinema: escurece topo e base, abre centro
    const cinTop = ctx.createLinearGradient(0, PHOTO_TOP, 0, PHOTO_TOP + 130)
    cinTop.addColorStop(0, 'rgba(5,5,5,0.92)'); cinTop.addColorStop(1, 'rgba(5,5,5,0)')
    ctx.fillStyle = cinTop; ctx.fillRect(0, PHOTO_TOP, W, 130)

    const cinLeft = ctx.createLinearGradient(0, 0, 200, 0)
    cinLeft.addColorStop(0, 'rgba(5,5,5,0.72)'); cinLeft.addColorStop(1, 'rgba(5,5,5,0)')
    ctx.fillStyle = cinLeft; ctx.fillRect(0, PHOTO_TOP, 200, PHOTO_H)

    const cinBot = ctx.createLinearGradient(0, PHOTO_TOP + PHOTO_H - 220, 0, PHOTO_TOP + PHOTO_H)
    cinBot.addColorStop(0, 'rgba(5,5,5,0)')
    cinBot.addColorStop(0.5, 'rgba(5,5,5,0.7)')
    cinBot.addColorStop(1, 'rgba(5,5,5,1)')
    ctx.fillStyle = cinBot; ctx.fillRect(0, PHOTO_TOP + PHOTO_H - 220, W, 220)
    ctx.restore()

    // Contorno luminoso verde ao redor do atleta (glow na borda da foto)
    ctx.save()
    octPath(ctx, 14, PHOTO_TOP, W - 28, PHOTO_H, 8)
    ctx.shadowColor = GREEN; ctx.shadowBlur = 22
    ctx.strokeStyle = GREEN + '33'; ctx.lineWidth = 2; ctx.stroke()
    ctx.restore()

  } else {
    // Sem foto — iniciais
    ctx.save()
    const iRad = ctx.createRadialGradient(W/2, PHOTO_TOP + PHOTO_H/2, 0, W/2, PHOTO_TOP + PHOTO_H/2, 130)
    iRad.addColorStop(0, GREEN + '18'); iRad.addColorStop(1, 'transparent')
    ctx.fillStyle = iRad; ctx.fillRect(0, PHOTO_TOP, W, PHOTO_H)
    ctx.shadowColor = GREEN; ctx.shadowBlur = 40
    ctx.fillStyle = GREEN + '88'
    ctx.font = `bold 90px system-ui, sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(opts.initials, W / 2, PHOTO_TOP + PHOTO_H / 2)
    ctx.restore()
  }

  // ── 7. OVR (topo esquerdo, sobre a foto) ──────────────────────────────────
  ctx.save()
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(255,255,255,0.48)'
  ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.fillText('OVR', 22, PHOTO_TOP + 12)
  ctx.shadowColor = NEON; ctx.shadowBlur = 40
  ctx.fillStyle = NEON
  ctx.font = 'bold 96px system-ui, -apple-system, sans-serif'
  ctx.fillText(opts.ovr ? String(opts.ovr) : '—', 14, PHOTO_TOP + 24)
  ctx.restore()

  // ── 8. LOGO MC (topo esquerdo) ────────────────────────────────────────────
  ctx.save()
  const MCX = 18, MCY = PHOTO_TOP + 14
  ctx.shadowColor = GREEN; ctx.shadowBlur = 16
  ctx.fillStyle = GREEN + '20'; ctx.strokeStyle = GREEN + '85'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(MCX + 14, MCY + 14, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.shadowBlur = 0
  ctx.fillStyle = GREEN
  ctx.font = 'bold 10px system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('MC', MCX + 14, MCY + 14)
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = 'rgba(255,255,255,0.80)'
  ctx.font = 'bold 7px system-ui, sans-serif'
  ctx.fillText('MEU', MCX + 32, MCY + 11)
  ctx.fillStyle = GREEN; ctx.fillText('CRAQUE', MCX + 32, MCY + 22)
  ctx.restore()

  // ── 9. NOME DO ATLETA ──────────────────────────────────────────────────────
  const NAME_BASE = PHOTO_TOP + PHOTO_H - 36
  const parts     = opts.nome.trim().split(' ')
  const lastName  = (parts.length > 1 ? parts[parts.length - 1] : opts.nome).toUpperCase()
  const firstName = (parts.length > 1 ? parts.slice(0, -1).join(' ') : '').toUpperCase()

  ctx.save()
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  if (firstName) {
    ctx.fillStyle = 'rgba(255,255,255,0.90)'
    ctx.font = 'bold 24px system-ui, sans-serif'
    ctx.fillText(firstName, 18, NAME_BASE - 2)
  }
  ctx.shadowColor = GREEN; ctx.shadowBlur = 22
  ctx.fillStyle = GREEN
  ctx.font = 'bold 58px system-ui, -apple-system, sans-serif'
  let ln = lastName
  while (ctx.measureText(ln).width > W - 28 && ln.length > 3) ln = ln.slice(0, -1)
  if (ln !== lastName) ln += '…'
  ctx.fillText(ln, 16, NAME_BASE + (firstName ? 56 : 12))
  ctx.restore()

  // ── 10. BLOCO IDENTIFICAÇÃO ───────────────────────────────────────────────
  const ID_Y = PHOTO_TOP + PHOTO_H + 6, ID_H = 50
  const QR_SIZE = 46, QR_X = W - 14 - QR_SIZE

  // Caixa principal
  ctx.save()
  const idBg = ctx.createLinearGradient(0, ID_Y, 0, ID_Y + ID_H)
  idBg.addColorStop(0, '#0d0d0d'); idBg.addColorStop(1, '#080808')
  octPath(ctx, 14, ID_Y, W - 28, ID_H, 6); ctx.fillStyle = idBg; ctx.fill()
  ctx.shadowColor = TC; ctx.shadowBlur = 8
  ctx.strokeStyle = TC + '40'; ctx.lineWidth = 1
  octPath(ctx, 14, ID_Y, W - 28, ID_H, 6); ctx.stroke()
  // Linha de brilho no topo da caixa
  ctx.shadowColor = TC; ctx.shadowBlur = 6; ctx.strokeStyle = TC + '70'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(30, ID_Y + 1); ctx.lineTo(QR_X - 4, ID_Y + 1); ctx.stroke()
  ctx.restore()

  ctx.save()
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.font = 'bold 8px system-ui, sans-serif'
  ctx.fillText('ID ÚNICO', 24, ID_Y + 10)
  ctx.shadowColor = GREEN; ctx.shadowBlur = 12
  ctx.fillStyle = GREEN; ctx.font = 'bold 20px system-ui, sans-serif'
  ctx.fillText((opts.athleteId ?? '—').replace(/^[A-Z]+-/, ''), 24, ID_Y + 22)

  // Divisor
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(96, ID_Y + 10); ctx.lineTo(96, ID_Y + ID_H - 10); ctx.stroke()

  // Bandeira + BRASIL
  drawBrazilFlag(ctx, 104, ID_Y + ID_H / 2 - 10, 28, 20)
  ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.72)'
  ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText('BRASIL', 138, ID_Y + ID_H / 2)
  ctx.restore()

  // QR code
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=92x92&data=${encodeURIComponent(opts.profileUrl)}&color=00FF88&bgcolor=050505&margin=1`
  const qrImg = await loadImage(qrUrl)
  if (qrImg) {
    ctx.save()
    ctx.beginPath(); ctx.rect(QR_X, ID_Y + 3, QR_SIZE, ID_H - 6); ctx.clip()
    ctx.drawImage(qrImg, QR_X, ID_Y + 3, QR_SIZE, ID_H - 6)
    ctx.restore()
  } else {
    drawQRPattern(ctx, QR_X, ID_Y + 3, QR_SIZE - 2, GREEN + 'cc')
  }

  // ── 11. ATRIBUTOS ─────────────────────────────────────────────────────────
  const STATS_Y = ID_Y + ID_H + 5, STATS_H = 52

  ctx.save()
  const stBg = ctx.createLinearGradient(0, STATS_Y, 0, STATS_Y + STATS_H)
  stBg.addColorStop(0, '#0e0e0e'); stBg.addColorStop(1, '#080808')
  octPath(ctx, 14, STATS_Y, W - 28, STATS_H, 6); ctx.fillStyle = stBg; ctx.fill()
  ctx.strokeStyle = `rgba(255,255,255,0.07)`; ctx.lineWidth = 1
  octPath(ctx, 14, STATS_Y, W - 28, STATS_H, 6); ctx.stroke()
  ctx.restore()

  const toStat = (v: number | null | undefined) => v ? Math.min(99, Math.round(v * 9.9)) : null
  const statCols = [
    { label:'PAC', val: toStat(opts.statPac) },
    { label:'SHO', val: toStat(opts.statSho) },
    { label:'PAS', val: toStat(opts.statPas) },
    { label:'DRI', val: toStat(opts.statDri) },
    { label:'DEF', val: toStat(opts.statDef) },
    { label:'PHY', val: toStat(opts.statPhy) },
  ]
  const hasStats = statCols.some(s => s.val !== null)
  const colW = (W - 28) / 6

  ctx.save()
  if (hasStats) {
    statCols.forEach((s, i) => {
      const cx = 14 + i * colW + colW / 2
      if (i > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(14 + i * colW, STATS_Y + 8); ctx.lineTo(14 + i * colW, STATS_Y + STATS_H - 8); ctx.stroke()
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(255,255,255,0.42)'
      ctx.font = 'bold 8px system-ui, sans-serif'
      ctx.fillText(s.label, cx, STATS_Y + 7)
      ctx.shadowColor = GREEN; ctx.shadowBlur = 14
      ctx.fillStyle = GREEN; ctx.font = 'bold 22px system-ui, sans-serif'
      ctx.fillText(s.val !== null ? String(s.val) : '—', cx, STATS_Y + 18)
      ctx.shadowBlur = 0
    })
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.20)'
    ctx.font = '11px system-ui, sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('Aguardando avaliação de treinador', W / 2, STATS_Y + STATS_H / 2)
  }
  ctx.restore()

  // ── 12. DADOS DO ATLETA ────────────────────────────────────────────────────
  const FOOT_Y = STATS_Y + STATS_H + 5, FOOT_H = 52

  ctx.save()
  const ftBg = ctx.createLinearGradient(0, FOOT_Y, 0, FOOT_Y + FOOT_H)
  ftBg.addColorStop(0, '#0e0e0e'); ftBg.addColorStop(1, '#080808')
  octPath(ctx, 14, FOOT_Y, W - 28, FOOT_H, 6); ctx.fillStyle = ftBg; ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
  octPath(ctx, 14, FOOT_Y, W - 28, FOOT_H, 6); ctx.stroke()
  ctx.restore()

  const footCols = [
    { icon: '⚽', label: 'POSIÇÃO', val: (opts.posicao || opts.pos).toUpperCase() },
    { icon: '📅', label: 'IDADE',   val: opts.idade ? `${opts.idade} ANOS` : (opts.categoria ?? '—').toUpperCase() },
    { icon: '📍', label: 'CIDADE',  val: ((opts.cidade ?? '').split(',')[0] || '—').toUpperCase() },
  ]
  const fColW = (W - 28) / 3

  ctx.save()
  footCols.forEach((s, i) => {
    const cx = 14 + i * fColW + fColW / 2
    if (i > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(14 + i * fColW, FOOT_Y + 8); ctx.lineTo(14 + i * fColW, FOOT_Y + FOOT_H - 8); ctx.stroke()
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.font = '12px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillText(s.icon, cx, FOOT_Y + 6)
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = 'bold 7px system-ui, sans-serif'
    ctx.fillText(s.label, cx, FOOT_Y + 21)
    ctx.fillStyle = 'rgba(255,255,255,0.88)'
    ctx.font = 'bold 11px system-ui, sans-serif'
    let v = s.val
    while (ctx.measureText(v).width > fColW - 8 && v.length > 2) v = v.slice(0, -1)
    if (v !== s.val) v += '.'
    ctx.fillText(v, cx, FOOT_Y + 32)
  })
  ctx.restore()

  // ── 13. RODAPÉ TAGLINE ────────────────────────────────────────────────────
  const TAG_Y = FOOT_Y + FOOT_H + 7

  ctx.save()
  // Linhas decorativas
  ctx.strokeStyle = TC + '50'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(18, TAG_Y + 8); ctx.lineTo(110, TAG_Y + 8); ctx.stroke()
  ctx.beginPath(); ctx.moveTo(W - 110, TAG_Y + 8); ctx.lineTo(W - 18, TAG_Y + 8); ctx.stroke()

  // Tagline
  const tag1 = 'NASCIDA PARA FAZER ', tag2 = 'HISTÓRIA'
  ctx.font = 'italic bold 11px system-ui, sans-serif'
  const tw1 = ctx.measureText(tag1).width, tw2 = ctx.measureText(tag2).width
  const startX = W / 2 - (tw1 + tw2) / 2
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.fillText(tag1, startX, TAG_Y + 8)
  ctx.shadowColor = GREEN; ctx.shadowBlur = 12
  ctx.fillStyle = GREEN
  ctx.fillText(tag2, startX + tw1, TAG_Y + 8)
  ctx.restore()

  // ── 14. REFLEXO METÁLICO FINAL ────────────────────────────────────────────
  ctx.save()
  const shine = ctx.createLinearGradient(0, 0, W * 0.6, H * 0.4)
  shine.addColorStop(0,   'rgba(255,255,255,0.03)')
  shine.addColorStop(0.4, 'rgba(255,255,255,0.06)')
  shine.addColorStop(0.5, 'rgba(255,255,255,0.015)')
  shine.addColorStop(1,   'rgba(255,255,255,0)')
  ctx.fillStyle = shine; ctx.fillRect(0, 0, W, H)
  ctx.restore()

  // Watermark
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.font = '8px system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('meucraque.com', W / 2, H - 5)
}

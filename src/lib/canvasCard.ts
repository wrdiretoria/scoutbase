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

  // Renderiza em 2x para nitidez — HiDPI / Retina
  const DPR = 2
  const W = 400, H = 700
  canvas.width  = W * DPR
  canvas.height = H * DPR
  ctx.scale(DPR, DPR)

  const GOLD  = '#c8960c'
  const GOLDF = '#ffd700'
  const GREEN = '#00FF88'
  const BG    = '#050505'

  // Tier
  const ovr = opts.ovr ?? 0
  let TC: string, TG: string, TL: string, OVR_COLOR: string
  if      (ovr >= 80) { TC = GOLDF; TG = '#fff5c0'; TL = 'CARD OURO';   OVR_COLOR = GOLDF   }
  else if (ovr >= 50) { TC = '#c0c8d0'; TG = '#eceff1'; TL = 'CARD PRATA';  OVR_COLOR = '#dce3ec' }
  else                { TC = '#cd7f32'; TG = '#e8a060'; TL = 'CARD BRONZE'; OVR_COLOR = '#e8a060' }

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

  const PHOTO_TOP = 55, PHOTO_H = 400

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

  // ── 7. GRADIENTE DE LEITURA — canto superior esquerdo ────────────────────
  ctx.save()
  const readGrad = ctx.createRadialGradient(0, PHOTO_TOP, 0, 170, PHOTO_TOP + 160, 200)
  readGrad.addColorStop(0,   'rgba(0,0,0,0.78)')
  readGrad.addColorStop(0.5, 'rgba(0,0,0,0.42)')
  readGrad.addColorStop(1,   'rgba(0,0,0,0)')
  ctx.fillStyle = readGrad
  ctx.fillRect(0, PHOTO_TOP, 200, 180)
  ctx.restore()

  // ── 8. BLOCO SUPERIOR ESQUERDO — hierarquia limpa ────────────────────────
  //
  //  [OVR]          ← label 10px, muted
  //  [  4 0  ]      ← número dominante, tier color
  //  [○MC  MEU CRAQUE] ← logo pequeno abaixo

  const INFO_X = 16
  const INFO_Y = PHOTO_TOP + 14

  // Linha "OVR"
  ctx.save()
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(255,255,255,0.50)'
  ctx.font = '600 10px system-ui, sans-serif'
  ctx.letterSpacing = '0.18em'
  ctx.fillText('OVR', INFO_X, INFO_Y)
  ctx.restore()

  // Número OVR — elemento dominante
  ctx.save()
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  ctx.shadowColor = OVR_COLOR; ctx.shadowBlur = 32
  ctx.fillStyle = OVR_COLOR
  ctx.font = 'bold 84px system-ui, -apple-system, sans-serif'
  ctx.fillText(opts.ovr ? String(opts.ovr) : '—', INFO_X - 2, INFO_Y + 12)
  ctx.restore()

  // Logo MC + MEU CRAQUE — abaixo do número
  const MC_Y = INFO_Y + 104
  ctx.save()
  // Círculo MC
  ctx.shadowColor = GREEN; ctx.shadowBlur = 10
  ctx.fillStyle = 'rgba(0,255,136,0.12)'
  ctx.strokeStyle = GREEN + '90'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.arc(INFO_X + 10, MC_Y + 10, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  ctx.shadowBlur = 0
  ctx.fillStyle = GREEN
  ctx.font = 'bold 8px system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('MC', INFO_X + 10, MC_Y + 10)
  // Texto MEU CRAQUE
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = 'bold 9px system-ui, sans-serif'
  ctx.fillText('MEU CRAQUE', INFO_X + 26, MC_Y + 10)
  ctx.restore()

  // ── 9. GRADIENTE INFERIOR — leitura do nome ──────────────────────────────
  const PHOTO_END = PHOTO_TOP + PHOTO_H
  ctx.save()
  const nameGrad = ctx.createLinearGradient(0, PHOTO_END - 120, 0, PHOTO_END)
  nameGrad.addColorStop(0,   'rgba(0,0,0,0)')
  nameGrad.addColorStop(0.4, 'rgba(0,0,0,0.55)')
  nameGrad.addColorStop(1,   'rgba(0,0,0,0.88)')
  ctx.fillStyle = nameGrad
  ctx.fillRect(0, PHOTO_END - 120, W, 120)
  ctx.restore()

  // ── 10. NOME DO ATLETA ────────────────────────────────────────────────────
  const NAME_LAST_BASE  = PHOTO_END - 14
  const NAME_FIRST_BASE = NAME_LAST_BASE - 50

  const parts    = opts.nome.trim().split(' ')
  const lastName  = (parts.length > 1 ? parts[parts.length - 1] : opts.nome).toUpperCase()
  const firstName = (parts.length > 1 ? parts.slice(0, -1).join(' ') : '').toUpperCase()

  ctx.save()
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'

  if (firstName) {
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 26px system-ui, sans-serif'
    ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 6
    ctx.fillText(firstName, 18, NAME_FIRST_BASE)
  }

  // Sobrenome — cor do tier, com glow
  ctx.shadowColor = TC; ctx.shadowBlur = 20
  ctx.fillStyle = TC
  ctx.font = 'bold 54px system-ui, -apple-system, sans-serif'
  let ln = lastName
  ctx.font = 'bold 54px system-ui, -apple-system, sans-serif'
  while (ctx.measureText(ln).width > W - 28 && ln.length > 3) ln = ln.slice(0, -1)
  if (ln !== lastName) ln += '…'
  ctx.fillText(ln, 16, NAME_LAST_BASE)
  ctx.restore()

  // ── helper: painel com gradiente premium ─────────────────────────────────
  function drawPanel(y: number, h: number) {
    ctx.save()
    const bg = ctx.createLinearGradient(0, y, 0, y + h)
    bg.addColorStop(0, '#121212'); bg.addColorStop(1, '#090909')
    octPath(ctx, 14, y, W - 28, h, 7)
    ctx.fillStyle = bg; ctx.fill()
    // borda tier
    ctx.shadowColor = TC; ctx.shadowBlur = 6
    ctx.strokeStyle = TC + '38'; ctx.lineWidth = 1
    ctx.stroke()
    // linha de brilho superior
    ctx.shadowColor = TC; ctx.shadowBlur = 4
    ctx.strokeStyle = TC + '65'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(28, y + 1); ctx.lineTo(W - 28, y + 1); ctx.stroke()
    ctx.restore()
  }

  // ── 10. BLOCO IDENTIFICAÇÃO ───────────────────────────────────────────────
  const ID_Y = PHOTO_END + 8, ID_H = 52
  const QR_SIZE = 46, QR_X = W - 14 - QR_SIZE

  drawPanel(ID_Y, ID_H)

  ctx.save()
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(255,255,255,0.32)'
  ctx.font = '700 9px system-ui, sans-serif'
  ctx.letterSpacing = '0.12em'
  ctx.fillText('ID ÚNICO', 24, ID_Y + 9)
  ctx.shadowColor = GREEN; ctx.shadowBlur = 14
  ctx.fillStyle = GREEN
  ctx.font = 'bold 22px system-ui, sans-serif'
  ctx.fillText((opts.athleteId ?? '—').replace(/^[A-Z]+-/, ''), 24, ID_Y + 22)

  // Divisor vertical
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(100, ID_Y + 10); ctx.lineTo(100, ID_Y + ID_H - 10); ctx.stroke()

  // Bandeira + país
  drawBrazilFlag(ctx, 110, ID_Y + ID_H / 2 - 10, 28, 20)
  ctx.fillStyle = 'rgba(255,255,255,0.78)'
  ctx.font = 'bold 12px system-ui, sans-serif'
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillText('BRASIL', 145, ID_Y + ID_H / 2)
  ctx.restore()

  // QR code — maior e mais nítido
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=128x128&data=${encodeURIComponent(opts.profileUrl)}&color=00FF88&bgcolor=121212&margin=1`
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
  const STATS_Y = ID_Y + ID_H + 5, STATS_H = 56

  drawPanel(STATS_Y, STATS_H)

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
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(14 + i * colW, STATS_Y + 8); ctx.lineTo(14 + i * colW, STATS_Y + STATS_H - 8); ctx.stroke()
      }
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(255,255,255,0.40)'
      ctx.font = '700 9px system-ui, sans-serif'
      ctx.fillText(s.label, cx, STATS_Y + 8)
      ctx.shadowColor = GREEN; ctx.shadowBlur = 16
      ctx.fillStyle = GREEN
      ctx.font = 'bold 24px system-ui, sans-serif'
      ctx.fillText(s.val !== null ? String(s.val) : '—', cx, STATS_Y + 20)
      ctx.shadowBlur = 0
    })
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.22)'
    ctx.font = '500 11px system-ui, sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('Aguardando avaliação de treinador', W / 2, STATS_Y + STATS_H / 2)
  }
  ctx.restore()

  // ── 12. DADOS DO ATLETA ────────────────────────────────────────────────────
  const FOOT_Y = STATS_Y + STATS_H + 5, FOOT_H = 52

  drawPanel(FOOT_Y, FOOT_H)

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
      ctx.strokeStyle = TC + '28'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(14 + i * fColW, FOOT_Y + 8); ctx.lineTo(14 + i * fColW, FOOT_Y + FOOT_H - 8); ctx.stroke()
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.font = '13px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.60)'
    ctx.fillText(s.icon, cx, FOOT_Y + 7)
    ctx.fillStyle = 'rgba(255,255,255,0.32)'
    ctx.font = '600 8px system-ui, sans-serif'
    ctx.letterSpacing = '0.1em'
    ctx.fillText(s.label, cx, FOOT_Y + 23)
    ctx.fillStyle = 'rgba(255,255,255,0.92)'
    ctx.font = 'bold 12px system-ui, sans-serif'
    ctx.letterSpacing = '0.03em'
    let v = s.val
    ctx.font = 'bold 12px system-ui, sans-serif'
    while (ctx.measureText(v).width > fColW - 10 && v.length > 2) v = v.slice(0, -1)
    if (v !== s.val) v += '.'
    ctx.fillText(v, cx, FOOT_Y + 35)
  })
  ctx.restore()

  // ── 13. RODAPÉ TAGLINE ────────────────────────────────────────────────────
  const TAG_Y = FOOT_Y + FOOT_H + 8

  ctx.save()
  // Linhas decorativas com gradiente
  const tgl1 = ctx.createLinearGradient(16, 0, 120, 0)
  tgl1.addColorStop(0, 'transparent'); tgl1.addColorStop(1, TC + '70')
  ctx.strokeStyle = tgl1; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(16, TAG_Y + 9); ctx.lineTo(120, TAG_Y + 9); ctx.stroke()

  const tgl2 = ctx.createLinearGradient(W - 120, 0, W - 16, 0)
  tgl2.addColorStop(0, TC + '70'); tgl2.addColorStop(1, 'transparent')
  ctx.strokeStyle = tgl2; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(W - 120, TAG_Y + 9); ctx.lineTo(W - 16, TAG_Y + 9); ctx.stroke()

  // Tagline dinâmica
  function getTagline(pos: string | null | undefined): [string, string] {
    const p = (pos ?? '').toLowerCase()
    if (p.includes('atacante') || p.includes('avante')) return ['NASCIDA PARA FAZER ', 'HISTÓRIA']
    if (p.includes('meia') || p.includes('volante'))    return ['O JOGO PASSA PELOS ', 'SEUS PÉS']
    if (p.includes('zagueiro') || p.includes('lateral')) return ['A MURALHA QUE ', 'NINGUÉM PASSA']
    if (p.includes('goleiro'))                           return ['A ÚLTIMA ', 'BARREIRA']
    return ['SEU TALENTO, ', 'SUA IDENTIDADE']
  }
  const [tag1, tag2] = getTagline(opts.posicao || opts.pos)
  ctx.font = 'italic bold 11px system-ui, sans-serif'
  const tw1 = ctx.measureText(tag1).width, tw2 = ctx.measureText(tag2).width
  const tagX = W / 2 - (tw1 + tw2) / 2
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.shadowBlur = 0
  ctx.fillText(tag1, tagX, TAG_Y + 9)
  ctx.shadowColor = TC; ctx.shadowBlur = 12
  ctx.fillStyle = TC
  ctx.fillText(tag2, tagX + tw1, TAG_Y + 9)
  ctx.restore()

  // ── 14. REFLEXO METÁLICO PREMIUM ─────────────────────────────────────────
  ctx.save()
  const shine = ctx.createLinearGradient(0, 0, W * 0.55, H * 0.38)
  shine.addColorStop(0,   'rgba(255,255,255,0.04)')
  shine.addColorStop(0.35,'rgba(255,255,255,0.07)')
  shine.addColorStop(0.5, 'rgba(255,255,255,0.02)')
  shine.addColorStop(1,   'rgba(255,255,255,0)')
  ctx.fillStyle = shine; ctx.fillRect(0, 0, W, H)
  ctx.restore()

  // ── 15. WATERMARK ─────────────────────────────────────────────────────────
  ctx.save()
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.font = '8px system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('meucraque.com', W / 2, H - 4)
  ctx.restore()
}

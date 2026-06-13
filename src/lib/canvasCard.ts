/**
 * canvasCard.ts — Card Meu Craque, fiel ao design do AtletaCardLanding.
 * 400 × 640 px, Canvas 2D, DPR 2x.
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

// ── Tier — espelho de AtletaCardLanding ────────────────────────────────────────

function getTier(ovr: number | null) {
  if (ovr !== null && ovr >= 85) return { color: '#F5C518', bg: '#0e0b00', border: '#F5C51840', medal: '🥇' }
  if (ovr !== null && ovr >= 70) return { color: '#bdbdbd', bg: '#0d0d0d', border: '#9e9e9e30', medal: '🥈' }
  if (ovr !== null && ovr >= 50) return { color: '#cd7f32', bg: '#0c0800', border: '#cd7f3235', medal: '🥉' }
  return                               { color: '#6b7280', bg: '#0a0a0a', border: '#6b728025', medal: null }
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0,2), 16)
  const g = parseInt(h.slice(2,4), 16)
  const b = parseInt(h.slice(4,6), 16)
  return { r, g, b }
}

function tagline(posicao: string | null | undefined): string {
  const p = (posicao ?? '').toLowerCase()
  if (p.includes('atacante') || p.includes('avante')) return 'NASCIDO PARA FAZER HISTÓRIA'
  if (p.includes('meia') || p.includes('volante'))    return 'O JOGO PASSA PELOS SEUS PÉS'
  if (p.includes('zagueiro') || p.includes('lateral')) return 'A MURALHA QUE NINGUÉM PASSA'
  if (p.includes('goleiro'))                           return 'A ÚLTIMA BARREIRA'
  return 'SEU TALENTO, SUA IDENTIDADE'
}

function posAbrev(posicao: string | null | undefined): string {
  if (!posicao) return '—'
  const p = posicao.toLowerCase()
  if (p.includes('goleiro'))                              return 'GOL'
  if (p.includes('lateral'))                             return 'LAT'
  if (p.includes('zagueiro'))                            return 'ZAG'
  if (p.includes('volante'))                             return 'VOL'
  if (p.includes('meia') || p.includes('armador'))       return 'MEI'
  if (p.includes('atacante') || p.includes('avante') || p.includes('ponta') || p.includes('centro')) return 'ATA'
  return posicao.slice(0, 3).toUpperCase()
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(res => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => res(img)
    img.onerror = () => res(null)
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

// ── generateCard ───────────────────────────────────────────────────────────────

export async function generateCard(canvas: HTMLCanvasElement, opts: CanvasCardProps): Promise<void> {
  const ctx = canvas.getContext('2d')!

  const DPR = 2
  const W = 400, H = 640
  canvas.width  = W * DPR
  canvas.height = H * DPR
  ctx.scale(DPR, DPR)

  const tier = getTier(opts.ovr)
  const { r: cr, g: cg, b: cb } = hexToRgb(tier.color)

  const PAD = 24    // padding lateral do card
  const RAD = 28    // border-radius externo

  // ── 1. FUNDO ────────────────────────────────────────────────────────────────
  roundRect(ctx, 0, 0, W, H, RAD)
  ctx.fillStyle = tier.bg
  ctx.fill()

  // Borda
  roundRect(ctx, 0, 0, W, H, RAD)
  ctx.strokeStyle = tier.border
  ctx.lineWidth = 2
  ctx.stroke()

  // ── 2. TOPO: MC | medalha | posição ─────────────────────────────────────────
  const TOP_Y = 20
  const TOP_H = 52

  // Bolinha MC
  const MC_CX = PAD + 20, MC_CY = TOP_Y + TOP_H / 2
  ctx.beginPath(); ctx.arc(MC_CX, MC_CY, 20, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${cr},${cg},${cb},0.12)`
  ctx.fill()
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.6)`
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.fillStyle = tier.color
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText('MC', MC_CX, MC_CY)

  // Medalha ou sem nada
  if (tier.medal) {
    ctx.font = '26px system-ui, sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(tier.medal, W / 2, MC_CY)
  }

  // Pill posição
  const POS_TEXT = posAbrev(opts.posicao || opts.pos)
  ctx.font = 'bold 13px system-ui, sans-serif'
  const pw = ctx.measureText(POS_TEXT).width + 24
  const POS_X = W - PAD - pw, POS_Y = MC_CY - 15, POS_H = 30
  roundRect(ctx, POS_X, POS_Y, pw, POS_H, 10)
  ctx.fillStyle = `rgba(${cr},${cg},${cb},0.18)`
  ctx.fill()
  ctx.fillStyle = tier.color
  ctx.font = 'bold 13px system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(POS_TEXT, POS_X + pw / 2, MC_CY)

  // ── 3. FOTO ──────────────────────────────────────────────────────────────────
  const PHOTO_X = PAD, PHOTO_Y = TOP_Y + TOP_H + 8
  const PHOTO_W = W - PAD * 2, PHOTO_H = 210
  const PHOTO_R = 18

  roundRect(ctx, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, PHOTO_R)
  ctx.fillStyle = '#111'
  ctx.fill()

  let img: HTMLImageElement | null = null
  if (opts.fotoUrl) img = await loadImage(opts.fotoUrl)

  if (img) {
    ctx.save()
    roundRect(ctx, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, PHOTO_R)
    ctx.clip()
    const scale = Math.max(PHOTO_W / img.width, PHOTO_H / img.height)
    const dw = img.width * scale, dh = img.height * scale
    const dx = PHOTO_X + (PHOTO_W - dw) / 2
    const dy = PHOTO_Y + (PHOTO_H - dh) * 0.1
    ctx.drawImage(img, dx, dy, dw, dh)

    // Gradiente inferior sobre a foto
    const grad = ctx.createLinearGradient(0, PHOTO_Y + PHOTO_H - 80, 0, PHOTO_Y + PHOTO_H)
    grad.addColorStop(0, 'transparent')
    grad.addColorStop(1, tier.bg)
    ctx.fillStyle = grad
    ctx.fillRect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H)
    ctx.restore()
  } else {
    // Iniciais
    ctx.save()
    roundRect(ctx, PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H, PHOTO_R)
    ctx.clip()
    const rad = ctx.createRadialGradient(W/2, PHOTO_Y + PHOTO_H/2, 0, W/2, PHOTO_Y + PHOTO_H/2, 120)
    rad.addColorStop(0, `rgba(${cr},${cg},${cb},0.18)`)
    rad.addColorStop(1, 'transparent')
    ctx.fillStyle = rad
    ctx.fillRect(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_H)
    ctx.font = `bold 72px system-ui, sans-serif`
    ctx.fillStyle = `rgba(${cr},${cg},${cb},0.55)`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(opts.initials, W/2, PHOTO_Y + PHOTO_H/2)
    ctx.restore()
  }

  // ── 4. NOME ──────────────────────────────────────────────────────────────────
  const NAME_Y = PHOTO_Y + PHOTO_H + 10
  const parts    = opts.nome.trim().split(' ')
  const lastName  = (parts.length > 1 ? parts[parts.length - 1] : opts.nome).toUpperCase()
  const firstName = (parts.length > 1 ? parts[0] : '').toUpperCase()

  ctx.textAlign = 'left'; ctx.textBaseline = 'top'

  // firstName — pequeno, faded
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = '600 16px system-ui, sans-serif'
  ctx.fillText(firstName || ' ', PAD, NAME_Y)

  // lastName — grande, tier color
  ctx.fillStyle = tier.color
  ctx.shadowColor = tier.color
  ctx.shadowBlur = 24
  ctx.font = `bold 56px system-ui, -apple-system, sans-serif`
  let ln = lastName
  while (ctx.measureText(ln).width > PHOTO_W - 4 && ln.length > 2) ln = ln.slice(0, -1)
  if (ln !== lastName) ln += '…'
  ctx.fillText(ln, PAD, NAME_Y + 18)
  ctx.shadowBlur = 0

  // ── 5. DIVISOR ───────────────────────────────────────────────────────────────
  const DIV1_Y = NAME_Y + 18 + 56 + 8
  const divGrad = ctx.createLinearGradient(PAD, 0, W - PAD, 0)
  divGrad.addColorStop(0, 'transparent')
  divGrad.addColorStop(0.3, `rgba(${cr},${cg},${cb},0.4)`)
  divGrad.addColorStop(0.7, `rgba(${cr},${cg},${cb},0.4)`)
  divGrad.addColorStop(1, 'transparent')
  ctx.strokeStyle = divGrad; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, DIV1_Y); ctx.lineTo(W - PAD, DIV1_Y); ctx.stroke()

  // ── 6. ID | BANDEIRA | OVR ───────────────────────────────────────────────────
  const ROW1_Y = DIV1_Y + 10
  const ROW1_H = 44

  // ID
  const mcIdNum = opts.athleteId ? opts.athleteId.replace(/^MC-/, '') : '—'
  ctx.textAlign = 'left'; ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(255,255,255,0.28)'
  ctx.font = '700 11px system-ui, sans-serif'
  ctx.fillText('ID ÚNICO', PAD, ROW1_Y)
  ctx.fillStyle = tier.color
  ctx.font = 'bold 19px system-ui, sans-serif'
  ctx.fillText(mcIdNum, PAD, ROW1_Y + 14)

  // Bandeira + OVR pill — lado direito
  const OVR_TEXT = opts.ovr != null ? String(opts.ovr) : '—'
  const FLAG = '🇧🇷'

  // Flag
  ctx.font = '20px system-ui, sans-serif'
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle'
  const OVR_PILL_W = 72, OVR_PILL_H = 30
  const OVR_X = W - PAD - OVR_PILL_W - 8
  const FLAG_X = OVR_X - 10
  ctx.fillText(FLAG, FLAG_X, ROW1_Y + ROW1_H / 2)

  // OVR pill
  roundRect(ctx, OVR_X, ROW1_Y + (ROW1_H - OVR_PILL_H) / 2, OVR_PILL_W, OVR_PILL_H, 20)
  ctx.fillStyle = `rgba(${cr},${cg},${cb},0.18)`
  ctx.fill()
  roundRect(ctx, OVR_X, ROW1_Y + (ROW1_H - OVR_PILL_H) / 2, OVR_PILL_W, OVR_PILL_H, 20)
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.35)`
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(255,255,255,0.40)'
  ctx.font = '700 10px system-ui, sans-serif'
  ctx.fillText('OVR', OVR_X + 22, ROW1_Y + ROW1_H / 2)
  ctx.fillStyle = tier.color
  ctx.font = 'bold 20px system-ui, sans-serif'
  ctx.fillText(OVR_TEXT, OVR_X + 52, ROW1_Y + ROW1_H / 2)

  // ── 7. DIVISOR ───────────────────────────────────────────────────────────────
  const DIV2_Y = ROW1_Y + ROW1_H + 6
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.30)`
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, DIV2_Y); ctx.lineTo(W - PAD, DIV2_Y); ctx.stroke()

  // ── 8. 6 ATRIBUTOS ───────────────────────────────────────────────────────────
  const ATTRS_Y = DIV2_Y + 6
  const ATTRS_H = 52
  const toFifa = (v: number | null | undefined) => v != null ? String(Math.min(99, Math.max(0, Math.round(v)))) : '—'
  const stats = [
    { label: 'VEL', val: toFifa(opts.statPac) },
    { label: 'TEC', val: toFifa(opts.statSho) },
    { label: 'DRI', val: toFifa(opts.statPas) },
    { label: 'FIS', val: toFifa(opts.statDri) },
    { label: 'TAT', val: toFifa(opts.statDef) },
    { label: 'POS', val: toFifa(opts.statPhy) },
  ]
  const hasAttr = stats.some(s => s.val !== '—')
  const colW = PHOTO_W / 6

  stats.forEach((s, i) => {
    const cx = PAD + i * colW + colW / 2
    const cy = ATTRS_Y

    if (i > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(PAD + i * colW, cy + 4); ctx.lineTo(PAD + i * colW, cy + ATTRS_H - 4); ctx.stroke()
    }

    ctx.textAlign = 'center'; ctx.textBaseline = 'top'
    ctx.fillStyle = hasAttr ? tier.color : 'rgba(255,255,255,0.12)'
    ctx.font = `bold 22px system-ui, sans-serif`
    if (hasAttr) { ctx.shadowColor = tier.color; ctx.shadowBlur = 12 }
    ctx.fillText(s.val, cx, cy + 4)
    ctx.shadowBlur = 0

    ctx.fillStyle = 'rgba(255,255,255,0.30)'
    ctx.font = '700 9px system-ui, sans-serif'
    ctx.fillText(s.label, cx, cy + 30)
  })

  // ── 9. DIVISOR ───────────────────────────────────────────────────────────────
  const DIV3_Y = ATTRS_Y + ATTRS_H + 4
  ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.25)`
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, DIV3_Y); ctx.lineTo(W - PAD, DIV3_Y); ctx.stroke()

  // ── 10. POSIÇÃO | CATEGORIA ──────────────────────────────────────────────────
  const FOOT_Y = DIV3_Y + 6
  const FOOT_H = 44
  const footCols = [
    { icon: '⚽', label: 'POSIÇÃO', val: (opts.posicao || opts.pos || '—').toUpperCase().slice(0, 12) },
    { icon: '🏷️', label: 'CATEG.',  val: (opts.categoria ?? '—').toUpperCase() },
  ]
  const fColW = PHOTO_W / 2

  footCols.forEach((fc, i) => {
    const cx = PAD + i * fColW + fColW / 2
    if (i > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(PAD + i * fColW, FOOT_Y + 4); ctx.lineTo(PAD + i * fColW, FOOT_Y + FOOT_H - 4); ctx.stroke()
    }
    ctx.textAlign = 'center'
    ctx.font = '14px system-ui, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.textBaseline = 'top'
    ctx.fillText(fc.icon, cx, FOOT_Y + 2)

    ctx.fillStyle = 'rgba(255,255,255,0.28)'
    ctx.font = '700 9px system-ui, sans-serif'
    ctx.fillText(fc.label, cx, FOOT_Y + 20)

    ctx.fillStyle = fc.val === '—' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.75)'
    ctx.font = 'bold 13px system-ui, sans-serif'
    ctx.fillText(fc.val, cx, FOOT_Y + 31)
  })

  // ── 11. TAGLINE ──────────────────────────────────────────────────────────────
  const TAG_Y = FOOT_Y + FOOT_H + 6
  ctx.textAlign = 'center'; ctx.textBaseline = 'top'
  ctx.fillStyle = `rgba(${cr},${cg},${cb},0.55)`
  ctx.font = 'italic bold 11px system-ui, sans-serif'
  ctx.fillText(tagline(opts.posicao), W / 2, TAG_Y)

  // ── 12. WATERMARK ────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  ctx.font = '9px system-ui, sans-serif'
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillText('meucraque.com', W / 2, H - 6)
}

/**
 * canvasCard.ts — Card Meu Craque, imagem para compartilhamento.
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
  pais?:         string | null   // país do cadastro → bandeira (padrão Brasil)
  statPac?:      number | null
  statSho?:      number | null
  statPas?:      number | null
  statDri?:      number | null
  statDef?:      number | null
  statPhy?:      number | null
}

// ── Tier — espelho de AtletaCardLanding ────────────────────────────────────────

export function getTier(ovr: number | null) {
  if (ovr !== null && ovr >= 85) return { color: '#F5C518', bg: '#0e0b00', border: '#F5C51840', medal: '🥇' }
  if (ovr !== null && ovr >= 70) return { color: '#bdbdbd', bg: '#0d0d0d', border: '#9e9e9e30', medal: '🥈' }
  if (ovr !== null && ovr >= 50) return { color: '#cd7f32', bg: '#0c0800', border: '#cd7f3235', medal: '🥉' }
  return                               { color: '#6b7280', bg: '#0a0a0a', border: '#6b728025', medal: null }
}

export function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0,2), 16)
  const g = parseInt(h.slice(2,4), 16)
  const b = parseInt(h.slice(4,6), 16)
  return { r, g, b }
}

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(res => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => res(img)
    img.onerror = () => res(null)
    img.src = src
  })
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
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

export async function generateCard(canvas: HTMLCanvasElement, opts: CanvasCardProps): Promise<void> {
  const context2d = canvas.getContext('2d')
  if (!context2d) throw new Error('Não foi possível criar o card.')
  const ctx = context2d

  const width = 400
  const height = 640
  canvas.width = width * 2
  canvas.height = height * 2
  ctx.scale(2, 2)
  const lime = '#b3f737'
  const photo = opts.fotoUrl ? await loadImage(opts.fotoUrl) : null

  function text(value: string, x: number, y: number, size: number, color: string, weight = 700, maxWidth = 344) {
    ctx.fillStyle = color
    ctx.font = `${weight} ${size}px system-ui, sans-serif`
    while (ctx.measureText(value).width > maxWidth && size > 13) {
      size -= 1
      ctx.font = `${weight} ${size}px system-ui, sans-serif`
    }
    ctx.fillText(value, x, y, maxWidth)
  }

  roundRect(ctx, 0, 0, width, height, 28)
  ctx.clip()
  ctx.fillStyle = '#091610'
  ctx.fillRect(0, 0, width, height)

  // The same upright 3:4 portrait used on the athlete's profile.
  const px = 88, py = 88, pw = 224, ph = pw * 4 / 3
  function shield(x: number, y: number, w: number, h: number) {
    const points = [[.08,0],[.92,0],[1,.06],[1,.93],[.88,1],[.12,1],[0,.93],[0,.06]]
    ctx.beginPath()
    points.forEach(([dx,dy], index) => {
      if (index === 0) ctx.moveTo(x + dx*w, y + dy*h)
      else ctx.lineTo(x + dx*w, y + dy*h)
    })
    ctx.closePath()
  }
  const metal = ctx.createLinearGradient(px, py, px + pw, py + ph)
  metal.addColorStop(0, '#e1e8db')
  metal.addColorStop(.3, '#182b22')
  metal.addColorStop(.55, lime)
  metal.addColorStop(.75, '#40533c')
  metal.addColorStop(1, '#dce4d6')
  shield(px - 6, py - 6, pw + 12, ph + 12)
  ctx.fillStyle = metal
  ctx.fill()
  ctx.save()
  shield(px, py, pw, ph)
  ctx.clip()
  ctx.fillStyle = '#162c22'
  ctx.fillRect(px, py, pw, ph)
  if (photo) {
    const scale = Math.max(pw / photo.naturalWidth, ph / photo.naturalHeight)
    const w = photo.naturalWidth * scale
    const h = photo.naturalHeight * scale
    ctx.drawImage(photo, px + (pw - w) / 2, py + (ph - h) / 2, w, h)
  } else {
    ctx.textAlign = 'center'
    text(opts.initials, 200, 256, 72, lime, 800, pw - 24)
    ctx.textAlign = 'left'
  }
  ctx.restore()

  text('MeuCraque', 28, 48, 30, lime, 900)
  ctx.textAlign = 'right'
  text('PERFIL ESPORTIVO', 372, 47, 12, '#d4e0d7', 800, 135)
  ctx.textAlign = 'left'
  text(opts.posicao || opts.pos || 'Atleta', 28, 404, 19, lime, 800)
  text(opts.nome, 28, 450, 42, '#ffffff', 900)
  const context = [opts.categoria, opts.cidade].filter(Boolean).join(' · ')
  if (context) text(context, 28, 482, 18, '#d4e0d7', 600)

  ctx.fillStyle = '#315141'
  ctx.fillRect(28, 507, 344, 1)
  if (opts.athleteId) text(`ID ${opts.athleteId}`, 28, 537, 15, '#d4e0d7')
  if (opts.ovr !== null && opts.hasEvaluation) {
    ctx.textAlign = 'right'
    text(`OVR ${opts.ovr}`, 372, 537, 18, lime, 800, 118)
    ctx.textAlign = 'left'
  }
}

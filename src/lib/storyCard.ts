/**
 * storyCard.ts — Card do atleta no formato story (1080 × 1920, Instagram/WhatsApp).
 *
 * Reaproveita o card FIFA de canvasCard.ts (mesmo visual da home), ampliado e
 * emoldurado na cor da tier, com a marca meucraque.com e o link do perfil.
 * OVR e categoria devem vir dos helpers únicos (lib/escala.ts, lib/categoria.ts).
 * Atleta sem OVR → "NOVO CRAQUE" no lugar do número.
 */
import { generateCard, getTier, hexToRgb, roundRect, type CanvasCardProps } from './canvasCard'

export const STORY_W = 1080
export const STORY_H = 1920

// Zona segura do story: o Instagram cobre ~250px no topo e ~250px embaixo com a própria UI
const SAFE_TOP = 250

const VERDE = '#00e676'

function nomeTier(ovr: number | null): string {
  if (ovr !== null && ovr >= 85) return 'CARD OURO'
  if (ovr !== null && ovr >= 70) return 'CARD PRATA'
  if (ovr !== null && ovr >= 50) return 'CARD BRONZE'
  return 'NOVO CRAQUE'
}

/** Desenha o story completo no canvas (redimensiona para 1080 × 1920). */
export async function generateStoryCard(canvas: HTMLCanvasElement, opts: CanvasCardProps): Promise<void> {
  canvas.width  = STORY_W
  canvas.height = STORY_H
  const ctx = canvas.getContext('2d')!
  const W = STORY_W, H = STORY_H

  const tier = getTier(opts.ovr)
  const { r: cr, g: cg, b: cb } = hexToRgb(tier.color)
  const semOvr = opts.ovr === null

  // ── 1. FUNDO: preto + brilho da tier atrás do card ────────────────────────
  ctx.fillStyle = '#080808'
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W / 2, 1060, 60, W / 2, 1060, 900)
  glow.addColorStop(0, `rgba(${cr},${cg},${cb},0.28)`)
  glow.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)
  // Linhas diagonais sutis (textura de gramado/estádio)
  ctx.strokeStyle = 'rgba(255,255,255,0.025)'
  ctx.lineWidth = 2
  for (let x = -H; x < W; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.stroke()
  }

  // ── 2. MARCA no topo ───────────────────────────────────────────────────────
  ctx.textBaseline = 'alphabetic'
  ctx.textAlign = 'left'
  ctx.font = '900 76px system-ui, -apple-system, sans-serif'
  const marca = 'MEUCRAQUE', dom = '.com'
  const wMarca = ctx.measureText(marca).width
  ctx.font = '900 76px system-ui, -apple-system, sans-serif'
  const wDom = ctx.measureText(dom).width
  const xMarca = (W - wMarca - wDom) / 2
  ctx.fillStyle = '#ffffff'
  ctx.fillText(marca, xMarca, SAFE_TOP + 40)
  ctx.fillStyle = VERDE
  ctx.shadowColor = VERDE; ctx.shadowBlur = 24
  ctx.fillText(dom, xMarca + wMarca, SAFE_TOP + 40)
  ctx.shadowBlur = 0
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.font = '600 30px system-ui, sans-serif'
  ctx.fillText('A vitrine dos talentos do futebol de base', W / 2, SAFE_TOP + 92)

  // ── 3. OVR em destaque (ou NOVO CRAQUE) ────────────────────────────────────
  if (semOvr) {
    const txt = 'NOVO CRAQUE'
    ctx.font = '900 64px system-ui, sans-serif'
    const pw = ctx.measureText(txt).width + 96, ph = 110
    const px = (W - pw) / 2, py = SAFE_TOP + 140
    roundRect(ctx, px, py, pw, ph, ph / 2)
    ctx.fillStyle = 'rgba(0,230,118,0.14)'; ctx.fill()
    ctx.strokeStyle = VERDE; ctx.lineWidth = 4; ctx.stroke()
    ctx.fillStyle = VERDE
    ctx.textBaseline = 'middle'
    ctx.fillText(txt, W / 2, py + ph / 2 + 2)
  } else {
    ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.font = '800 34px system-ui, sans-serif'
    ctx.fillText(`OVR  ·  ${nomeTier(opts.ovr)}`, W / 2, SAFE_TOP + 165)
    ctx.fillStyle = tier.color
    ctx.shadowColor = tier.color; ctx.shadowBlur = 40
    ctx.font = '900 128px system-ui, sans-serif'
    ctx.fillText(String(opts.ovr), W / 2, SAFE_TOP + 275)
    ctx.shadowBlur = 0
  }

  // ── 4. CARD FIFA (canvasCard 400×640 @2x) ampliado ─────────────────────────
  const cardCanvas = document.createElement('canvas')
  await generateCard(cardCanvas, opts)
  const CARD_W = 620
  const CARD_H = CARD_W * (cardCanvas.height / cardCanvas.width)   // 992
  const CARD_X = (W - CARD_W) / 2
  const CARD_Y = SAFE_TOP + 320
  const RAD = 28 * (CARD_W / 400)

  // Moldura com brilho na cor da tier (bronze/prata/ouro)
  ctx.save()
  ctx.shadowColor = tier.color
  ctx.shadowBlur = 70
  roundRect(ctx, CARD_X, CARD_Y, CARD_W, CARD_H, RAD)
  ctx.fillStyle = tier.bg
  ctx.fill()
  ctx.restore()
  ctx.drawImage(cardCanvas, CARD_X, CARD_Y, CARD_W, CARD_H)
  roundRect(ctx, CARD_X - 4, CARD_Y - 4, CARD_W + 8, CARD_H + 8, RAD + 4)
  ctx.strokeStyle = tier.color
  ctx.lineWidth = 6
  ctx.stroke()

  // ── 5. RODAPÉ: chamada + link do perfil ────────────────────────────────────
  const FOOT_Y = CARD_Y + CARD_H + 66   // ~1628, acima da barra de mensagem do Instagram
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 40px system-ui, sans-serif'
  ctx.fillText('Veja meu perfil completo', W / 2, FOOT_Y)

  const link = opts.profileUrl.replace(/^https?:\/\/(www\.)?/, '')
  ctx.font = '700 30px system-ui, sans-serif'
  let size = 30
  while (ctx.measureText(link).width > W - 120 && size > 18) {
    size -= 1
    ctx.font = `700 ${size}px system-ui, sans-serif`
  }
  ctx.fillStyle = VERDE
  ctx.fillText(link, W / 2, FOOT_Y + 56)
}

/** PNG do canvas como File (para Web Share API e download). */
export function storyParaArquivo(canvas: HTMLCanvasElement, nomeArquivo: string): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(new File([b], nomeArquivo, { type: 'image/png' })) : reject(new Error('toBlob falhou')), 'image/png')
  })
}

/** Celular com suporte a compartilhar arquivos (abre Instagram/WhatsApp direto). */
export function podeCompartilharArquivo(file: File): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare) return false
  const toque = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  return toque && navigator.canShare({ files: [file] })
}

/** Compartilha via Web Share API no celular; no desktop baixa o PNG. */
export async function compartilharStory(file: File, texto: string, url: string): Promise<'compartilhado' | 'baixado' | 'cancelado'> {
  if (podeCompartilharArquivo(file)) {
    try {
      await navigator.share({ files: [file], title: 'Meu card · MeuCraque', text: `${texto} ${url}` })
      return 'compartilhado'
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'cancelado'
      // Falhou o share (ex.: gesto expirado) → cai para download
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  return 'baixado'
}

/**
 * Shared athlete image: export the card itself, without a surrounding story poster.
 * Keep the legacy function name so every existing share action uses the same card.
 */
import { generateCard, type CanvasCardProps } from './canvasCard'

export const STORY_W = 800
export const STORY_H = 1280

export async function generateStoryCard(canvas: HTMLCanvasElement, opts: CanvasCardProps): Promise<void> {
  await generateCard(canvas, opts)
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
export async function compartilharStory(file: File, _texto: string, _url: string): Promise<'compartilhado' | 'baixado' | 'cancelado'> {
  if (podeCompartilharArquivo(file)) {
    try {
      await navigator.share({ files: [file], title: 'Meu card · MeuCraque' })
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

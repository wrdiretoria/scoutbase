/**
 * Bandeira (emoji) a partir do país/nacionalidade do cadastro — fonte única
 * para os cards da home e o card de canvas/story. Brasil é o padrão.
 */
export function bandeiraDoPais(pais: string | null | undefined): string {
  const n = (pais ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  if (n.includes('paraguai') || n.includes('paraguay')) return '🇵🇾'
  if (n.includes('argentina')) return '🇦🇷'
  if (n.includes('uruguai') || n.includes('uruguay')) return '🇺🇾'
  if (n.includes('colombia')) return '🇨🇴'
  if (n.includes('chile')) return '🇨🇱'
  if (n.includes('peru')) return '🇵🇪'
  if (n.includes('bolivia')) return '🇧🇴'
  if (n.includes('venezuela')) return '🇻🇪'
  if (n.includes('equador') || n.includes('ecuador')) return '🇪🇨'
  if (n.includes('portugal')) return '🇵🇹'
  if (n.includes('espanha') || n.includes('spain') || n.includes('espana')) return '🇪🇸'
  return '🇧🇷'
}

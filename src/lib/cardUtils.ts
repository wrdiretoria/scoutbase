/**
 * Utilitários compartilhados entre cards de atleta e treinador.
 * Centraliza funções duplicadas em compartilhar, carta, CardShare e pages.
 */

/** Iniciais do nome (até 2 palavras). */
export function getInitials(nome: string): string {
  return nome.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

/** Mapa de posição completa → abreviação. */
export const POS_MAP: Record<string, string> = {
  'Goleiro':        'GK',  'Lateral Direito':  'LD',  'Lateral Esquerdo': 'LE',
  'Zagueiro':       'ZG',  'Volante':           'VOL', 'Meia':              'MEI',
  'Meia-Atacante':  'MAT', 'Ponta Direita':     'PD',  'Ponta Esquerda':   'PE',
  'Atacante':       'ATA', 'Centro-Avante':     'CA',
}

/** Abrevia posição ("Atacante" → "ATA", desconhecida → 3 primeiras letras). */
export function posAbrev(posicao: string): string {
  if (!posicao) return ''
  return POS_MAP[posicao] ?? posicao.slice(0, 3).toUpperCase()
}

/** Idade em anos completos a partir da data de nascimento (YYYY-MM-DD). */
export function calcularIdade(dataNasc: string): number {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

/**
 * Categoria por data de nascimento.
 * Retorna "Sub-11" … "Sub-20" ou "Adulto".
 */
export function calcularCategoria(dataNasc: string): string {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  if (idade <= 11) return 'Sub-11'
  if (idade <= 13) return 'Sub-13'
  if (idade <= 15) return 'Sub-15'
  if (idade <= 17) return 'Sub-17'
  if (idade <= 20) return 'Sub-20'
  return 'Adulto'
}

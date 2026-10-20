/**
 * Utilitários compartilhados entre cards de atleta e treinador.
 * Centraliza funções duplicadas em compartilhar, carta, CardShare e pages.
 */

import { categoriaDoAtleta } from './categoria'

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
 * Categoria pela regra única (lib/categoria.ts): ano atual − ano de nascimento.
 * Retorna "Sub-N" ou "Adulto" ('' sem data válida).
 */
export function calcularCategoria(dataNasc: string): string {
  return categoriaDoAtleta(dataNasc) ?? ''
}

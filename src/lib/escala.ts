/**
 * Escala única de OVR e atributos — fonte da verdade para TODAS as telas.
 * Módulo puro (sem Supabase/Next), pode ser usado em client e server components.
 *
 * OVR — SÓ a avaliação do treinador:
 *   • nota de cada avaliação = calcScoutScore (Técnico 35% · Físico 25% · Tático 25% ·
 *     Comportamento 15%), recalculada a partir das respostas quando existem
 *   • OVR do atleta = média das notas das suas avaliações
 *   • sem avaliação → null (exibir "—" / NOVO CRAQUE)
 *
 * Perfil completo — barra separada (perfilCompleto), NÃO entra no OVR.
 *
 * Atributos (VEL/TEC/DRI/FIS/TAT/POS) — sempre exibidos em 0-99.
 *   Avaliações antigas gravaram em 0-10; as novas (calcAtributos) em 0-99,
 *   nas mesmas colunas. atributosDaAvaliacao() normaliza as duas.
 */

import { calcScoutScore, VARIANTES, type VarianteKey } from './questionnaire'

// ── OVR ───────────────────────────────────────────────────────────────────────

export type AvaliacaoNota = {
  scout_score?: number | null
  respostas?:   Record<string, number> | null
  variante?:    string | null
}

/** Colunas necessárias para calcular a nota de uma avaliação. */
export const COLUNAS_NOTA = 'scout_score, respostas, variante'

/**
 * Nota (0-100) de uma avaliação pela regra atual. Com respostas, recalcula com os
 * pesos por bloco; avaliações legadas (sem respostas) usam o scout_score gravado.
 */
export function notaDaAvaliacao(av: AvaliacaoNota | null | undefined): number | null {
  if (!av) return null
  if (av.respostas && av.variante && av.variante in VARIANTES) {
    return calcScoutScore(av.respostas, av.variante as VarianteKey)
  }
  return typeof av.scout_score === 'number' ? Math.round(av.scout_score) : null
}

/** OVR do atleta: média das notas das avaliações; null se não houver avaliação. */
export function ovrDasAvaliacoes(avs: (AvaliacaoNota | null | undefined)[]): number | null {
  const notas = avs.map(notaDaAvaliacao).filter((n): n is number => n !== null)
  return notas.length > 0 ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length) : null
}

// ── Perfil completo (barra separada, fora do OVR) ─────────────────────────────

export type PerfilUserMeta = {
  questionario_completo?: boolean | string | null
  clubes_anteriores?:     string | null
  campeonatos?:           string | null
  titulos?:               string | null
  premiacoes?:            string | null
  telefone?:              string | null
}

/**
 * Itens do perfil (somam 100%):
 *   Cadastro (nome + posição + nascimento — obrigatórios): 15
 *   Foto 20 · Questionário 20 · Clubes anteriores 15 · Campeonatos 10
 *   Títulos 10 · Premiações 5 · Telefone 5
 */
export function perfilCompleto(
  avatarUrl: string | null | undefined,
  meta: PerfilUserMeta,
): { pct: number; faltando: { item: string; pts: number }[] } {
  const itens: { item: string; pts: number; ok: boolean }[] = [
    { item: 'Cadastro básico',   pts: 15, ok: true },
    { item: 'Foto de perfil',    pts: 20, ok: !!avatarUrl },
    { item: 'Questionário',      pts: 20, ok: !!meta.questionario_completo },
    { item: 'Clubes anteriores', pts: 15, ok: !!meta.clubes_anteriores?.trim() },
    { item: 'Campeonatos',       pts: 10, ok: !!meta.campeonatos?.trim() },
    { item: 'Títulos',           pts: 10, ok: !!meta.titulos?.trim() },
    { item: 'Premiações',        pts: 5,  ok: !!meta.premiacoes?.trim() },
    { item: 'Telefone',          pts: 5,  ok: !!meta.telefone?.trim() },
  ]
  return {
    pct:      itens.filter(i => i.ok).reduce((a, i) => a + i.pts, 0),
    faltando: itens.filter(i => !i.ok).map(({ item, pts }) => ({ item, pts })),
  }
}

// ── Atributos ─────────────────────────────────────────────────────────────────

export type Atributos = {
  vel: number | null
  tec: number | null
  dri: number | null
  fis: number | null
  tat: number | null
  pos: number | null
}

type AvaliacaoAtributos = {
  velocidade?:     number | null
  tecnica?:        number | null
  finalizacao?:    number | null
  forca?:          number | null
  visao_jogo?:     number | null
  posicionamento?: number | null
}

const clamp99 = (v: number) => Math.min(99, Math.max(0, Math.round(v)))

/**
 * Converte uma linha de `avaliacoes` nos 6 atributos em 0-99.
 * Se todos os valores cabem em 0-10, é escala legada → ×10.
 */
export function atributosDaAvaliacao(av: AvaliacaoAtributos | null | undefined): Atributos | null {
  if (!av) return null
  const raw = [av.velocidade, av.tecnica, av.finalizacao, av.forca, av.visao_jogo, av.posicionamento]
  const vals = raw.filter((v): v is number => typeof v === 'number')
  if (vals.length === 0) return null
  const fator = vals.every(v => v <= 10) ? 10 : 1
  const conv = (v: number | null | undefined) => (typeof v === 'number' ? clamp99(v * fator) : null)
  return {
    vel: conv(av.velocidade),
    tec: conv(av.tecnica),
    dri: conv(av.finalizacao),
    fis: conv(av.forca),
    tat: conv(av.visao_jogo),
    pos: conv(av.posicionamento),
  }
}

/** Formata um atributo já em 0-99 para exibição ('—' se ausente). */
export function fmtAtributo(v: number | null | undefined): string {
  return v == null ? '—' : String(clamp99(v))
}

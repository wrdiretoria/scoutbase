/**
 * Escala única de OVR e atributos — fonte da verdade para TODAS as telas.
 * Módulo puro (sem Supabase/Next), pode ser usado em client e server components.
 *
 * OVR — fórmula 50/50:
 *   • 50% perfil (cadastro + currículo preenchido)
 *   • 50% avaliação de treinadores (média dos scout_score, 0-100)
 *
 * Atributos (VEL/TEC/DRI/FIS/TAT/POS) — sempre exibidos em 0-99.
 *   Avaliações antigas gravaram em 0-10; as novas (calcAtributos) em 0-99,
 *   nas mesmas colunas. atributosDaAvaliacao() normaliza as duas.
 */

// ── OVR ───────────────────────────────────────────────────────────────────────

export type OvrUserMeta = {
  questionario_completo?: boolean | string | null
  clubes_anteriores?:     string | null
  campeonatos?:           string | null
  titulos?:               string | null
  premiacoes?:            string | null
  telefone?:              string | null
}

/**
 * Pontuação do perfil (max 100 pts → × 0.5 = max 50 OVR):
 *   Base (nome + posicao + dob — obrigatórios no cadastro): 15 pts (sempre)
 *   Foto (avatar_url):                                      20 pts
 *   Questionário (questionario_completo em user_metadata):  20 pts
 *   Clubes anteriores:                                      15 pts
 *   Campeonatos:                                            10 pts
 *   Títulos:                                                10 pts
 *   Premiações:                                              5 pts
 *   Telefone:                                                5 pts
 */
export function calcProfileScore(avatarUrl: string | null | undefined, meta: OvrUserMeta): number {
  let score = 15
  if (avatarUrl)                            score += 20
  if (meta.questionario_completo)           score += 20
  if (meta.clubes_anteriores?.trim())       score += 15
  if (meta.campeonatos?.trim())             score += 10
  if (meta.titulos?.trim())                 score += 10
  if (meta.premiacoes?.trim())              score += 5
  if (meta.telefone?.trim())                score += 5
  return score  // 0–100
}

/** Média arredondada dos scout_score; null se não houver avaliação. */
export function mediaScoutScore(scores: (number | null | undefined)[]): number | null {
  const vals = scores.filter((s): s is number => typeof s === 'number')
  return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null
}

export function calcOvr(profileScore: number, trainerAvg: number | null): number | null {
  // Sem avaliação oficial: OVR não existe
  if (trainerAvg === null) return null
  return Math.round(profileScore * 0.5) + Math.round(trainerAvg * 0.5)
}

/** Atalho: OVR a partir dos dados crus do atleta. */
export function ovrDoAtleta(
  avatarUrl: string | null | undefined,
  meta: OvrUserMeta,
  scoutScores: (number | null | undefined)[],
): number | null {
  return calcOvr(calcProfileScore(avatarUrl, meta), mediaScoutScore(scoutScores))
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

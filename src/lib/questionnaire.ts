/**
 * Definições do questionário de avaliação — 20 perguntas, escala 1-5.
 *
 * Estrutura por avaliação:
 *   Bloco A (10) — Atributos Técnicos   → específicos por posição / variante
 *   Bloco B  (6) — Perfil do Jogador    → fixos para todos os atletas
 *   Bloco C  (4) — Físico / Contextual  → específicos por fase + posição
 *
 * Variantes (23):
 *   iniciacao                                                        (legacy/fallback)
 *   iniciacao_goleiro   | iniciacao_zagueiro   | iniciacao_lateral
 *   iniciacao_volante   | iniciacao_meia       | iniciacao_ponta    | iniciacao_centroavante
 *   formacao_goleiro    | formacao_zagueiro    | formacao_lateral
 *   formacao_volante    | formacao_meia        | formacao_ponta     | formacao_centroavante
 *   competicao_goleiro  | competicao_zagueiro  | competicao_lateral
 *   competicao_volante  | competicao_meia      | competicao_ponta   | competicao_centroavante
 *
 * Score: Math.round(((avg - 1) / 4) × 100)  →  0 a 100
 *   Tudo 1 = 0  |  Tudo 3 = 50  |  Tudo 5 = 100
 */

export type QuestionDef = { key: string; label: string; icon: string }

export type VarianteKey =
  | 'iniciacao'
  | 'iniciacao_goleiro'     | 'iniciacao_zagueiro'     | 'iniciacao_lateral'
  | 'iniciacao_volante'     | 'iniciacao_meia'          | 'iniciacao_ponta'    | 'iniciacao_centroavante'
  | 'formacao_goleiro'      | 'formacao_zagueiro'      | 'formacao_lateral'
  | 'formacao_volante'      | 'formacao_meia'           | 'formacao_ponta'     | 'formacao_centroavante'
  | 'competicao_goleiro'    | 'competicao_zagueiro'    | 'competicao_lateral'
  | 'competicao_volante'    | 'competicao_meia'         | 'competicao_ponta'   | 'competicao_centroavante'

export type VarianteDef = {
  label:  string
  blocoA: QuestionDef[]   // 10 questões técnicas (varia por posição/fase)
  blocoC: QuestionDef[]   // 4 questões físico/contextual (varia por posição/fase)
}

// ── Bloco B — Perfil do Jogador (6 perguntas, fixas para todos) ───────────────

export const BLOCO_PERFIL: QuestionDef[] = [
  { key: 'pf_tecnico',     label: 'Técnico',      icon: '🔧' },
  { key: 'pf_inteligente', label: 'Inteligente',  icon: '💡' },
  { key: 'pf_forte',       label: 'Forte',        icon: '💪' },
  { key: 'pf_lider',       label: 'Líder',        icon: '👑' },
  { key: 'pf_competitivo', label: 'Competitivo',  icon: '🔥' },
  { key: 'pf_decisivo',    label: 'Decisivo',     icon: '⭐' },
]

// ── Bloco A genérico de campo (legacy — usado apenas pela variante 'iniciacao') ─

const BLOCO_A_CAMPO: QuestionDef[] = [
  { key: 'passe_curto',    label: 'Passe Curto',       icon: '↗' },
  { key: 'passe_longo',    label: 'Passe Longo',       icon: '🏹' },
  { key: 'finalizacao',    label: 'Finalização',       icon: '🎯' },
  { key: 'drible',         label: 'Drible',            icon: '⚡' },
  { key: 'dominio',        label: 'Domínio/Controle',  icon: '🦶' },
  { key: 'conducao',       label: 'Condução de Bola',  icon: '⚽' },
  { key: 'cabecio',        label: 'Cabeceio',          icon: '👆' },
  { key: 'marcacao',       label: 'Marcação',          icon: '🛡' },
  { key: 'desarme',        label: 'Desarme',           icon: '✋' },
  { key: 'tomada_decisao', label: 'Tomada de Decisão', icon: '🧠' },
]

// ─────────────────────────────────────────────────────────────────────────────
// GOLEIRO
// ─────────────────────────────────────────────────────────────────────────────

const BLOCO_A_GK_INICIACAO: QuestionDef[] = [
  { key: 'gk_controle_maos',     label: 'Controle com as Mãos',              icon: '🧤' },
  { key: 'gk_seguranca_maos',    label: 'Segurança nas Mãos',                icon: '🔒' },
  { key: 'gk_posicionamento',    label: 'Posicionamento no Gol',             icon: '📍' },
  { key: 'gk_defesa_chao',       label: 'Defesa no Chão',                    icon: '⬇' },
  { key: 'gk_defesa_alta',       label: 'Defesa no Alto',                    icon: '⬆' },
  { key: 'gk_saida_gol',         label: 'Saída do Gol',                      icon: '↕' },
  { key: 'gk_distribuicao_pes',  label: 'Distribuição com os Pés',           icon: '🦶' },
  { key: 'gk_distribuicao_maos', label: 'Distribuição com as Mãos',          icon: '🤲' },
  { key: 'gk_comunicacao',       label: 'Comunicação com Companheiros',       icon: '📣' },
  { key: 'gk_atencao_foco',      label: 'Atenção e Foco',                    icon: '👁' },
]

const BLOCO_A_GK_FORMACAO: QuestionDef[] = [
  { key: 'gk_seguranca_maos',        label: 'Segurança nas Mãos',                  icon: '🔒' },
  { key: 'gk_posicionamento',        label: 'Posicionamento no Gol',               icon: '📍' },
  { key: 'gk_defesa_chao',           label: 'Defesa no Chão',                      icon: '⬇' },
  { key: 'gk_defesa_alta',           label: 'Defesa no Alto / Cruzamentos',        icon: '⬆' },
  { key: 'gk_saida_gol',             label: 'Saída do Gol',                        icon: '↕' },
  { key: 'gk_defesa_1x1',            label: 'Defesa no 1×1',                       icon: '⚔' },
  { key: 'gk_passe_curto_pes',       label: 'Passe Curto com os Pés',              icon: '🦶' },
  { key: 'gk_distribuicao_maos',     label: 'Distribuição com as Mãos',            icon: '🤲' },
  { key: 'gk_comunicacao_defesa',    label: 'Comunicação / Organização Defensiva', icon: '📣' },
  { key: 'gk_leitura_antecipada',    label: 'Leitura de Jogo / Antecipação',       icon: '🧠' },
]

const BLOCO_A_GK_COMPETICAO: QuestionDef[] = [
  { key: 'gk_seguranca_confianca',    label: 'Segurança e Confiança',                    icon: '🔒' },
  { key: 'gk_posicionamento_tatico',  label: 'Posicionamento Tático',                    icon: '📍' },
  { key: 'gk_defesa_chao_pressao',    label: 'Defesa no Chão sob Pressão',               icon: '⬇' },
  { key: 'gk_dominio_cruzamentos',    label: 'Domínio em Cruzamentos',                   icon: '⬆' },
  { key: 'gk_saida_avancada',         label: 'Saída Avançada / Domínio de Área',          icon: '↕' },
  { key: 'gk_defesa_1x1_penaltis',    label: 'Defesa no 1×1 e Pênaltis',                 icon: '⚔' },
  { key: 'gk_jogo_pes_curto_medio',   label: 'Jogo com os Pés (curto e médio)',           icon: '🦶' },
  { key: 'gk_passe_longo_meta',       label: 'Passe Longo / Tiro de Meta',                icon: '🏹' },
  { key: 'gk_lideranca_organizacao',  label: 'Liderança e Organização Defensiva',         icon: '👑' },
  { key: 'gk_tomada_decisao_pressao', label: 'Tomada de Decisão sob Pressão',             icon: '🧠' },
]

const BLOCO_C_GK_INICIACAO: QuestionDef[] = [
  { key: 'gk_velocidade_reacao',  label: 'Velocidade de Reação',    icon: '⚡' },
  { key: 'gk_agilidade_lateral',  label: 'Agilidade Lateral',       icon: '🤸' },
  { key: 'gk_salto',              label: 'Salto / Elevação',         icon: '🦘' },
  { key: 'gk_disposicao',         label: 'Disposição e Atitude',    icon: '🌟' },
]

const BLOCO_C_GK_FORMACAO: QuestionDef[] = [
  { key: 'gk_velocidade_reacao',  label: 'Velocidade de Reação',     icon: '⚡' },
  { key: 'gk_agilidade_lateral',  label: 'Agilidade Lateral',        icon: '🤸' },
  { key: 'gk_salto',              label: 'Salto / Potência Vertical', icon: '🦘' },
  { key: 'gk_forca_maos_bracos',  label: 'Força nas Mãos e Braços',  icon: '💪' },
]

const BLOCO_C_GK_COMPETICAO: QuestionDef[] = [
  { key: 'gk_explosao_potencia',        label: 'Explosão e Potência',        icon: '💥' },
  { key: 'gk_velocidade_reacao',        label: 'Velocidade de Reação',       icon: '⚡' },
  { key: 'gk_resistencia_concentracao', label: 'Resistência e Concentração', icon: '🔋' },
  { key: 'gk_forca_fisica_geral',       label: 'Força Física Geral',         icon: '💪' },
]

// ─────────────────────────────────────────────────────────────────────────────
// ZAGUEIRO
// ─────────────────────────────────────────────────────────────────────────────

const BLOCO_A_ZAG_INICIACAO: QuestionDef[] = [
  { key: 'zag_posicionamento', label: 'Posicionamento Defensivo',    icon: '📍' },
  { key: 'zag_jogo_aereo',     label: 'Jogo Aéreo Defensivo',        icon: '⬆' },
  { key: 'zag_desarme',        label: 'Desarme / Corte',             icon: '✋' },
  { key: 'zag_marcacao',       label: 'Marcação / Cobertura',        icon: '🛡' },
  { key: 'zag_dominio_bola',   label: 'Domínio com a Bola',          icon: '🦶' },
  { key: 'zag_passe_curto',    label: 'Passe Curto / Saída de Bola', icon: '↗' },
  { key: 'zag_antecipacao',    label: 'Antecipação e Leitura',       icon: '🧠' },
  { key: 'zag_forca_duel',     label: 'Força nos Duelos',            icon: '💪' },
  { key: 'zag_comunicacao',    label: 'Comunicação Defensiva',       icon: '📣' },
  { key: 'zag_coragem',        label: 'Coragem e Determinação',      icon: '🔥' },
]

const BLOCO_A_ZAG_FORMACAO: QuestionDef[] = [
  { key: 'zag_posicionamento_estrutural', label: 'Posicionamento Estrutural',    icon: '📍' },
  { key: 'zag_marcacao_1x1',             label: 'Marcação no 1×1',              icon: '⚔' },
  { key: 'zag_desarme_bloqueio',         label: 'Desarme e Bloqueio',           icon: '✋' },
  { key: 'zag_jogo_aereo',               label: 'Jogo Aéreo Defensivo',         icon: '⬆' },
  { key: 'zag_interceptacao',            label: 'Interceptação / Antecipação',  icon: '🧠' },
  { key: 'zag_saida_bola',               label: 'Saída de Bola / 1º Passe',     icon: '↗' },
  { key: 'zag_passe_medio',              label: 'Passe Médio / Transição',      icon: '🏹' },
  { key: 'zag_lideranca',                label: 'Liderança Defensiva',          icon: '👑' },
  { key: 'zag_duelo_corpo',              label: 'Duelo Físico / Corpo a Corpo', icon: '💪' },
  { key: 'zag_recuperacao',              label: 'Recuperação de Posição',       icon: '🔄' },
]

const BLOCO_A_ZAG_COMPETICAO: QuestionDef[] = [
  { key: 'zag_posicionamento_tatico',  label: 'Posicionamento Tático',                 icon: '📍' },
  { key: 'zag_marcacao_1x1_pressao',   label: 'Marcação no 1×1 sob Pressão',          icon: '⚔' },
  { key: 'zag_desarme_bloqueio',       label: 'Desarme / Bloqueio / Corte',            icon: '✋' },
  { key: 'zag_dominio_cruzamentos',    label: 'Domínio em Cruzamentos e Escanteios',   icon: '⬆' },
  { key: 'zag_antecipacao_tatica',     label: 'Antecipação e Leitura Tática',          icon: '🧠' },
  { key: 'zag_saida_qualidade',        label: 'Qualidade na Saída de Bola',            icon: '↗' },
  { key: 'zag_passe_longo',            label: 'Passe Longo / Lançamento',              icon: '🏹' },
  { key: 'zag_duelo_aereo',            label: 'Duelo Aéreo Dominante',                 icon: '🦘' },
  { key: 'zag_lideranca_organizacao',  label: 'Liderança e Organização da Defesa',     icon: '👑' },
  { key: 'zag_tomada_decisao',         label: 'Tomada de Decisão sob Pressão',         icon: '⚡' },
]

const BLOCO_C_ZAG_INICIACAO: QuestionDef[] = [
  { key: 'zag_forca_fisica',   label: 'Força Física',             icon: '💪' },
  { key: 'zag_potencia_aereo', label: 'Potência no Jogo Aéreo',   icon: '🦘' },
  { key: 'zag_resistencia',    label: 'Resistência Física',       icon: '🔋' },
  { key: 'zag_disposicao',     label: 'Disposição e Atitude',     icon: '🌟' },
]

const BLOCO_C_ZAG_FORMACAO: QuestionDef[] = [
  { key: 'zag_forca_fisica',   label: 'Força Física nos Duelos',  icon: '💪' },
  { key: 'zag_potencia_aereo', label: 'Potência no Jogo Aéreo',   icon: '🦘' },
  { key: 'zag_resistencia',    label: 'Resistência Física',       icon: '🔋' },
  { key: 'zag_comunicacao',    label: 'Comunicação Defensiva',    icon: '📣' },
]

const BLOCO_C_ZAG_COMPETICAO: QuestionDef[] = [
  { key: 'zag_forca_fisica',   label: 'Força Física',                     icon: '💪' },
  { key: 'zag_potencia_aereo', label: 'Potência no Jogo Aéreo',           icon: '🦘' },
  { key: 'zag_resistencia',    label: 'Resistência Física',               icon: '🔋' },
  { key: 'zag_concentracao',   label: 'Concentração / Disciplina Tática', icon: '🎯' },
]

// ─────────────────────────────────────────────────────────────────────────────
// LATERAL
// ─────────────────────────────────────────────────────────────────────────────

const BLOCO_A_LAT_INICIACAO: QuestionDef[] = [
  { key: 'lat_conducao_velocidade',  label: 'Condução em Velocidade',          icon: '⚽' },
  { key: 'lat_marcacao',             label: 'Marcação Defensiva',              icon: '🛡' },
  { key: 'lat_desarme',              label: 'Desarme / Corte',                 icon: '✋' },
  { key: 'lat_velocidade_agilidade', label: 'Velocidade e Agilidade',          icon: '🏃' },
  { key: 'lat_passe_curto',          label: 'Passe Curto / Saída de Bola',     icon: '↗' },
  { key: 'lat_sobreposicao',         label: 'Sobreposição / Subida no Ataque', icon: '⬆' },
  { key: 'lat_cruzamento',           label: 'Cruzamento e Assistência',        icon: '🎯' },
  { key: 'lat_dominio',              label: 'Domínio com a Bola',              icon: '🦶' },
  { key: 'lat_antecipacao',          label: 'Antecipação Defensiva',           icon: '🧠' },
  { key: 'lat_disposicao',           label: 'Disposição para Correr',          icon: '🔥' },
]

const BLOCO_A_LAT_FORMACAO: QuestionDef[] = [
  { key: 'lat_velocidade_sprint',   label: 'Velocidade em Sprint',                icon: '🏃' },
  { key: 'lat_marcacao_1x1',        label: 'Marcação no 1×1',                    icon: '⚔' },
  { key: 'lat_desarme',             label: 'Desarme Defensivo',                   icon: '✋' },
  { key: 'lat_sobreposicao',        label: 'Sobreposição e Subida',               icon: '⬆' },
  { key: 'lat_cruzamento',          label: 'Qualidade no Cruzamento',             icon: '🎯' },
  { key: 'lat_conducao_velocidade', label: 'Condução em Velocidade',              icon: '⚽' },
  { key: 'lat_passe_curto_medio',   label: 'Passe Curto e Médio',                 icon: '↗' },
  { key: 'lat_posicionamento',      label: 'Posicionamento Defensivo/Ofensivo',   icon: '📍' },
  { key: 'lat_antecipacao',         label: 'Antecipação Defensiva',               icon: '🧠' },
  { key: 'lat_cobertura_corredor',  label: 'Cobertura do Corredor',               icon: '🔄' },
]

const BLOCO_A_LAT_COMPETICAO: QuestionDef[] = [
  { key: 'lat_velocidade_aceleracao', label: 'Velocidade e Aceleração',                  icon: '🏃' },
  { key: 'lat_marcacao_1x1_pressao',  label: 'Marcação no 1×1 sob Pressão',             icon: '⚔' },
  { key: 'lat_desarme',               label: 'Desarme e Bloqueio',                       icon: '✋' },
  { key: 'lat_cobertura_zaga',        label: 'Cobertura e Apoio à Zaga',                  icon: '🛡' },
  { key: 'lat_cruzamento_qualidade',  label: 'Qualidade do Cruzamento',                  icon: '🎯' },
  { key: 'lat_conducao_velocidade',   label: 'Condução em Velocidade',                   icon: '⚽' },
  { key: 'lat_passe_variado',         label: 'Variação de Passe (curto/médio/longo)',     icon: '🏹' },
  { key: 'lat_posicionamento_tatico', label: 'Posicionamento Tático',                    icon: '📍' },
  { key: 'lat_leitura_jogo',          label: 'Leitura de Jogo Ofensivo/Defensivo',       icon: '🧠' },
  { key: 'lat_resistencia_tatica',    label: 'Resistência e Cobertura do Corredor',      icon: '🔋' },
]

const BLOCO_C_LAT_INICIACAO: QuestionDef[] = [
  { key: 'lat_velocidade',  label: 'Velocidade de Corrida',          icon: '🏃' },
  { key: 'lat_agilidade',   label: 'Agilidade / Mudança de Direção', icon: '🤸' },
  { key: 'lat_resistencia', label: 'Resistência (vai e volta)',       icon: '🔋' },
  { key: 'lat_coragem',     label: 'Coragem nos Duelos',             icon: '💪' },
]

const BLOCO_C_LAT_FORMACAO: QuestionDef[] = [
  { key: 'lat_velocidade',    label: 'Velocidade de Sprint',               icon: '🏃' },
  { key: 'lat_resistencia',   label: 'Resistência Aeróbica (vai e volta)', icon: '🔋' },
  { key: 'lat_agilidade',     label: 'Agilidade Defensiva',                icon: '🤸' },
  { key: 'lat_comunicacao',   label: 'Comunicação Defensiva',              icon: '📣' },
]

const BLOCO_C_LAT_COMPETICAO: QuestionDef[] = [
  { key: 'lat_velocidade_aceleracao', label: 'Velocidade e Aceleração', icon: '🏃' },
  { key: 'lat_resistencia_fisica',    label: 'Resistência Aeróbica',    icon: '🔋' },
  { key: 'lat_agilidade',             label: 'Agilidade e Explosão',    icon: '🤸' },
  { key: 'lat_concentracao',          label: 'Concentração Tática',     icon: '🎯' },
]

// ─────────────────────────────────────────────────────────────────────────────
// VOLANTE
// ─────────────────────────────────────────────────────────────────────────────

const BLOCO_A_VOL_INICIACAO: QuestionDef[] = [
  { key: 'vol_conducao',       label: 'Condução com a Bola',        icon: '⚽' },
  { key: 'vol_passe_curto',    label: 'Passe Curto',                icon: '↗' },
  { key: 'vol_dominio',        label: 'Domínio / Recepção',         icon: '🦶' },
  { key: 'vol_disputa',        label: 'Disputa pela Bola',          icon: '💪' },
  { key: 'vol_marcacao',       label: 'Marcação e Pressão',         icon: '🛡' },
  { key: 'vol_drible',         label: 'Drible Básico',              icon: '🕹' },
  { key: 'vol_posicionamento', label: 'Posicionamento no Jogo',     icon: '📍' },
  { key: 'vol_transicao',      label: 'Transição Defesa/Ataque',    icon: '⚡' },
  { key: 'vol_disposicao',     label: 'Disposição para Correr',     icon: '🔥' },
  { key: 'vol_visao',          label: 'Visão de Jogo Básica',       icon: '👁' },
]

const BLOCO_A_VOL_FORMACAO: QuestionDef[] = [
  { key: 'vol_marcacao_pressing',  label: 'Marcação e Pressing',             icon: '🛡' },
  { key: 'vol_interceptacao',      label: 'Interceptação e Bloqueio',        icon: '✋' },
  { key: 'vol_recuperacao',        label: 'Recuperação de Bola',             icon: '🔄' },
  { key: 'vol_passe_curto_medio',  label: 'Passe Curto e Médio',             icon: '↗' },
  { key: 'vol_recepcao_pressao',   label: 'Recepção sob Pressão',            icon: '🦶' },
  { key: 'vol_conducao_espaco',    label: 'Condução em Espaços Reduzidos',   icon: '⚽' },
  { key: 'vol_transicao',          label: 'Velocidade de Transição',         icon: '⚡' },
  { key: 'vol_posicionamento',     label: 'Posicionamento Tático',           icon: '📍' },
  { key: 'vol_duelo',              label: 'Duelo Físico / Disputa',          icon: '⚔' },
  { key: 'vol_leitura_jogo',       label: 'Leitura de Jogo Defensivo',       icon: '📖' },
]

const BLOCO_A_VOL_COMPETICAO: QuestionDef[] = [
  { key: 'vol_marcacao_1x1',        label: 'Marcação no 1×1',                       icon: '⚔' },
  { key: 'vol_interceptacao',       label: 'Interceptação e Antecipação',           icon: '✋' },
  { key: 'vol_recuperacao_pressao', label: 'Recuperação sob Pressão',               icon: '🔄' },
  { key: 'vol_passe_variado',       label: 'Variação de Passe (curto/médio/longo)', icon: '🏹' },
  { key: 'vol_recepcao_alta',       label: 'Recepção sob Alta Pressão',             icon: '🦶' },
  { key: 'vol_conducao_rapida',     label: 'Condução Rápida em Espaços',            icon: '⚽' },
  { key: 'vol_transicao_rapida',    label: 'Velocidade de Transição Def/Ataq',      icon: '⚡' },
  { key: 'vol_posicionamento',      label: 'Posicionamento e Cobertura',            icon: '📍' },
  { key: 'vol_lideranca',           label: 'Liderança e Organização',               icon: '👑' },
  { key: 'vol_finalizacao_media',   label: 'Finalização de Média Distância',        icon: '🎯' },
]

const BLOCO_C_VOL_INICIACAO: QuestionDef[] = [
  { key: 'vol_disposicao_garra',  label: 'Disposição / Garra',         icon: '🔥' },
  { key: 'vol_resistencia',       label: 'Resistência para Correr',    icon: '🔋' },
  { key: 'vol_coordenacao',       label: 'Coordenação Motora',         icon: '🤸' },
  { key: 'vol_atitude',           label: 'Atitude e Comprometimento',  icon: '❤️' },
]

const BLOCO_C_VOL_FORMACAO: QuestionDef[] = [
  { key: 'vol_resistencia',       label: 'Resistência Física',         icon: '🔋' },
  { key: 'vol_velocidade_reacao', label: 'Velocidade de Reação',       icon: '🏃' },
  { key: 'vol_forca_disputa',     label: 'Força na Disputa',           icon: '💪' },
  { key: 'vol_comunicacao',       label: 'Comunicação e Organização',  icon: '🗣' },
]

const BLOCO_C_VOL_COMPETICAO: QuestionDef[] = [
  { key: 'vol_resistencia_fisica',    label: 'Resistência Física',        icon: '🔋' },
  { key: 'vol_velocidade_aceleracao', label: 'Velocidade e Aceleração',   icon: '🏃' },
  { key: 'vol_forca_corporal',        label: 'Força Corporal',            icon: '💪' },
  { key: 'vol_concentracao',          label: 'Concentração e Disciplina', icon: '🧘' },
]

// ─────────────────────────────────────────────────────────────────────────────
// MEIA / MEIA-ATACANTE
// ─────────────────────────────────────────────────────────────────────────────

const BLOCO_A_MEI_INICIACAO: QuestionDef[] = [
  { key: 'mei_passe_curto',    label: 'Passe Curto',               icon: '↗' },
  { key: 'mei_conducao',       label: 'Condução com a Bola',       icon: '⚽' },
  { key: 'mei_dominio',        label: 'Domínio / Recepção',        icon: '🦶' },
  { key: 'mei_drible',         label: 'Drible Básico',             icon: '🕹' },
  { key: 'mei_finalizacao',    label: 'Finalização Básica',        icon: '🎯' },
  { key: 'mei_visao',          label: 'Visão de Jogo',             icon: '👁' },
  { key: 'mei_posicionamento', label: 'Posicionamento no Jogo',    icon: '📍' },
  { key: 'mei_movimentacao',   label: 'Movimentação sem Bola',     icon: '💨' },
  { key: 'mei_transicao',      label: 'Transição Rápida',          icon: '⚡' },
  { key: 'mei_disposicao',     label: 'Disposição para Jogar',     icon: '🔥' },
]

const BLOCO_A_MEI_FORMACAO: QuestionDef[] = [
  { key: 'mei_passe_curto_medio',   label: 'Passe Curto e Médio',                  icon: '↗' },
  { key: 'mei_visao_circulacao',    label: 'Visão e Circulação de Bola',           icon: '🧠' },
  { key: 'mei_recepcao_pressao',    label: 'Recepção sob Pressão',                 icon: '🦶' },
  { key: 'mei_conducao_espaco',     label: 'Condução em Espaços Reduzidos',        icon: '⚽' },
  { key: 'mei_drible_1x1',          label: 'Drible no 1×1',                       icon: '🕹' },
  { key: 'mei_finalizacao',         label: 'Finalização',                          icon: '🎯' },
  { key: 'mei_passe_profundidade',  label: 'Passe em Profundidade / Assistência',  icon: '🏹' },
  { key: 'mei_posicionamento',      label: 'Posicionamento Ofensivo',              icon: '📍' },
  { key: 'mei_transicao',           label: 'Velocidade de Transição',              icon: '⚡' },
  { key: 'mei_criatividade',        label: 'Leitura e Criatividade',               icon: '📖' },
]

const BLOCO_A_MEI_COMPETICAO: QuestionDef[] = [
  { key: 'mei_passe_variado',        label: 'Variação de Passe',                      icon: '🏹' },
  { key: 'mei_visao_decisao',        label: 'Visão de Jogo e Tomada de Decisão',      icon: '🧠' },
  { key: 'mei_recepcao_alta',        label: 'Recepção sob Alta Pressão',              icon: '🦶' },
  { key: 'mei_conducao_drible',      label: 'Condução e Drible no 1×1',              icon: '⚽' },
  { key: 'mei_finalizacao_pressao',  label: 'Finalização sob Pressão',               icon: '🎯' },
  { key: 'mei_assistencia',          label: 'Assistência / Passe para Gol',           icon: '🏃' },
  { key: 'mei_movimentacao',         label: 'Movimentação sem Bola',                  icon: '💨' },
  { key: 'mei_posicionamento',       label: 'Posicionamento Ofensivo / Apoio',        icon: '📍' },
  { key: 'mei_transicao',            label: 'Velocidade de Transição',                icon: '⚡' },
  { key: 'mei_imprevisibilidade',    label: 'Criatividade e Imprevisibilidade',       icon: '✨' },
]

const BLOCO_C_MEI_INICIACAO: QuestionDef[] = [
  { key: 'mei_coordenacao',       label: 'Coordenação Motora',   icon: '🤸' },
  { key: 'mei_velocidade_reacao', label: 'Velocidade de Reação', icon: '🏃' },
  { key: 'mei_agilidade',         label: 'Agilidade com a Bola', icon: '🦶' },
  { key: 'mei_disposicao',        label: 'Disposição e Vontade', icon: '❤️' },
]

const BLOCO_C_MEI_FORMACAO: QuestionDef[] = [
  { key: 'mei_velocidade',         label: 'Velocidade',                    icon: '🏃' },
  { key: 'mei_agilidade',          label: 'Agilidade',                     icon: '🤸' },
  { key: 'mei_resistencia',        label: 'Resistência Física',            icon: '🔋' },
  { key: 'mei_criatividade_ment',  label: 'Criatividade (aspecto mental)', icon: '✨' },
]

const BLOCO_C_MEI_COMPETICAO: QuestionDef[] = [
  { key: 'mei_velocidade_aceleracao', label: 'Velocidade e Aceleração', icon: '🏃' },
  { key: 'mei_agilidade',             label: 'Agilidade',               icon: '🤸' },
  { key: 'mei_resistencia',           label: 'Resistência Física',      icon: '🔋' },
  { key: 'mei_concentracao',          label: 'Concentração',            icon: '🧘' },
]

// ─────────────────────────────────────────────────────────────────────────────
// PONTA (Direita / Esquerda)
// ─────────────────────────────────────────────────────────────────────────────

const BLOCO_A_PON_INICIACAO: QuestionDef[] = [
  { key: 'pon_velocidade',      label: 'Velocidade em Linha Reta',     icon: '⚡' },
  { key: 'pon_conducao',        label: 'Condução em Velocidade',       icon: '⚽' },
  { key: 'pon_drible',          label: 'Drible / 1×1',                icon: '🕹' },
  { key: 'pon_cruzamento',      label: 'Cruzamento Básico',            icon: '🎯' },
  { key: 'pon_dominio',         label: 'Domínio com a Bola',           icon: '🦶' },
  { key: 'pon_passe_curto',     label: 'Passe Curto',                  icon: '↗' },
  { key: 'pon_movimentacao',    label: 'Movimentação sem Bola',        icon: '💨' },
  { key: 'pon_coragem_1x1',     label: 'Disposição e Coragem no 1×1', icon: '🔥' },
  { key: 'pon_leitura_espaco',  label: 'Leitura de Espaços',          icon: '👁' },
  { key: 'pon_finalizacao',     label: 'Finalização Básica',           icon: '⭐' },
]

const BLOCO_A_PON_FORMACAO: QuestionDef[] = [
  { key: 'pon_velocidade_sprint',  label: 'Velocidade em Sprint',          icon: '🏃' },
  { key: 'pon_conducao_explosiva', label: 'Condução Explosiva',            icon: '⚽' },
  { key: 'pon_drible_1x1',         label: 'Drible no 1×1',                icon: '⚡' },
  { key: 'pon_cruzamento',         label: 'Cruzamento e Assistência',      icon: '🎯' },
  { key: 'pon_passe_profundidade', label: 'Passe em Profundidade',         icon: '🏹' },
  { key: 'pon_dominio_protecao',   label: 'Domínio e Proteção de Bola',   icon: '🦶' },
  { key: 'pon_movimentacao',       label: 'Movimentação e Desmarcação',   icon: '💨' },
  { key: 'pon_posicionamento',     label: 'Posicionamento na Ponta',      icon: '📍' },
  { key: 'pon_leitura_jogo',       label: 'Leitura de Jogo',              icon: '🧠' },
  { key: 'pon_finalizacao',        label: 'Finalização',                   icon: '⭐' },
]

const BLOCO_A_PON_COMPETICAO: QuestionDef[] = [
  { key: 'pon_velocidade_aceleracao', label: 'Velocidade e Aceleração',             icon: '🏃' },
  { key: 'pon_conducao_explosiva',    label: 'Condução Explosiva no 1×1',           icon: '⚽' },
  { key: 'pon_drible_velocidade',     label: 'Drible em Alta Velocidade',           icon: '⚡' },
  { key: 'pon_cruzamento_qualidade',  label: 'Qualidade do Cruzamento',             icon: '🎯' },
  { key: 'pon_passe_profundidade',    label: 'Passe em Profundidade / Assistência', icon: '🏹' },
  { key: 'pon_protecao_bola',         label: 'Proteção de Bola sob Pressão',        icon: '🦶' },
  { key: 'pon_movimentacao_ruptura',  label: 'Movimentação sem Bola e Ruptura',     icon: '💨' },
  { key: 'pon_aproveitamento_espaco', label: 'Aproveitamento de Espaços',           icon: '📍' },
  { key: 'pon_tomada_decisao',        label: 'Tomada de Decisão',                   icon: '🧠' },
  { key: 'pon_finalizacao_pressao',   label: 'Finalização sob Pressão',             icon: '⭐' },
]

const BLOCO_C_PON_INICIACAO: QuestionDef[] = [
  { key: 'pon_velocidade',  label: 'Velocidade',                    icon: '🏃' },
  { key: 'pon_agilidade',   label: 'Agilidade / Mudança de Direção', icon: '🤸' },
  { key: 'pon_coordenacao', label: 'Coordenação Motora',            icon: '🌀' },
  { key: 'pon_disposicao',  label: 'Disposição e Garra',            icon: '❤️' },
]

const BLOCO_C_PON_FORMACAO: QuestionDef[] = [
  { key: 'pon_velocidade_sprint', label: 'Velocidade de Sprint',             icon: '🏃' },
  { key: 'pon_agilidade',         label: 'Agilidade e Mudança de Direção',  icon: '🤸' },
  { key: 'pon_explosao',          label: 'Explosão / Arrancada',            icon: '💥' },
  { key: 'pon_criatividade',      label: 'Criatividade e Imprevisibilidade', icon: '✨' },
]

const BLOCO_C_PON_COMPETICAO: QuestionDef[] = [
  { key: 'pon_velocidade_aceleracao', label: 'Velocidade e Aceleração',           icon: '🏃' },
  { key: 'pon_agilidade_explosiva',   label: 'Agilidade Explosiva',              icon: '🤸' },
  { key: 'pon_resistencia_sprints',   label: 'Resistência para Repetir Sprints', icon: '🔋' },
  { key: 'pon_concentracao',          label: 'Concentração e Consistência',      icon: '🧘' },
]

// ─────────────────────────────────────────────────────────────────────────────
// CENTROAVANTE / ATACANTE
// ─────────────────────────────────────────────────────────────────────────────

const BLOCO_A_CAV_INICIACAO: QuestionDef[] = [
  { key: 'cav_finalizacao',       label: 'Finalização Básica',         icon: '🎯' },
  { key: 'cav_dominio_protecao',  label: 'Domínio / Proteção de Bola', icon: '⚽' },
  { key: 'cav_drible',            label: 'Drible no Ataque',           icon: '🕹' },
  { key: 'cav_jogo_aereo',        label: 'Jogo Aéreo Ofensivo',        icon: '👆' },
  { key: 'cav_movimentacao',      label: 'Movimentação sem Bola',      icon: '💨' },
  { key: 'cav_passe_apoio',       label: 'Passe Curto / Apoio',        icon: '↗' },
  { key: 'cav_disposicao',        label: 'Disposição para Finalizar',  icon: '🔥' },
  { key: 'cav_posicionamento',    label: 'Posicionamento na Área',     icon: '📍' },
  { key: 'cav_velocidade_reacao', label: 'Velocidade de Reação',       icon: '⚡' },
  { key: 'cav_forca_duelos',      label: 'Força nos Duelos',           icon: '💪' },
]

const BLOCO_A_CAV_FORMACAO: QuestionDef[] = [
  { key: 'cav_finalizacao_precisao', label: 'Finalização com Precisão',      icon: '🎯' },
  { key: 'cav_protecao_apoio',       label: 'Proteção de Bola e Apoio',      icon: '⚽' },
  { key: 'cav_jogo_aereo',           label: 'Jogo Aéreo Ofensivo',           icon: '👆' },
  { key: 'cav_movimentacao',         label: 'Movimentação e Desmarcação',    icon: '💨' },
  { key: 'cav_posicionamento',       label: 'Posicionamento Ofensivo',       icon: '📍' },
  { key: 'cav_drible_criacao',       label: 'Drible e Criação no 1×1',      icon: '⚡' },
  { key: 'cav_assistencia',          label: 'Assistência / Passe para Gol', icon: '🏹' },
  { key: 'cav_leitura_jogo',         label: 'Leitura de Jogo Ofensivo',     icon: '🧠' },
  { key: 'cav_forca_duelos',         label: 'Força nos Duelos',              icon: '💪' },
  { key: 'cav_garra',                label: 'Disposição e Garra',            icon: '🔥' },
]

const BLOCO_A_CAV_COMPETICAO: QuestionDef[] = [
  { key: 'cav_finalizacao_pressao',  label: 'Finalização sob Pressão',             icon: '🎯' },
  { key: 'cav_protecao_bola',        label: 'Proteção e Manutenção de Bola',       icon: '⚽' },
  { key: 'cav_jogo_aereo_dominio',   label: 'Domínio do Jogo Aéreo Ofensivo',      icon: '👆' },
  { key: 'cav_movimentacao_ruptura', label: 'Movimentação e Ruptura',              icon: '💨' },
  { key: 'cav_posicionamento_area',  label: 'Posicionamento na Área',              icon: '📍' },
  { key: 'cav_drible_espacos',       label: 'Drible e Criação de Espaços',         icon: '⚡' },
  { key: 'cav_assistencia',          label: 'Assistência / Passe Final',           icon: '🏹' },
  { key: 'cav_leitura_defesa',       label: 'Leitura do Posicionamento Defensivo', icon: '🧠' },
  { key: 'cav_forca_protecao',       label: 'Força e Proteção sob Pressão',        icon: '💪' },
  { key: 'cav_frieza_decisao',       label: 'Frieza e Decisão na Área',            icon: '🔥' },
]

const BLOCO_C_CAV_INICIACAO: QuestionDef[] = [
  { key: 'cav_velocidade_reacao', label: 'Velocidade de Reação', icon: '⚡' },
  { key: 'cav_forca_fisica',      label: 'Força Física',         icon: '💪' },
  { key: 'cav_jogo_aereo_basico', label: 'Jogo Aéreo Básico',   icon: '👆' },
  { key: 'cav_disposicao_garra',  label: 'Disposição e Garra',  icon: '❤️' },
]

const BLOCO_C_CAV_FORMACAO: QuestionDef[] = [
  { key: 'cav_velocidade',   label: 'Velocidade',              icon: '🏃' },
  { key: 'cav_forca_duelos', label: 'Força nos Duelos',        icon: '💪' },
  { key: 'cav_jogo_aereo',   label: 'Potência no Jogo Aéreo', icon: '👆' },
  { key: 'cav_movimentacao', label: 'Movimentação sem Bola',  icon: '💨' },
]

const BLOCO_C_CAV_COMPETICAO: QuestionDef[] = [
  { key: 'cav_forca_fisica',          label: 'Força Física',            icon: '💪' },
  { key: 'cav_velocidade_aceleracao', label: 'Velocidade e Aceleração', icon: '🏃' },
  { key: 'cav_potencia_aereo',        label: 'Potência no Jogo Aéreo', icon: '👆' },
  { key: 'cav_resistencia',           label: 'Resistência Física',      icon: '🔋' },
]

// ── Bloco C genérico (legacy — usado apenas pela variante 'iniciacao') ────────

const BLOCO_C_INICIACAO_LEGADO: QuestionDef[] = [
  { key: 'cx_1', label: 'Velocidade / Agilidade', icon: '🏃' },
  { key: 'cx_2', label: 'Coordenação Motora',      icon: '🤸' },
  { key: 'cx_3', label: 'Equilíbrio e Postura',    icon: '🧘' },
  { key: 'cx_4', label: 'Disposição / Atitude',    icon: '🌟' },
]

// ── VARIANTES — estrutura completa ────────────────────────────────────────────

export const VARIANTES: Record<VarianteKey, VarianteDef> = {

  // ── Iniciação (legacy fallback) ────────────────────────────────────────────

  iniciacao: {
    label:  'Iniciação (Sub-7 a Sub-10)',
    blocoA: BLOCO_A_CAMPO,
    blocoC: BLOCO_C_INICIACAO_LEGADO,
  },

  // ── Iniciação por posição ──────────────────────────────────────────────────

  iniciacao_goleiro: {
    label:  'Iniciação — Goleiro (Sub-7 a Sub-10)',
    blocoA: BLOCO_A_GK_INICIACAO,
    blocoC: BLOCO_C_GK_INICIACAO,
  },
  iniciacao_zagueiro: {
    label:  'Iniciação — Zagueiro (Sub-7 a Sub-10)',
    blocoA: BLOCO_A_ZAG_INICIACAO,
    blocoC: BLOCO_C_ZAG_INICIACAO,
  },
  iniciacao_lateral: {
    label:  'Iniciação — Lateral (Sub-7 a Sub-10)',
    blocoA: BLOCO_A_LAT_INICIACAO,
    blocoC: BLOCO_C_LAT_INICIACAO,
  },
  iniciacao_volante: {
    label:  'Iniciação — Volante (Sub-7 a Sub-10)',
    blocoA: BLOCO_A_VOL_INICIACAO,
    blocoC: BLOCO_C_VOL_INICIACAO,
  },
  iniciacao_meia: {
    label:  'Iniciação — Meia (Sub-7 a Sub-10)',
    blocoA: BLOCO_A_MEI_INICIACAO,
    blocoC: BLOCO_C_MEI_INICIACAO,
  },
  iniciacao_ponta: {
    label:  'Iniciação — Ponta (Sub-7 a Sub-10)',
    blocoA: BLOCO_A_PON_INICIACAO,
    blocoC: BLOCO_C_PON_INICIACAO,
  },
  iniciacao_centroavante: {
    label:  'Iniciação — Centroavante (Sub-7 a Sub-10)',
    blocoA: BLOCO_A_CAV_INICIACAO,
    blocoC: BLOCO_C_CAV_INICIACAO,
  },

  // ── Formação ───────────────────────────────────────────────────────────────

  formacao_goleiro: {
    label:  'Formação — Goleiro (Sub-11 a Sub-14)',
    blocoA: BLOCO_A_GK_FORMACAO,
    blocoC: BLOCO_C_GK_FORMACAO,
  },
  formacao_zagueiro: {
    label:  'Formação — Zagueiro (Sub-11 a Sub-14)',
    blocoA: BLOCO_A_ZAG_FORMACAO,
    blocoC: BLOCO_C_ZAG_FORMACAO,
  },
  formacao_lateral: {
    label:  'Formação — Lateral (Sub-11 a Sub-14)',
    blocoA: BLOCO_A_LAT_FORMACAO,
    blocoC: BLOCO_C_LAT_FORMACAO,
  },
  formacao_volante: {
    label:  'Formação — Volante (Sub-11 a Sub-14)',
    blocoA: BLOCO_A_VOL_FORMACAO,
    blocoC: BLOCO_C_VOL_FORMACAO,
  },
  formacao_meia: {
    label:  'Formação — Meia (Sub-11 a Sub-14)',
    blocoA: BLOCO_A_MEI_FORMACAO,
    blocoC: BLOCO_C_MEI_FORMACAO,
  },
  formacao_ponta: {
    label:  'Formação — Ponta (Sub-11 a Sub-14)',
    blocoA: BLOCO_A_PON_FORMACAO,
    blocoC: BLOCO_C_PON_FORMACAO,
  },
  formacao_centroavante: {
    label:  'Formação — Centroavante (Sub-11 a Sub-14)',
    blocoA: BLOCO_A_CAV_FORMACAO,
    blocoC: BLOCO_C_CAV_FORMACAO,
  },

  // ── Competição ─────────────────────────────────────────────────────────────

  competicao_goleiro: {
    label:  'Competição — Goleiro (Sub-15 a Sub-17)',
    blocoA: BLOCO_A_GK_COMPETICAO,
    blocoC: BLOCO_C_GK_COMPETICAO,
  },
  competicao_zagueiro: {
    label:  'Competição — Zagueiro (Sub-15 a Sub-17)',
    blocoA: BLOCO_A_ZAG_COMPETICAO,
    blocoC: BLOCO_C_ZAG_COMPETICAO,
  },
  competicao_lateral: {
    label:  'Competição — Lateral (Sub-15 a Sub-17)',
    blocoA: BLOCO_A_LAT_COMPETICAO,
    blocoC: BLOCO_C_LAT_COMPETICAO,
  },
  competicao_volante: {
    label:  'Competição — Volante (Sub-15 a Sub-17)',
    blocoA: BLOCO_A_VOL_COMPETICAO,
    blocoC: BLOCO_C_VOL_COMPETICAO,
  },
  competicao_meia: {
    label:  'Competição — Meia (Sub-15 a Sub-17)',
    blocoA: BLOCO_A_MEI_COMPETICAO,
    blocoC: BLOCO_C_MEI_COMPETICAO,
  },
  competicao_ponta: {
    label:  'Competição — Ponta (Sub-15 a Sub-17)',
    blocoA: BLOCO_A_PON_COMPETICAO,
    blocoC: BLOCO_C_PON_COMPETICAO,
  },
  competicao_centroavante: {
    label:  'Competição — Centroavante (Sub-15 a Sub-17)',
    blocoA: BLOCO_A_CAV_COMPETICAO,
    blocoC: BLOCO_C_CAV_COMPETICAO,
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getIdade(dataNasc: string): number {
  const hoje = new Date()
  const nasc = new Date(dataNasc)
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

export function getFase(dataNasc: string): 'iniciacao' | 'formacao' | 'competicao' {
  const idade = getIdade(dataNasc)
  if (idade <= 10) return 'iniciacao'
  if (idade <= 14) return 'formacao'
  return 'competicao'
}

export function getGrupoPosicao(
  posicao: string,
): 'goleiro' | 'zagueiro' | 'lateral' | 'volante' | 'meia' | 'ponta' | 'centroavante' {
  if (posicao === 'Goleiro') return 'goleiro'
  if (posicao === 'Zagueiro') return 'zagueiro'
  if (['Lateral Direito', 'Lateral Esquerdo'].includes(posicao)) return 'lateral'
  if (posicao === 'Volante') return 'volante'
  if (['Meia', 'Meia-Atacante'].includes(posicao)) return 'meia'
  if (['Ponta Direita', 'Ponta Esquerda'].includes(posicao)) return 'ponta'
  return 'centroavante' // Atacante, Centro-Avante
}

export function getVariante(dataNasc: string, posicao: string): VarianteKey {
  const fase  = getFase(dataNasc)
  const grupo = getGrupoPosicao(posicao)
  if (fase === 'iniciacao') {
    if (grupo === 'goleiro')      return 'iniciacao_goleiro'
    if (grupo === 'zagueiro')     return 'iniciacao_zagueiro'
    if (grupo === 'lateral')      return 'iniciacao_lateral'
    if (grupo === 'volante')      return 'iniciacao_volante'
    if (grupo === 'meia')         return 'iniciacao_meia'
    if (grupo === 'ponta')        return 'iniciacao_ponta'
    return 'iniciacao_centroavante'
  }
  return `${fase}_${grupo}` as VarianteKey
}

export function getTodasPerguntas(variante: VarianteKey): QuestionDef[] {
  const v = VARIANTES[variante]
  return [...v.blocoA, ...BLOCO_PERFIL, ...v.blocoC]
}

/**
 * Calcula o scout_score a partir das 20 respostas (escala 1-5).
 * Fórmula: Math.round(((avg - 1) / 4) × 100)  →  resultado 0–100.
 * Tudo 1 = 0  |  Tudo 3 = 50  |  Tudo 5 = 100
 */
export function calcScoutScore(respostas: Record<string, number>, variante: VarianteKey): number {
  const perguntas = getTodasPerguntas(variante)
  const values = perguntas.map(q => respostas[q.key] ?? 0).filter(v => v > 0)
  if (values.length === 0) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return Math.round(((avg - 1) / 4) * 100)
}

/** Pontos fortes: até top-N perguntas com nota ≥ 4 */
export function getPontosFortes(
  respostas: Record<string, number>,
  variante: VarianteKey,
  top = 3,
): QuestionDef[] {
  const perguntas = getTodasPerguntas(variante)
  return [...perguntas]
    .filter(q => (respostas[q.key] ?? 0) >= 4)
    .sort((a, b) => (respostas[b.key] ?? 0) - (respostas[a.key] ?? 0))
    .slice(0, top)
}

/** A melhorar: até top-N perguntas com nota ≤ 2 */
export function getAMelhorar(
  respostas: Record<string, number>,
  variante: VarianteKey,
  top = 3,
): QuestionDef[] {
  const perguntas = getTodasPerguntas(variante)
  return [...perguntas]
    .filter(q => (respostas[q.key] ?? 0) > 0 && (respostas[q.key] ?? 0) <= 2)
    .sort((a, b) => (respostas[a.key] ?? 0) - (respostas[b.key] ?? 0))
    .slice(0, top)
}

// ── Atributos FIFA-style (VEL / TEC / DRI / FIS / TAT / POS) ────────────────
//
// Para cada grupo de posição, mapeamos quais question-keys alimentam cada
// atributo. Keys ausentes nas respostas (ex.: de outra fase) são ignoradas,
// então o mesmo mapa funciona para iniciacao / formacao / competicao.
//
// GOLEIRO  → DRI representa "jogo com os pés" (distribuição, passe curto)
// ZAGUEIRO → DRI representa "saída de bola" (condução/passe pelo chão)
// (todos os outros → DRI = drible/condução convencional)

export type Atributos = {
  VEL: number   // Velocidade
  TEC: number   // Técnica
  DRI: number   // Drible / Jogo com a bola
  FIS: number   // Físico
  TAT: number   // Tática
  POS: number   // Postura / Perfil
}

type AtributoMap = Record<keyof Atributos, string[]>

const ATRIBUTOS_KEYS: Record<ReturnType<typeof getGrupoPosicao>, AtributoMap> = {

  goleiro: {
    VEL: ['gk_velocidade_reacao', 'gk_agilidade_lateral', 'gk_explosao_potencia'],
    TEC: ['gk_controle_maos', 'gk_seguranca_maos', 'gk_seguranca_confianca',
          'gk_defesa_chao', 'gk_defesa_chao_pressao', 'gk_defesa_alta',
          'gk_dominio_cruzamentos', 'gk_defesa_1x1', 'gk_defesa_1x1_penaltis'],
    DRI: ['gk_distribuicao_pes', 'gk_passe_curto_pes', 'gk_jogo_pes_curto_medio',
          'gk_passe_longo_meta', 'gk_distribuicao_maos'],
    FIS: ['gk_salto', 'gk_forca_maos_bracos', 'gk_forca_fisica_geral',
          'gk_resistencia_concentracao'],
    TAT: ['gk_posicionamento', 'gk_posicionamento_tatico', 'gk_saida_gol',
          'gk_saida_avancada', 'gk_leitura_antecipada', 'gk_leitura_jogo',
          'gk_tomada_decisao_pressao'],
    POS: ['gk_comunicacao', 'gk_comunicacao_defesa', 'gk_lideranca_organizacao',
          'gk_atencao_foco', 'pf_lider', 'pf_competitivo', 'pf_decisivo', 'pf_inteligente'],
  },

  zagueiro: {
    VEL: ['zag_potencia_aereo', 'zag_forca_duel', 'zag_duelo_corpo', 'zag_duelo_aereo'],
    TEC: ['zag_desarme', 'zag_desarme_bloqueio', 'zag_marcacao', 'zag_marcacao_1x1',
          'zag_marcacao_1x1_pressao', 'zag_jogo_aereo', 'zag_dominio_cruzamentos',
          'zag_dominio_bola', 'zag_passe_curto'],
    DRI: ['zag_saida_bola', 'zag_saida_qualidade', 'zag_passe_medio', 'zag_passe_longo',
          'zag_dominio_bola'],
    FIS: ['zag_forca_fisica', 'zag_potencia_aereo', 'zag_resistencia', 'zag_forca_duel'],
    TAT: ['zag_posicionamento', 'zag_posicionamento_estrutural', 'zag_posicionamento_tatico',
          'zag_antecipacao', 'zag_interceptacao', 'zag_antecipacao_tatica',
          'zag_recuperacao', 'zag_tomada_decisao'],
    POS: ['zag_lideranca', 'zag_lideranca_organizacao', 'zag_coragem', 'zag_comunicacao',
          'pf_lider', 'pf_competitivo', 'pf_decisivo'],
  },

  lateral: {
    VEL: ['lat_velocidade', 'lat_velocidade_sprint', 'lat_velocidade_aceleracao',
          'lat_agilidade', 'lat_agilidade_defensiva', 'lat_agilidade_explosiva'],
    TEC: ['lat_marcacao', 'lat_marcacao_1x1', 'lat_marcacao_1x1_pressao', 'lat_desarme',
          'lat_cruzamento', 'lat_cruzamento_qualidade', 'lat_passe_curto',
          'lat_passe_curto_medio', 'lat_passe_variado'],
    DRI: ['lat_conducao_velocidade', 'lat_sobreposicao', 'lat_dominio'],
    FIS: ['lat_resistencia', 'lat_resistencia_fisica', 'lat_agilidade', 'lat_coragem'],
    TAT: ['lat_posicionamento', 'lat_posicionamento_tatico', 'lat_antecipacao',
          'lat_cobertura_corredor', 'lat_cobertura_zaga', 'lat_leitura_jogo',
          'lat_resistencia_tatica'],
    POS: ['lat_disposicao', 'lat_comunicacao', 'lat_concentracao',
          'pf_lider', 'pf_competitivo', 'pf_decisivo'],
  },

  volante: {
    VEL: ['vol_velocidade_reacao', 'vol_velocidade_aceleracao', 'vol_transicao',
          'vol_transicao_rapida'],
    TEC: ['vol_passe_curto', 'vol_passe_curto_medio', 'vol_passe_variado', 'vol_dominio',
          'vol_recepcao_pressao', 'vol_recepcao_alta', 'vol_marcacao', 'vol_marcacao_pressing',
          'vol_marcacao_1x1', 'vol_interceptacao', 'vol_recuperacao', 'vol_recuperacao_pressao'],
    DRI: ['vol_drible', 'vol_conducao', 'vol_conducao_espaco', 'vol_conducao_rapida'],
    FIS: ['vol_forca_disputa', 'vol_forca_corporal', 'vol_resistencia', 'vol_resistencia_fisica',
          'vol_duelo'],
    TAT: ['vol_posicionamento', 'vol_transicao', 'vol_leitura_jogo', 'vol_lideranca',
          'vol_visao'],
    POS: ['vol_disposicao_garra', 'vol_atitude', 'vol_comunicacao', 'vol_concentracao',
          'pf_lider', 'pf_competitivo', 'pf_decisivo'],
  },

  meia: {
    VEL: ['mei_velocidade', 'mei_velocidade_reacao', 'mei_velocidade_aceleracao',
          'mei_transicao', 'mei_agilidade'],
    TEC: ['mei_passe_curto', 'mei_passe_curto_medio', 'mei_passe_variado',
          'mei_recepcao_pressao', 'mei_recepcao_alta', 'mei_finalizacao',
          'mei_finalizacao_pressao', 'mei_assistencia', 'mei_passe_profundidade'],
    DRI: ['mei_drible', 'mei_drible_1x1', 'mei_conducao', 'mei_conducao_espaco',
          'mei_conducao_drible'],
    FIS: ['mei_agilidade', 'mei_resistencia', 'mei_coordenacao'],
    TAT: ['mei_visao', 'mei_visao_circulacao', 'mei_visao_decisao', 'mei_posicionamento',
          'mei_movimentacao', 'mei_criatividade', 'mei_imprevisibilidade'],
    POS: ['mei_disposicao', 'mei_concentracao', 'mei_criatividade_ment',
          'pf_lider', 'pf_competitivo', 'pf_decisivo', 'pf_inteligente'],
  },

  ponta: {
    VEL: ['pon_velocidade', 'pon_velocidade_sprint', 'pon_velocidade_aceleracao',
          'pon_agilidade', 'pon_agilidade_explosiva', 'pon_explosao'],
    TEC: ['pon_cruzamento', 'pon_cruzamento_qualidade', 'pon_passe_curto',
          'pon_passe_profundidade', 'pon_dominio', 'pon_dominio_protecao',
          'pon_protecao_bola', 'pon_finalizacao', 'pon_finalizacao_pressao'],
    DRI: ['pon_drible', 'pon_drible_1x1', 'pon_drible_velocidade',
          'pon_conducao', 'pon_conducao_explosiva'],
    FIS: ['pon_velocidade', 'pon_agilidade', 'pon_explosao', 'pon_resistencia_sprints',
          'pon_coordenacao'],
    TAT: ['pon_movimentacao', 'pon_movimentacao_ruptura', 'pon_posicionamento',
          'pon_leitura_espaco', 'pon_leitura_jogo', 'pon_aproveitamento_espaco',
          'pon_tomada_decisao'],
    POS: ['pon_disposicao', 'pon_coragem_1x1', 'pon_concentracao', 'pon_criatividade',
          'pf_competitivo', 'pf_decisivo', 'pf_lider'],
  },

  centroavante: {
    VEL: ['cav_velocidade_reacao', 'cav_velocidade', 'cav_velocidade_aceleracao'],
    TEC: ['cav_finalizacao', 'cav_finalizacao_precisao', 'cav_finalizacao_pressao',
          'cav_jogo_aereo', 'cav_jogo_aereo_dominio', 'cav_jogo_aereo_basico',
          'cav_dominio_protecao', 'cav_protecao_apoio', 'cav_protecao_bola',
          'cav_assistencia', 'cav_passe_apoio'],
    DRI: ['cav_drible', 'cav_drible_criacao', 'cav_drible_espacos',
          'cav_movimentacao', 'cav_movimentacao_ruptura'],
    FIS: ['cav_forca_duelos', 'cav_forca_fisica', 'cav_forca_protecao',
          'cav_potencia_aereo', 'cav_resistencia'],
    TAT: ['cav_posicionamento', 'cav_posicionamento_area', 'cav_leitura_jogo',
          'cav_leitura_defesa', 'cav_frieza_decisao', 'cav_movimentacao'],
    POS: ['cav_garra', 'cav_disposicao', 'cav_disposicao_garra',
          'pf_competitivo', 'pf_decisivo', 'pf_lider', 'pf_forte'],
  },
}

/** Média de um conjunto de keys → nota 0-99 (estilo FIFA). Keys ausentes = ignoradas. */
function avgAtributo(respostas: Record<string, number>, keys: string[]): number {
  const vals = keys.map(k => respostas[k] ?? 0).filter(v => v > 0)
  if (vals.length === 0) return 0
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.min(99, Math.round(((avg - 1) / 4) * 99))
}

/**
 * Calcula os 6 atributos FIFA-style (0-99) a partir das respostas.
 * O mapeamento de perguntas → atributo é específico por posição,
 * então um Goleiro nunca é avaliado por "finalização" e um Zagueiro
 * tem "DRI" representado pela qualidade da saída de bola.
 */
export function calcAtributos(
  respostas: Record<string, number>,
  posicao: string,
): Atributos {
  const grupo = getGrupoPosicao(posicao)
  const map   = ATRIBUTOS_KEYS[grupo]
  return {
    VEL: avgAtributo(respostas, map.VEL),
    TEC: avgAtributo(respostas, map.TEC),
    DRI: avgAtributo(respostas, map.DRI),
    FIS: avgAtributo(respostas, map.FIS),
    TAT: avgAtributo(respostas, map.TAT),
    POS: avgAtributo(respostas, map.POS),
  }
}

// ── Backward-compat exports ───────────────────────────────────────────────────

/** @deprecated Use VARIANTES[variante].blocoA */
export const BLOCO_TECNICO = BLOCO_A_CAMPO

/** @deprecated Use VARIANTES[variante].label */
export const VARIANTE_LABELS: Record<VarianteKey, string> = Object.fromEntries(
  Object.entries(VARIANTES).map(([k, v]) => [k, v.label]),
) as Record<VarianteKey, string>

/** @deprecated Use VARIANTES[variante].blocoC */
export const BLOCOS_CONTEXTUAIS: Record<VarianteKey, QuestionDef[]> = Object.fromEntries(
  Object.entries(VARIANTES).map(([k, v]) => [k, v.blocoC]),
) as Record<VarianteKey, QuestionDef[]>

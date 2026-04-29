/**
 * POST /api/relatorios/gerar
 *
 * Gera relatório mensal unificado usando Google Gemini (camada gratuita: 1.500 req/dia).
 */

import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createServerClient } from '@/lib/supabase'

// ── Gemini client ─────────────────────────────────────────────────────────────

function getGemini() {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('GEMINI_API_KEY não configurada')
  return new GoogleGenerativeAI(key)
}

// ── Error messages ─────────────────────────────────────────────────────────────

function friendlyError(err: unknown): { message: string; status: number } {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
    return { message: 'Relatório temporariamente indisponível. Tente novamente em alguns minutos.', status: 429 }
  }
  if (msg.includes('GEMINI_API_KEY')) {
    return { message: 'Serviço de IA não configurado. Configure a variável GEMINI_API_KEY.', status: 503 }
  }
  return { message: 'Não foi possível gerar o relatório agora. Tente novamente em breve.', status: 500 }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { alunoId, freqMes } = await req.json() as { alunoId: string; freqMes: number | null }

  // Fetch athlete
  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, posicao, data_nascimento, scout_id')
    .eq('id', alunoId)
    .eq('professor_id', user.id)
    .single()

  if (!aluno) return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })

  // Fetch last 6 evaluations
  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select(`
      tecnico, fisico, tatico, comportamento, scout_score, observacao, created_at,
      passe_curto, passe_longo, dominio_direito, dominio_esquerdo, tempo_bola,
      conducao, cabecio, finalizacao, velocidade, forca, impulsao, mudanca_direcao,
      coordenacao, visao_jogo, posicionamento, cap_defender, cap_atacar,
      atitude, pressao, lideranca, concentracao, colaboracao, disciplina
    `)
    .eq('aluno_id', alunoId)
    .order('created_at', { ascending: false })
    .limit(6)

  if (!avaliacoes || avaliacoes.length === 0) {
    return NextResponse.json({ error: 'Atleta sem avaliações registradas' }, { status: 400 })
  }

  const ultima   = avaliacoes[0]
  const anterior = avaliacoes[1] ?? null

  const scoutScore = ultima.scout_score ? (ultima.scout_score / 10).toFixed(1) : '—'
  const scoreAnterior = anterior?.scout_score ? (anterior.scout_score / 10).toFixed(1) : null
  const evolucaoStr = scoreAnterior
    ? `Scout Score anterior: ${scoreAnterior}/10 → atual: ${scoutScore}/10`
    : 'Primeira avaliação registrada'

  const freqStr = freqMes !== null ? `${freqMes}%` : 'Não registrada'

  const prompt = `Você é um especialista em desenvolvimento esportivo no futebol de base brasileiro.
Gere um relatório mensal completo, profissional e humanizado em português.
Use **negrito** para títulos de seção. Seja específico e personalizado — evite frases genéricas.

=== DADOS DO ATLETA ===
Nome: ${aluno.nome}
Posição: ${aluno.posicao ?? 'Não informada'}
Scout ID: ${aluno.scout_id ?? 'N/D'}
Scout Score atual: ${scoutScore}/10
Frequência no mês: ${freqStr}
${evolucaoStr}
Total de avaliações registradas: ${avaliacoes.length}

=== ÚLTIMA AVALIAÇÃO (escala 0-10) ===
Técnico: ${ultima.tecnico}/10 | Físico: ${ultima.fisico}/10 | Tático: ${ultima.tatico}/10 | Comportamento: ${ultima.comportamento}/10

Detalhes técnicos:
• Passe curto: ${ultima.passe_curto ?? '—'} | Passe longo: ${ultima.passe_longo ?? '—'}
• Domínio direito: ${ultima.dominio_direito ?? '—'} | Domínio esquerdo: ${ultima.dominio_esquerdo ?? '—'}
• Condução: ${ultima.conducao ?? '—'} | Finalização: ${ultima.finalizacao ?? '—'} | Cabeceio: ${ultima.cabecio ?? '—'}
• Velocidade: ${ultima.velocidade ?? '—'} | Força: ${ultima.forca ?? '—'} | Impulsão: ${ultima.impulsao ?? '—'}
• Visão de jogo: ${ultima.visao_jogo ?? '—'} | Posicionamento: ${ultima.posicionamento ?? '—'}
• Cap. defensiva: ${ultima.cap_defender ?? '—'} | Cap. ofensiva: ${ultima.cap_atacar ?? '—'}
• Atitude: ${ultima.atitude ?? '—'} | Liderança: ${ultima.lideranca ?? '—'} | Disciplina: ${ultima.disciplina ?? '—'}
${ultima.observacao ? `\nObservação do treinador: "${ultima.observacao}"` : ''}

=== ESTRUTURA OBRIGATÓRIA DO RELATÓRIO ===
**Visão Geral** — 2-3 frases resumindo o momento do atleta com base nos dados.
**Pontos Fortes** — Liste 3 pontos específicos com base nas maiores notas.
**Áreas de Desenvolvimento** — 2 pontos com sugestões práticas e objetivas.
**Evolução** — Tendência (melhora / estabilidade / atenção) com base no histórico de scores.
**Mensagem ao Atleta** — Tom direto e motivador, personalizado pelo nome. 3-4 frases.

Máximo 320 palavras. Tom profissional e acolhedor.`

  try {
    const genAI = getGemini()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const texto = result.response.text()

    return NextResponse.json({
      texto,
      alunoNome:    aluno.nome,
      scoutScore,
      scoreAnterior,
      tecnico:      ultima.tecnico,
      fisico:       ultima.fisico,
      tatico:       ultima.tatico,
      comportamento: ultima.comportamento,
      freqMes,
    })
  } catch (err) {
    console.error('[Gemini] error:', err)
    const { message, status } = friendlyError(err)
    return NextResponse.json({ error: message }, { status })
  }
}

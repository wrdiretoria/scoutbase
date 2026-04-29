/**
 * POST /api/relatorios/gerar
 *
 * Gera relatórios de atletas usando Google Gemini (camada gratuita: 1.500 req/dia).
 * Chave em: aistudio.google.com → Get API Key → adicionar como GEMINI_API_KEY
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

  // Rate limit
  if (msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('rate')) {
    return {
      message: 'Relatório temporariamente indisponível. Tente novamente em alguns minutos.',
      status: 429,
    }
  }
  // API key not set
  if (msg.includes('GEMINI_API_KEY')) {
    return {
      message: 'Serviço de IA não configurado. Configure a variável GEMINI_API_KEY.',
      status: 503,
    }
  }
  // Generic
  return {
    message: 'Não foi possível gerar o relatório agora. Tente novamente em breve.',
    status: 500,
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { alunoId, tipo } = await req.json() as { alunoId: string; tipo: string }

  // Fetch athlete
  const { data: aluno } = await supabase
    .from('alunos')
    .select('id, nome, posicao, data_nascimento, scout_id')
    .eq('id', alunoId)
    .eq('professor_id', user.id)
    .single()

  if (!aluno) return NextResponse.json({ error: 'Atleta não encontrado' }, { status: 404 })

  // Fetch latest evaluations (up to 6)
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

  const ultima = avaliacoes[0]
  const scoutScore = ultima.scout_score ? (ultima.scout_score / 10).toFixed(1) : '—'

  // Calcular frequência a partir do histórico de avaliações (aproximação)
  // Frequência real viria de presencas, mas usamos os dados disponíveis
  const evolucaoHistorico = avaliacoes.length > 1
    ? `Histórico de Scout Score: ${avaliacoes
        .map((a, i) => `${i === 0 ? 'atual' : `${i}ª anterior`}: ${a.scout_score ? (a.scout_score / 10).toFixed(1) : '—'}`)
        .join(', ')}`
    : 'Primeira avaliação registrada'

  // Build prompt based on report type
  let prompt = ''

  if (tipo === 'responsavel') {
    prompt = `Você é um assistente especialista em desenvolvimento esportivo.
Gere um boletim profissional e humanizado em português para os responsáveis do atleta abaixo.
Inclua: pontos fortes, áreas de melhoria e uma mensagem motivacional personalizada.
Tom: profissional mas acolhedor. Use **negrito** para destacar títulos de seção.

Atleta: ${aluno.nome}
Posição: ${aluno.posicao ?? 'Não informada'}
Scout Score: ${scoutScore}/10

Técnico: ${ultima.tecnico}/10
Físico: ${ultima.fisico}/10
Tático: ${ultima.tatico}/10
Comportamento: ${ultima.comportamento}/10

Detalhes técnicos (escala 1-10):
- Passe curto: ${ultima.passe_curto ?? '—'} | Passe longo: ${ultima.passe_longo ?? '—'}
- Domínio direito: ${ultima.dominio_direito ?? '—'} | Domínio esquerdo: ${ultima.dominio_esquerdo ?? '—'}
- Condução: ${ultima.conducao ?? '—'} | Finalização: ${ultima.finalizacao ?? '—'}
- Velocidade: ${ultima.velocidade ?? '—'} | Força: ${ultima.forca ?? '—'}
- Visão de jogo: ${ultima.visao_jogo ?? '—'} | Posicionamento: ${ultima.posicionamento ?? '—'}
- Atitude: ${ultima.atitude ?? '—'} | Disciplina: ${ultima.disciplina ?? '—'}
${ultima.observacao ? `\nObservação do treinador: "${ultima.observacao}"` : ''}

Estruture com: abertura calorosa, Pontos Fortes (3 itens), Áreas em Desenvolvimento (2 itens), mensagem de encerramento motivacional. Máximo 280 palavras.`

  } else if (tipo === 'olheiro') {
    prompt = `Você é um especialista em scouting e análise de talentos no futebol brasileiro.
Gere um relatório técnico de scouting profissional e objetivo em português.
Use **negrito** para títulos de seção. Seja preciso e técnico.

Atleta: ${aluno.nome}
Scout ID: ${aluno.scout_id ?? 'N/D'}
Posição: ${aluno.posicao ?? 'Não informada'}
Scout Score: ${scoutScore}/10
Avaliações registradas: ${avaliacoes.length}
${evolucaoHistorico}

Scores por categoria (escala 1-10):
- Técnico: ${ultima.tecnico}/10
- Físico: ${ultima.fisico}/10
- Tático: ${ultima.tatico}/10
- Comportamento: ${ultima.comportamento}/10

Detalhes:
- Passe curto: ${ultima.passe_curto ?? '—'} | Passe longo: ${ultima.passe_longo ?? '—'}
- Domínio direito: ${ultima.dominio_direito ?? '—'} | Esquerdo: ${ultima.dominio_esquerdo ?? '—'}
- Tempo de bola: ${ultima.tempo_bola ?? '—'} | Condução: ${ultima.conducao ?? '—'}
- Cabeceio: ${ultima.cabecio ?? '—'} | Finalização: ${ultima.finalizacao ?? '—'}
- Velocidade: ${ultima.velocidade ?? '—'} | Força: ${ultima.forca ?? '—'}
- Impulsão: ${ultima.impulsao ?? '—'} | Mudança de direção: ${ultima.mudanca_direcao ?? '—'}
- Visão de jogo: ${ultima.visao_jogo ?? '—'} | Posicionamento: ${ultima.posicionamento ?? '—'}
- Capacidade defensiva: ${ultima.cap_defender ?? '—'} | Ofensiva: ${ultima.cap_atacar ?? '—'}
- Atitude: ${ultima.atitude ?? '—'} | Liderança: ${ultima.lideranca ?? '—'}
- Concentração: ${ultima.concentracao ?? '—'} | Disciplina: ${ultima.disciplina ?? '—'}
${ultima.observacao ? `\nNota do avaliador: "${ultima.observacao}"` : ''}

Estruture: Perfil Técnico, Pontos de Destaque, Áreas de Desenvolvimento, Avaliação Geral, Recomendação (Alto/Médio/Baixo interesse). Máximo 350 palavras.`

  } else if (tipo === 'evolucao') {
    prompt = `Você é especialista em análise de desempenho esportivo no futebol.
Gere uma análise de evolução clara e motivadora em português.
Use **negrito** para títulos de seção.

Atleta: ${aluno.nome}
Posição: ${aluno.posicao ?? 'Não informada'}
Scout Score atual: ${scoutScore}/10
${evolucaoHistorico}

Última avaliação:
- Técnico: ${ultima.tecnico}/10
- Físico: ${ultima.fisico}/10
- Tático: ${ultima.tatico}/10
- Comportamento: ${ultima.comportamento}/10

Estruture: Resumo da Evolução (tendência), Categoria em Destaque, Foco de Desenvolvimento, Próximos Passos (2-3 recomendações práticas). Máximo 250 palavras.`

  } else {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  // Call Gemini
  try {
    const genAI = getGemini()
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const texto = result.response.text()

    return NextResponse.json({
      texto,
      alunoNome: aluno.nome,
      scoutScore,
    })
  } catch (err) {
    console.error('[Gemini] error:', err)
    const { message, status } = friendlyError(err)
    return NextResponse.json({ error: message }, { status })
  }
}

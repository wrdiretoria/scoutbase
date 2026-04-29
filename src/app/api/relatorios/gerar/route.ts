import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
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

  // Fetch evaluations (most recent 6)
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

  // Build criteria detail for latest eval
  const criterios = [
    { cat: 'Técnico', itens: [
      { nome: 'Passe curto', val: ultima.passe_curto },
      { nome: 'Passe longo', val: ultima.passe_longo },
      { nome: 'Domínio direito', val: ultima.dominio_direito },
      { nome: 'Domínio esquerdo', val: ultima.dominio_esquerdo },
      { nome: 'Tempo de bola', val: ultima.tempo_bola },
      { nome: 'Condução', val: ultima.conducao },
      { nome: 'Cabeceio', val: ultima.cabecio },
      { nome: 'Finalização', val: ultima.finalizacao },
    ]},
    { cat: 'Físico', itens: [
      { nome: 'Velocidade', val: ultima.velocidade },
      { nome: 'Força', val: ultima.forca },
      { nome: 'Impulsão', val: ultima.impulsao },
      { nome: 'Mudança de direção', val: ultima.mudanca_direcao },
      { nome: 'Coordenação', val: ultima.coordenacao },
    ]},
    { cat: 'Tático', itens: [
      { nome: 'Visão de jogo', val: ultima.visao_jogo },
      { nome: 'Posicionamento', val: ultima.posicionamento },
      { nome: 'Capacidade de defender', val: ultima.cap_defender },
      { nome: 'Capacidade de atacar', val: ultima.cap_atacar },
    ]},
    { cat: 'Comportamento', itens: [
      { nome: 'Atitude', val: ultima.atitude },
      { nome: 'Relação com pressão', val: ultima.pressao },
      { nome: 'Liderança', val: ultima.lideranca },
      { nome: 'Concentração', val: ultima.concentracao },
      { nome: 'Colaboração', val: ultima.colaboracao },
      { nome: 'Disciplina', val: ultima.disciplina },
    ]},
  ]

  const criteriosTexto = criterios.map((c) =>
    `${c.cat} (média ${ultima[c.cat.toLowerCase() as keyof typeof ultima] ?? '?'}/10):\n` +
    c.itens.map((i) => `  - ${i.nome}: ${i.val ?? '?'}/10`).join('\n')
  ).join('\n\n')

  const evolucao = avaliacoes.length > 1
    ? `\nHistórico de Scout Score (mais recente primeiro): ${avaliacoes.map((a, i) =>
        `${i + 1}ª av: ${a.scout_score ? (a.scout_score / 10).toFixed(1) : '—'}`
      ).join(', ')}`
    : ''

  let systemPrompt = ''
  let userPrompt = ''

  if (tipo === 'responsavel') {
    systemPrompt = `Você é um assistente especialista em avaliação de atletas jovens de futebol.
Escreve relatórios profissionais, positivos e motivadores em português do Brasil.
Seu tom é amigável, próximo e encorajador — você fala diretamente para os pais/responsáveis.
Use linguagem simples, sem jargões técnicos excessivos.`

    userPrompt = `Gere um BOLETIM DO ATLETA para os responsáveis de ${aluno.nome}${aluno.posicao ? ` (${aluno.posicao})` : ''}.
Scout Score atual: ${scoutScore}/10
${evolucao}

Notas detalhadas da última avaliação:
${criteriosTexto}
${ultima.observacao ? `\nObservação do treinador: "${ultima.observacao}"` : ''}

Estruture o boletim com:
1. **Mensagem de abertura** — apresentação calorosa (2-3 frases)
2. **Pontos Fortes** — os 3 critérios com notas mais altas, descritos de forma positiva e motivadora
3. **Áreas em Desenvolvimento** — 2-3 áreas para melhorar, fraseadas de forma construtiva e encorajadora (nunca negativa)
4. **Mensagem de Encerramento** — palavras de incentivo e engajamento para os pais acompanharem o progresso

Seja específico com os dados mas escreva em linguagem humana e acessível. Máximo 300 palavras.`

  } else if (tipo === 'olheiro') {
    systemPrompt = `Você é um assistente especialista em scouting e análise de talentos no futebol brasileiro.
Escreve relatórios técnicos precisos, profissionais e objetivos em português do Brasil.
Seu público são olheiros e dirigentes esportivos. Use terminologia técnica adequada.`

    userPrompt = `Gere um RELATÓRIO TÉCNICO DE SCOUTING para ${aluno.nome}${aluno.posicao ? ` (${aluno.posicao})` : ''}.
Scout ID: ${aluno.scout_id ?? 'N/D'}
Scout Score: ${scoutScore}/10
Número de avaliações: ${avaliacoes.length}
${evolucao}

Notas detalhadas da última avaliação:
${criteriosTexto}
${ultima.observacao ? `\nObservação do avaliador: "${ultima.observacao}"` : ''}

Estruture o relatório com:
1. **Perfil Técnico** — análise objetiva das capacidades técnicas e físicas (2-3 parágrafos)
2. **Pontos de Destaque** — habilidades acima da média com dados específicos
3. **Áreas de Desenvolvimento** — aspectos que precisam de trabalho, com contexto técnico
4. **Avaliação Geral** — parecer profissional sobre o potencial do atleta
5. **Recomendação** — indicação do nível de interesse (alto/médio/baixo) com justificativa

Seja preciso, técnico e baseado nos dados. Máximo 350 palavras.`

  } else if (tipo === 'evolucao') {
    systemPrompt = `Você é um especialista em análise de desempenho esportivo no futebol.
Escreve análises de evolução claras, motivadoras e baseadas em dados.
Seu tom é profissional mas acessível.`

    userPrompt = `Gere uma ANÁLISE DE EVOLUÇÃO para ${aluno.nome}${aluno.posicao ? ` (${aluno.posicao})` : ''}.
Scout Score atual: ${scoutScore}/10
Avaliações registradas: ${avaliacoes.length}
${evolucao}

Categorias na última avaliação:
- Técnico: ${ultima.tecnico}/10
- Físico: ${ultima.fisico}/10
- Tático: ${ultima.tatico}/10
- Comportamento: ${ultima.comportamento}/10

Estruture com:
1. **Resumo da Evolução** — tendência geral de desempenho (melhora, estagnação, declínio)
2. **Categoria em Destaque** — a que mais evolui ou se destaca, com análise
3. **Foco de Desenvolvimento** — a categoria que mais precisa de atenção
4. **Próximos Passos** — 2-3 recomendações práticas de treinamento

Baseie a análise nos dados fornecidos. Seja encorajador mas honesto. Máximo 250 palavras.`
  } else {
    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  }

  try {
    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const texto = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ texto, alunoNome: aluno.nome, scoutScore })
  } catch (err) {
    console.error('Anthropic error:', err)
    return NextResponse.json({ error: 'Erro ao gerar relatório com IA' }, { status: 500 })
  }
}

# ScoutBase — Contexto do Projeto

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript
- Supabase (auth + banco de dados)
- Tailwind CSS v4

## Tabelas no Supabase
- `profiles` — dados do professor
- `alunos` — alunos cadastrados (professor_id, nome, posicao, turma_id, responsavel, telefone, ativo, token_acesso)
- `turmas` — turmas do professor (professor_id, nome, categoria)
- `presencas` — registros de presença (aluno_id, data, presente: boolean)
- `avaliacoes` — avaliações dos alunos (aluno_id, nota: 0–10, categoria, data)

## Arquivos principais
```
src/
  app/
    login/page.tsx         — login com email/senha
    cadastro/page.tsx      — criação de conta
    dashboard/page.tsx     — métricas gerais (server component)
    alunos/
      page.tsx             — lista de alunos + busca + modal "+ Novo"
      [id]/page.tsx        — perfil do aluno com Scout Score + link para pais
      [id]/CopyLinkButton.tsx — botão cliente para copiar link público
    avaliacoes/
      [id]/page.tsx        — página servidor: carrega aluno + avaliações do Supabase
      [id]/AvaliacaoClient.tsx — componente cliente: form + radar + histórico
    presencas/page.tsx     — controle de presença por turma
    turmas/page.tsx        — listar/criar/deletar turmas (nome + categoria)
    p/[token]/page.tsx     — página pública para pais (sem login): nome, Scout Score, frequência, radar
  hooks/
    useAuth.ts             — hook cliente para sessão do usuário
  lib/
    supabase.ts            — createClient() browser + createServerClient() server
  proxy.ts                 — middleware de proteção de rotas
```

## O que já está feito
- [x] Autenticação (login, cadastro, logout via middleware)
- [x] Dashboard com dados reais: total de alunos ativos, frequência média, alertas de risco
- [x] Hook `useAuth()` para componentes cliente
- [x] Página `/alunos` — lista alunos do professor, busca por nome, botão "+ Novo" com modal de cadastro
- [x] Página `/alunos/[id]` — perfil completo: Scout Score (média das avaliações), frequência, contato do responsável, histórico de avaliações, botão "Nova avaliação"
- [x] Página `/presencas` — lista alunos da turma selecionada, marca presença/falta com um clique (salva imediatamente no Supabase), mostra % de frequência por aluno, destaca alunos em risco (< 70%)
- [x] Página `/avaliacoes/[id]` — formulário de avaliação com 4 pilares (Técnico, Físico, Tático, Comportamento), Scout Score automático, gráfico radar mês atual vs anterior, histórico de avaliações
- [x] Página `/turmas` — listar turmas, criar nova (nome + categoria: Sub-11/13/15/17/Adulto), deletar com confirmação
- [x] Página pública `/p/[token]` — sem login: nome do atleta, Scout Score, frequência, última avaliação com gráfico radar
- [x] Perfil do aluno `/alunos/[id]` — exibe link privado `/p/[token]` com botão copiar para enviar aos pais

## Scout Score (novo modelo)
Calculado como a **média aritmética dos 4 pilares** (cada um de 0 a 10).
Exibido na escala 0–10 na página de avaliações.
Cor: verde ≥ 7.5, amarelo ≥ 5, vermelho < 5.

## Avaliações — Lógica
- Formulário com 4 sliders (0–10): Técnico, Físico, Tático, Comportamento
- Scout Score = (T + F + Ta + C) / 4, atualizado em tempo real
- Ao salvar: insere 4 rows na tabela `avaliacoes` com o mesmo `data` (timestamp idêntico), permitindo agrupamento posterior
- Gráfico radar SVG (sem dependências externas): polígono verde = mês atual, polígono cinza tracejado = mês anterior
- Histórico lista todas as avaliações completas (grupos de 4 pilares) em ordem cronológica decrescente
- Acesso via botão "Nova avaliação" no perfil do aluno (`/alunos/[id]`)

## Scout Score (página de perfil — legado)
Calculado como a **média aritmética de todos os valores `nota`** na tabela `avaliacoes` para o aluno.
Cor: verde ≥ 75, amarelo ≥ 50, vermelho < 50.
*(Os novos registros têm nota 0–10; os antigos 0–100 — a escala é mista enquanto há dados legados)*

## Lógica de Presenças (`/presencas`)
- Seletor de turma no topo (carrega todas as turmas do professor)
- Lista os alunos ativos da turma selecionada
- Ao clicar "Presente" ou "Falta": verifica se já existe registro na tabela `presencas` para (aluno_id, data=hoje)
  - Se existe: faz `update` pelo `id` do registro
  - Se não existe: faz `insert` e guarda o `id` retornado
- Frequência calculada buscando todos os registros históricos do aluno e computando `presentes / total`
- Alunos em risco (< 70%) aparecem com badge "Risco" na linha e numa seção destacada em vermelho abaixo da lista

## Exportar PDF do atleta
- Botão "Exportar PDF" no perfil do aluno (`/alunos/[id]`)
- Geração client-side via `@react-pdf/renderer` (importação dinâmica no clique)
- Componente `RelatorioPDF` em `src/app/alunos/[id]/RelatorioPDF.tsx`
- Componente `ExportarPDFButton` em `src/app/alunos/[id]/ExportarPDFButton.tsx`
- PDF contém: nome da escolinha (cabeçalho verde), dados do atleta, Scout Score, frequência total, frequência do mês, histórico de avaliações agrupado por data
- Frequência mensal calculada com `.gte('data', primeiroDiaMes)` no Supabase
- Nome da escolinha vem de `user.user_metadata?.nome`

## Próximo passo
A definir.

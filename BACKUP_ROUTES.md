# BACKUP_ROUTES.md — Meu Craque (belaja)
> Gerado em 2026-05-24 · Snapshot da estrutura de rotas, páginas e componentes.  
> **Não modifica nenhum código** — uso exclusivo como referência / backup de navegação.

---

## Sumário

- [Estrutura de diretórios](#estrutura-de-diretórios)
- [Páginas — Rotas públicas](#páginas--rotas-públicas)
- [Páginas — Área do Atleta](#páginas--área-do-atleta)
- [Páginas — Área do Treinador](#páginas--área-do-treinador)
- [Páginas — Área do Scout](#páginas--área-do-scout)
- [Páginas — Área dos Pais](#páginas--área-dos-pais)
- [Páginas — Painel Escola (ScoutBase)](#páginas--painel-escola-scoutbase)
- [Páginas — Admin](#páginas--admin)
- [API Routes](#api-routes)
- [Componentes da Landing Page](#componentes-da-landing-page)
- [Componentes Compartilhados](#componentes-compartilhados)
- [Layouts](#layouts)
- [Biblioteca (src/lib)](#biblioteca-srclib)

---

## Estrutura de diretórios

```
belaja/
├── src/
│   ├── app/                    ← App Router Next.js
│   │   ├── components/         ← Componentes da landing page
│   │   ├── api/                ← API Routes (Route Handlers)
│   │   ├── admin/
│   │   ├── agenda/
│   │   ├── alunos/
│   │   ├── atleta/
│   │   ├── avaliacoes/
│   │   ├── cadastro/
│   │   ├── configuracoes/
│   │   ├── dashboard/
│   │   ├── entrar/
│   │   ├── financeiro/
│   │   ├── jogador/
│   │   ├── login/
│   │   ├── offline/
│   │   ├── p/
│   │   ├── pais/
│   │   ├── planos/
│   │   ├── presencas/
│   │   ├── ranking/
│   │   ├── relatorio/
│   │   ├── relatorios/
│   │   ├── scout/
│   │   ├── termos/
│   │   ├── treinador/
│   │   └── turmas/
│   ├── components/             ← Componentes globais (bottom navs, modais, etc.)
│   └── lib/                    ← Utilitários e clientes de serviço
├── next.config.ts
├── vercel.json
└── package.json
```

---

## Páginas — Rotas públicas

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/` | `src/app/page.tsx` | Landing page principal (Server Component) |
| `/cadastro` | `src/app/cadastro/page.tsx` | Tela de escolha de tipo de conta |
| `/login` | `src/app/login/page.tsx` | Login unificado (atleta / treinador / escola) |
| `/ranking` | `src/app/ranking/page.tsx` | Ranking público de atletas por OVR |
| `/jogador/[id]` | `src/app/jogador/[id]/page.tsx` | Perfil público do atleta (UUID como slug) |
| `/treinador/[id]` | `src/app/treinador/[id]/page.tsx` | Perfil público do treinador |
| `/p/[token]` | `src/app/p/[token]/page.tsx` | Link de convite com token (deep link) |
| `/entrar/[treinadorId]` | `src/app/entrar/[treinadorId]/page.tsx` | Entry point de aluno via ID do treinador |
| `/termos` | `src/app/termos/page.tsx` | Termos de uso e política de privacidade |
| `/planos` | `src/app/planos/page.tsx` | Página de planos e preços |
| `/offline` | `src/app/offline/page.tsx` | Fallback PWA sem conexão |

---

## Páginas — Área do Atleta

Prefixo: `/atleta/`

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/atleta/cadastro` | `atleta/cadastro/page.tsx` | Cadastro de novo atleta (multi-step) |
| `/atleta/bem-vindo` | `atleta/bem-vindo/page.tsx` | Onboarding pós-cadastro + geração do card MC |
| `/atleta/perfil` | `atleta/perfil/page.tsx` | Perfil completo do atleta logado (OVR, avaliações, currículo) |
| `/atleta/questionario` | `atleta/questionario/page.tsx` | Questionário de autoavaliação (variantes por posição) |
| `/atleta/historico` | `atleta/historico/page.tsx` | Histórico de avaliações recebidas |
| `/atleta/compartilhar` | `atleta/compartilhar/page.tsx` | Gerar e compartilhar card visual (canvas) |
| `/atleta/carta` | `atleta/carta/page.tsx` | Carta de apresentação do atleta |
| `/atleta/promover` | `atleta/promover/page.tsx` | Promover perfil / visibilidade patrocinada |
| `/atleta/recuperar-id` | `atleta/recuperar-id/page.tsx` | Recuperar ID (MC-XXXXX) via e-mail |
| `/atleta/recuperar-senha` | `atleta/recuperar-senha/page.tsx` | Recuperação de senha do atleta |
| `/atleta/[sid]` | `atleta/[sid]/page.tsx` | Rota de atleta por SID (slug alternativo) |

---

## Páginas — Área do Treinador

Prefixo: `/treinador/`

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/treinador/cadastro` | `treinador/cadastro/page.tsx` | Cadastro de treinador / escola |
| `/treinador/configurar` | `treinador/configurar/page.tsx` | Onboarding em 4 etapas (foto, identidade, bio, redes) |
| `/treinador/curriculo` | `treinador/curriculo/page.tsx` | Editar currículo completo (histórico, certs, conquistas, socials) |
| `/treinador/perfil` | `treinador/perfil/page.tsx` | Perfil do treinador logado (métricas, bio, ações) |
| `/treinador/dashboard` | `treinador/dashboard/page.tsx` | Dashboard do treinador (atletas avaliados, atividades) |
| `/treinador/avaliar` | `treinador/avaliar/page.tsx` | Iniciar avaliação de atleta por ID |
| `/treinador/compartilhar` | `treinador/compartilhar/page.tsx` | Compartilhar currículo do treinador |
| `/treinador/recuperar-id` | `treinador/recuperar-id/page.tsx` | Recuperar ID (TR-XXXXX) via e-mail |
| `/treinador/recuperar-senha` | `treinador/recuperar-senha/page.tsx` | Recuperação de senha do treinador |
| `/treinador/nova-senha` | `treinador/nova-senha/page.tsx` | Definir nova senha após reset |
| `/treinador/[id]` | `treinador/[id]/page.tsx` | Perfil público do treinador (rota dinâmica) |

---

## Páginas — Área do Scout

Prefixo: `/scout/`

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/scout/cadastro` | `scout/cadastro/page.tsx` | Cadastro de scout |
| `/scout/entrar` | `scout/entrar/page.tsx` | Login de scout |
| `/scout/dashboard` | `scout/dashboard/page.tsx` | Dashboard do scout |
| `/scout/busca` | `scout/busca/page.tsx` | Busca avançada de atletas |
| `/scout/favoritos` | `scout/favoritos/page.tsx` | Atletas favoritados pelo scout |

---

## Páginas — Área dos Pais

Prefixo: `/pais/`

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/pais/entrar` | `pais/entrar/page.tsx` | Acesso dos responsáveis |
| `/pais/perfil` | `pais/perfil/page.tsx` | Perfil / acompanhamento pelo responsável |

---

## Páginas — Painel Escola (ScoutBase)

> Área de gestão de escolinhas — turmas, alunos, finanças, presenças.

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/dashboard` | `dashboard/page.tsx` | Dashboard principal da escola |
| `/alunos` | `alunos/page.tsx` | Listagem de alunos |
| `/alunos/[id]` | `alunos/[id]/page.tsx` | Perfil individual do aluno |
| `/turmas` | `turmas/page.tsx` | Gestão de turmas |
| `/agenda` | `agenda/page.tsx` | Agenda de aulas e eventos |
| `/presencas` | `presencas/page.tsx` | Controle de presença |
| `/avaliacoes/[id]` | `avaliacoes/[id]/page.tsx` | Avaliação individual |
| `/relatorios` | `relatorios/page.tsx` | Relatórios gerais |
| `/relatorio/[sid]` | `relatorio/[sid]/page.tsx` | Relatório individual por SID |
| `/financeiro` | `financeiro/page.tsx` | Módulo financeiro |
| `/configuracoes` | `configuracoes/page.tsx` | Configurações da escola |

---

## Páginas — Admin

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/admin` | `admin/page.tsx` | Painel administrativo interno |

---

## API Routes

### 🧑‍💼 Atleta — `/api/atleta/`

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/atleta/gerar-id` | POST | Gera ID único MC-XXXXX |
| `/api/atleta/salvar-perfil` | POST | Salva perfil do atleta no Supabase |
| `/api/atleta/salvar-curriculo` | POST | Salva dados do currículo (clubes, títulos, etc.) |
| `/api/atleta/ovr` | GET | Retorna OVR calculado do atleta |
| `/api/atleta/upload-foto` | POST | Upload de foto de perfil (comprimida) |
| `/api/atleta/upload-foto-cadastro` | POST | Upload de foto durante o cadastro |
| `/api/atleta/upload-galeria` | POST | Upload de fotos para a galeria |
| `/api/atleta/delete-galeria` | POST | Remover foto da galeria |
| `/api/atleta/nomes` | GET | Lista nomes de atletas para busca |
| `/api/atleta/recuperar-id` | POST | Recuperar MC-XXXXX via e-mail |
| `/api/atleta/recuperar-senha` | POST | Enviar e-mail de recuperação de senha |
| `/api/atleta/visita` | POST | Registrar visita ao perfil do atleta |
| `/api/atleta/visitas` | GET | Contar visitas ao perfil |
| `/api/atleta/promover` | POST | Solicitar promoção de perfil |
| `/api/atleta/carta-pix` | POST | Gerar cobrança Pix para carta de apresentação |
| `/api/atleta/highlights` | GET/POST | Highlights do atleta |
| `/api/atleta/highlights/[id]` | DELETE | Remover highlight específico |

### 👨‍🏫 Treinador — `/api/treinador/`

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/treinador/salvar-perfil` | POST | Salva perfil + currículo + socials (profiles + user_metadata) |
| `/api/treinador/avaliar` | POST | Registra avaliação de atleta com scout_score |
| `/api/treinador/buscar-atleta` | GET | Busca atleta por ID (MC-XXXXX) para avaliação |
| `/api/treinador/recuperar-id` | POST | Recuperar TR-XXXXX via e-mail |

### 🔐 Auth / Cadastro

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/cadastro/salvar-perfil` | POST | Cria perfil inicial após signUp |
| `/api/cadastro/verificar-cpf` | POST | Verifica disponibilidade de CPF |
| `/api/auth/buscar-por-id` | GET | Busca usuário por ID de autenticação |

### 📊 Landing / Público

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/landing/atletas` | GET | Atletas para LancesSection e HeroFeed (avaliados + novos) |
| `/api/landing/livefeed` | GET | Feed ao vivo de eventos (join + avaliações) com paginação |
| `/api/landing/fotos` | GET | Fotos de atletas para PhotoBillboard |
| `/api/landing/stats` | GET | Estatísticas gerais da plataforma |
| `/api/landing/activity` | GET | Atividade recente para ActivityTicker |
| `/api/landing/tactical` | GET | Dados para TacticalBoard |

### 🔍 Scout

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/scout/favorito` | POST | Favoritar / desfavoritar atleta |

### 👨‍👩‍👧 Pais

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/pais/verificar` | POST | Verificar acesso de responsável |
| `/api/pais/resetar` | POST | Resetar acesso dos pais |

### 💰 Financeiro / Pagamentos

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/asaas/cobranca` | POST | Criar cobrança via Asaas |
| `/api/asaas/webhook` | POST | Webhook de confirmação de pagamento Asaas |
| `/api/financeiro/registrar` | POST | Registrar transação financeira |

### 🤝 Indicação / Convite

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/indicacao/registrar` | POST | Registrar indicação de novo atleta |
| `/api/indicacao/stats` | GET | Estatísticas de indicações do atleta |
| `/api/convite/solicitar` | POST | Solicitar convite de acesso |
| `/api/convite/listar` | GET | Listar convites pendentes |

### 📝 Relatórios

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/relatorios/gerar` | POST | Gerar relatório de aluno |

### 🔧 Admin / Sistema

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/admin/delete-athlete` | POST | Deletar atleta (admin) |
| `/api/admin/delete-user` | POST | Deletar usuário (admin) |
| `/api/admin/reset-password` | POST | Resetar senha (admin) |
| `/api/admin/update-user` | POST | Atualizar dados de usuário (admin) |
| `/api/freemium/incrementar` | POST | Incrementar contador freemium |
| `/api/cron/email-semanal` | GET | Cron job de e-mail semanal |

---

## Componentes da Landing Page

> Todos em `src/app/components/`

| Componente | Tipo | Descrição |
|------------|------|-----------|
| `NavBar.tsx` | Client | Barra de navegação principal com links e CTA |
| `PhotoBillboard.tsx` | Client | Billboard de fotos de atletas (slideshow fullscreen) |
| `LancesSection.tsx` | Client | Cards verticais de atletas em destaque (scroll horizontal) |
| `HeroFeed.tsx` | Client | Feed de atletas recentes no hero |
| `LiveFeed.tsx` | Client | Feed ao vivo de avaliações e novos cadastros (Realtime) |
| `RankingSection.tsx` | Server | Top 6 atletas por OVR (scroll horizontal) |
| `TeamOfWeekSection.tsx` | Server | Top 3 atletas — pódio visual (1º, 2º, 3º) |
| `ProspectsSection.tsx` | Server | Cards de atletas avaliados com stats |
| `CardCraqueSection.tsx` | Server | Card grande de destaque com atributos |
| `FeaturesSection.tsx` | Client/Server | Seção de funcionalidades da plataforma |
| `ParaQuemSection.tsx` | Client/Server | Seção "para quem é o Meu Craque" |
| `StatsBar.tsx` | Server | Barra de estatísticas (atletas, avaliações, etc.) |
| `ActivityTicker.tsx` | Client | Ticker de atividade em tempo real |
| `TacticalBoard.tsx` | Client | Lousa tática visual / decorativa |
| `SpinningGlobe.tsx` | Client | Globo 3D animado (presença global) |
| `AtletaFoto.tsx` | Client | Wrapper de `<img>` com fallback `onError` |

---

## Componentes Compartilhados

> Em `src/components/`

| Componente | Descrição |
|------------|-----------|
| `AtletaBottomNav.tsx` | Bottom navigation do atleta (Início, Perfil, Compartilhar, etc.) |
| `TreinadorBottomNav.tsx` | Bottom navigation do treinador (Dashboard, Avaliar, Perfil, Sair) |
| `Sidebar.tsx` | Sidebar lateral do painel escola (ScoutBase) |
| `PremiumModal.tsx` | Modal de upgrade para plano premium |
| `EmptyState.tsx` | Componente de estado vazio reutilizável |
| `SwRegister.tsx` | Registro do Service Worker (PWA) |

---

## Layouts

| Arquivo | Escopo | Descrição |
|---------|--------|-----------|
| `src/app/layout.tsx` | Global | Root layout — fonte, metadata, PWA |
| `src/app/dashboard/layout.tsx` | Dashboard escola | Layout com Sidebar |
| `src/app/alunos/layout.tsx` | Alunos | Sub-layout com Sidebar |
| `src/app/avaliacoes/layout.tsx` | Avaliações | Sub-layout com Sidebar |
| `src/app/configuracoes/layout.tsx` | Configurações | Sub-layout com Sidebar |
| `src/app/financeiro/layout.tsx` | Financeiro | Sub-layout com Sidebar |
| `src/app/presencas/layout.tsx` | Presenças | Sub-layout com Sidebar |
| `src/app/relatorios/layout.tsx` | Relatórios | Sub-layout com Sidebar |
| `src/app/turmas/layout.tsx` | Turmas | Sub-layout com Sidebar |
| `src/app/pais/layout.tsx` | Pais | Layout área dos responsáveis |

---

## Biblioteca (`src/lib/`)

| Arquivo | Descrição |
|---------|-----------|
| `supabase.ts` | Clientes Supabase — `createClient()` (browser) e `createAdminClient()` (server) |
| `ovr.ts` | Fórmula OVR — `fetchOvrMap()` e `fetchOvrSingle()` — perfil (0–50) + avaliação (0–50) = total (0–100) |
| `questionnaire.ts` | Definições do questionário de avaliação — variantes por posição, blocos, pesos |
| `email.ts` | Funções de envio de e-mail (Resend ou similar) |
| `asaas.ts` | Integração com gateway de pagamento Asaas |
| `base-url.ts` | Helper para URL base da aplicação (local vs produção) |

---

## Tipos de usuário e IDs

| Tipo | ID Format | Campo em `profiles` | Armazenado em |
|------|-----------|---------------------|---------------|
| Atleta | `MC-XXXXX` | `athlete_id` | `profiles.athlete_id` |
| Treinador | `TR-XXXXX` | `athlete_id` | `profiles.athlete_id` |
| Scout | — | — | `user_metadata.tipo = 'scout'` |
| Escola | — | — | `user_metadata.tipo = 'escola'` |

---

## OVR — Fórmula resumida

```
OVR Total (0–100) = Perfil OVR (0–50) + Avaliação OVR (0–50)

Perfil OVR = pontos_perfil × 0.5
  Pontos do perfil (max 100):
    Base (nome + posição + dob): 15 pts  ← sempre
    Avatar:                      20 pts
    Questionário completo:       20 pts
    Clubes anteriores:           15 pts
    Campeonatos:                 10 pts
    Títulos:                     10 pts
    Premiações:                   5 pts
    Telefone:                     5 pts

Avaliação OVR = scout_score × 0.5
  scout_score = média dos registros em avaliacoes.scout_score (0–100)
  Sem avaliação → max 50 OVR total
```

---

## Dados salvos por área

| Campo | Tabela/Local | Quem usa |
|-------|-------------|----------|
| `bio` | `profiles.bio` | Atleta + Treinador |
| `especialidade` | `profiles.especialidade` | Treinador |
| `avatar_url` | `profiles.avatar_url` | Atleta + Treinador |
| `fotos` | `profiles.fotos` (array) | Atleta |
| `athlete_id` | `profiles.athlete_id` | Atleta (MC-) e Treinador (TR-) |
| `nome`, `posicao`, `cidade`, `telefone` | `auth.users.user_metadata` | Atleta |
| `cidade`, `anos_exp`, `clubes_trabalhados` | `auth.users.user_metadata` | Treinador |
| `certificacoes`, `conquistas` | `auth.users.user_metadata` | Treinador |
| `instagram`, `tiktok`, `youtube`, `outras` | `auth.users.user_metadata` | Treinador |
| `scout_score` | `avaliacoes.scout_score` | Avaliação por treinador |

---

*Arquivo gerado automaticamente — não editar manualmente.*  
*Última atualização: 2026-05-24*

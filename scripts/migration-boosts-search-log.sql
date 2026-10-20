-- Migração: profile_boosts + scout_search_log (Fase 3 — planos e monetização).
-- Execute no Supabase Dashboard → SQL Editor.
-- Cria apenas tabelas novas — não altera nenhuma tabela existente, incluindo
-- entitlements (o upsert nela é feito em duas etapas no código de aplicação,
-- sem precisar de constraint UNIQUE nova).

-- ─────────────────────────────────────────────────────────────────────────────
-- profile_boosts — "Impulsionar perfil" (R$9,90, 7 dias de destaque)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists profile_boosts (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

create index if not exists profile_boosts_profile_id_idx on profile_boosts (profile_id);
create index if not exists profile_boosts_expires_at_idx on profile_boosts (expires_at);

alter table profile_boosts enable row level security;

-- Leitura pública: ranking/busca precisam saber quem está em destaque.
-- Nenhuma policy de insert/update — só o webhook (service role) escreve aqui.
create policy "profile_boosts public read"
  on profile_boosts for select
  using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- scout_search_log — contador de buscas/mês do plano free de scout/treinador
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists scout_search_log (
  id         uuid primary key default gen_random_uuid(),
  scout_id   uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists scout_search_log_scout_id_created_at_idx on scout_search_log (scout_id, created_at);

alter table scout_search_log enable row level security;

create policy "scout_search_log visible to owner"
  on scout_search_log for select
  using (scout_id = auth.uid());

create policy "scout_search_log insertable by owner"
  on scout_search_log for insert
  with check (scout_id = auth.uid());

-- Verificação
select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('profile_boosts', 'scout_search_log')
order by table_name;

-- ─────────────────────────────────────────────────────────────────────────────
-- Indicação premiada — "3 amigos verificados = 1 avaliação grátis"
--
-- Livro-caixa das indicações. Cada atleta indicado aparece UMA vez (referred_id
-- único): não dá para contar a mesma pessoa duas vezes. O cadastro completo
-- cria uma indicação pendente; ela só é confirmada após uma avaliação oficial
-- por um treinador aprovado.
--
-- Os prêmios usam o saldo protegido em profiles.cards_disponiveis e a tabela
-- evaluation_credit_grants garante idempotência.
--
-- Rodar no SQL Editor do Supabase. Idempotente (pode rodar mais de uma vez).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists indicacoes (
  id            uuid primary key default gen_random_uuid(),
  referrer_id   uuid not null,                 -- quem indicou (auth.users.id == profiles.id)
  referred_id   uuid not null unique,          -- quem foi indicado — conta uma vez só
  status        text not null default 'pendente'
                check (status in ('pendente', 'confirmada', 'rejeitada')),
  motivo        text,                          -- motivo da rejeição (autoindicação, conta antiga…)
  created_at    timestamptz not null default now()
);

create index if not exists indicacoes_referrer_idx on indicacoes (referrer_id, status);

alter table indicacoes enable row level security;

-- O atleta só enxerga as próprias indicações (como indicador). Escrita: só service role.
drop policy if exists "indicacoes visiveis ao indicador" on indicacoes;
create policy "indicacoes visiveis ao indicador"
  on indicacoes for select
  using (referrer_id = auth.uid());

-- Permissões da API (Data API). Em projetos onde tabelas novas NÃO são expostas
-- automaticamente, sem estes GRANTs a API responde PGRST205 ("not in schema cache").
grant select, insert, update, delete on public.indicacoes to service_role;
grant select on public.indicacoes to authenticated;

-- Recarrega o cache de esquema da API para enxergar a tabela na hora
notify pgrst, 'reload schema';


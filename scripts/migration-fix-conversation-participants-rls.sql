-- Migração: corrige recursão infinita na RLS de conversation_participants.
-- Execute no Supabase Dashboard → SQL Editor.
--
-- Bug: as policies de SELECT e INSERT de conversation_participants (criadas em
-- migration-network-feed-messaging-opportunities.sql) fazem subquery na PRÓPRIA
-- tabela pra checar se o usuário já participa da conversa. Toda leitura via
-- RLS dispara a policy de novo pra resolver a subquery → recursão infinita
-- (erro Postgres 42P17: "infinite recursion detected in policy for relation
-- conversation_participants"). Isso quebra qualquer INSERT em messages feito
-- com o client autenticado (RLS), porque a policy de messages também depende
-- de conversation_participants.
--
-- Correção padrão do Postgres/Supabase pra esse caso: mover a checagem de
-- participação pra uma função SECURITY DEFINER, que roda ignorando RLS
-- internamente e por isso não recursiona.

create or replace function public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from conversation_participants
    where conversation_id = _conversation_id and user_id = _user_id
  );
$$;

drop policy if exists "conversation_participants visible to fellow participants" on conversation_participants;
drop policy if exists "conversation_participants insertable by existing participants" on conversation_participants;

create policy "conversation_participants visible to fellow participants"
  on conversation_participants for select
  using (
    user_id = auth.uid()
    or public.is_conversation_participant(conversation_id, auth.uid())
  );

create policy "conversation_participants insertable by existing participants"
  on conversation_participants for insert
  with check (
    user_id = auth.uid()
    or public.is_conversation_participant(conversation_id, auth.uid())
  );

-- Verificação
select polname, polcmd from pg_policy
where polrelid = 'conversation_participants'::regclass;

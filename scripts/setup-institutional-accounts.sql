create table public.institutional_profiles (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('clube', 'escolinha')),
  nome text not null check (char_length(nome) between 2 and 160),
  cnpj text not null unique check (cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$'),
  cidade text not null check (char_length(cidade) between 2 and 160),
  responsavel_nome text not null check (char_length(responsavel_nome) between 2 and 160),
  responsavel_cargo text not null check (char_length(responsavel_cargo) between 2 and 160),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.institutional_profiles enable row level security;
revoke all on public.institutional_profiles from anon, authenticated;
grant select on public.institutional_profiles to authenticated;
grant all on public.institutional_profiles to service_role;
create policy "institution owner reads own registration"
on public.institutional_profiles for select to authenticated
using (owner_id = (select auth.uid()));

create or replace function public.sync_institutional_profile()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' then
    if row(new.kind, new.nome, new.cnpj, new.cidade, new.responsavel_nome, new.responsavel_cargo)
       is not distinct from
       row(old.kind, old.nome, old.cnpj, old.cidade, old.responsavel_nome, old.responsavel_cargo) then
      return new;
    end if;
  end if;
  new.updated_at := now();
  if TG_OP = 'UPDATE' then
    new.verification_status := 'pending';
  end if;
  update public.profiles set nome = new.nome where id = new.owner_id;
  insert into public.feed_posts (author_id, author_type, type, body)
  values (new.owner_id, 'clube', 'update',
    case when TG_OP = 'INSERT' then 'Criou o perfil institucional.' else 'Atualizou o perfil institucional.' end);
  return new;
end;
$$;
revoke all on function public.sync_institutional_profile() from public;
grant execute on function public.sync_institutional_profile() to service_role;
create trigger sync_institutional_profile
before insert or update on public.institutional_profiles
for each row execute function public.sync_institutional_profile();

-- Instituições pendentes não publicam oportunidades pela Data API.
alter policy "opportunities insertable by club owner" on public.opportunities
with check (
  club_id = (select auth.uid())
  and not exists (
    select 1 from public.institutional_profiles i
    where i.owner_id = (select auth.uid()) and i.verification_status <> 'verified'
  )
);
alter policy "opportunities updatable by club owner" on public.opportunities
using (club_id = (select auth.uid()))
with check (
  club_id = (select auth.uid())
  and not exists (
    select 1 from public.institutional_profiles i
    where i.owner_id = (select auth.uid()) and i.verification_status <> 'verified'
  )
);

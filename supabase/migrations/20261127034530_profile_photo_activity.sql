create or replace function public.record_profile_photo_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  person_type text;
begin
  if new.avatar_url is not distinct from old.avatar_url or nullif(trim(new.avatar_url), '') is null then
    return new;
  end if;
  select raw_user_meta_data->>'tipo' into person_type from auth.users where id = new.id;
  if person_type in ('atleta', 'treinador', 'scout', 'clube') then
    insert into public.feed_posts(author_id, author_type, type, body, media_url)
    values(new.id, person_type, 'update', 'Atualizou a foto de perfil.', new.avatar_url);
  end if;
  return new;
end;
$$;
revoke all on function public.record_profile_photo_activity() from public, anon, authenticated;
create trigger profile_photo_activity
after update of avatar_url on public.profiles
for each row execute function public.record_profile_photo_activity();

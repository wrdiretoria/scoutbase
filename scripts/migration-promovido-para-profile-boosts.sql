-- Migração: move destaques pagos do antigo `promovido_ate` (user_metadata)
-- para a tabela `profile_boosts`.
-- Execute UMA vez no Supabase Dashboard → SQL Editor, logo depois do deploy.
--
-- Por quê: user_metadata pode ser alterado pelo próprio usuário pelo navegador,
-- então o ranking e a busca deixaram de ler `promovido_ate`. Sem esta migração,
-- quem pagou e ainda está dentro dos 30 dias perderia o destaque.
--
-- Só copia quem tem pagamento registrado pelo webhook (pagamentos_processados)
-- e cujo destaque ainda não venceu.

-- 1) Conferir antes (lista quem será migrado)
select u.id, u.email,
       (u.raw_user_meta_data->>'promovido_ate')::timestamptz as promovido_ate,
       u.raw_user_meta_data->'pagamentos_processados' as pagamentos
from auth.users u
where u.raw_user_meta_data ? 'promovido_ate'
  and (u.raw_user_meta_data->>'promovido_ate')::timestamptz > now()
order by promovido_ate desc;

-- 2) Migrar
insert into profile_boosts (profile_id, expires_at)
select u.id,
       -- nunca mais que 30 dias a partir de hoje (corta datas forjadas tipo 2099)
       least((u.raw_user_meta_data->>'promovido_ate')::timestamptz, now() + interval '30 days')
from auth.users u
where u.raw_user_meta_data ? 'promovido_ate'
  and (u.raw_user_meta_data->>'promovido_ate')::timestamptz > now()
  and jsonb_typeof(u.raw_user_meta_data->'pagamentos_processados') = 'array'
  and jsonb_array_length(u.raw_user_meta_data->'pagamentos_processados') > 0
  and not exists (
    select 1 from profile_boosts b
    where b.profile_id = u.id and b.expires_at > now()
  );

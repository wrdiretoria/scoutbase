SELECT
  (SELECT tableowner FROM pg_tables WHERE tablename = 'escolinhas') AS escolinhas_owner,
  (SELECT tableowner FROM pg_tables WHERE tablename = 'escolinha_treinadores') AS treinadores_owner,
  (SELECT proowner::regrole::text FROM pg_proc WHERE proname = 'is_escolinha_owner') AS fn_is_owner_owner,
  (SELECT proowner::regrole::text FROM pg_proc WHERE proname = 'is_escolinha_treinador_aceito') AS fn_is_treinador_owner,
  (SELECT prosecdef FROM pg_proc WHERE proname = 'is_escolinha_owner') AS fn_security_definer,
  current_user AS sql_editor_current_user;

SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('escolinhas', 'escolinha_treinadores')
ORDER BY tablename, policyname;

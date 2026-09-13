-- Migração: permite o próprio atleta ler seus registros de presença
-- Execute no Supabase Dashboard → SQL Editor
--
-- A policy de SELECT em presencas_turma hoje só cobre o treinador (dono/aceito).
-- O atleta precisa ler os próprios registros para o dashboard de frequência
-- em /atleta/historico. Policy separada, não mexe nas existentes.

DROP POLICY IF EXISTS "presencas_turma_select_self" ON presencas_turma;
CREATE POLICY "presencas_turma_select_self" ON presencas_turma
  FOR SELECT
  USING (profile_id = auth.uid());

SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'presencas_turma'
ORDER BY policyname;

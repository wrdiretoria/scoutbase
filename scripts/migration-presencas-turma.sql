-- Migração: presencas_turma (chamada para turmas de escolinha)
-- Execute no Supabase Dashboard → SQL Editor
--
-- Cria: presencas_turma — separada da tabela legada `presencas` (ScoutBase/alunos),
-- não altera nada existente.

CREATE TABLE IF NOT EXISTS presencas_turma (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id   uuid NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id),
  data       date NOT NULL,
  status     text NOT NULL CHECK (status IN ('presente', 'falta')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (turma_id, profile_id, data)
);

CREATE INDEX IF NOT EXISTS idx_presencas_turma_turma_id ON presencas_turma(turma_id);
CREATE INDEX IF NOT EXISTS idx_presencas_turma_profile_id ON presencas_turma(profile_id);
CREATE INDEX IF NOT EXISTS idx_presencas_turma_data ON presencas_turma(data);

ALTER TABLE presencas_turma ENABLE ROW LEVEL SECURITY;

-- Mesmo padrão de acesso de turma_atletas: dono da turma (direto ou via escolinha)
-- ou treinador aceito da escolinha da turma. Usa as funções SECURITY DEFINER já
-- existentes (is_escolinha_treinador_aceito) para não reintroduzir recursão de RLS.
DROP POLICY IF EXISTS "presencas_turma_select" ON presencas_turma;
CREATE POLICY "presencas_turma_select" ON presencas_turma
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM turmas t
      WHERE t.id = presencas_turma.turma_id
        AND (
          t.professor_id = auth.uid()
          OR public.is_escolinha_treinador_aceito(t.escolinha_id, auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "presencas_turma_insert" ON presencas_turma;
CREATE POLICY "presencas_turma_insert" ON presencas_turma
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM turmas t
      WHERE t.id = presencas_turma.turma_id
        AND (
          t.professor_id = auth.uid()
          OR public.is_escolinha_treinador_aceito(t.escolinha_id, auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "presencas_turma_update" ON presencas_turma;
CREATE POLICY "presencas_turma_update" ON presencas_turma
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM turmas t
      WHERE t.id = presencas_turma.turma_id
        AND (
          t.professor_id = auth.uid()
          OR public.is_escolinha_treinador_aceito(t.escolinha_id, auth.uid())
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM turmas t
      WHERE t.id = presencas_turma.turma_id
        AND (
          t.professor_id = auth.uid()
          OR public.is_escolinha_treinador_aceito(t.escolinha_id, auth.uid())
        )
    )
  );

-- Verificação
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'presencas_turma'
ORDER BY ordinal_position;

SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'presencas_turma'
ORDER BY policyname;

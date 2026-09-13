-- Migração: hierarquia Escolinha → Turmas → Atletas
-- Execute no Supabase Dashboard → SQL Editor
--
-- Cria: escolinhas, escolinha_treinadores, turma_atletas
-- Altera: turmas (nova coluna escolinha_id, nullable)
-- Não altera: alunos, presencas
--
-- Nota: professor_id / profile_id referenciam profiles(id) (não auth.users),
-- para seguir o mesmo padrão já usado em turmas.professor_id, alunos.professor_id
-- e presencas.professor_id nesta base.

-- ============================================================
-- 1. escolinhas
-- ============================================================
CREATE TABLE IF NOT EXISTS escolinhas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome         text NOT NULL,
  professor_id uuid NOT NULL REFERENCES profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escolinhas_professor_id ON escolinhas(professor_id);

-- ============================================================
-- 2. escolinha_treinadores
-- ============================================================
CREATE TABLE IF NOT EXISTS escolinha_treinadores (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  escolinha_id uuid NOT NULL REFERENCES escolinhas(id) ON DELETE CASCADE,
  profile_id   uuid NOT NULL REFERENCES profiles(id),
  papel        text NOT NULL DEFAULT 'auxiliar' CHECK (papel IN ('dono', 'auxiliar')),
  status       text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aceito')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (escolinha_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_escolinha_treinadores_escolinha_id ON escolinha_treinadores(escolinha_id);
CREATE INDEX IF NOT EXISTS idx_escolinha_treinadores_profile_id ON escolinha_treinadores(profile_id);

-- ============================================================
-- 3. turma_atletas
-- ============================================================
CREATE TABLE IF NOT EXISTS turma_atletas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id   uuid NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (turma_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_turma_atletas_turma_id ON turma_atletas(turma_id);
CREATE INDEX IF NOT EXISTS idx_turma_atletas_profile_id ON turma_atletas(profile_id);

-- ============================================================
-- 4. turmas: nova coluna escolinha_id (nullable — não afeta turmas existentes)
-- ============================================================
ALTER TABLE turmas ADD COLUMN IF NOT EXISTS escolinha_id uuid REFERENCES escolinhas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_turmas_escolinha_id ON turmas(escolinha_id);

-- ============================================================
-- 5. RLS — mesmo padrão de acesso por dono (professor_id = auth.uid()),
--    estendido para treinadores convidados com status 'aceito'
-- ============================================================

ALTER TABLE escolinhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE escolinha_treinadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE turma_atletas ENABLE ROW LEVEL SECURITY;

-- escolinhas: dono tem acesso total; treinadores aceitos podem ler
CREATE POLICY "escolinhas_select" ON escolinhas
  FOR SELECT
  USING (
    professor_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM escolinha_treinadores et
      WHERE et.escolinha_id = escolinhas.id
        AND et.profile_id = auth.uid()
        AND et.status = 'aceito'
    )
  );

CREATE POLICY "escolinhas_insert" ON escolinhas
  FOR INSERT
  WITH CHECK (professor_id = auth.uid());

CREATE POLICY "escolinhas_update" ON escolinhas
  FOR UPDATE
  USING (professor_id = auth.uid())
  WITH CHECK (professor_id = auth.uid());

CREATE POLICY "escolinhas_delete" ON escolinhas
  FOR DELETE
  USING (professor_id = auth.uid());

-- escolinha_treinadores: dono da escolinha gerencia convites;
-- o próprio treinador convidado pode ver e aceitar seu convite
CREATE POLICY "escolinha_treinadores_select" ON escolinha_treinadores
  FOR SELECT
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM escolinhas e
      WHERE e.id = escolinha_treinadores.escolinha_id
        AND e.professor_id = auth.uid()
    )
  );

CREATE POLICY "escolinha_treinadores_insert" ON escolinha_treinadores
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM escolinhas e
      WHERE e.id = escolinha_treinadores.escolinha_id
        AND e.professor_id = auth.uid()
    )
  );

CREATE POLICY "escolinha_treinadores_update" ON escolinha_treinadores
  FOR UPDATE
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM escolinhas e
      WHERE e.id = escolinha_treinadores.escolinha_id
        AND e.professor_id = auth.uid()
    )
  )
  WITH CHECK (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM escolinhas e
      WHERE e.id = escolinha_treinadores.escolinha_id
        AND e.professor_id = auth.uid()
    )
  );

CREATE POLICY "escolinha_treinadores_delete" ON escolinha_treinadores
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM escolinhas e
      WHERE e.id = escolinha_treinadores.escolinha_id
        AND e.professor_id = auth.uid()
    )
  );

-- turma_atletas: acesso de quem é dono da turma (direto ou via escolinha)
-- ou treinador aceito da escolinha da turma
CREATE POLICY "turma_atletas_select" ON turma_atletas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM turmas t
      WHERE t.id = turma_atletas.turma_id
        AND (
          t.professor_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM escolinha_treinadores et
            WHERE et.escolinha_id = t.escolinha_id
              AND et.profile_id = auth.uid()
              AND et.status = 'aceito'
          )
        )
    )
  );

CREATE POLICY "turma_atletas_insert" ON turma_atletas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM turmas t
      WHERE t.id = turma_atletas.turma_id
        AND (
          t.professor_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM escolinha_treinadores et
            WHERE et.escolinha_id = t.escolinha_id
              AND et.profile_id = auth.uid()
              AND et.status = 'aceito'
          )
        )
    )
  );

CREATE POLICY "turma_atletas_delete" ON turma_atletas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM turmas t
      WHERE t.id = turma_atletas.turma_id
        AND (
          t.professor_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM escolinha_treinadores et
            WHERE et.escolinha_id = t.escolinha_id
              AND et.profile_id = auth.uid()
              AND et.status = 'aceito'
          )
        )
    )
  );

-- ============================================================
-- Verificação
-- ============================================================
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('escolinhas', 'escolinha_treinadores', 'turma_atletas')
ORDER BY table_name, ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'turmas' AND column_name = 'escolinha_id';

SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('escolinhas', 'escolinha_treinadores', 'turma_atletas')
ORDER BY tablename, policyname;

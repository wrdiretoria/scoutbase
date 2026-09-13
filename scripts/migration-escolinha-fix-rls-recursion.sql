-- Fix: RLS infinite recursion entre escolinhas <-> escolinha_treinadores
-- Execute no Supabase Dashboard → SQL Editor
--
-- Causa raiz: a policy de SELECT em escolinhas consulta escolinha_treinadores,
-- e a policy de SELECT em escolinha_treinadores consulta escolinhas de volta.
-- Como as duas tabelas têm RLS, cada checagem reavalia a policy da outra tabela,
-- formando um loop (erro 42P17: infinite recursion detected in policy).
--
-- Correção: funções SECURITY DEFINER que resolvem a checagem ignorando RLS
-- internamente, quebrando o ciclo sem mudar a regra de acesso.
--
-- IMPORTANTE: este script NÃO tem BEGIN/ROLLBACK — a tentativa anterior falhou
-- porque um bloco de teste com BEGIN/ROLLABACK no final acabou desfazendo tudo
-- que veio antes dele na mesma transação implícita do SQL Editor.

CREATE OR REPLACE FUNCTION public.is_escolinha_owner(p_escolinha_id uuid, p_uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM escolinhas e
    WHERE e.id = p_escolinha_id AND e.professor_id = p_uid
  );
$$;

CREATE OR REPLACE FUNCTION public.is_escolinha_treinador_aceito(p_escolinha_id uuid, p_uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM escolinha_treinadores et
    WHERE et.escolinha_id = p_escolinha_id AND et.profile_id = p_uid AND et.status = 'aceito'
  );
$$;

-- ============================================================
-- escolinhas: substitui a subquery direta pela função
-- ============================================================
DROP POLICY IF EXISTS "escolinhas_select" ON escolinhas;
CREATE POLICY "escolinhas_select" ON escolinhas
  FOR SELECT
  USING (
    professor_id = auth.uid()
    OR public.is_escolinha_treinador_aceito(id, auth.uid())
  );

-- ============================================================
-- escolinha_treinadores: substitui as subqueries diretas pela função
-- ============================================================
DROP POLICY IF EXISTS "escolinha_treinadores_select" ON escolinha_treinadores;
CREATE POLICY "escolinha_treinadores_select" ON escolinha_treinadores
  FOR SELECT
  USING (
    profile_id = auth.uid()
    OR public.is_escolinha_owner(escolinha_id, auth.uid())
  );

DROP POLICY IF EXISTS "escolinha_treinadores_insert" ON escolinha_treinadores;
CREATE POLICY "escolinha_treinadores_insert" ON escolinha_treinadores
  FOR INSERT
  WITH CHECK (public.is_escolinha_owner(escolinha_id, auth.uid()));

DROP POLICY IF EXISTS "escolinha_treinadores_update" ON escolinha_treinadores;
CREATE POLICY "escolinha_treinadores_update" ON escolinha_treinadores
  FOR UPDATE
  USING (
    profile_id = auth.uid()
    OR public.is_escolinha_owner(escolinha_id, auth.uid())
  )
  WITH CHECK (
    profile_id = auth.uid()
    OR public.is_escolinha_owner(escolinha_id, auth.uid())
  );

DROP POLICY IF EXISTS "escolinha_treinadores_delete" ON escolinha_treinadores;
CREATE POLICY "escolinha_treinadores_delete" ON escolinha_treinadores
  FOR DELETE
  USING (public.is_escolinha_owner(escolinha_id, auth.uid()));

-- ============================================================
-- turma_atletas: mesma troca por consistência
-- ============================================================
DROP POLICY IF EXISTS "turma_atletas_select" ON turma_atletas;
CREATE POLICY "turma_atletas_select" ON turma_atletas
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM turmas t
      WHERE t.id = turma_atletas.turma_id
        AND (
          t.professor_id = auth.uid()
          OR public.is_escolinha_treinador_aceito(t.escolinha_id, auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "turma_atletas_insert" ON turma_atletas;
CREATE POLICY "turma_atletas_insert" ON turma_atletas
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM turmas t
      WHERE t.id = turma_atletas.turma_id
        AND (
          t.professor_id = auth.uid()
          OR public.is_escolinha_treinador_aceito(t.escolinha_id, auth.uid())
        )
    )
  );

DROP POLICY IF EXISTS "turma_atletas_delete" ON turma_atletas;
CREATE POLICY "turma_atletas_delete" ON turma_atletas
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM turmas t
      WHERE t.id = turma_atletas.turma_id
        AND (
          t.professor_id = auth.uid()
          OR public.is_escolinha_treinador_aceito(t.escolinha_id, auth.uid())
        )
    )
  );

-- ============================================================
-- Verificação (sem BEGIN/ROLLBACK — só leitura, não precisa)
-- ============================================================
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('escolinhas', 'escolinha_treinadores', 'turma_atletas')
ORDER BY tablename, policyname;

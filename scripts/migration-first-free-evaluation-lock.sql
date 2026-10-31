-- A short-lived claim prevents concurrent requests from both receiving the
-- first-evaluation exemption. Stale claims can be retried after 10 minutes.
CREATE TABLE IF NOT EXISTS public.first_free_evaluation_claims (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  claimed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.first_free_evaluation_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.first_free_evaluation_claims FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.first_free_evaluation_claims TO service_role;

CREATE OR REPLACE FUNCTION public.claim_first_free_evaluation(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_claimed integer;
BEGIN
  IF p_user_id IS NULL THEN RAISE EXCEPTION 'invalid profile'; END IF;
  IF EXISTS (SELECT 1 FROM public.avaliacoes WHERE aluno_id = p_user_id) THEN
    RETURN false;
  END IF;

  INSERT INTO public.first_free_evaluation_claims (user_id, claimed_at)
  VALUES (p_user_id, now())
  ON CONFLICT (user_id) DO UPDATE
    SET claimed_at = now()
    WHERE public.first_free_evaluation_claims.claimed_at < now() - interval '10 minutes'
      AND NOT EXISTS (SELECT 1 FROM public.avaliacoes WHERE aluno_id = p_user_id);
  GET DIAGNOSTICS v_claimed = ROW_COUNT;
  RETURN v_claimed = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_first_free_evaluation(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.first_free_evaluation_claims
  WHERE user_id = p_user_id
    AND claimed_at >= now() - interval '10 minutes'
    AND NOT EXISTS (SELECT 1 FROM public.avaliacoes WHERE aluno_id = p_user_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_first_free_evaluation(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_first_free_evaluation(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_free_evaluation(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_first_free_evaluation(uuid) TO service_role;


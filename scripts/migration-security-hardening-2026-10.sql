-- Security containment for public Data API access.
-- App writes to evaluations and credits through server-side service_role code.

-- Evaluations must only be written by server-side routes. RLS remains in
-- place for the existing authenticated read policies.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.avaliacoes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.avaliacoes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.avaliacoes TO service_role;

-- These legacy RPCs accept an arbitrary profile ID and have no source-code
-- callers. Remove them from the public API; service_role retains access.
REVOKE EXECUTE ON FUNCTION public.increment_card(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_card(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_card(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_card(uuid) TO service_role;

-- These SECURITY DEFINER helpers are used by RLS policies, so they must stay
-- callable by authenticated users. Restrict them to the caller's own user ID
-- to remove the arbitrary membership/ownership lookup endpoint.
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT _user_id = auth.uid()
     AND EXISTS (
       SELECT 1
       FROM public.conversation_participants cp
       WHERE cp.conversation_id = _conversation_id
         AND cp.user_id = _user_id
     );
$$;

CREATE OR REPLACE FUNCTION public.is_escolinha_owner(p_escolinha_id uuid, p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_uid = auth.uid()
     AND EXISTS (
       SELECT 1
       FROM public.escolinhas e
       WHERE e.id = p_escolinha_id
         AND e.professor_id = p_uid
     );
$$;

CREATE OR REPLACE FUNCTION public.is_escolinha_treinador_aceito(p_escolinha_id uuid, p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_uid = auth.uid()
     AND EXISTS (
       SELECT 1
       FROM public.escolinha_treinadores et
       WHERE et.escolinha_id = p_escolinha_id
         AND et.profile_id = p_uid
         AND et.status = 'aceito'
     );
$$;

-- The balance RPCs are no longer exposed, and these checks also make any
-- future server-side call safe against invalid or unbounded increments.
CREATE OR REPLACE FUNCTION public.increment_card(p_user_id uuid, p_amount integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new integer;
BEGIN
  IF p_user_id IS NULL OR p_amount IS NULL OR p_amount < 1 OR p_amount > 100 THEN
    RAISE EXCEPTION 'invalid card increment';
  END IF;

  UPDATE public.profiles
     SET cards_disponiveis = COALESCE(cards_disponiveis, 0) + p_amount
   WHERE id = p_user_id
   RETURNING cards_disponiveis INTO v_new;

  RETURN v_new;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_card(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new integer;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid profile';
  END IF;

  UPDATE public.profiles
     SET cards_disponiveis = cards_disponiveis - 1
   WHERE id = p_user_id
     AND cards_disponiveis > 0
   RETURNING cards_disponiveis INTO v_new;

  RETURN v_new;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_card(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_card(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_card(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_card(uuid) TO service_role;

NOTIFY pgrst, 'reload schema';


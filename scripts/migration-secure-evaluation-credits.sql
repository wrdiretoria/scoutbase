-- Move evaluation-card balances to a server-owned profile column. The live
-- project had no positive balances or confirmed card payments/referral rewards
-- when this migration was prepared.
UPDATE public.profiles SET cards_disponiveis = 0 WHERE cards_disponiveis IS NULL;
ALTER TABLE public.profiles ALTER COLUMN cards_disponiveis SET DEFAULT 0;
ALTER TABLE public.profiles ALTER COLUMN cards_disponiveis SET NOT NULL;

CREATE TABLE IF NOT EXISTS public.evaluation_credit_grants (
  source_key text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL CHECK (amount BETWEEN 1 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_credit_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.evaluation_credit_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.evaluation_credit_grants TO service_role;

CREATE OR REPLACE FUNCTION public.grant_evaluation_credit(
  p_user_id uuid,
  p_source_key text,
  p_amount integer DEFAULT 1
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_inserted integer;
  v_balance integer;
BEGIN
  IF p_user_id IS NULL OR p_source_key IS NULL OR length(p_source_key) < 3
     OR length(p_source_key) > 200 OR p_amount IS NULL OR p_amount < 1 OR p_amount > 100 THEN
    RAISE EXCEPTION 'invalid evaluation credit grant';
  END IF;

  INSERT INTO public.evaluation_credit_grants (source_key, user_id, amount)
  VALUES (p_source_key, p_user_id, p_amount)
  ON CONFLICT (source_key) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    SELECT cards_disponiveis INTO v_balance
    FROM public.profiles WHERE id = p_user_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'profile not found'; END IF;
    RETURN v_balance;
  END IF;

  UPDATE public.profiles
     SET cards_disponiveis = cards_disponiveis + p_amount
   WHERE id = p_user_id
   RETURNING cards_disponiveis INTO v_balance;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile not found'; END IF;

  RETURN v_balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.grant_evaluation_credit(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_evaluation_credit(uuid, text, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.protect_evaluation_credit_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.role() IN ('anon', 'authenticated')
     AND NEW.cards_disponiveis IS DISTINCT FROM OLD.cards_disponiveis THEN
    RAISE EXCEPTION 'evaluation credit balance is server-managed.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.protect_evaluation_credit_balance() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS protect_evaluation_credit_balance ON public.profiles;
CREATE TRIGGER protect_evaluation_credit_balance
BEFORE UPDATE OF cards_disponiveis ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_evaluation_credit_balance();


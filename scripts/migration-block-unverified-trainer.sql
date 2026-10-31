-- The project owner identified this account as not authorized to act as a
-- trainer. Keep the account itself intact; deny only assessment writes.
CREATE TABLE IF NOT EXISTS public.trainer_access_blocks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trainer_access_blocks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.trainer_access_blocks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.trainer_access_blocks TO service_role;

INSERT INTO public.trainer_access_blocks (user_id, reason)
VALUES (
  '32d345a1-3955-4ae0-ab28-011798011cf5',
  'Identified by project owner as not authorized to act as a trainer.'
)
ON CONFLICT (user_id) DO UPDATE
SET reason = EXCLUDED.reason;

CREATE OR REPLACE FUNCTION public.reject_blocked_trainer_assessment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.trainer_access_blocks b
    WHERE b.user_id = NEW.professor_id
  ) THEN
    RAISE EXCEPTION 'This account is not authorized to submit evaluations.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_blocked_trainer_assessment() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS reject_blocked_trainer_assessment ON public.avaliacoes;
CREATE TRIGGER reject_blocked_trainer_assessment
BEFORE INSERT OR UPDATE OF professor_id ON public.avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.reject_blocked_trainer_assessment();


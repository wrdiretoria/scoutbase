-- Trainer privileges are deny-by-default. Only the real owner account is
-- approved; all other known trainer accounts are test accounts.
CREATE TABLE IF NOT EXISTS public.verified_trainers (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  approved boolean NOT NULL DEFAULT false,
  reason text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verified_trainers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.verified_trainers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.verified_trainers TO service_role;

INSERT INTO public.verified_trainers (user_id, approved, reason)
VALUES
  ('7999ef7f-9ca3-43d7-b321-39ee35bf223c', false, 'Fictitious trainer account for testing.'),
  ('32d345a1-3955-4ae0-ab28-011798011cf5', false, 'Fictitious trainer account for testing.'),
  ('b5114e5a-bdba-46f6-9664-7de8977bf9b4', true,  'Real project owner account; approved by owner.'),
  ('654bb843-317f-4f8a-84b3-7063ae25489e', false, 'Fictitious trainer account for testing.'),
  ('4cb20766-01f6-4af8-b6d1-d9a53951168c', false, 'Fictitious trainer account for testing.'),
  ('3ee5b0b1-a8b8-46f7-a94b-28fd4e7a263b', false, 'Fictitious trainer account for testing.'),
  ('0080056d-9ee6-453b-a1da-6f4d2c42cc30', false, 'Fictitious trainer account for testing.')
ON CONFLICT (user_id) DO UPDATE
SET approved = EXCLUDED.approved,
    reason = EXCLUDED.reason,
    updated_at = now();

-- Deny evaluations from every account that is not on the approved list,
-- including requests made through service-role server routes.
CREATE OR REPLACE FUNCTION public.reject_unverified_trainer_assessment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.verified_trainers t
    WHERE t.user_id = NEW.professor_id
      AND t.approved = true
  ) THEN
    RAISE EXCEPTION 'This account is not an approved trainer.'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.reject_unverified_trainer_assessment() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS reject_blocked_trainer_assessment ON public.avaliacoes;
DROP TRIGGER IF EXISTS reject_unverified_trainer_assessment ON public.avaliacoes;
CREATE TRIGGER reject_unverified_trainer_assessment
BEFORE INSERT OR UPDATE OF professor_id ON public.avaliacoes
FOR EACH ROW EXECUTE FUNCTION public.reject_unverified_trainer_assessment();


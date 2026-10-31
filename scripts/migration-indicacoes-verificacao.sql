-- Indicações só viram confirmadas depois da primeira avaliação oficial
-- registrada por um treinador aprovado. Nenhuma avaliação retroativa é marcada.
ALTER TABLE public.indicacoes
  ALTER COLUMN status SET DEFAULT 'pendente';
ALTER TABLE public.indicacoes
  DROP CONSTRAINT IF EXISTS indicacoes_status_check;
ALTER TABLE public.indicacoes
  ADD CONSTRAINT indicacoes_status_check
  CHECK (status IN ('pendente', 'confirmada', 'rejeitada'));
NOTIFY pgrst, 'reload schema';

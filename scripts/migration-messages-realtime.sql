-- Migração: habilita Supabase Realtime (postgres_changes) na tabela messages.
-- Execute no Supabase Dashboard → SQL Editor.
-- Necessário para o chat interno assinar novas mensagens em tempo real —
-- por padrão nenhuma tabela nova entra na publicação supabase_realtime.
-- Idempotente: só adiciona se ainda não estiver na publicação.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- Verificação
SELECT tablename FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages';

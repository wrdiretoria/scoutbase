-- Migração: colunas extras de treinador na tabela profiles
-- Execute no Supabase Dashboard → SQL Editor

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pais_nascimento   TEXT    DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certificacao       TEXT    DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS experiencia_anos  INTEGER DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS categoria_trabalho TEXT    DEFAULT NULL;

-- Verificação: confirmar que as colunas foram criadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name IN ('pais_nascimento','certificacao','experiencia_anos','categoria_trabalho')
ORDER BY column_name;

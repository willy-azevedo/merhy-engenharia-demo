-- Diagnóstico SOMENTE LEITURA para o administrador do Supabase.
-- Execute no SQL Editor do projeto usado em review-config.js.
-- Retorna a estrutura das funções e tabelas, sem consultar comentários.
-- Não envie senhas, chaves de API, tokens de revisão ou dados de usuários.
-- Revise as definições antes de compartilhar, caso contenham segredos fixos.
BEGIN TRANSACTION READ ONLY;

SELECT n.nspname AS schema_name,
       p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS arguments,
       pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname LIKE 'merhy_review_%'
  AND p.prokind = 'f'
ORDER BY n.nspname, p.proname;

SELECT table_schema, table_name, column_name, data_type,
       is_nullable, column_default
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  AND (table_name LIKE 'merhy%review%' OR table_name LIKE 'review%')
ORDER BY table_schema, table_name, ordinal_position;

ROLLBACK;

-- Teste simples para verificar se as tabelas foram criadas
\echo '=== VERIFICANDO TABELAS CRIADAS ==='

\echo '1. Tabelas de Motivos de Reprovação:'
SELECT 
    table_name,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = table_name) 
        THEN '✅ CRIADA' 
        ELSE '❌ NÃO CRIADA' 
    END as status
FROM (VALUES 
    ('motivos_reprovacao'),
    ('historico_reprovacoes')
) AS t(table_name);

\echo '2. Tabelas de SLAs:'
SELECT 
    table_name,
    CASE 
        WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = table_name) 
        THEN '✅ CRIADA' 
        ELSE '❌ NÃO CRIADA' 
    END as status
FROM (VALUES 
    ('slas_etapas'),
    ('alertas_sla'),
    ('notificacoes_sla')
) AS t(table_name);

\echo '3. Verificando estrutura da tabela motivos_reprovacao:'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'motivos_reprovacao' 
ORDER BY ordinal_position;

\echo '4. Verificando estrutura da tabela slas_etapas:'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'slas_etapas' 
ORDER BY ordinal_position;

\echo '5. Verificando índices criados:'
SELECT indexname, tablename
FROM pg_indexes 
WHERE indexname LIKE 'idx_%' 
AND (tablename IN ('motivos_reprovacao', 'historico_reprovacoes', 'slas_etapas', 'alertas_sla', 'notificacoes_sla'))
ORDER BY tablename, indexname;

\echo '6. Verificando constraints:'
SELECT 
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('motivos_reprovacao', 'historico_reprovacoes', 'slas_etapas', 'alertas_sla', 'notificacoes_sla')
ORDER BY tc.table_name, tc.constraint_name;

\echo '=== TESTE CONCLUÍDO ===' 
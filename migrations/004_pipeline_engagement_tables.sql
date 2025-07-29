-- Migração 004: Tabelas para Análise de Engajamento no Pipeline
-- Data: 2024-01-XX
-- Descrição: Adiciona tabelas para rastrear engajamento, tempo e métricas do pipeline

-- 1. Tabela de logs de movimentação do pipeline
CREATE TABLE IF NOT EXISTS logs_movimentacao_pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaga_candidato_id UUID NOT NULL REFERENCES vaga_candidatos(id) ON DELETE CASCADE,
    etapa_anterior VARCHAR(50),
    etapa_nova VARCHAR(50) NOT NULL,
    tempo_na_etapa INTEGER, -- tempo em dias na etapa anterior
    responsavel_id UUID REFERENCES usuarios(id),
    motivo_movimentacao VARCHAR(100), -- aprovado, reprovado, desistiu, etc
    comentarios TEXT,
    data_movimentacao TIMESTAMP DEFAULT NOW() NOT NULL,
    dados_adicionais JSONB -- dados extras da movimentação
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_logs_movimentacao_vaga_candidato ON logs_movimentacao_pipeline(vaga_candidato_id);
CREATE INDEX IF NOT EXISTS idx_logs_movimentacao_data ON logs_movimentacao_pipeline(data_movimentacao);
CREATE INDEX IF NOT EXISTS idx_logs_movimentacao_etapa ON logs_movimentacao_pipeline(etapa_nova);

-- 2. Tabela de métricas de engajamento
CREATE TABLE IF NOT EXISTS metricas_engajamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaga_id UUID REFERENCES vagas(id),
    empresa_id UUID NOT NULL REFERENCES empresas(id),
    etapa VARCHAR(50) NOT NULL,
    periodo VARCHAR(20) NOT NULL, -- diario, semanal, mensal
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    tempo_medio DECIMAL(5,2), -- tempo médio em dias
    total_candidatos INTEGER NOT NULL DEFAULT 0,
    candidatos_aprovados INTEGER NOT NULL DEFAULT 0,
    candidatos_reprovados INTEGER NOT NULL DEFAULT 0,
    candidatos_desistiram INTEGER NOT NULL DEFAULT 0,
    sla_estourado INTEGER NOT NULL DEFAULT 0,
    data_calculo TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_metricas_engajamento_empresa ON metricas_engajamento(empresa_id);
CREATE INDEX IF NOT EXISTS idx_metricas_engajamento_vaga ON metricas_engajamento(vaga_id);
CREATE INDEX IF NOT EXISTS idx_metricas_engajamento_periodo ON metricas_engajamento(periodo, data_inicio, data_fim);

-- 3. Tabela de candidatos parados
CREATE TABLE IF NOT EXISTS candidatos_parados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaga_candidato_id UUID NOT NULL REFERENCES vaga_candidatos(id) ON DELETE CASCADE,
    etapa VARCHAR(50) NOT NULL,
    dias_parado INTEGER NOT NULL,
    limite_sla INTEGER, -- limite em dias para esta etapa
    status_alerta VARCHAR(20) NOT NULL DEFAULT 'normal', -- normal, atencao, critico
    responsavel_id UUID REFERENCES usuarios(id),
    ultima_atividade TIMESTAMP,
    data_calculo TIMESTAMP DEFAULT NOW() NOT NULL,
    notificado BOOLEAN NOT NULL DEFAULT FALSE,
    data_notificacao TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_candidatos_parados_vaga_candidato ON candidatos_parados(vaga_candidato_id);
CREATE INDEX IF NOT EXISTS idx_candidatos_parados_status ON candidatos_parados(status_alerta);
CREATE INDEX IF NOT EXISTS idx_candidatos_parados_dias ON candidatos_parados(dias_parado);
CREATE INDEX IF NOT EXISTS idx_candidatos_parados_notificado ON candidatos_parados(notificado);

-- 4. Comentários nas tabelas
COMMENT ON TABLE logs_movimentacao_pipeline IS 'Logs detalhados de movimentação de candidatos no pipeline para análise de engajamento';
COMMENT ON TABLE metricas_engajamento IS 'Métricas agregadas de engajamento por período, vaga e etapa';
COMMENT ON TABLE candidatos_parados IS 'Candidatos que estão parados há mais de X dias em uma etapa';

-- 5. Função para calcular automaticamente candidatos parados
CREATE OR REPLACE FUNCTION calcular_candidatos_parados()
RETURNS void AS $$
BEGIN
    -- Limpar tabela atual
    DELETE FROM candidatos_parados;
    
    -- Inserir candidatos parados há mais de 3 dias
    INSERT INTO candidatos_parados (
        vaga_candidato_id,
        etapa,
        dias_parado,
        responsavel_id,
        ultima_atividade
    )
    SELECT 
        vc.id,
        vc.etapa,
        EXTRACT(DAY FROM CURRENT_DATE - vc.data_movimentacao)::INTEGER,
        vc.responsavel_id,
        vc.data_movimentacao
    FROM vaga_candidatos vc
    INNER JOIN vagas v ON vc.vaga_id = v.id
    WHERE 
        vc.etapa NOT IN ('aprovado', 'reprovado', 'contratado')
        AND EXTRACT(DAY FROM CURRENT_DATE - vc.data_movimentacao) >= 3;
        
    -- Atualizar status de alerta baseado nos dias parado
    UPDATE candidatos_parados 
    SET status_alerta = CASE 
        WHEN dias_parado <= 3 THEN 'normal'
        WHEN dias_parado <= 7 THEN 'atencao'
        WHEN dias_parado <= 14 THEN 'alto'
        ELSE 'critico'
    END;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para atualizar candidatos parados quando candidato é movimentado
CREATE OR REPLACE FUNCTION trigger_atualizar_candidatos_parados()
RETURNS TRIGGER AS $$
BEGIN
    -- Remover candidato da lista de parados se foi movimentado
    DELETE FROM candidatos_parados 
    WHERE vaga_candidato_id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_candidatos_parados_update
    AFTER UPDATE ON vaga_candidatos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_atualizar_candidatos_parados();

-- 7. View para facilitar consultas de engajamento
CREATE OR REPLACE VIEW view_engajamento_pipeline AS
SELECT 
    vc.id as vaga_candidato_id,
    c.nome as candidato_nome,
    c.email as candidato_email,
    v.titulo as vaga_titulo,
    vc.etapa,
    vc.data_movimentacao,
    vc.data_inscricao,
    EXTRACT(DAY FROM CURRENT_DATE - vc.data_movimentacao)::INTEGER as dias_na_etapa,
    u.nome as responsavel_nome,
    e.nome as empresa_nome,
    CASE 
        WHEN EXTRACT(DAY FROM CURRENT_DATE - vc.data_movimentacao) <= 3 THEN 'normal'
        WHEN EXTRACT(DAY FROM CURRENT_DATE - vc.data_movimentacao) <= 7 THEN 'atencao'
        WHEN EXTRACT(DAY FROM CURRENT_DATE - vc.data_movimentacao) <= 14 THEN 'alto'
        ELSE 'critico'
    END as status_alerta
FROM vaga_candidatos vc
INNER JOIN candidatos c ON vc.candidato_id = c.id
INNER JOIN vagas v ON vc.vaga_id = v.id
INNER JOIN empresas e ON v.empresa_id = e.id
LEFT JOIN usuarios u ON vc.responsavel_id = u.id
WHERE vc.etapa NOT IN ('aprovado', 'reprovado', 'contratado');

-- 8. Função para gerar métricas de engajamento
CREATE OR REPLACE FUNCTION gerar_metricas_engajamento(
    p_empresa_id UUID,
    p_periodo VARCHAR(20) DEFAULT 'mensal',
    p_data_inicio DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_data_fim DATE DEFAULT CURRENT_DATE
)
RETURNS void AS $$
BEGIN
    -- Inserir métricas por etapa
    INSERT INTO metricas_engajamento (
        empresa_id,
        etapa,
        periodo,
        data_inicio,
        data_fim,
        tempo_medio,
        total_candidatos,
        candidatos_aprovados,
        candidatos_reprovados,
        candidatos_desistiram
    )
    SELECT 
        p_empresa_id,
        vc.etapa,
        p_periodo,
        p_data_inicio,
        p_data_fim,
        AVG(EXTRACT(DAY FROM vc.data_movimentacao - vc.data_inscricao))::DECIMAL(5,2),
        COUNT(*),
        COUNT(CASE WHEN vc.etapa = 'aprovado' THEN 1 END),
        COUNT(CASE WHEN vc.etapa = 'reprovado' THEN 1 END),
        COUNT(CASE WHEN vc.comentarios ILIKE '%desistiu%' OR vc.comentarios ILIKE '%abandonou%' THEN 1 END)
    FROM vaga_candidatos vc
    INNER JOIN vagas v ON vc.vaga_id = v.id
    WHERE 
        v.empresa_id = p_empresa_id
        AND vc.data_movimentacao BETWEEN p_data_inicio AND p_data_fim
    GROUP BY vc.etapa;
END;
$$ LANGUAGE plpgsql;

-- 9. Executar cálculo inicial de candidatos parados
SELECT calcular_candidatos_parados();

-- 10. Comentários finais
COMMENT ON FUNCTION calcular_candidatos_parados() IS 'Calcula e atualiza a lista de candidatos parados no pipeline';
COMMENT ON FUNCTION trigger_atualizar_candidatos_parados() IS 'Trigger para remover candidatos da lista de parados quando movimentados';
COMMENT ON FUNCTION gerar_metricas_engajamento(UUID, VARCHAR, DATE, DATE) IS 'Gera métricas de engajamento para uma empresa em um período específico';
COMMENT ON VIEW view_engajamento_pipeline IS 'View para facilitar consultas de engajamento no pipeline'; 
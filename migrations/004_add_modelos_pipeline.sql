-- Criação da tabela de modelos de pipeline padrão por empresa
CREATE TABLE modelos_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  padrao BOOLEAN NOT NULL DEFAULT FALSE,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criação da tabela de etapas dos modelos de pipeline
CREATE TABLE etapas_modelo_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id UUID NOT NULL REFERENCES modelos_pipeline(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'intermediaria',
  cor VARCHAR(7) DEFAULT '#3B82F6',
  obrigatoria BOOLEAN NOT NULL DEFAULT TRUE,
  pode_reprovar BOOLEAN NOT NULL DEFAULT FALSE,
  sla INTEGER,
  acoes_automaticas JSONB,
  campos_obrigatorios JSONB,
  responsaveis JSONB,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_modelos_pipeline_empresa ON modelos_pipeline(empresa_id);
CREATE INDEX idx_modelos_pipeline_padrao ON modelos_pipeline(empresa_id, padrao) WHERE padrao = TRUE;
CREATE INDEX idx_etapas_modelo_pipeline_modelo ON etapas_modelo_pipeline(modelo_id);
CREATE INDEX idx_etapas_modelo_pipeline_ordem ON etapas_modelo_pipeline(modelo_id, ordem);

-- Constraint para garantir apenas um modelo padrão por empresa
CREATE UNIQUE INDEX idx_modelos_pipeline_padrao_unico ON modelos_pipeline(empresa_id) WHERE padrao = TRUE; 
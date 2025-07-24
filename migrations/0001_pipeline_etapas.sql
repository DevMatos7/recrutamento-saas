
PGPASSWORD=jm190124 psql -U postgres -h localhost -d genteproCREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE pipeline_etapas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    ordem INTEGER NOT NULL,
    cor VARCHAR(10) DEFAULT '#df7826',
    empresa_id UUID REFERENCES empresas(id),
    vaga_id UUID REFERENCES vagas(id),
    campos_obrigatorios JSONB DEFAULT '[]'
);

CREATE INDEX idx_pipeline_etapas_vaga ON pipeline_etapas(vaga_id);
CREATE INDEX idx_pipeline_etapas_empresa ON pipeline_etapas(empresa_id); 
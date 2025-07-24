-- Criação da tabela de checklists de etapas do pipeline
CREATE TABLE checklists_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa_id UUID NOT NULL REFERENCES etapas_modelo_pipeline(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL DEFAULT 'documento',
  obrigatorio BOOLEAN NOT NULL DEFAULT TRUE,
  ordem INTEGER NOT NULL,
  validacao_automatica BOOLEAN NOT NULL DEFAULT FALSE,
  criterios_validacao JSONB,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criação da tabela de itens de checklist por candidato
CREATE TABLE itens_checklist_candidato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES checklists_etapas(id) ON DELETE CASCADE,
  vaga_candidato_id UUID NOT NULL REFERENCES vaga_candidatos(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  anexos JSONB,
  validado_por UUID REFERENCES usuarios(id),
  data_validacao TIMESTAMP,
  data_conclusao TIMESTAMP,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_checklists_etapas_etapa ON checklists_etapas(etapa_id);
CREATE INDEX idx_checklists_etapas_ordem ON checklists_etapas(etapa_id, ordem);
CREATE INDEX idx_itens_checklist_candidato_checklist ON itens_checklist_candidato(checklist_id);
CREATE INDEX idx_itens_checklist_candidato_vaga_candidato ON itens_checklist_candidato(vaga_candidato_id);
CREATE INDEX idx_itens_checklist_candidato_status ON itens_checklist_candidato(status);

-- Constraint para garantir ordem única por etapa
CREATE UNIQUE INDEX idx_checklists_etapas_ordem_unico ON checklists_etapas(etapa_id, ordem); 
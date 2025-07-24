-- Criação da tabela de motivos de reprovação padrão
CREATE TABLE motivos_reprovacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES empresas(id),
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100) NOT NULL DEFAULT 'geral',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  obrigatorio BOOLEAN NOT NULL DEFAULT FALSE,
  ordem INTEGER NOT NULL DEFAULT 0,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criação da tabela de histórico de reprovações
CREATE TABLE historico_reprovacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_candidato_id UUID NOT NULL REFERENCES vaga_candidatos(id) ON DELETE CASCADE,
  motivo_id UUID REFERENCES motivos_reprovacao(id),
  motivo_customizado TEXT,
  observacoes TEXT,
  etapa_reprovacao VARCHAR(100) NOT NULL,
  reprovado_por UUID NOT NULL REFERENCES usuarios(id),
  data_reprovacao TIMESTAMP NOT NULL DEFAULT NOW(),
  dados_adicionais JSONB,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_motivos_reprovacao_empresa ON motivos_reprovacao(empresa_id);
CREATE INDEX idx_motivos_reprovacao_categoria ON motivos_reprovacao(categoria);
CREATE INDEX idx_motivos_reprovacao_ativo ON motivos_reprovacao(ativo) WHERE ativo = TRUE;
CREATE INDEX idx_motivos_reprovacao_ordem ON motivos_reprovacao(empresa_id, ordem);
CREATE INDEX idx_historico_reprovacoes_vaga_candidato ON historico_reprovacoes(vaga_candidato_id);
CREATE INDEX idx_historico_reprovacoes_motivo ON historico_reprovacoes(motivo_id);
CREATE INDEX idx_historico_reprovacoes_reprovado_por ON historico_reprovacoes(reprovado_por);
CREATE INDEX idx_historico_reprovacoes_data_reprovacao ON historico_reprovacoes(data_reprovacao);

-- Inserir motivos padrão de reprovação (serão criados dinamicamente por empresa via API)
-- Os motivos padrão serão criados através do endpoint /api/empresas/:empresaId/motivos-reprovacao/template 
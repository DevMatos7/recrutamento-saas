-- Criação da tabela de automatizações de etapas do pipeline
CREATE TABLE automatizacoes_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa_id UUID NOT NULL REFERENCES etapas_modelo_pipeline(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(50) NOT NULL DEFAULT 'movimento',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  condicoes JSONB,
  acoes JSONB,
  webhook_url VARCHAR(500),
  webhook_headers JSONB,
  webhook_method VARCHAR(10) DEFAULT 'POST',
  delay_execucao INTEGER,
  max_tentativas INTEGER DEFAULT 3,
  tentativas_atuais INTEGER DEFAULT 0,
  ultima_execucao TIMESTAMP,
  proxima_execucao TIMESTAMP,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criação da tabela de logs de execução de automatizações
CREATE TABLE logs_automatizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automatizacao_id UUID NOT NULL REFERENCES automatizacoes_etapas(id) ON DELETE CASCADE,
  vaga_candidato_id UUID NOT NULL REFERENCES vaga_candidatos(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  dados_entrada JSONB,
  resultado JSONB,
  erro TEXT,
  tentativa INTEGER NOT NULL DEFAULT 1,
  data_execucao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_automatizacoes_etapas_etapa ON automatizacoes_etapas(etapa_id);
CREATE INDEX idx_automatizacoes_etapas_ativo ON automatizacoes_etapas(ativo) WHERE ativo = TRUE;
CREATE INDEX idx_automatizacoes_etapas_proxima_execucao ON automatizacoes_etapas(proxima_execucao) WHERE proxima_execucao IS NOT NULL;
CREATE INDEX idx_logs_automatizacoes_automatizacao ON logs_automatizacoes(automatizacao_id);
CREATE INDEX idx_logs_automatizacoes_vaga_candidato ON logs_automatizacoes(vaga_candidato_id);
CREATE INDEX idx_logs_automatizacoes_status ON logs_automatizacoes(status);
CREATE INDEX idx_logs_automatizacoes_data_execucao ON logs_automatizacoes(data_execucao); 
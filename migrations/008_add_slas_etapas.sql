-- Criação da tabela de SLAs de etapas do pipeline
CREATE TABLE slas_etapas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  etapa_id UUID NOT NULL REFERENCES etapas_modelo_pipeline(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  prazo_horas INTEGER NOT NULL DEFAULT 24,
  prazo_dias INTEGER NOT NULL DEFAULT 1,
  tipo_prazo VARCHAR(20) NOT NULL DEFAULT 'dias',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  alerta_antes INTEGER NOT NULL DEFAULT 2,
  alerta_apos INTEGER NOT NULL DEFAULT 1,
  acoes_automaticas JSONB,
  notificacoes JSONB,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Criação da tabela de alertas de SLA
CREATE TABLE alertas_sla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sla_id UUID NOT NULL REFERENCES slas_etapas(id) ON DELETE CASCADE,
  vaga_candidato_id UUID NOT NULL REFERENCES vaga_candidatos(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL DEFAULT 'vencimento',
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  titulo VARCHAR(255) NOT NULL,
  mensagem TEXT,
  nivel_urgencia VARCHAR(20) NOT NULL DEFAULT 'medio',
  data_vencimento TIMESTAMP NOT NULL,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_envio TIMESTAMP,
  data_leitura TIMESTAMP,
  data_resolucao TIMESTAMP,
  resolvido_por UUID REFERENCES usuarios(id),
  dados_adicionais JSONB
);

-- Criação da tabela de notificações de SLA
CREATE TABLE notificacoes_sla (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alerta_id UUID NOT NULL REFERENCES alertas_sla(id) ON DELETE CASCADE,
  destinatario_id UUID NOT NULL REFERENCES usuarios(id),
  tipo VARCHAR(50) NOT NULL DEFAULT 'email',
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  titulo VARCHAR(255) NOT NULL,
  conteudo TEXT,
  dados_envio JSONB,
  tentativas INTEGER NOT NULL DEFAULT 0,
  max_tentativas INTEGER NOT NULL DEFAULT 3,
  proxima_tentativa TIMESTAMP,
  data_envio TIMESTAMP,
  data_entrega TIMESTAMP,
  erro TEXT,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX idx_slas_etapas_etapa ON slas_etapas(etapa_id);
CREATE INDEX idx_slas_etapas_ativo ON slas_etapas(ativo) WHERE ativo = TRUE;
CREATE INDEX idx_alertas_sla_sla ON alertas_sla(sla_id);
CREATE INDEX idx_alertas_sla_vaga_candidato ON alertas_sla(vaga_candidato_id);
CREATE INDEX idx_alertas_sla_status ON alertas_sla(status);
CREATE INDEX idx_alertas_sla_data_vencimento ON alertas_sla(data_vencimento);
CREATE INDEX idx_alertas_sla_tipo ON alertas_sla(tipo);
CREATE INDEX idx_alertas_sla_nivel_urgencia ON alertas_sla(nivel_urgencia);
CREATE INDEX idx_notificacoes_sla_alerta ON notificacoes_sla(alerta_id);
CREATE INDEX idx_notificacoes_sla_destinatario ON notificacoes_sla(destinatario_id);
CREATE INDEX idx_notificacoes_sla_status ON notificacoes_sla(status);
CREATE INDEX idx_notificacoes_sla_proxima_tentativa ON notificacoes_sla(proxima_tentativa) WHERE proxima_tentativa IS NOT NULL;
CREATE INDEX idx_notificacoes_sla_data_envio ON notificacoes_sla(data_envio);

-- Inserir SLAs padrão para etapas comuns (serão criados dinamicamente por etapa via API)
-- Os SLAs padrão serão criados através do endpoint /api/etapas/:etapaId/slas/template 
CREATE TABLE IF NOT EXISTS vaga_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id UUID NOT NULL REFERENCES vagas(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id),
  acao VARCHAR(32) NOT NULL,
  data TIMESTAMP NOT NULL DEFAULT NOW(),
  detalhes TEXT
); 
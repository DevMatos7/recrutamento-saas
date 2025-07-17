-- Migration: Criação do histórico de solicitações de vaga e ajuste de origem

CREATE TABLE historico_solicitacao_vaga (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitacao_id UUID NOT NULL REFERENCES solicitacoes_vaga(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    acao VARCHAR(32) NOT NULL, -- exemplo: criado, editado, aprovado, reprovado
    motivo TEXT,
    data TIMESTAMP NOT NULL DEFAULT now()
);

-- Adicionar campo de origem na tabela de solicitações de vaga
ALTER TABLE solicitacoes_vaga ADD COLUMN origem VARCHAR(16) NOT NULL DEFAULT 'manual';
-- Ajustar campo tipo para ser obrigatório apenas se origem = 'manual' (validação na aplicação) 
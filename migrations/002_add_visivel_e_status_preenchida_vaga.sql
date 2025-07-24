-- Adiciona o campo 'visivel' na tabela 'vagas'
ALTER TABLE vagas ADD COLUMN visivel BOOLEAN NOT NULL DEFAULT TRUE;

-- (Opcional) Atualiza comentários ou constraints para status, se necessário
-- O campo status já é varchar, então apenas documentar o novo valor possível
-- Não é necessário alterar o tipo, apenas garantir que o backend trate o novo status

-- Se desejar, pode atualizar registros existentes para garantir consistência
-- UPDATE vagas SET visivel = TRUE WHERE visivel IS NULL; 
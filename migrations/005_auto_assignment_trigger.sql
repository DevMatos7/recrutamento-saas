-- Trigger para atribuição automática de candidatos quando inseridos em vagas com responsável
CREATE OR REPLACE FUNCTION atribuir_candidato_automaticamente()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se a vaga tem responsável
    IF EXISTS (
        SELECT 1 FROM vagas 
        WHERE id = NEW.vaga_id 
        AND responsavel_id IS NOT NULL
    ) THEN
        -- Atualizar o candidato com o responsável da vaga
        UPDATE vaga_candidatos 
        SET responsavel_id = (
            SELECT responsavel_id 
            FROM vagas 
            WHERE id = NEW.vaga_id
        )
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_atribuir_candidato_automaticamente ON vaga_candidatos;
CREATE TRIGGER trigger_atribuir_candidato_automaticamente
    AFTER INSERT ON vaga_candidatos
    FOR EACH ROW
    EXECUTE FUNCTION atribuir_candidato_automaticamente();

-- Função para atribuir responsável a uma vaga e automaticamente atribuir candidatos existentes
CREATE OR REPLACE FUNCTION atribuir_responsavel_vaga_e_candidatos(
    p_vaga_id UUID,
    p_responsavel_id UUID
)
RETURNS JSON AS $$
DECLARE
    v_candidatos_atribuidos INTEGER;
    v_result JSON;
BEGIN
    -- Atualizar a vaga com o responsável
    UPDATE vagas 
    SET responsavel_id = p_responsavel_id,
        data_atualizacao = NOW()
    WHERE id = p_vaga_id;
    
    -- Atribuir o responsável a todos os candidatos da vaga que não têm responsável
    UPDATE vaga_candidatos 
    SET responsavel_id = p_responsavel_id
    WHERE vaga_id = p_vaga_id 
    AND responsavel_id IS NULL;
    
    GET DIAGNOSTICS v_candidatos_atribuidos = ROW_COUNT;
    
    v_result := json_build_object(
        'success', true,
        'message', 'Responsável atribuído com sucesso. ' || v_candidatos_atribuidos || ' candidatos foram atribuídos automaticamente.',
        'candidatos_atribuidos', v_candidatos_atribuidos
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        v_result := json_build_object(
            'success', false,
            'message', 'Erro ao atribuir responsável: ' || SQLERRM,
            'candidatos_atribuidos', 0
        );
        RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Índice para melhorar performance das consultas de atribuição
CREATE INDEX IF NOT EXISTS idx_vaga_candidatos_vaga_responsavel 
ON vaga_candidatos(vaga_id, responsavel_id);

CREATE INDEX IF NOT EXISTS idx_vagas_responsavel 
ON vagas(responsavel_id); 
-- ============================================
-- IMPLEMENTAÇÃO SGBD - PostgreSQL
-- a) Stored Procedure
-- b) Trigger
-- c) Usuários (Admin e Leitura)
-- ============================================

-- ============================================
-- a) PROCEDIMENTO ARMAZENADO (Stored Procedure)
-- ============================================
-- Procedimento para registrar uma nova embarcação para um cliente
-- Valida se o cliente existe e insere a embarcação

CREATE OR REPLACE PROCEDURE sp_RegistrarEmbarcacao(
    p_nome VARCHAR(100),
    p_tipo VARCHAR(50),
    p_capacidade INT,
    p_tamanho DECIMAL(10,2),
    p_cpf_cliente VARCHAR(14)
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_id_client INT;
    v_id_vessel INT;
BEGIN
    -- Busca o Id do cliente pelo CPF
    SELECT Id_Person INTO v_id_client
    FROM Client
    WHERE CPF = p_cpf_cliente;
    
    -- Verifica se o cliente existe
    IF v_id_client IS NULL THEN
        RAISE EXCEPTION 'Cliente com CPF % não encontrado.', p_cpf_cliente;
    END IF;
    
    -- Insere a nova embarcação
    INSERT INTO Vessel ("Name", "Type", Capacity, "Size", Id_Client)
    VALUES (p_nome, p_tipo, p_capacidade, p_tamanho, v_id_client)
    RETURNING "Id" INTO v_id_vessel;
    
    -- Mensagem de confirmação
    RAISE NOTICE 'Embarcação "%" registrada com sucesso! ID: %', p_nome, v_id_vessel;
    
    COMMIT;
END;
$$;

-- Exemplo de uso do procedimento:
-- CALL sp_RegistrarEmbarcacao('Nova Embarcação', 'Lancha', 8, 25.00, '123.456.789-09');


-- ============================================
-- b) GATILHO (Trigger)
-- ============================================
-- Trigger de validação: impede inserção de embarcação com capacidade inválida
-- e garante que o tipo seja padronizado (primeira letra maiúscula)

CREATE OR REPLACE FUNCTION fn_ValidarEmbarcacao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Validação: capacidade não pode ser negativa ou zero
    IF NEW.Capacity IS NOT NULL AND NEW.Capacity <= 0 THEN
        RAISE EXCEPTION 'A capacidade da embarcação deve ser maior que zero. Valor informado: %', NEW.Capacity;
    END IF;
    
    -- Validação: tamanho não pode ser negativo
    IF NEW."Size" IS NOT NULL AND NEW."Size" <= 0 THEN
        RAISE EXCEPTION 'O tamanho da embarcação deve ser maior que zero. Valor informado: %', NEW."Size";
    END IF;
    
    -- Padronização: primeira letra do tipo em maiúscula
    IF NEW."Type" IS NOT NULL THEN
        NEW."Type" := INITCAP(NEW."Type");
    END IF;
    
    -- Validação: verifica se o cliente existe
    IF NEW.Id_Client IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM Client WHERE Id_Person = NEW.Id_Client) THEN
            RAISE EXCEPTION 'Cliente com Id % não encontrado.', NEW.Id_Client;
        END IF;
    END IF;
    
    RAISE NOTICE 'Embarcação "%" validada com sucesso!', NEW."Name";
    
    RETURN NEW;
END;
$$;

-- Criação do trigger
DROP TRIGGER IF EXISTS trg_ValidarEmbarcacao ON Vessel;

CREATE TRIGGER trg_ValidarEmbarcacao
BEFORE INSERT OR UPDATE ON Vessel
FOR EACH ROW
EXECUTE FUNCTION fn_ValidarEmbarcacao();

-- Exemplos de teste do trigger:
-- INSERT INTO Vessel ("Name", "Type", Capacity, "Size", Id_Client) VALUES ('Teste', 'lancha', -5, 20.00, 1);
-- Resultado: ERRO - capacidade inválida

-- INSERT INTO Vessel ("Name", "Type", Capacity, "Size", Id_Client) VALUES ('Teste', 'lancha', 10, 20.00, 1);
-- Resultado: Sucesso - tipo será convertido para 'Lancha'


-- ============================================
-- c) CRIAÇÃO DE USUÁRIOS
-- ============================================

-- 1. Usuário Administrativo (acesso total ao banco de dados criado)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'usuario_admin_embarcacoes') THEN
        REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM usuario_admin_embarcacoes;
        REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM usuario_admin_embarcacoes;
        REVOKE ALL PRIVILEGES ON SCHEMA public FROM usuario_admin_embarcacoes;
        DROP USER usuario_admin_embarcacoes;
    END IF;
END $$;

CREATE USER usuario_admin_embarcacoes WITH PASSWORD 'SenhaAdmin@2026';

GRANT ALL PRIVILEGES ON SCHEMA public TO usuario_admin_embarcacoes;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO usuario_admin_embarcacoes;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO usuario_admin_embarcacoes;
GRANT CREATE ON SCHEMA public TO usuario_admin_embarcacoes;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL PRIVILEGES ON TABLES TO usuario_admin_embarcacoes;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT ALL PRIVILEGES ON SEQUENCES TO usuario_admin_embarcacoes;


-- 2. Usuário Somente Leitura
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'usuario_leitura_embarcacoes') THEN
        REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM usuario_leitura_embarcacoes;
        REVOKE ALL PRIVILEGES ON SCHEMA public FROM usuario_leitura_embarcacoes;
        DROP USER usuario_leitura_embarcacoes;
    END IF;
END $$;

CREATE USER usuario_leitura_embarcacoes WITH PASSWORD 'SenhaLeitura@2026';

GRANT USAGE ON SCHEMA public TO usuario_leitura_embarcacoes;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO usuario_leitura_embarcacoes;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON TABLES TO usuario_leitura_embarcacoes;


-- ============================================
-- VERIFICAÇÃO DOS USUÁRIOS CRIADOS
-- ============================================
SELECT 
    r.rolname AS usuario,
    CASE 
        WHEN r.rolsuper THEN 'Superusuário'
        WHEN r.rolcreatedb THEN 'Pode criar BD'
        ELSE 'Usuário comum'
    END AS tipo,
    r.rolcanlogin AS pode_logar
FROM pg_roles r
WHERE r.rolname IN ('usuario_admin_embarcacoes', 'usuario_leitura_embarcacoes');

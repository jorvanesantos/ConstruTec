-- ==========================================================
-- ConstruTec - Sistema Inteligente de Cálculo de Materiais
-- Arquivo: database/admin_migration.sql
-- Objetivo: Migração para suporte a Administradores, Proprietários (máx 5),
--           Tipos de Obra dinâmicos, Materiais cadastrados e Histórico do Sistema.
-- ==========================================================

USE construtec_ia;

-- 1. Atualizar Tabela de Usuários com tipo_usuario (PROPRIETARIO, ADM, USUARIO)
-- Nota: se as colunas já existirem no MySQL, ignore erros de duplicação.
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS tipo_usuario ENUM('PROPRIETARIO', 'ADM', 'USUARIO') NOT NULL DEFAULT 'USUARIO' AFTER perfil,
ADD COLUMN IF NOT EXISTS data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER ativo;

-- 2. Tabela de Histórico do Sistema (Logs de Auditoria)
CREATE TABLE IF NOT EXISTS historico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NULL,
    usuario_nome VARCHAR(150) NOT NULL,
    usuario_email VARCHAR(180) NULL,
    tipo_usuario ENUM('PROPRIETARIO', 'ADM', 'USUARIO') NOT NULL DEFAULT 'USUARIO',
    acao VARCHAR(80) NOT NULL COMMENT 'LOGIN, CRIAR_CALCULO, EDITAR_OBRA, EXCLUIR_OBRA, CADASTRAR_USUARIO, CADASTRAR_ADM, CADASTRAR_PROPRIETARIO, EDITAR_MATERIAL, etc.',
    descricao TEXT NOT NULL,
    detalhes_json JSON NULL,
    ip_origem VARCHAR(50) DEFAULT '127.0.0.1',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 3. Atualizar Tabela de Materiais com campos de gestão administrativa
ALTER TABLE materiais
ADD COLUMN IF NOT EXISTS preco DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER descricao,
ADD COLUMN IF NOT EXISTS quantidade_minima INT NOT NULL DEFAULT 5 AFTER preco,
ADD COLUMN IF NOT EXISTS status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo' AFTER quantidade_minima,
ADD COLUMN IF NOT EXISTS unidade VARCHAR(50) NOT NULL DEFAULT 'unidade' AFTER status;

-- 4. Garantir campos na Tabela de Tipos de Obra
ALTER TABLE tipos_obra
ADD COLUMN IF NOT EXISTS status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo' AFTER icone;

-- 5. Índices para Otimização de Consultas Administrativas
CREATE INDEX IF NOT EXISTS idx_usuarios_tipo ON usuarios(tipo_usuario, ativo);
CREATE INDEX IF NOT EXISTS idx_historico_acao ON historico(acao);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico(criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_materiais_status ON materiais(status);

-- 6. Inserir Proprietário Padrão (Dono do Sistema) se não existir
INSERT INTO usuarios (nome, email, perfil, tipo_usuario, ativo, uf_padrao, cidade_padrao)
VALUES ('Jorvane Santos (Proprietário)', 'jorvane@construtec.com.br', 'proprietario', 'PROPRIETARIO', TRUE, 'SP', 'São Paulo')
ON DUPLICATE KEY UPDATE tipo_usuario = 'PROPRIETARIO';

-- Inserir Administrador Padrão
INSERT INTO usuarios (nome, email, perfil, tipo_usuario, ativo, uf_padrao, cidade_padrao)
VALUES ('Carlos Silva (Administrador)', 'adm@construtec.com.br', 'engenheiro', 'ADM', TRUE, 'SP', 'São Paulo')
ON DUPLICATE KEY UPDATE tipo_usuario = 'ADM';

-- Inserir Usuários Comuns de Demonstração
INSERT INTO usuarios (nome, email, perfil, tipo_usuario, ativo, uf_padrao, cidade_padrao)
VALUES 
('Carlos Mendes', 'carlos.mendes@gmail.com', 'mestre_obras', 'USUARIO', TRUE, 'RJ', 'Rio de Janeiro'),
('Maria Oliveira', 'maria.oliveira@gmail.com', 'proprietario', 'USUARIO', TRUE, 'MG', 'Belo Horizonte')
ON DUPLICATE KEY UPDATE ativo = TRUE;

-- 7. Inserir Materiais solicitados na especificação com valores reais
INSERT INTO materiais (codigo, nome, categoria, unidade_base, unidade_comercial, descricao, preco, quantidade_minima, status, unidade)
VALUES
('mat_cimento', 'Cimento Portland CP-II', 'Aglomerantes', 'saco', 'sacos', 'Cimento para alvenaria e concreto estrutural', 42.00, 20, 'ativo', 'saco'),
('mat_tinta', 'Tinta Acrílica Premium', 'Pintura', 'litro', 'litros', 'Tinta lavável para acabamento interno e externo', 35.00, 10, 'ativo', 'litro'),
('mat_tijolo', 'Tijolo Cerâmico 8 Furos', 'Alvenaria', 'unidade', 'unidades', 'Tijolo padrão para alvenaria de vedação', 1.20, 500, 'ativo', 'unidade')
ON DUPLICATE KEY UPDATE preco = VALUES(preco), quantidade_minima = VALUES(quantidade_minima), status = VALUES(status);

-- 8. Primeiro registro no histórico do sistema
INSERT INTO historico (usuario_nome, usuario_email, tipo_usuario, acao, descricao)
VALUES ('Sistema ConstruTec', 'sistema@construtec.com.br', 'PROPRIETARIO', 'LOGIN', 'Inicialização do banco e provisionamento do módulo administrativo');

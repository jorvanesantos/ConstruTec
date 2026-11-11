-- ==========================================================
-- ConstruTec - Sistema Inteligente de Cálculo de Materiais
-- Arquivo: database/create_tables.sql
-- Objetivo: Criação das tabelas relacionais com chaves e constraints
-- ==========================================================

USE construtec;

-- 1. Tabela de Usuários (com controle de Proprietários, ADMs e Usuários comuns)
CREATE TABLE IF NOT EXISTS usuarios (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NULL,
    google_id VARCHAR(100) NULL UNIQUE,
    avatar_url VARCHAR(500) NULL,
    perfil ENUM('proprietario', 'pedreiro', 'mestre_obras', 'engenheiro', 'arquiteto') DEFAULT 'proprietario',
    tipo_usuario ENUM('PROPRIETARIO', 'ADM', 'USUARIO') NOT NULL DEFAULT 'USUARIO',
    uf_padrao VARCHAR(2) DEFAULT 'SP',
    cidade_padrao VARCHAR(100) DEFAULT 'São Paulo',
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Tabela de Localizações Regionais (Multiplicador de Preços)
CREATE TABLE IF NOT EXISTS localizacoes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uf VARCHAR(2) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    multiplicador_preco DECIMAL(4,3) NOT NULL DEFAULT 1.000,
    fonte_referencia VARCHAR(150) DEFAULT 'SINAPI / Mercado Regional',
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_localizacao_uf_cidade UNIQUE (uf, cidade)
) ENGINE=InnoDB;

-- 3. Tabela de Tipos de Obra
CREATE TABLE IF NOT EXISTS tipos_obra (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT NULL,
    categoria ENUM('alvenaria', 'acabamento', 'estrutural', 'cobertura', 'geral') NOT NULL,
    desperdicio_padrao DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    icone VARCHAR(50) DEFAULT 'Wrench',
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Tabela de Materiais (com controle de preços, estoque mínimo e status pelo ADM)
CREATE TABLE IF NOT EXISTS materiais (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    unidade_base VARCHAR(50) NOT NULL,
    unidade_comercial VARCHAR(50) NOT NULL,
    unidade VARCHAR(50) NOT NULL DEFAULT 'unidade',
    preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quantidade_minima INT NOT NULL DEFAULT 10,
    descricao TEXT NULL,
    status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Tabela de Preços de Materiais por Região
CREATE TABLE IF NOT EXISTS precos_materiais (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    material_id BIGINT NOT NULL,
    localizacao_id BIGINT NOT NULL,
    preco_base DECIMAL(10,2) NOT NULL,
    data_atualizacao DATE NOT NULL,
    fonte VARCHAR(100) DEFAULT 'SINAPI / Pesquisa ConstruTec',
    CONSTRAINT fk_preco_material FOREIGN KEY (material_id) REFERENCES materiais (id) ON DELETE CASCADE,
    CONSTRAINT fk_preco_localizacao FOREIGN KEY (localizacao_id) REFERENCES localizacoes (id) ON DELETE CASCADE,
    CONSTRAINT uq_material_localizacao UNIQUE (material_id, localizacao_id)
) ENGINE=InnoDB;

-- 6. Tabela de Obras / Projetos do Usuário
CREATE TABLE IF NOT EXISTS obras (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT NULL,
    localizacao_id BIGINT NOT NULL,
    status ENUM('planejamento', 'em_andamento', 'concluida', 'pausada') DEFAULT 'planejamento',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_obra_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_obra_localizacao FOREIGN KEY (localizacao_id) REFERENCES localizacoes (id)
) ENGINE=InnoDB;

-- 7. Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NULL,
    owner_user_id VARCHAR(80) NULL,
    obra_id BIGINT NULL,
    tipo_obra_id BIGINT NULL,
    titulo VARCHAR(150) NOT NULL,
    cliente_nome VARCHAR(150) NULL,
    tipo_obra VARCHAR(50) NULL,
    custo_total_estimado DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    dados_localizacao JSON NULL,
    resultado_calculo JSON NULL,
    area_m2 DECIMAL(10,2) NULL,
    volume_m3 DECIMAL(10,3) NULL,
    percentual_desperdicio DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    subtotal_materiais DECIMAL(12,2) NULL,
    custo_desperdicio DECIMAL(12,2) NULL,
    valor_total_estimado DECIMAL(12,2) NULL,
    parametros_json JSON NULL,
    formulas_json JSON NULL,
    status ENUM('rascunho', 'aprovado', 'em_andamento', 'concluido') DEFAULT 'rascunho',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_orcamento_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT fk_orcamento_obra FOREIGN KEY (obra_id) REFERENCES obras (id) ON DELETE SET NULL,
    CONSTRAINT fk_orcamento_tipo_obra FOREIGN KEY (tipo_obra_id) REFERENCES tipos_obra (id)
) ENGINE=InnoDB;

-- 8. Tabela de Itens de Materiais do Orçamento
CREATE TABLE IF NOT EXISTS orcamento_materiais (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    orcamento_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    quantidade_teorica DECIMAL(10,2) NOT NULL,
    quantidade_comercial DECIMAL(10,2) NOT NULL,
    unidade_medida VARCHAR(50) NOT NULL,
    preco_unitario_estimado DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    finalidade VARCHAR(255) NULL,
    CONSTRAINT fk_item_orcamento FOREIGN KEY (orcamento_id) REFERENCES orcamentos (id) ON DELETE CASCADE,
    CONSTRAINT fk_item_material FOREIGN KEY (material_id) REFERENCES materiais (id)
) ENGINE=InnoDB;

-- 9. Tabela de Histórico do Sistema (Logs de Auditoria e Rastreabilidade)
CREATE TABLE IF NOT EXISTS historico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NULL,
    usuario_nome VARCHAR(150) NOT NULL,
    usuario_email VARCHAR(180) NULL,
    tipo_usuario ENUM('PROPRIETARIO', 'ADM', 'USUARIO') NOT NULL DEFAULT 'USUARIO',
    acao VARCHAR(80) NOT NULL,
    descricao TEXT NOT NULL,
    detalhes_json JSON NULL,
    ip_origem VARCHAR(50) DEFAULT '127.0.0.1',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 10. Chamados de suporte abertos por usuários e atendidos pela equipe administrativa
CREATE TABLE IF NOT EXISTS suporte_chamados (
    id VARCHAR(80) PRIMARY KEY,
    owner_user_id VARCHAR(80) NOT NULL,
    owner_name VARCHAR(150) NOT NULL,
    owner_email VARCHAR(180) NOT NULL,
    assunto VARCHAR(150) NOT NULL,
    mensagem TEXT NOT NULL,
    status ENUM('aberto', 'em_atendimento', 'respondido', 'fechado') NOT NULL DEFAULT 'aberto',
    resposta TEXT NULL,
    respondido_por VARCHAR(150) NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_suporte_owner_status (owner_user_id, status)
) ENGINE=InnoDB;

-- Índices de Otimização
CREATE INDEX idx_orcamentos_usuario ON orcamentos(usuario_id);
CREATE INDEX idx_orcamento_materiais_orcamento ON orcamento_materiais(orcamento_id);
CREATE INDEX idx_precos_material_local ON precos_materiais(material_id, localizacao_id);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario, ativo);
CREATE INDEX idx_historico_acao ON historico(acao);
CREATE INDEX idx_historico_data ON historico(criado_em DESC);

-- 11. Cálculos de materiais salvos pela API Node/Express
CREATE TABLE IF NOT EXISTS calculos (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_user_id VARCHAR(80) NULL,
    tipo_obra VARCHAR(50) NOT NULL,
    parametros_json JSON NOT NULL,
    resultado_json JSON NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_calculos_tipo_data (tipo_obra, criado_em)
) ENGINE=InnoDB;

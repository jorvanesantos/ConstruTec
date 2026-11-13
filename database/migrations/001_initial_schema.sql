-- =============================================================================
-- ConstruTec - Migration 001: Schema Inicial do Banco de Dados MySQL
-- Conforme Plano de Desenvolvimento (Tabela modelo inicial + Auditoria + SINAPI)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS construtec_ia
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE construtec_ia;

-- 1. Tabela usuario (dados da conta, perfil, hash bcrypt e status)
CREATE TABLE IF NOT EXISTS usuario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NULL,
    google_id VARCHAR(100) NULL UNIQUE,
    avatar_url VARCHAR(500) NULL,
    perfil VARCHAR(80) DEFAULT 'cliente',
    tipo_usuario ENUM('ADM_MASTER', 'PROPRIETARIO', 'ADM', 'USUARIO') NOT NULL DEFAULT 'USUARIO',
    telefone VARCHAR(30) NULL,
    uf_padrao VARCHAR(2) DEFAULT 'SP',
    cidade_padrao VARCHAR(100) DEFAULT 'São Paulo',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuario_tipo_ativo (tipo_usuario, ativo)
) ENGINE=InnoDB;

-- 2. Tabela unidade_medida (unidades padronizadas do sistema)
CREATE TABLE IF NOT EXISTS unidade_medida (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sigla VARCHAR(30) NOT NULL UNIQUE,
    nome VARCHAR(80) NOT NULL,
    descricao VARCHAR(200) NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. Tabela tipo_construcao (muro, parede, piso, pintura, concreto, fundacao, telhado, revestimento, outro)
CREATE TABLE IF NOT EXISTS tipo_construcao (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    tagline VARCHAR(150) NULL,
    descricao TEXT NULL,
    categoria ENUM('alvenaria', 'acabamento', 'estrutural', 'cobertura', 'geral') NOT NULL DEFAULT 'geral',
    desperdicio_padrao DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    icone VARCHAR(50) DEFAULT 'Wrench',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Tabela material (insumos, preços base e unidades relacionadas)
CREATE TABLE IF NOT EXISTS material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(60) NOT NULL UNIQUE,
    nome VARCHAR(150) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    unidade_medida_id BIGINT NULL,
    unidade_base VARCHAR(50) NOT NULL,
    unidade_comercial VARCHAR(50) NOT NULL,
    preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    quantidade_minima INT NOT NULL DEFAULT 10,
    descricao TEXT NULL,
    status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_material_status (status),
    CONSTRAINT fk_material_unidade FOREIGN KEY (unidade_medida_id) REFERENCES unidade_medida (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Tabela localizacoes (multiplicadores regionais SINAPI por UF)
CREATE TABLE IF NOT EXISTS localizacoes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uf VARCHAR(2) NOT NULL,
    estado VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    multiplicador_preco DECIMAL(4,3) NOT NULL DEFAULT 1.000,
    fonte_referencia VARCHAR(150) DEFAULT 'SINAPI / Mercado Regional',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_localizacao_uf_cidade UNIQUE (uf, cidade)
) ENGINE=InnoDB;

-- 6. Tabela obra (obras/orçamentos salvos pelos usuários)
CREATE TABLE IF NOT EXISTS obra (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo_externo VARCHAR(60) NULL UNIQUE,
    usuario_id BIGINT NULL,
    tipo_construcao_id BIGINT NULL,
    titulo VARCHAR(150) NOT NULL,
    cliente_nome VARCHAR(150) NULL,
    tipo_obra VARCHAR(50) NOT NULL,
    tipo_obra_nome VARCHAR(100) NULL,
    custo_total_estimado DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status ENUM('rascunho', 'aprovado', 'em_andamento', 'concluido') NOT NULL DEFAULT 'rascunho',
    notas TEXT NULL,
    dados_localizacao JSON NULL,
    resultado_calculo JSON NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_obra_usuario (usuario_id),
    CONSTRAINT fk_obra_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE SET NULL,
    CONSTRAINT fk_obra_tipo FOREIGN KEY (tipo_construcao_id) REFERENCES tipo_construcao (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 7. Tabela medicao (medidas utilizadas em uma obra/cálculo)
CREATE TABLE IF NOT EXISTS medicao (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    obra_id BIGINT NOT NULL,
    comprimento DECIMAL(10,3) NULL,
    altura DECIMAL(10,3) NULL,
    largura DECIMAL(10,3) NULL,
    profundidade DECIMAL(10,3) NULL,
    espessura_cm DECIMAL(10,2) NULL,
    area_liquida_m2 DECIMAL(12,3) NULL,
    volume_m3 DECIMAL(12,3) NULL,
    desperdicio_percentual DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    parametros_json JSON NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medicao_obra FOREIGN KEY (obra_id) REFERENCES obra (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 8. Tabela historico (auditoria e histórico de ações do sistema)
CREATE TABLE IF NOT EXISTS historico (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NULL,
    usuario_nome VARCHAR(150) NOT NULL,
    usuario_email VARCHAR(180) NULL,
    tipo_usuario ENUM('ADM_MASTER', 'PROPRIETARIO', 'ADM', 'USUARIO') NOT NULL DEFAULT 'USUARIO',
    acao VARCHAR(80) NOT NULL,
    descricao TEXT NOT NULL,
    detalhes_json JSON NULL,
    ip_origem VARCHAR(50) DEFAULT '127.0.0.1',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_historico_acao (acao),
    INDEX idx_historico_data (criado_em DESC),
    CONSTRAINT fk_historico_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE SET NULL
) ENGINE=InnoDB;

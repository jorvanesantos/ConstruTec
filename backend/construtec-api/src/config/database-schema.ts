import type { Pool } from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

export async function ensureDatabaseSchema(dbPool: Pool): Promise<void> {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS sinapi_preco (
        referencia CHAR(7) NOT NULL,
        codigo INT NOT NULL,
        uf CHAR(2) NOT NULL,
        descricao VARCHAR(500) NOT NULL,
        unidade VARCHAR(30) NOT NULL,
        preco DECIMAL(14,4) NOT NULL,
        fonte VARCHAR(500) NOT NULL,
        importado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (referencia, codigo, uf),
        KEY sinapi_uf_referencia (uf, referencia)
      ) ENGINE=InnoDB;
    `);
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(180) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NULL,
        reset_token VARCHAR(255) NULL,
        reset_token_expira DATETIME NULL,
        avatar_url MEDIUMTEXT NULL,
        perfil VARCHAR(80) DEFAULT 'cliente',
        tipo_usuario ENUM('ADM_MASTER', 'PROPRIETARIO', 'ADM', 'USUARIO') NOT NULL DEFAULT 'USUARIO',
        telefone VARCHAR(30) NULL,
        uf_padrao VARCHAR(2) DEFAULT 'SP',
        cidade_padrao VARCHAR(100) DEFAULT 'São Paulo',
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    const [resetColumns] = await dbPool.query<RowDataPacket[]>(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'usuario'
        AND COLUMN_NAME IN ('reset_token', 'reset_token_expira')
    `);
    const existingColumns = new Set(resetColumns.map(column => String(column.COLUMN_NAME)));
    const columnsToAdd = [
      !existingColumns.has('reset_token') ? 'ADD COLUMN reset_token VARCHAR(255) NULL' : '',
      !existingColumns.has('reset_token_expira') ? 'ADD COLUMN reset_token_expira DATETIME NULL' : ''
    ].filter(Boolean);
    if (columnsToAdd.length > 0) {
      await dbPool.query(`ALTER TABLE usuario ${columnsToAdd.join(', ')}`);
      console.log('[MySQL] Colunas de redefinição de senha adicionadas à tabela usuario.');
    }

    const [avatarColumns] = await dbPool.query<RowDataPacket[]>(`
      SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuario' AND COLUMN_NAME = 'avatar_url'
    `);
    if (avatarColumns.length === 0) {
      throw new Error('A coluna usuario.avatar_url não foi encontrada; revise a estrutura antes de continuar.');
    }
    if (String(avatarColumns[0].DATA_TYPE).toLowerCase() !== 'mediumtext') {
      await dbPool.query(`ALTER TABLE usuario MODIFY COLUMN avatar_url MEDIUMTEXT NULL`);
    }

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS tipo_construcao (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL UNIQUE,
        nome VARCHAR(100) NOT NULL,
        descricao TEXT NULL,
        categoria ENUM('alvenaria', 'acabamento', 'estrutural', 'cobertura', 'geral') NOT NULL DEFAULT 'geral',
        desperdicio_padrao DECIMAL(5,2) NOT NULL DEFAULT 10.00,
        icone VARCHAR(50) DEFAULT 'Wrench',
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS material (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(60) NOT NULL UNIQUE,
        nome VARCHAR(150) NOT NULL,
        categoria VARCHAR(100) NOT NULL,
        unidade_base VARCHAR(50) NOT NULL,
        unidade_comercial VARCHAR(50) NOT NULL,
        preco DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        quantidade_minima INT NOT NULL DEFAULT 10,
        descricao TEXT NULL,
        status ENUM('ativo', 'inativo') NOT NULL DEFAULT 'ativo',
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS obra (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        codigo_externo VARCHAR(60) NULL,
        usuario_id BIGINT NULL,
        titulo VARCHAR(150) NOT NULL,
        cliente_nome VARCHAR(150) NULL,
        tipo_obra VARCHAR(50) NOT NULL,
        tipo_obra_nome VARCHAR(100) NULL,
        custo_total_estimado DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'rascunho',
        dados_localizacao JSON NULL,
        resultado_calculo JSON NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS medicao (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        obra_id BIGINT NOT NULL,
        area_liquida_m2 DECIMAL(12,3) NULL,
        volume_m3 DECIMAL(12,3) NULL,
        desperdicio_percentual DECIMAL(5,2) NOT NULL DEFAULT 10.00,
        parametros_json JSON NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS historico (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        usuario_id BIGINT NULL,
        usuario_nome VARCHAR(150) NOT NULL,
        usuario_email VARCHAR(180) NULL,
        tipo_usuario ENUM('ADM_MASTER', 'PROPRIETARIO', 'ADM', 'USUARIO') NOT NULL DEFAULT 'USUARIO',
        acao VARCHAR(80) NOT NULL,
        descricao TEXT NOT NULL,
        ip_origem VARCHAR(50) DEFAULT '127.0.0.1',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS master_solicitacoes (
        id VARCHAR(80) PRIMARY KEY,
        tipo_acao ENUM('REBAIXAR', 'EXCLUIR') NOT NULL,
        alvo_usuario_id VARCHAR(80) NOT NULL,
        alvo_usuario_nome VARCHAR(150) NOT NULL,
        alvo_usuario_email VARCHAR(180) NOT NULL,
        novo_tipo_usuario VARCHAR(30) NULL,
        solicitante_id VARCHAR(80) NOT NULL,
        solicitante_nome VARCHAR(150) NOT NULL,
        solicitante_email VARCHAR(180) NOT NULL,
        motivo TEXT NULL,
        status ENUM('PENDENTE', 'ACEITA', 'RECUSADA', 'CANCELADA') NOT NULL DEFAULT 'PENDENTE',
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        respondido_em TIMESTAMP NULL
      ) ENGINE=InnoDB;
    `);
}

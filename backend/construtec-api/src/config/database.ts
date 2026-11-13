import mysql from 'mysql2/promise';

export const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'construtec_ia'
};

let dbPool: mysql.Pool | null = null;
let isDbConnected = false;
let dbConnectionError: string | null = null;

export function getDbPool(): mysql.Pool | null {
  return dbPool;
}

export function getDbState() {
  return {
    connected: isDbConnected,
    error: dbConnectionError,
    config: {
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      database: DB_CONFIG.database
    }
  };
}

export async function ensureDatabaseSchema(): Promise<void> {
  if (!dbPool || !isDbConnected) return;
  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS usuario (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(180) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NULL,
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

    await dbPool.query(`ALTER TABLE usuario MODIFY COLUMN avatar_url MEDIUMTEXT NULL`).catch(() => {});

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
  } catch (err: any) {
    console.warn('[MySQL] Aviso na verificação de schema:', err.message);
  }
}

export async function connectDatabase(): Promise<boolean> {
  try {
    const setupPool = mysql.createPool({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      waitForConnections: true,
      connectionLimit: 2,
      connectTimeout: 3000
    });

    try {
      const setupConn = await setupPool.getConnection();
      await setupConn.query(
        `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
      );
      setupConn.release();
    } catch {
      // Ignora erro caso não haja privilégio DDL de criação do schema
    } finally {
      await setupPool.end().catch(() => {});
    }

    dbPool = mysql.createPool({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password,
      database: DB_CONFIG.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 4000
    });

    const conn = await dbPool.getConnection();
    await conn.ping();
    conn.release();
    isDbConnected = true;
    dbConnectionError = null;
    console.log(`[MySQL] Conectado ao banco '${DB_CONFIG.database}' em ${DB_CONFIG.host}:${DB_CONFIG.port}.`);
    await ensureDatabaseSchema();
    return true;
  } catch (err: any) {
    isDbConnected = false;
    dbConnectionError = err.message || 'Erro de conexão';
    console.log(`[MySQL] Operando em modo de memória com fallback seguro (${dbConnectionError}).`);
    return false;
  }
}

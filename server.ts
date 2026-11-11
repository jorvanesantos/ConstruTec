import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import type { Pool, ResultSetHeader } from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { CalculationService } from './src/services/calculationEngine';
import { BASE_MATERIALS_CATALOG, REGIONAL_LOCATIONS, WORK_TYPES } from './src/data/catalog';
import { createMysqlPool, databaseConfig } from './src/config/database';
import { createSavedCalculationsRouter } from './src/routes/savedCalculations.routes';
import { DEFAULT_CALCULATION_SETTINGS, isCalculationSettings, type CalculationSettings } from './src/services/calculationSettings';
import { DEFAULT_SYSTEM_SETTINGS, isSystemSettings, type SystemSettings } from './src/services/systemSettings';
import { 
  WorkTypeKey, 
  SavedBudget, 
  UserType, 
  AdminUser, 
  AdminMaterial, 
  AdminWorkType, 
  AdminUserWork, 
  SupportTicket,
  SupportTicketStatus,
  SystemAuditLog 
} from './src/types';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// Configurações do Banco de Dados MySQL
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET é obrigatório em produção.');
}
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

let dbPool: Pool | null = null;
let isDbConnected = false;
let dbConnectionError: string | null = null;
let calculationSettings: CalculationSettings = DEFAULT_CALCULATION_SETTINGS;
let systemSettings: SystemSettings = DEFAULT_SYSTEM_SETTINGS;

function mapSupportTicketRow(row: any): SupportTicket {
  const timestampToIso = (value: unknown) =>
    value ? new Date(value as string | number | Date).toISOString() : new Date().toISOString();
  return {
    id: String(row.id),
    ownerUserId: String(row.owner_user_id),
    ownerName: String(row.owner_name || 'Usuário'),
    ownerEmail: String(row.owner_email || ''),
    subject: String(row.assunto || ''),
    message: String(row.mensagem || ''),
    status: row.status as SupportTicketStatus,
    response: row.resposta ? String(row.resposta) : undefined,
    responseBy: row.respondido_por ? String(row.respondido_por) : undefined,
    createdAt: timestampToIso(row.criado_em),
    updatedAt: timestampToIso(row.atualizado_em)
  };
}

async function persistMaterialAndCalculationSettings(
  material: AdminMaterial,
  updatedSettings: CalculationSettings
): Promise<boolean> {
  if (!isDbConnected || !dbPool) return false;

  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO materiais
        (codigo, nome, categoria, unidade_base, unidade_comercial, unidade, preco, quantidade_minima, descricao, status, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        nome = VALUES(nome), categoria = VALUES(categoria), unidade_base = VALUES(unidade_base),
        unidade_comercial = VALUES(unidade_comercial), unidade = VALUES(unidade),
        preco = VALUES(preco), quantidade_minima = VALUES(quantidade_minima),
        descricao = VALUES(descricao), status = VALUES(status), ativo = VALUES(ativo)`,
      [
        material.id,
        material.name,
        material.category,
        material.unit,
        material.unit,
        material.unit,
        material.price,
        material.minQuantity,
        material.description,
        material.status,
        material.status === 'ativo'
      ]
    );
    await connection.execute(
      `INSERT INTO configuracoes_sistema (chave, valor_json) VALUES ('calculation_settings', ?)
       ON DUPLICATE KEY UPDATE valor_json = VALUES(valor_json)`,
      [JSON.stringify(updatedSettings)]
    );
    await connection.commit();
    calculationSettings = updatedSettings;
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Inicializa a conexão com o MySQL
async function initDatabase() {
  try {
    // 1. Tenta inicializar/criar a base de dados se necessário
    const setupPool = createMysqlPool();

    try {
      const setupConn = await setupPool.getConnection();
      await setupConn.query(`CREATE DATABASE IF NOT EXISTS \`${databaseConfig.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      setupConn.release();
    } catch (e) {
      // Ignora erro se não tiver permissão de criar banco
    } finally {
      await setupPool.end().catch(() => {});
    }

    // 2. Conecta ao banco de dados especificado
    dbPool = createMysqlPool(databaseConfig.name);

    const conn = await dbPool.getConnection();
    await conn.ping();
    conn.release();
    isDbConnected = true;
    dbConnectionError = null;
    console.log(`[MySQL] Conectado com sucesso ao banco '${databaseConfig.name}' em ${databaseConfig.host}:${databaseConfig.port} (usuário: ${databaseConfig.user})!`);

    await ensureDatabaseSchema();
    await syncDataFromMySQL();
  } catch (err: any) {
    isDbConnected = false;
    dbConnectionError = err.message || 'Erro de conexão';
    console.log(`[MySQL] Banco local '${databaseConfig.name}' não conectado (${err.code || err.message}).`);
    console.log(`[MySQL] O servidor está operando com armazenamento em memória com fallback automático e total persistência durante a sessão.`);
  }
}

// Sincroniza dados entre o MySQL e o armazenamento
async function syncDataFromMySQL() {
  if (!dbPool || !isDbConnected) return;
  try {
    // 1. Usuários
    try {
      const [uRows]: any = await dbPool.query('SELECT * FROM usuarios');
      if (Array.isArray(uRows)) {
        if (uRows.length > 0) {
          usersStore = uRows.map((r: any, idx: number) => ({
            id: String(r.id || r.codigo || idx + 1),
            name: r.nome || 'Usuário',
            email: r.email || '',
            userType: (r.tipo_usuario === 'PROPRIETARIO' ? 'ADM_MASTER' : (r.tipo_usuario || 'USUARIO')) as UserType,
            role: r.perfil || 'cliente',
            passwordHash: r.senha_hash || undefined,
            active: Boolean(r.ativo !== undefined ? (r.ativo === 1 || r.ativo === true || r.ativo === '1') : true),
            createdAt: r.criado_em ? new Date(r.criado_em).toISOString() : new Date().toISOString(),
            avatarUrl: r.avatar_url || (r.tipo_usuario === 'PROPRIETARIO' 
              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
              : undefined),
            city: r.cidade_padrao || 'São Paulo',
            uf: r.uf_padrao || 'SP'
          }));
          console.log(`[MySQL] Sincronizados ${usersStore.length} usuários da base relacional ${databaseConfig.name}.`);
        }
      }
    } catch (uErr: any) {
      console.warn('[MySQL] Aviso ao sincronizar usuários:', uErr.message);
    }

    // 2. Materiais
    try {
      const [mRows]: any = await dbPool.query('SELECT * FROM materiais');
      if (Array.isArray(mRows) && mRows.length > 0) {
        materialsStore = mRows.map((r: any, idx: number) => {
          const code = String(r.codigo || r.id || idx + 1);
          const catalogItem = BASE_MATERIALS_CATALOG.find((item) => item.id === code);
          const storedPrice = Number.parseFloat(r.preco);
          return {
          id: code,
          name: r.nome || 'Material',
          description: r.descricao || '',
          unit: r.unidade_comercial || r.unidade || r.unidade_base || 'unidade',
          price: Number.isFinite(storedPrice) && storedPrice > 0 ? storedPrice : catalogItem?.basePrice || 0,
          minQuantity: parseInt(r.quantidade_minima) || 10,
          status: (r.status || (r.ativo ? 'ativo' : 'inativo')) as 'ativo' | 'inativo',
          category: r.categoria || 'Geral',
          updatedAt: r.criado_em || new Date().toISOString()
        };
        });
        console.log(`[MySQL] Sincronizados ${materialsStore.length} materiais da base relacional.`);
      }
    } catch (mErr: any) {
      console.warn('[MySQL] Aviso ao sincronizar materiais:', mErr.message);
    }

    // 3. Histórico de Auditoria
    try {
      const [hRows]: any = await dbPool.query('SELECT * FROM historico LIMIT 100');
      if (Array.isArray(hRows) && hRows.length > 0) {
        auditLogsStore = hRows.map((r: any, idx: number) => ({
          id: String(r.id || idx + 1),
          action: r.acao || 'Ação',
          description: r.descricao || '',
          userId: r.usuario_id ? String(r.usuario_id) : undefined,
          userName: r.usuario_nome || 'Sistema',
          userEmail: r.usuario_email,
          userType: (r.tipo_usuario || 'USUARIO') as UserType,
          createdAt: r.criado_em || new Date().toISOString(),
          ip: r.ip_origem || '127.0.0.1'
        })).reverse();
      }
    } catch (hErr: any) {
      console.warn('[MySQL] Aviso ao sincronizar histórico:', hErr.message);
    }

    try {
      const [settingsRows]: any = await dbPool.query(
        "SELECT valor_json FROM configuracoes_sistema WHERE chave = 'calculation_settings' LIMIT 1"
      );
      if (settingsRows.length > 0) {
        const stored = typeof settingsRows[0].valor_json === 'string'
          ? JSON.parse(settingsRows[0].valor_json)
          : settingsRows[0].valor_json;
        if (isCalculationSettings(stored)) calculationSettings = stored;
      }
    } catch (settingsError: any) {
      console.warn('[MySQL] Aviso ao carregar configurações de cálculo:', settingsError.message);
    }

    try {
      const [systemRows]: any = await dbPool.query(
        "SELECT valor_json FROM configuracoes_sistema WHERE chave = 'system_settings' LIMIT 1"
      );
      if (systemRows.length > 0) {
        const stored = typeof systemRows[0].valor_json === 'string' ? JSON.parse(systemRows[0].valor_json) : systemRows[0].valor_json;
        if (isSystemSettings(stored)) systemSettings = stored;
      }
    } catch (settingsError: any) {
      console.warn('[MySQL] Aviso ao carregar configurações do sistema:', settingsError.message);
    }
  } catch (err: any) {
    console.warn('[MySQL] Aviso durante sincronização inicial:', err.message);
  }
}

// Cria/garante tabelas no MySQL se estiver ativo
async function ensureDatabaseSchema() {
  if (!dbPool || !isDbConnected) return;
  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(150) NOT NULL,
        email VARCHAR(180) NOT NULL UNIQUE,
        senha_hash VARCHAR(255) NULL,
        perfil VARCHAR(50) DEFAULT 'proprietario',
        tipo_usuario ENUM('PROPRIETARIO', 'ADM', 'USUARIO') NOT NULL DEFAULT 'USUARIO',
        uf_padrao VARCHAR(2) DEFAULT 'SP',
        cidade_padrao VARCHAR(100) DEFAULT 'São Paulo',
        ativo BOOLEAN DEFAULT TRUE,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS configuracoes_sistema (
        chave VARCHAR(100) PRIMARY KEY,
        valor_json JSON NOT NULL,
        atualizado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await dbPool.query(`
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
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await dbPool.query(`
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
    `);
    await dbPool.query(`
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
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS orcamentos (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        owner_user_id VARCHAR(80) NULL,
        titulo VARCHAR(150) NOT NULL,
        cliente_nome VARCHAR(150) NULL,
        tipo_obra VARCHAR(50) NOT NULL,
        custo_total_estimado DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'rascunho',
        dados_localizacao JSON NULL,
        resultado_calculo JSON NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS calculos (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        owner_user_id VARCHAR(80) NULL,
        tipo_obra VARCHAR(50) NOT NULL,
        parametros_json JSON NOT NULL,
        resultado_json JSON NOT NULL,
        criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_calculos_tipo_data (tipo_obra, criado_em)
      ) ENGINE=InnoDB;
    `);

    const [budgetColumns]: any = await dbPool.query("SHOW COLUMNS FROM orcamentos LIKE 'owner_user_id'");
    if (budgetColumns.length === 0) {
      await dbPool.query('ALTER TABLE orcamentos ADD COLUMN owner_user_id VARCHAR(80) NULL');
    }
    const budgetCompatibilityColumns = [
      ['cliente_nome', 'VARCHAR(150) NULL'],
      ['tipo_obra', 'VARCHAR(50) NULL'],
      ['custo_total_estimado', 'DECIMAL(12,2) NOT NULL DEFAULT 0.00'],
      ['dados_localizacao', 'JSON NULL'],
      ['resultado_calculo', 'JSON NULL']
    ] as const;
    for (const [column, definition] of budgetCompatibilityColumns) {
      const [columns]: any = await dbPool.query(`SHOW COLUMNS FROM orcamentos LIKE '${column}'`);
      if (columns.length === 0) {
        await dbPool.query(`ALTER TABLE orcamentos ADD COLUMN ${column} ${definition}`);
      }
    }
    const [calculationColumns]: any = await dbPool.query("SHOW COLUMNS FROM calculos LIKE 'owner_user_id'");
    if (calculationColumns.length === 0) {
      await dbPool.query('ALTER TABLE calculos ADD COLUMN owner_user_id VARCHAR(80) NULL');
    }

    console.log('[MySQL] Tabelas de usuários, histórico, materiais, orçamentos e cálculos verificadas com sucesso.');
  } catch (err: any) {
    console.warn('[MySQL] Aviso de verificação de schema:', err.message);
  }
}

app.use(express.json());
app.use('/api/calculos/salvos', authenticateToken, createSavedCalculationsRouter({
  getPool: () => dbPool,
  isConnected: () => isDbConnected
}));

// -------------------------------------------------------------
// SEGURANÇA CRIPTOGRÁFICA DE SENHAS ÚNICAS (SHA-256 + SALT)
// -------------------------------------------------------------
function hashPassword(plainText: string): string {
  if (!plainText) return '';
  return crypto.createHash('sha256').update(`construtec_unique_salt_${plainText.trim()}`).digest('hex');
}

function verifyPassword(providedPassword: string, storedHashOrPlain?: string): boolean {
  if (!providedPassword || !storedHashOrPlain) return false;
  const provided = providedPassword.trim();
  const calculatedHash = hashPassword(provided);
  // 1. Confere hash criptográfico único
  if (calculatedHash === storedHashOrPlain) return true;
  // 2. Confere texto simples se estiver em memória
  if (provided === storedHashOrPlain.trim()) return true;
  // 3. Confere hash padrão para credencial inicial 123456
  if (storedHashOrPlain === hashPassword('123456') && provided === '123456') return true;
  return false;
}

function isMasterUser(user: Pick<AdminUser, 'userType'> | undefined): boolean {
  return user?.userType === 'ADM_MASTER' || user?.userType === 'PROPRIETARIO';
}

function toPublicUser(user: AdminUser) {
  const { password, passwordHash, ...safeUser } = user;
  return safeUser;
}

// -------------------------------------------------------------
// DADOS EM MEMÓRIA (SEED E FALLBACK ROBUSTO)
// -------------------------------------------------------------

// 1. Usuários do sistema (ADM Master, ADM e Usuários comuns)
let usersStore: AdminUser[] = [
  {
    id: 'usr_prop_1',
    name: 'Jorvane Santos',
    email: 'jorvanesantos@gmail.com',
    passwordHash: hashPassword('123456'),
    userType: 'ADM_MASTER',
    role: 'ADM Master Geral',
    active: true,
    createdAt: '2026-01-15T10:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    phone: '(11) 98765-4321',
    city: 'São Paulo',
    uf: 'SP'
  },
  {
    id: 'usr_prop_2',
    name: 'Jorvane Santos (Corp)',
    email: 'jorvane@construtec.com.br',
    passwordHash: hashPassword('123456'),
    userType: 'ADM_MASTER',
    role: 'ADM Master Geral',
    active: true,
    createdAt: '2026-01-15T10:00:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    phone: '(11) 98765-4321',
    city: 'São Paulo',
    uf: 'SP'
  },
  {
    id: 'usr_adm_1',
    name: 'Carlos Silva (Engenheiro Chefe)',
    email: 'adm@construtec.com.br',
    passwordHash: hashPassword('123456'),
    userType: 'ADM',
    role: 'ADM Técnico / Obras',
    active: true,
    createdAt: '2026-02-01T08:30:00.000Z',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    phone: '(11) 99123-5566',
    city: 'São Paulo',
    uf: 'SP'
  },
  {
    id: 'usr_user_1',
    name: 'Maria Oliveira',
    email: 'maria@gmail.com',
    passwordHash: hashPassword('123456'),
    userType: 'USUARIO',
    role: 'Usuário',
    active: true,
    createdAt: '2026-02-14T14:20:00.000Z',
    phone: '(31) 98877-2233',
    city: 'Belo Horizonte',
    uf: 'MG'
  },
  {
    id: 'usr_user_2',
    name: 'Carlos Mendes',
    email: 'carlos@gmail.com',
    passwordHash: hashPassword('123456'),
    userType: 'USUARIO',
    role: 'Usuário',
    active: true,
    createdAt: '2026-02-20T11:45:00.000Z',
    phone: '(21) 97766-3344',
    city: 'Rio de Janeiro',
    uf: 'RJ'
  }
];

// 2. Materiais cadastrados pelo ADM com os itens solicitados pelo usuário
let materialsStore: AdminMaterial[] = [
  {
    id: 'mat_1',
    name: 'Cimento Portland CP-II',
    description: 'Cimento composto de alta resistência para fundações, alvenaria e reboco.',
    unit: 'saco',
    price: 42.00,
    minQuantity: 20,
    status: 'ativo',
    category: 'Aglomerantes',
    updatedAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 'mat_2',
    name: 'Tinta Acrílica Premium Fosca',
    description: 'Tinta lavável e antimofo de altíssima cobertura para acabamento interno e externo.',
    unit: 'litro',
    price: 35.00,
    minQuantity: 10,
    status: 'ativo',
    category: 'Pintura',
    updatedAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 'mat_3',
    name: 'Tijolo Cerâmico 8 Furos (9x19x19 cm)',
    description: 'Tijolo vazado cerâmico de vedação padrão com excelente isolamento termoacústico.',
    unit: 'unidade',
    price: 1.20,
    minQuantity: 500,
    status: 'ativo',
    category: 'Alvenaria',
    updatedAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 'mat_4',
    name: 'Areia Média Lavada',
    description: 'Areia natural lavada e isenta de matéria orgânica para preparo de argamassas e concreto.',
    unit: 'm³',
    price: 110.00,
    minQuantity: 5,
    status: 'ativo',
    category: 'Agregados',
    updatedAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 'mat_5',
    name: 'Pedra Brita 1 (9,5 a 19mm)',
    description: 'Brita de gnaisse/basalto calibrada para concreto estrutural e vigas.',
    unit: 'm³',
    price: 125.00,
    minQuantity: 5,
    status: 'ativo',
    category: 'Agregados',
    updatedAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 'mat_6',
    name: 'Bloco de Concreto 14x19x39 cm',
    description: 'Bloco de concreto vibro-prensado para alvenaria de vedação e estrutural leve.',
    unit: 'unidade',
    price: 4.60,
    minQuantity: 200,
    status: 'ativo',
    category: 'Alvenaria',
    updatedAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 'mat_7',
    name: 'Argamassa Colante AC-I',
    description: 'Argamassa para assentamento de pisos e azulejos em áreas internas secas.',
    unit: 'saco 20kg',
    price: 17.50,
    minQuantity: 15,
    status: 'ativo',
    category: 'Argamassas',
    updatedAt: '2026-03-01T10:00:00.000Z'
  },
  {
    id: 'mat_8',
    name: 'Porcelanato Polido 80x80 cm',
    description: 'Porcelanato retificado extra com absorção menor que 0,5% e acabamento espelhado.',
    unit: 'm²',
    price: 89.00,
    minQuantity: 25,
    status: 'ativo',
    category: 'Pisos',
    updatedAt: '2026-03-01T10:00:00.000Z'
  }
];

materialsStore = BASE_MATERIALS_CATALOG.map((material) => ({
  id: material.id,
  name: material.name,
  description: material.description,
  unit: material.commercialUnit,
  price: material.basePrice,
  minQuantity: 10,
  status: 'ativo',
  category: material.category,
  updatedAt: material.updatedAt
}));

// 3. Tipos de Construção (controlados pelo ADM)
let workTypesStore: AdminWorkType[] = [
  {
    id: 'wt_1',
    code: 'muro',
    name: 'Muro',
    description: 'Alvenaria de fechamento perimetral em blocos de concreto ou cerâmicos com vigamento.',
    category: 'alvenaria',
    defaultWaste: 10,
    icon: 'ShieldAlert',
    active: true,
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'wt_2',
    code: 'parede',
    name: 'Parede',
    description: 'Paredes internas e externas com opções de chapisco, emboço e reboco.',
    category: 'alvenaria',
    defaultWaste: 10,
    icon: 'BrickWall',
    active: true,
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'wt_3',
    code: 'piso',
    name: 'Piso',
    description: 'Assentamento de cerâmicas, porcelanatos e contrapiso nivelador.',
    category: 'acabamento',
    defaultWaste: 12,
    icon: 'Grid3X3',
    active: true,
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'wt_4',
    code: 'pintura',
    name: 'Pintura',
    description: 'Preparação com selador, emassamento e aplicação de demãos de tinta acrílica.',
    category: 'acabamento',
    defaultWaste: 8,
    icon: 'Paintbrush',
    active: true,
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'wt_5',
    code: 'concreto',
    name: 'Concreto',
    description: 'Concreto virado ou usinado com traço estrutural, fck e dosagem por volume.',
    category: 'estrutural',
    defaultWaste: 10,
    icon: 'Box',
    active: true,
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'wt_6',
    code: 'fundacao',
    name: 'Fundação',
    description: 'Sapatas isoladas, estacas, brocas e vigas baldrame com armadura de aço.',
    category: 'estrutural',
    defaultWaste: 12,
    icon: 'Anchor',
    active: true,
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'wt_7',
    code: 'telhado',
    name: 'Telhado',
    description: 'Estrutura de madeira ou metálica com telhas cerâmicas ou fibrocimento.',
    category: 'cobertura',
    defaultWaste: 10,
    icon: 'Home',
    active: true,
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'wt_8',
    code: 'revestimento',
    name: 'Revestimento',
    description: 'Azulejos e pastilhas para banheiros, cozinhas e fachadas prediais.',
    category: 'acabamento',
    defaultWaste: 10,
    icon: 'Layers',
    active: true,
    createdAt: '2026-01-10T00:00:00.000Z'
  },
  {
    id: 'wt_9',
    code: 'outro',
    name: 'Outra obra',
    description: 'Reformas pontuais, contrapisos, demolições e reparos civis diversos.',
    category: 'geral',
    defaultWaste: 10,
    icon: 'Wrench',
    active: true,
    createdAt: '2026-01-10T00:00:00.000Z'
  }
];

// 4. Obras cadastradas pelos usuários com o formato exato solicitado pelo usuário:
// Usuário       Obra             Tipo
// Jorvane       Muro da casa     Muro
// Carlos        Reforma          Pintura
// Maria         Piso cozinha     Piso
let userWorksStore: AdminUserWork[] = [
  {
    id: 'obra_1',
    userId: 'usr_prop_1',
    userName: 'Jorvane Santos',
    userEmail: 'jorvane@construtec.com.br',
    title: 'Muro da casa',
    workType: 'muro',
    workTypeName: 'Muro',
    status: 'aprovado',
    totalCost: 5840.00,
    locationCity: 'São Paulo',
    locationUf: 'SP',
    createdAt: '2026-03-02T14:30:00.000Z'
  },
  {
    id: 'obra_2',
    userId: 'usr_user_2',
    userName: 'Carlos Mendes',
    userEmail: 'carlos@gmail.com',
    title: 'Reforma',
    workType: 'pintura',
    workTypeName: 'Pintura',
    status: 'em_andamento',
    totalCost: 2150.00,
    locationCity: 'Rio de Janeiro',
    locationUf: 'RJ',
    createdAt: '2026-03-03T11:00:00.000Z'
  },
  {
    id: 'obra_3',
    userId: 'usr_user_1',
    userName: 'Maria Oliveira',
    userEmail: 'maria@gmail.com',
    title: 'Piso cozinha',
    workType: 'piso',
    workTypeName: 'Piso',
    status: 'aprovado',
    totalCost: 3720.50,
    locationCity: 'Belo Horizonte',
    locationUf: 'MG',
    createdAt: '2026-03-04T09:15:00.000Z'
  }
];

let supportTicketsStore: SupportTicket[] = [];

// 5. Histórico do sistema (Auditoria) com ações requeridas:
// LOGIN, CRIAR_CALCULO, EDITAR_OBRA, EXCLUIR_OBRA, CADASTRAR_USUARIO, EDITAR_MATERIAL, CADASTRAR_ADM, etc.
let auditLogsStore: SystemAuditLog[] = [
  {
    id: 'log_1',
    action: 'LOGIN',
    description: 'Proprietário Jorvane Santos realizou login no sistema com sucesso.',
    userId: 'usr_prop_1',
    userName: 'Jorvane Santos',
    userEmail: 'jorvane@construtec.com.br',
    userType: 'PROPRIETARIO',
    createdAt: '2026-03-05T08:00:00.000Z',
    ip: '189.40.122.15'
  },
  {
    id: 'log_2',
    action: 'CADASTRAR_ADM',
    description: 'Proprietário cadastrou novo Administrador: Carlos Silva (Engenheiro Chefe).',
    userId: 'usr_prop_1',
    userName: 'Jorvane Santos',
    userEmail: 'jorvane@construtec.com.br',
    userType: 'PROPRIETARIO',
    createdAt: '2026-03-05T08:15:00.000Z',
    ip: '189.40.122.15'
  },
  {
    id: 'log_3',
    action: 'EDITAR_MATERIAL',
    description: 'Administrador atualizou o preço do insumo Cimento Portland CP-II para R$ 42,00.',
    userId: 'usr_adm_1',
    userName: 'Carlos Silva (ADM)',
    userEmail: 'adm@construtec.com.br',
    userType: 'ADM',
    createdAt: '2026-03-05T08:45:00.000Z',
    ip: '177.18.204.88'
  },
  {
    id: 'log_4',
    action: 'CRIAR_CALCULO',
    description: 'Usuário Maria Oliveira calculou e salvou obra: Piso cozinha.',
    userId: 'usr_user_1',
    userName: 'Maria Oliveira',
    userEmail: 'maria@gmail.com',
    userType: 'USUARIO',
    createdAt: '2026-03-05T09:30:00.000Z',
    ip: '191.33.15.70'
  },
  {
    id: 'log_5',
    action: 'CADASTRAR_USUARIO',
    description: 'Novo usuário Carlos Mendes completou cadastro via plataforma.',
    userId: 'usr_user_2',
    userName: 'Carlos Mendes',
    userEmail: 'carlos@gmail.com',
    userType: 'USUARIO',
    createdAt: '2026-03-05T10:10:00.000Z',
    ip: '201.86.44.12'
  }
];

// Helper para registrar no Histórico do Sistema
async function recordAuditLog(
  action: SystemAuditLog['action'],
  description: string,
  user?: { id?: string; name?: string; email?: string; userType?: UserType },
  req?: Request
) {
  const ip = req ? (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1') : '127.0.0.1';
  const newLog: SystemAuditLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    action,
    description,
    userId: user?.id,
    userName: user?.name || 'Sistema ConstruTec',
    userEmail: user?.email || 'sistema@construtec.com.br',
    userType: user?.userType || 'USUARIO',
    createdAt: new Date().toISOString(),
    ip
  };

  auditLogsStore.unshift(newLog);
  if (auditLogsStore.length > 500) {
    auditLogsStore.pop();
  }

  // Grava no MySQL se conectado
  if (isDbConnected && dbPool) {
    try {
      const numericUserId = user?.id && /^\d+$/.test(user.id) ? Number(user.id) : null;
      await dbPool.query(
        `INSERT INTO historico (usuario_id, usuario_nome, usuario_email, tipo_usuario, acao, descricao, ip_origem)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          numericUserId,
          newLog.userName,
          newLog.userEmail || null,
          newLog.userType === 'ADM_MASTER' ? 'PROPRIETARIO' : newLog.userType,
          newLog.action,
          newLog.description,
          ip
        ]
      );
    } catch (e) {
      // fallback
    }
  }
}

// In-memory store for budgets
let budgetsStore: SavedBudget[] = [
  {
    id: 'orc_1',
    title: 'Muro da casa',
    clientName: 'Jorvane Santos',
    location: REGIONAL_LOCATIONS[0],
    workType: 'muro',
    workTypeName: 'Muro',
    calculationResult: CalculationService.calculateMuro({
      length: 24,
      height: 2.2,
      blockType: 'bloco_14',
      doorsCount: 1,
      doorWidth: 0.9,
      doorHeight: 2.1,
      wastePercentage: 10,
      location: REGIONAL_LOCATIONS[0]
    }),
    status: 'aprovado',
    createdAt: '2026-03-02T14:30:00.000Z',
    updatedAt: '2026-03-02T14:30:00.000Z',
    notes: 'Bloco de concreto 14x19x39cm com pilar a cada 2,5m.'
  },
  {
    id: 'orc_2',
    title: 'Reforma',
    clientName: 'Carlos Mendes',
    location: REGIONAL_LOCATIONS[1],
    workType: 'pintura',
    workTypeName: 'Pintura',
    calculationResult: CalculationService.calculatePintura({
      wallLength: 28,
      height: 2.8,
      wallsCount: 1,
      includeCeiling: true,
      ceilingArea: 32,
      doorsCount: 3,
      windowsCount: 2,
      coats: 2,
      needsSealer: true,
      needsPutty: true,
      wastePercentage: 8,
      location: REGIONAL_LOCATIONS[1]
    }),
    status: 'em_andamento',
    createdAt: '2026-03-03T11:00:00.000Z',
    updatedAt: '2026-03-03T11:00:00.000Z',
    notes: 'Tinta acrílica lavável cor palha.'
  },
  {
    id: 'orc_3',
    title: 'Piso cozinha',
    clientName: 'Maria Oliveira',
    location: REGIONAL_LOCATIONS[2],
    workType: 'piso',
    workTypeName: 'Piso',
    calculationResult: CalculationService.calculatePiso({
      length: 5.5,
      width: 3.8,
      tileType: 'porcelanato',
      tileSizeCm: 80,
      wastePercentage: 10,
      location: REGIONAL_LOCATIONS[2]
    }),
    status: 'aprovado',
    createdAt: '2026-03-04T09:15:00.000Z',
    updatedAt: '2026-03-04T09:15:00.000Z',
    notes: 'Porcelanato acetinado retificado 80x80cm.'
  }
];

// -------------------------------------------------------------
// MIDDLEWARES DE SEGURANÇA NO BACKEND (REQUISITO FUNDAMENTAL)
// -------------------------------------------------------------

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    userType: UserType;
    role: string;
  };
}

// Middleware 1: Validação de Token JWT
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Não autorizado',
      message: 'Token de autenticação não fornecido no cabeçalho Authorization.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({
        error: 'Acesso Proibido',
        message: 'Token inválido ou sessão expirada. Faça login novamente.'
      });
    }
    const currentUser = usersStore.find(user => user.id === String(decoded.id) && user.email.toLowerCase() === String(decoded.email).toLowerCase());
    if (!currentUser) {
      return res.status(401).json({ error: 'Sessão inválida.', message: 'A conta associada a esta sessão não está mais disponível.' });
    }
    if (!currentUser.active) {
      return res.status(403).json({ error: 'Conta desativada.', message: 'Entre em contato com a administração.' });
    }
    const userType = currentUser.userType === 'PROPRIETARIO' ? 'ADM_MASTER' : currentUser.userType;
    if (userType !== 'USUARIO' && userType !== 'ADM' && userType !== 'ADM_MASTER') {
      return res.status(403).json({ error: 'Perfil de conta inválido.' });
    }
    req.user = {
      id: currentUser.id,
      email: currentUser.email,
      name: currentUser.name,
      userType,
      role: currentUser.role
    };
    next();
  });
}

// Middleware 2: Requer papel de Administrador ou ADM Master
function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }

  const isAdminOrMaster = req.user.userType === 'ADM' || req.user.userType === 'ADM_MASTER' || req.user.userType === 'PROPRIETARIO';
  if (!isAdminOrMaster) {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Esta rota é restrita a Administradores (ADM e ADM Master) do ConstruTec.'
    });
  }

  next();
}

// Middleware 3: Requer papel estrito de ADM Master (Exclusivo para gestão de ADMs e ADM Masters)
function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Autenticação necessária.' });
  }

  const isMaster = req.user.userType === 'ADM_MASTER' || req.user.userType === 'PROPRIETARIO';
  if (!isMaster) {
    return res.status(403).json({
      error: 'Acesso restrito ao ADM Master',
      message: 'Somente um ADM Master credenciado pode cadastrar ou alterar status de outros Administradores.'
    });
  }

  next();
}
const requireMaster = requireOwner;

// -------------------------------------------------------------
// ENDPOINTS DE AUTENTICAÇÃO E DIAGNÓSTICO
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    system: 'ConstruTec API REST & Admin Engine',
    version: '2.0.0',
    database: {
      connected: isDbConnected,
      host: databaseConfig.host,
      port: databaseConfig.port,
      database: databaseConfig.name,
      user: databaseConfig.user,
      error: dbConnectionError
    },
    timestamp: new Date().toISOString()
  });
});

// GET /api/status-banco - Diagnóstico de conexão com MySQL
app.get('/api/status-banco', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  let pingOk = false;
  if (dbPool && isDbConnected) {
    try {
      const conn = await dbPool.getConnection();
      await conn.ping();
      conn.release();
      pingOk = true;
    } catch (e) {
      pingOk = false;
    }
  }

  const activeOwnersCount = usersStore.filter(u => u.userType === 'PROPRIETARIO' && u.active).length;

  res.json({
    sucesso: pingOk || isDbConnected,
    mensagem: (pingOk || isDbConnected)
      ? `Conectado com sucesso ao MySQL '${databaseConfig.name}' em ${databaseConfig.host}:${databaseConfig.port}!`
      : `Banco de dados MySQL local não respondeu em ${databaseConfig.host}:${databaseConfig.port}. O sistema está operando em memória com segurança ativa no backend.`,
    configuracao: {
      host: databaseConfig.host,
      port: databaseConfig.port,
      user: databaseConfig.user,
      database: databaseConfig.name
    },
    modo_armazenamento: (pingOk || isDbConnected) ? 'MySQL Relacional Ativo' : 'Memória com Fallback Seguro',
    tabelas_esperadas: ['usuarios', 'historico', 'materiais', 'orcamentos', 'localizacoes', 'tipos_obra'],
    proprietarios_ativos: activeOwnersCount,
    limite_proprietarios: 5
  });
});

// POST /api/conectar-banco - Força teste de conexão e sincronização com MySQL
app.post('/api/conectar-banco', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  await initDatabase();
  await syncDataFromMySQL();
  res.json({
    sucesso: isDbConnected,
    mensagem: isDbConnected
      ? `Conectado com sucesso ao MySQL '${databaseConfig.name}' em ${databaseConfig.host}:${databaseConfig.port}! Dados sincronizados com sucesso.`
      : `Não foi possível conectar ao MySQL em ${databaseConfig.host}:${databaseConfig.port} (${dbConnectionError || 'Falha de conexão'}).`,
    configuracao: {
      host: databaseConfig.host,
      port: databaseConfig.port,
      user: databaseConfig.user,
      database: databaseConfig.name
    }
  });
});

// POST /api/auth/login - Login unificado para Usuário Comum, ADM e Proprietário
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'E-mail é obrigatório para acessar o sistema.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Formato de e-mail inválido. Utilize nome@dominio.com.' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'A senha é obrigatória e deve ter no mínimo 6 caracteres.' });
  }

  // Se o banco estiver conectado, busca o usuário diretamente no MySQL
  let foundUser: AdminUser | undefined;
  if (isDbConnected && dbPool) {
    try {
      const [uRows]: any = await dbPool.query('SELECT * FROM usuarios WHERE LOWER(email) = LOWER(?) LIMIT 1', [cleanEmail]);
      if (Array.isArray(uRows) && uRows.length > 0) {
        const r = uRows[0];
        const rawType = r.tipo_usuario || 'USUARIO';
        const normalizedType: UserType = (rawType === 'PROPRIETARIO' ? 'ADM_MASTER' : rawType) as UserType;
        foundUser = {
          id: String(r.id || r.codigo),
          name: r.nome || 'Usuário',
          email: r.email || cleanEmail,
          userType: normalizedType,
          role: r.perfil || 'gestor',
          passwordHash: r.senha_hash || undefined,
          active: Boolean(r.ativo !== undefined ? (r.ativo === 1 || r.ativo === true || r.ativo === '1') : true),
          createdAt: r.criado_em ? new Date(r.criado_em).toISOString() : new Date().toISOString(),
          avatarUrl: r.avatar_url,
          city: r.cidade_padrao || 'São Paulo',
          uf: r.uf_padrao || 'SP'
        };
        // Atualiza na memória também
        const mIdx = usersStore.findIndex(u => u.email.toLowerCase() === cleanEmail);
        if (mIdx !== -1) {
          usersStore[mIdx] = foundUser;
        } else {
          usersStore.push(foundUser);
        }
      }
    } catch (e: any) {
      console.warn('[MySQL] Erro ao buscar usuário para login no MySQL:', e.message);
    }
  }

  if (!foundUser) {
    foundUser = usersStore.find(u => u.email.toLowerCase() === cleanEmail);
  }

  // Se não existir, avisa que o usuário precisa se registrar primeiro
  if (!foundUser) {
    return res.status(404).json({
      error: 'Usuário não encontrado',
      message: 'Não encontramos nenhuma conta com este e-mail. Por favor, clique na aba "Novo cadastro" para criar sua conta.'
    });
  }

  // 2. Validação estrita da senha única e exclusiva do usuário
  const userPasswordHash = foundUser.passwordHash || (foundUser as any).senha_hash || foundUser.password;
  if (!verifyPassword(password, userPasswordHash)) {
    await recordAuditLog('LOGIN_FALHA', `Tentativa de login com senha incorreta para o e-mail: ${cleanEmail}.`, undefined, req);
    return res.status(401).json({
      error: 'Senha incorreta',
      message: 'A senha informada está incorreta para este e-mail. Digite a senha cadastrada para sua conta.'
    });
  }

  // 3. Verifica se o usuário está ativo
  if (!foundUser.active) {
    return res.status(403).json({
      error: 'Conta desativada',
      message: 'Sua conta foi desativada temporariamente pela administração do sistema.'
    });
  }

  const safeUserType: UserType = (foundUser.userType === 'PROPRIETARIO' ? 'ADM_MASTER' : foundUser.userType) as UserType;

  // Gera Token JWT assinado
  const token = jwt.sign(
    { 
      id: foundUser.id, 
      email: foundUser.email, 
      name: foundUser.name, 
      userType: safeUserType, 
      role: foundUser.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Registra no histórico do sistema
  await recordAuditLog('LOGIN', `Login com e-mail realizado com sucesso por ${foundUser.name} [${safeUserType}].`, foundUser, req);

  res.json({
    token,
    user: {
      ...toPublicUser(foundUser),
      userType: safeUserType,
      isLoggedIn: true,
      defaultLocation: REGIONAL_LOCATIONS[0]
    }
  });
});

// POST /api/auth/register - Cadastro seguro com validação de formato e e-mail
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Nome completo é obrigatório (mínimo 2 caracteres).' });
  }

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'E-mail é obrigatório para cadastrar.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Formato de e-mail inválido. Digite um e-mail válido (ex: nome@empresa.com).' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'A senha deve conter no mínimo 6 caracteres.' });
  }

  // Sincroniza dados com MySQL antes de checar duplicidade
  if (isDbConnected && dbPool) {
    await syncDataFromMySQL();
  }

  // Checa se e-mail já existe
  const existingUser = usersStore.find(u => u.email.toLowerCase() === cleanEmail);
  if (existingUser) {
    return res.status(400).json({ 
      error: 'E-mail já cadastrado',
      message: 'Já existe um cadastro com este endereço de e-mail. Utilize a aba "Já tenho conta" para entrar.' 
    });
  }

  // Regra de segurança hierárquica: Novos cadastros via tela pública são sempre 'USUARIO'
  // Apenas ADM Masters autenticados podem promover alguém a ADM ou ADM Master
  const resolvedType: UserType = 'USUARIO';
  const hashedPassword = hashPassword(password);

  const newUser: AdminUser = {
    id: `usr_${crypto.randomUUID()}`,
    name: name.trim(),
    email: cleanEmail,
    passwordHash: hashedPassword,
    userType: resolvedType,
    role: role || 'cliente',
    active: true,
    createdAt: new Date().toISOString(),
    city: 'São Paulo',
    uf: 'SP'
  };

  // Grava no MySQL se conectado
  if (isDbConnected && dbPool) {
    try {
      const [ins]: any = await dbPool.query(
        `INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, perfil, cidade_padrao, uf_padrao, ativo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [newUser.name, newUser.email, hashedPassword, newUser.userType, newUser.role, newUser.city, newUser.uf, 1]
      );
      if (ins?.insertId) {
        newUser.id = String(ins.insertId);
      }
    } catch (dbErr: any) {
      console.warn('[MySQL] Erro ao cadastrar novo usuário no banco:', dbErr.message);
    }
  }

  usersStore.push(newUser);
  await recordAuditLog('CADASTRAR_USUARIO', `Novo usuário ${newUser.name} cadastrou-se com e-mail ${newUser.email}.`, newUser, req);

  // Gera Token JWT
  const token = jwt.sign(
    { 
      id: newUser.id, 
      email: newUser.email, 
      name: newUser.name, 
      userType: newUser.userType, 
      role: newUser.role 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    token,
    user: {
      ...toPublicUser(newUser),
      isLoggedIn: true,
      defaultLocation: REGIONAL_LOCATIONS[0]
    }
  });
});

// POST /api/auth/google
app.post('/api/auth/google', async (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Login Google indisponível.',
    message: 'A integração OAuth ainda não está configurada; informe uma credencial verificada antes de habilitar este acesso.'
  });
});

// POST /api/auth/alterar-senha - Alterar senha do usuário autenticado para garantir senha única
app.post('/api/auth/alterar-senha', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ error: 'A senha atual é obrigatória para confirmar a alteração.' });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    const userId = req.user?.id;
    const userEmail = req.user?.email?.toLowerCase();
    const userObj = usersStore.find(u => u.id === userId || u.email.toLowerCase() === userEmail);
    if (!userObj) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Validação estrita da senha atual
    const currentHash = userObj.passwordHash || userObj.password;
    if (!verifyPassword(currentPassword, currentHash)) {
      return res.status(401).json({ 
        error: 'Senha atual incorreta', 
        message: 'A senha atual informada está incorreta. Digite sua senha correta para prosseguir.' 
      });
    }

    // Impede que a nova senha seja igual à senha atual
    if (verifyPassword(newPassword, currentHash)) {
      return res.status(400).json({
        error: 'Senha idêntica',
        message: 'A nova senha não pode ser igual à senha atual. Escolha uma senha diferente.'
      });
    }

    const newHash = hashPassword(newPassword);
    userObj.passwordHash = newHash;
    userObj.password = newHash;

    if (isDbConnected && dbPool) {
      try {
        await dbPool.query('UPDATE usuarios SET senha_hash = ? WHERE LOWER(email) = LOWER(?)', [newHash, userEmail]);
      } catch (e: any) {
        console.warn('[MySQL] Erro ao atualizar senha no banco:', e.message);
      }
    }

    await recordAuditLog('ALTERAR_SENHA', `Usuário ${userObj.name} alterou sua senha única de acesso com sucesso.`, userObj, req);
    res.json({ sucesso: true, message: 'Senha alterada com sucesso! Utilize sua nova senha nos próximos logins.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao alterar senha', message: err.message });
  }
});

app.patch('/api/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { name, email } = req.body ?? {};
  if (typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Informe um nome com pelo menos 2 caracteres.' });
  }
  if (typeof email !== 'string' || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) {
    return res.status(400).json({ error: 'Informe um endereço de e-mail válido.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const currentUser = usersStore.find(user => user.id === req.user!.id);
  if (!currentUser) return res.status(404).json({ error: 'Usuário não encontrado.' });
  if (usersStore.some(user => user.id !== currentUser.id && user.email.toLowerCase() === normalizedEmail)) {
    return res.status(409).json({ error: 'Este e-mail já está sendo usado por outra conta.' });
  }

  if (isDbConnected && dbPool) {
    try {
      await dbPool.execute('UPDATE usuarios SET nome = ?, email = ? WHERE id = ?', [name.trim(), normalizedEmail, currentUser.id]);
    } catch (error) {
      console.error('[MySQL] Erro ao atualizar perfil:', error);
      return res.status(500).json({ error: 'Não foi possível salvar as alterações do perfil.' });
    }
  }

  currentUser.name = name.trim();
  currentUser.email = normalizedEmail;
  const token = jwt.sign(
    { id: currentUser.id, email: currentUser.email, name: currentUser.name, userType: isMasterUser(currentUser) ? 'ADM_MASTER' : currentUser.userType, role: currentUser.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  await recordAuditLog('EDITAR_USUARIO', 'O usuário atualizou seu próprio perfil.', currentUser, req);
  res.json({ token, user: { ...toPublicUser(currentUser), isLoggedIn: true, defaultLocation: REGIONAL_LOCATIONS[0] } });
});

// POST /api/auth/recuperar-senha/solicitar - Solicitar código de recuperação de senha
app.post('/api/auth/recuperar-senha/solicitar', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'O e-mail é obrigatório para recuperação.' });
    }

    return res.status(503).json({
      error: 'Recuperação indisponível',
      message: 'A recuperação de senha por e-mail ainda não está configurada. Entre em contato com um administrador.'
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao solicitar recuperação', message: err.message });
  }
});

// POST /api/auth/recuperar-senha/redefinir - Redefinir senha com o código verificado
app.post('/api/auth/recuperar-senha/redefinir', async (req: Request, res: Response) => {
  res.status(503).json({
    error: 'Recuperação indisponível',
    message: 'A recuperação de senha por e-mail ainda não está configurada. Entre em contato com um administrador.'
  });
});

// -------------------------------------------------------------
// ENDPOINTS ADMINISTRATIVOS (PROTEGIDOS POR BACKEND)
// -------------------------------------------------------------

// 1. Dashboard Stats
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  if (isDbConnected && dbPool) {
    await syncDataFromMySQL();
  }
  const totalUsuarios = usersStore.length;
  const totalObras = userWorksStore.length;
  const totalCalculos = budgetsStore.length;
  const totalMateriais = materialsStore.length;
  const totalProprietarios = usersStore.filter(u => (u.userType === 'PROPRIETARIO' || u.userType === 'ADM_MASTER') && u.active).length;
  const totalAdms = usersStore.filter(u => u.userType === 'ADM' && u.active).length;

  res.json({
    stats: {
      totalUsuarios,
      totalObras,
      totalCalculos,
      totalMateriais,
      totalProprietarios,
      totalAdms,
      maxProprietarios: 5
    },
    recentObras: userWorksStore.slice(0, 5),
    recentUsers: usersStore.slice(0, 5).map(toPublicUser),
    recentActivities: auditLogsStore.slice(0, 8)
  });
});

// 2. Gestão de Usuários
// GET /api/admin/usuarios - Visualizar e pesquisar usuários sincronizados com MySQL
app.get('/api/admin/usuarios', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { q, tipo, status } = req.query;

  // Sincroniza em tempo real com MySQL para refletir inserções externas feitas no Workbench
  if (isDbConnected && dbPool) {
    await syncDataFromMySQL();
  }

  let result = [...usersStore];

  if (q && typeof q === 'string') {
    const search = q.toLowerCase();
    result = result.filter(u => 
      u.name.toLowerCase().includes(search) || 
      u.email.toLowerCase().includes(search)
    );
  }

  if (tipo && typeof tipo === 'string' && tipo !== 'TODOS') {
    result = result.filter(u => u.userType === tipo);
  }

  if (status && typeof status === 'string' && status !== 'TODOS') {
    const isActive = status === 'ativo';
    result = result.filter(u => u.active === isActive);
  }

  if (!isMasterUser(req.user)) {
    result = result.filter(u => u.userType === 'USUARIO');
  }
  res.json(result.map(toPublicUser));
});

// POST /api/admin/usuarios - Cadastrar ADM ou ADM MASTER (Apenas ADM Master pode fazer)
app.post('/api/admin/usuarios', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, email, userType, role, phone, city, uf, password } = req.body;

    if (typeof name !== 'string' || name.trim().length < 2 ||
        typeof email !== 'string' || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim()) ||
        typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Informe nome, e-mail válido e senha com pelo menos 6 caracteres.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Sincroniza antes de validar unicidade
    if (isDbConnected && dbPool) {
      await syncDataFromMySQL();
    }

    // Verifica se já existe esse e-mail
    if (usersStore.some(u => u.email.toLowerCase() === cleanEmail)) {
      return res.status(400).json({ error: 'Já existe um usuário cadastrado com este e-mail.' });
    }

    const targetType: UserType = (userType === 'ADM_MASTER' || userType === 'PROPRIETARIO') 
      ? 'ADM_MASTER' 
      : (userType === 'ADM' ? 'ADM' : 'USUARIO');
    if (!isMasterUser(req.user) && targetType !== 'USUARIO') {
      return res.status(403).json({ error: 'ADM Normal só pode cadastrar contas de usuários finais.' });
    }

    // REGRA DE NEGÓCIO VITAL: No máximo 5 ADM Masters no sistema
    if (targetType === 'ADM_MASTER') {
      const activeMasters = usersStore.filter(u => (u.userType === 'ADM_MASTER' || u.userType === 'PROPRIETARIO') && u.active);
      if (activeMasters.length >= 5) {
        return res.status(400).json({
          error: 'Limite de ADM Masters atingido',
          message: 'O sistema permite no máximo 5 ADM Masters ativos. Para cadastrar um novo, desative ou remova um ADM Master existente.'
        });
      }
    }

    // Senha única inicial definida pelo ADM Master ou gerada segura
    const hashedPassword = hashPassword(password);

    const newUser: AdminUser = {
      id: `usr_${crypto.randomUUID()}`,
      name: name.trim(),
      email: cleanEmail,
      passwordHash: hashedPassword,
      userType: targetType,
      role: role || (targetType === 'ADM' ? 'engenheiro' : 'gestor'),
      active: true,
      createdAt: new Date().toISOString(),
      phone: phone || '',
      city: city || 'São Paulo',
      uf: uf || 'SP'
    };

    // Insere no banco MySQL relacional
    if (isDbConnected && dbPool) {
      try {
        const [insertRes]: any = await dbPool.query(
          `INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, perfil, cidade_padrao, uf_padrao, ativo)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [newUser.name, newUser.email, hashedPassword, newUser.userType === 'ADM_MASTER' ? 'PROPRIETARIO' : newUser.userType, newUser.role, newUser.city, newUser.uf, 1]
        );
        if (insertRes?.insertId) {
          newUser.id = String(insertRes.insertId);
        }
      } catch (dbErr: any) {
        console.warn('[MySQL] Erro ao gravar novo usuário no banco:', dbErr.message);
      }
    }

    usersStore.unshift(newUser);

    const logAction = targetType === 'ADM_MASTER' ? 'CADASTRAR_PROPRIETARIO' : (targetType === 'ADM' ? 'CADASTRAR_ADM' : 'CADASTRAR_USUARIO');
    await recordAuditLog(
      logAction,
      `ADM Master ${req.user?.name} cadastrou novo ${targetType}: ${newUser.name} (${newUser.email}).`,
      req.user,
      req
    );

    res.status(201).json(toPublicUser(newUser));
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao cadastrar usuário', message: error.message });
  }
});

// PUT /api/admin/usuarios/:id - Alterar dados permitidos do usuário
app.put('/api/admin/usuarios/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, role, phone, city, uf, userType } = req.body;

  const index = usersStore.findIndex(u => u.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const currentUser = usersStore[index];
  if (!isMasterUser(req.user) && currentUser.userType !== 'USUARIO') {
    return res.status(403).json({ error: 'ADM Normal só pode editar contas de usuários finais.' });
  }
  if (userType !== undefined && !['USUARIO', 'ADM', 'ADM_MASTER', 'PROPRIETARIO'].includes(userType)) {
    return res.status(400).json({ error: 'Tipo de usuário inválido.' });
  }
  if (email !== undefined && (typeof email !== 'string' ||
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim()) ||
      usersStore.some(user => user.id !== currentUser.id && user.email.toLowerCase() === email.trim().toLowerCase()))) {
    return res.status(400).json({ error: 'E-mail inválido ou já cadastrado.' });
  }

  // Se houver tentativa de alterar para PROPRIETARIO, somente PROPRIETARIO pode autorizar e com limite de 5
  if (userType && userType !== currentUser.userType) {
    if (!isMasterUser(req.user)) {
      return res.status(403).json({ error: 'Somente um Proprietário pode alterar o tipo de privilégio de um usuário.' });
    }

    if ((userType === 'PROPRIETARIO' || userType === 'ADM_MASTER') && !isMasterUser(currentUser)) {
      const activeOwners = usersStore.filter(u => isMasterUser(u) && u.active);
      if (activeOwners.length >= 5) {
        return res.status(400).json({
          error: 'Limite de proprietários atingido',
          message: 'O sistema permite no máximo 5 proprietários simultâneos.'
        });
      }
    }
  }

  usersStore[index] = {
    ...currentUser,
    name: name || currentUser.name,
    email: email ? email.trim().toLowerCase() : currentUser.email,
    role: role || currentUser.role,
    phone: phone !== undefined ? phone : currentUser.phone,
    city: city || currentUser.city,
    uf: uf || currentUser.uf,
    userType: (isMasterUser(req.user) && userType) ? (userType === 'PROPRIETARIO' ? 'ADM_MASTER' : userType) : currentUser.userType
  };

  // Atualiza no MySQL relacional
  if (isDbConnected && dbPool) {
    try {
      await dbPool.query(
        `UPDATE usuarios 
         SET nome = ?, email = ?, perfil = ?, cidade_padrao = ?, uf_padrao = ?, tipo_usuario = ?
         WHERE id = ? OR email = ?`,
        [
          usersStore[index].name,
          usersStore[index].email,
          usersStore[index].role,
          usersStore[index].city,
          usersStore[index].uf,
          usersStore[index].userType === 'ADM_MASTER' ? 'PROPRIETARIO' : usersStore[index].userType,
          id,
          currentUser.email
        ]
      );
    } catch (dbErr: any) {
      console.warn('[MySQL] Erro ao atualizar usuário no banco:', dbErr.message);
    }
  }

  await recordAuditLog(
    'EDITAR_USUARIO',
    `Dados do usuário ${usersStore[index].name} alterados por ${req.user?.name}.`,
    req.user,
    req
  );

  res.json(toPublicUser(usersStore[index]));
});

// PATCH /api/admin/usuarios/:id/status - Ativar / desativar usuário
app.patch('/api/admin/usuarios/:id/status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = usersStore.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const target = usersStore[index];

  // Regra de segurança: Não é permitido desativar a própria conta ativa
  if (target.id === req.user?.id) {
    return res.status(400).json({ error: 'Você não pode desativar sua própria conta.' });
  }

  // Regra de segurança: Apenas Proprietário pode desativar outro ADM ou Proprietário
  if (isMasterUser(target) || target.userType === 'ADM') {
    if (!isMasterUser(req.user)) {
      return res.status(403).json({ error: 'Apenas um Proprietário pode alterar o status de outro ADM ou Proprietário.' });
    }
  }

  const newStatus = !target.active;
  usersStore[index].active = newStatus;

  // Atualiza status no MySQL relacional
  if (isDbConnected && dbPool) {
    try {
      await dbPool.query(
        'UPDATE usuarios SET ativo = ? WHERE id = ? OR email = ?',
        [newStatus ? 1 : 0, id, target.email]
      );
    } catch (dbErr: any) {
      console.warn('[MySQL] Erro ao alterar status no banco:', dbErr.message);
    }
  }

  await recordAuditLog(
    'STATUS_USUARIO',
    `Usuário ${target.name} foi ${newStatus ? 'ATIVADO' : 'DESATIVADO'} por ${req.user?.name}.`,
    req.user,
    req
  );

  res.json({ id: target.id, active: newStatus, message: `Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso.` });
});

// DELETE /api/admin/usuarios/:id - Excluir usuário quando necessário
app.delete('/api/admin/usuarios/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = usersStore.findIndex(u => u.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Usuário não encontrado.' });
  }

  const target = usersStore[index];

  // Não pode excluir a própria conta
  if (target.id === req.user?.id) {
    return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
  }

  // Apenas Proprietário pode excluir outro Proprietário ou ADM
  if (isMasterUser(target) || target.userType === 'ADM') {
    if (!isMasterUser(req.user)) {
      return res.status(403).json({ error: 'Somente um Proprietário tem permissão para excluir Administradores ou outros Proprietários.' });
    }
  }

  // Não pode excluir se for o único proprietário restante
  if (isMasterUser(target)) {
    const ownersCount = usersStore.filter(u => isMasterUser(u)).length;
    if (ownersCount <= 1) {
      return res.status(400).json({ error: 'Não é possível excluir o único proprietário do sistema.' });
    }
  }

  // Exclui do MySQL relacional
  if (isDbConnected && dbPool) {
    try {
      await dbPool.query('DELETE FROM usuarios WHERE id = ? OR email = ?', [id, target.email]);
      await dbPool.query('DELETE FROM calculos WHERE owner_user_id = ?', [target.id]);
      await dbPool.query('DELETE FROM orcamentos WHERE owner_user_id = ?', [target.id]);
    } catch (dbErr: any) {
      console.warn('[MySQL] Erro ao excluir usuário no banco:', dbErr.message);
    }
  }

  budgetsStore = budgetsStore.filter(budget => (budget as SavedBudget & { userId?: string }).userId !== target.id);
  userWorksStore = userWorksStore.filter(work => work.userId !== target.id);
  usersStore.splice(index, 1);

  await recordAuditLog(
    'EXCLUIR_USUARIO',
    `Usuário ${target.name} (${target.userType}) foi excluído por ${req.user?.name}.`,
    req.user,
    req
  );

  res.json({ success: true, message: `Usuário ${target.name} excluído com sucesso.` });
});

app.post('/api/admin/usuarios/:id/reset-password', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const target = usersStore.find(user => user.id === req.params.id);
  if (!target) return res.status(404).json({ error: 'Usuário não encontrado.' });
  if (!isMasterUser(req.user) && target.userType !== 'USUARIO') {
    return res.status(403).json({ error: 'ADM Normal só pode redefinir a senha de usuários finais.' });
  }

  const temporaryPassword = crypto.randomBytes(9).toString('base64url');
  const passwordHash = hashPassword(temporaryPassword);
  target.passwordHash = passwordHash;
  target.password = passwordHash;

  if (isDbConnected && dbPool) {
    try {
      await dbPool.query('UPDATE usuarios SET senha_hash = ? WHERE id = ?', [passwordHash, target.id]);
    } catch (error) {
      console.error('[MySQL] Erro ao redefinir senha de usuário:', error);
      return res.status(500).json({ error: 'Não foi possível persistir a senha redefinida.' });
    }
  }

  await recordAuditLog('RECUPERAR_SENHA', `Senha redefinida por ${req.user?.name} para a conta ${target.email}.`, req.user, req);
  res.json({ temporaryPassword, message: 'Senha temporária gerada. Compartilhe-a com o usuário por um canal seguro.' });
});

// 3. Tipos de Construção (Controlados pelo ADM)
// GET /api/admin/tipos-obra - Listar tipos
app.get('/api/admin/tipos-obra', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(workTypesStore);
});

// POST /api/admin/tipos-obra - Adicionar tipo
app.post('/api/admin/tipos-obra', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, code, description, category, defaultWaste, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome do tipo de construção é obrigatório.' });
    }

    const resolvedCode = code || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_');

    if (workTypesStore.some(w => w.code === resolvedCode)) {
      return res.status(400).json({ error: 'Já existe um tipo de obra com este código.' });
    }

    const newWorkType: AdminWorkType = {
      id: `wt_${crypto.randomUUID()}`,
      code: resolvedCode,
      name,
      description: description || '',
      category: category || 'geral',
      defaultWaste: typeof defaultWaste === 'number' ? defaultWaste : 10,
      icon: icon || 'Wrench',
      active: true,
      createdAt: new Date().toISOString()
    };

    workTypesStore.push(newWorkType);

    await recordAuditLog(
      'CRIAR_TIPO_OBRA',
      `Novo tipo de obra criado: ${newWorkType.name} por ${req.user?.name}.`,
      req.user,
      req
    );

    res.status(201).json(newWorkType);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar tipo de obra', message: error.message });
  }
});

// PUT /api/admin/tipos-obra/:id - Editar tipo
app.put('/api/admin/tipos-obra/:id', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = workTypesStore.findIndex(w => w.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Tipo de obra não encontrado.' });
  }

  const { name, description, category, defaultWaste, icon } = req.body;

  workTypesStore[index] = {
    ...workTypesStore[index],
    name: name || workTypesStore[index].name,
    description: description !== undefined ? description : workTypesStore[index].description,
    category: category || workTypesStore[index].category,
    defaultWaste: defaultWaste !== undefined ? defaultWaste : workTypesStore[index].defaultWaste,
    icon: icon || workTypesStore[index].icon
  };

  await recordAuditLog(
    'EDITAR_TIPO_OBRA',
    `Tipo de obra ${workTypesStore[index].name} alterado por ${req.user?.name}.`,
    req.user,
    req
  );

  res.json(workTypesStore[index]);
});

// PATCH /api/admin/tipos-obra/:id/status - Ativar / desativar tipo
app.patch('/api/admin/tipos-obra/:id/status', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = workTypesStore.findIndex(w => w.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Tipo de obra não encontrado.' });
  }

  const newStatus = !workTypesStore[index].active;
  workTypesStore[index].active = newStatus;

  await recordAuditLog(
    'STATUS_TIPO_OBRA',
    `Tipo de obra ${workTypesStore[index].name} foi ${newStatus ? 'ATIVADO' : 'DESATIVADO'} por ${req.user?.name}.`,
    req.user,
    req
  );

  res.json({ id, active: newStatus });
});

// 4. Materiais (Controlados pelo ADM)
// GET /api/admin/materiais - Listar materiais
app.get('/api/admin/materiais', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json(materialsStore);
});

// POST /api/admin/materiais - Cadastrar material (Material, Descrição, Unidade, Preço, Qtd mínima, Status)
app.post('/api/admin/materiais', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, description, unit, price, minQuantity, status, category } = req.body;
    const parsedPrice = Number(price);

    if (!name?.trim() || !unit?.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0 || parsedPrice > 10000000) {
      return res.status(400).json({ error: 'Nome do material, unidade e preço são obrigatórios.' });
    }

    const newMaterial: AdminMaterial = {
      id: `mat_${crypto.randomUUID()}`,
      name: name.trim(),
      description: description || '',
      unit: unit.trim(),
      price: parsedPrice,
      minQuantity: Number.isInteger(Number(minQuantity)) && Number(minQuantity) > 0 ? Number(minQuantity) : 10,
      status: status === 'inativo' ? 'inativo' : 'ativo',
      category: category || 'Geral',
      updatedAt: new Date().toISOString()
    };

    const updatedSettings: CalculationSettings = {
      ...calculationSettings,
      materialPriceOverrides: { ...calculationSettings.materialPriceOverrides }
    };
    const persisted = await persistMaterialAndCalculationSettings(newMaterial, updatedSettings);
    if (!persisted) calculationSettings = updatedSettings;
    materialsStore.unshift(newMaterial);

    await recordAuditLog(
      'CADASTRAR_MATERIAL',
      `Novo material cadastrado: ${newMaterial.name} (R$ ${newMaterial.price.toFixed(2)} / ${newMaterial.unit}) por ${req.user?.name}.`,
      req.user,
      req
    );

    res.status(201).json({ ...newMaterial, persisted });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao cadastrar material', message: error.message });
  }
});

// PUT /api/admin/materiais/:id - Editar material
app.put('/api/admin/materiais/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = materialsStore.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Material não encontrado.' });
  }

  const { name, description, unit, price, minQuantity, status, category } = req.body;

  const parsedPrice = price === undefined ? materialsStore[index].price : Number(price);
  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0 || parsedPrice > 10000000) {
    return res.status(400).json({ error: 'O preço deve ser maior que zero e menor ou igual a R$ 10.000.000,00.' });
  }

  const updatedMaterial: AdminMaterial = {
    ...materialsStore[index],
    name: name || materialsStore[index].name,
    description: description !== undefined ? description : materialsStore[index].description,
    unit: unit || materialsStore[index].unit,
    price: parsedPrice,
    minQuantity: minQuantity !== undefined ? parseInt(minQuantity) : materialsStore[index].minQuantity,
    status: status || materialsStore[index].status,
    category: category || materialsStore[index].category,
    updatedAt: new Date().toISOString()
  };

  const catalogMaterial = BASE_MATERIALS_CATALOG.find((material) => material.id === updatedMaterial.id);
  const updatedSettings: CalculationSettings = {
    ...calculationSettings,
    materialPriceOverrides: {
      ...calculationSettings.materialPriceOverrides,
      ...(catalogMaterial ? { [catalogMaterial.id]: updatedMaterial.price } : {})
    }
  };

  try {
    const persisted = await persistMaterialAndCalculationSettings(updatedMaterial, updatedSettings);
    if (!persisted) calculationSettings = updatedSettings;
    materialsStore[index] = updatedMaterial;

    await recordAuditLog(
      'EDITAR_MATERIAL',
      `Material ${updatedMaterial.name} alterado por ${req.user?.name}. Novo preço: R$ ${updatedMaterial.price.toFixed(2)}.`,
      req.user,
      req
    );

    res.json({ ...updatedMaterial, persisted });
  } catch (error) {
    console.error('[MySQL] Erro ao salvar material e preço de cálculo:', error);
    res.status(500).json({ error: 'Não foi possível salvar o material e atualizar os cálculos.' });
  }
});

// PATCH /api/admin/materiais/:id/status - Ativar / desativar material
app.patch('/api/admin/materiais/:id/status', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = materialsStore.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Material não encontrado.' });
  }

  const newStatus = materialsStore[index].status === 'ativo' ? 'inativo' : 'ativo';
  materialsStore[index].status = newStatus;
  materialsStore[index].updatedAt = new Date().toISOString();

  await recordAuditLog(
    'STATUS_MATERIAL',
    `Material ${materialsStore[index].name} alterado para status ${newStatus.toUpperCase()} por ${req.user?.name}.`,
    req.user,
    req
  );

  res.json({ id, status: newStatus });
});

// DELETE /api/admin/materiais/:id - Excluir material
app.delete('/api/admin/materiais/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const index = materialsStore.findIndex(m => m.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Material não encontrado.' });
  }

  const removed = materialsStore.splice(index, 1)[0];

  await recordAuditLog(
    'EXCLUIR_MATERIAL',
    `Material ${removed.name} excluído por ${req.user?.name}.`,
    req.user,
    req
  );

  res.json({ success: true, message: `Material ${removed.name} excluído com sucesso.` });
});

// 5. Obras cadastradas pelos usuários (Visualização administrativa auditável)
// GET /api/admin/obras - Visualizar obras cadastradas pelos usuários
app.get('/api/admin/obras', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    disclaimer: 'Visualização Administrativa: A titularidade e propriedade técnica das obras pertence integralmente aos seus respectivos usuários cadastrados.',
    obras: userWorksStore
  });
});

app.delete('/api/admin/obras/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  if (!isMasterUser(req.user) && !reason) {
    return res.status(400).json({ error: 'ADM Normal deve informar o motivo da moderação.' });
  }

  const workIndex = userWorksStore.findIndex(work => work.id === req.params.id);
  const budgetIndex = budgetsStore.findIndex(budget => budget.id === req.params.id);
  if (workIndex === -1 && budgetIndex === -1) return res.status(404).json({ error: 'Obra ou relatório não encontrado.' });

  if (isDbConnected && dbPool) {
    try {
      await dbPool.execute('DELETE FROM orcamentos WHERE id = ?', [req.params.id]);
    } catch (error) {
      console.error('[MySQL] Erro ao moderar orçamento:', error);
      return res.status(500).json({ error: 'Não foi possível remover o relatório do banco.' });
    }
  }
  const work = workIndex === -1 ? undefined : userWorksStore[workIndex];
  if (workIndex !== -1) userWorksStore.splice(workIndex, 1);
  if (budgetIndex !== -1) budgetsStore.splice(budgetIndex, 1);
  await recordAuditLog(
    'EXCLUIR_OBRA',
    `Relatório ${req.params.id} removido por moderação de ${req.user?.name}.${reason ? ` Motivo: ${reason}` : ''}`,
    req.user,
    req
  );
  res.json({ success: true, ownerUserId: work?.userId });
});

app.get('/api/admin/calculos', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  if (!isDbConnected || !dbPool) return res.status(503).json({ error: 'MySQL indisponível para consultar o histórico de cálculos.' });
  try {
    const [rows]: any = await dbPool.query(
      'SELECT id, owner_user_id, tipo_obra, criado_em FROM calculos ORDER BY id DESC LIMIT 100'
    );
    res.json(rows);
  } catch (error) {
    console.error('[MySQL] Erro ao consultar histórico de cálculos para moderação:', error);
    res.status(500).json({ error: 'Não foi possível consultar os cálculos.' });
  }
});

app.delete('/api/admin/calculos/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  if (!/^[1-9]\d*$/.test(req.params.id)) return res.status(400).json({ error: 'Identificador de cálculo inválido.' });
  const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
  if (!isMasterUser(req.user) && !reason) {
    return res.status(400).json({ error: 'ADM Normal deve informar o motivo da moderação.' });
  }
  if (!isDbConnected || !dbPool) return res.status(503).json({ error: 'MySQL indisponível para excluir o histórico de cálculos.' });
  try {
    const [deleteResult] = await dbPool.execute<ResultSetHeader>('DELETE FROM calculos WHERE id = ?', [req.params.id]);
    if (deleteResult.affectedRows === 0) return res.status(404).json({ error: 'Cálculo não encontrado.' });
    await recordAuditLog(
      'EXCLUIR_OBRA',
      `Cálculo ${req.params.id} removido por moderação de ${req.user?.name}.${reason ? ` Motivo: ${reason}` : ''}`,
      req.user,
      req
    );
    res.json({ success: true });
  } catch (error) {
    console.error('[MySQL] Erro ao remover cálculo:', error);
    res.status(500).json({ error: 'Não foi possível excluir o cálculo.' });
  }
});

// 6. Histórico do sistema (Logs de Auditoria)
// GET /api/admin/historico - Consultar ações auditadas
app.get('/api/admin/historico', authenticateToken, requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { acao, q } = req.query;
  let result = [...auditLogsStore];

  if (acao && typeof acao === 'string' && acao !== 'TODAS') {
    result = result.filter(l => l.action === acao);
  }

  if (q && typeof q === 'string') {
    const search = q.toLowerCase();
    result = result.filter(l => 
      l.description.toLowerCase().includes(search) || 
      l.userName.toLowerCase().includes(search) ||
      (l.userEmail && l.userEmail.toLowerCase().includes(search))
    );
  }

  res.json(result);
});

app.get('/api/admin/chamados', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  if (isDbConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.query('SELECT * FROM suporte_chamados ORDER BY atualizado_em DESC LIMIT 200');
      return res.json(rows.map((row: any) => mapSupportTicketRow(row)));
    } catch (error) {
      console.error('[MySQL] Erro ao consultar chamados:', error);
      return res.status(500).json({ error: 'Não foi possível carregar os chamados.' });
    }
  }
  res.json([...supportTicketsStore].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
});

app.patch('/api/admin/chamados/:id', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  const allowedStatuses: SupportTicketStatus[] = ['aberto', 'em_atendimento', 'respondido', 'fechado'];
  const { status, response } = req.body;
  if (status !== undefined && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status de chamado inválido.' });
  }
  if (response !== undefined && (typeof response !== 'string' || response.trim().length > 5000)) {
    return res.status(400).json({ error: 'A resposta deve ter até 5.000 caracteres.' });
  }

  let ticket = supportTicketsStore.find((item) => item.id === req.params.id);
  if (!ticket && isDbConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.execute('SELECT * FROM suporte_chamados WHERE id = ? LIMIT 1', [req.params.id]);
      if (rows.length > 0) ticket = mapSupportTicketRow(rows[0]);
    } catch (error) {
      console.error('[MySQL] Erro ao localizar chamado:', error);
      return res.status(500).json({ error: 'Não foi possível localizar o chamado.' });
    }
  }
  if (!ticket) return res.status(404).json({ error: 'Chamado não encontrado.' });

  const responseText = response === undefined ? ticket.response : response.trim();
  const hasNewResponse = typeof response === 'string' && response.trim().length > 0;
  const updatedTicket: SupportTicket = {
    ...ticket,
    status: hasNewResponse && status !== 'fechado' ? 'respondido' : (status || ticket.status),
    response: responseText,
    responseBy: hasNewResponse ? req.user?.name : ticket.responseBy,
    updatedAt: new Date().toISOString()
  };
  if (updatedTicket.status === 'respondido' && !updatedTicket.response) {
    return res.status(400).json({ error: 'Informe uma resposta antes de marcar o chamado como respondido.' });
  }

  if (isDbConnected && dbPool) {
    try {
      await dbPool.execute(
        'UPDATE suporte_chamados SET status = ?, resposta = ?, respondido_por = ? WHERE id = ?',
        [updatedTicket.status, updatedTicket.response || null, updatedTicket.responseBy || null, updatedTicket.id]
      );
    } catch (error) {
      console.error('[MySQL] Erro ao atualizar chamado:', error);
      return res.status(500).json({ error: 'Não foi possível salvar a resposta do chamado.' });
    }
  }

  const existingIndex = supportTicketsStore.findIndex((item) => item.id === updatedTicket.id);
  if (existingIndex === -1) supportTicketsStore.unshift(updatedTicket);
  else supportTicketsStore[existingIndex] = updatedTicket;
  await recordAuditLog(
    'RESPONDER_CHAMADO',
    `Chamado ${updatedTicket.id} atualizado para ${updatedTicket.status} por ${req.user?.name}.`,
    req.user,
    req
  );
  res.json({ ...updatedTicket, persisted: isDbConnected });
});

// -------------------------------------------------------------
// REST API ENDPOINTS PÚBLICOS / USUÁRIO COMUM
// -------------------------------------------------------------

// GET /api/tipos-obras (retorna apenas os ativos)
app.get('/api/tipos-obras', (req: Request, res: Response) => {
  const activeTypes = workTypesStore.filter(w => w.active);
  res.json(activeTypes);
});

// GET /api/materiais (retorna apenas os ativos com preços vigentes)
app.get('/api/materiais', (req: Request, res: Response) => {
  const activeMaterials = materialsStore.filter(m => m.status === 'ativo');
  res.json(activeMaterials);
});

// GET /api/materiais/:id
app.get('/api/materiais/:id', (req: Request, res: Response) => {
  const item = materialsStore.find(m => m.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Material não encontrado' });
  }
  res.json(item);
});

app.get('/api/chamados', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Autenticação necessária.' });
  if (isDbConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.execute(
        'SELECT * FROM suporte_chamados WHERE owner_user_id = ? ORDER BY atualizado_em DESC',
        [req.user.id]
      );
      return res.json(rows.map((row: any) => mapSupportTicketRow(row)));
    } catch (error) {
      console.error('[MySQL] Erro ao consultar chamados do usuário:', error);
      return res.status(500).json({ error: 'Não foi possível carregar seus chamados.' });
    }
  }
  res.json(
    supportTicketsStore
      .filter((ticket) => ticket.ownerUserId === req.user!.id)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  );
});

app.post('/api/chamados', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Autenticação necessária.' });
  const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim() : '';
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
  if (subject.length < 3 || subject.length > 150) {
    return res.status(400).json({ error: 'O assunto deve conter entre 3 e 150 caracteres.' });
  }
  if (message.length < 10 || message.length > 5000) {
    return res.status(400).json({ error: 'A descrição deve conter entre 10 e 5.000 caracteres.' });
  }

  const now = new Date().toISOString();
  const ticket: SupportTicket = {
    id: `ticket_${crypto.randomUUID()}`,
    ownerUserId: req.user.id,
    ownerName: req.user.name,
    ownerEmail: req.user.email,
    subject,
    message,
    status: 'aberto',
    createdAt: now,
    updatedAt: now
  };
  if (isDbConnected && dbPool) {
    try {
      await dbPool.execute(
        `INSERT INTO suporte_chamados
          (id, owner_user_id, owner_name, owner_email, assunto, mensagem, status)
         VALUES (?, ?, ?, ?, ?, ?, 'aberto')`,
        [ticket.id, ticket.ownerUserId, ticket.ownerName, ticket.ownerEmail, ticket.subject, ticket.message]
      );
    } catch (error) {
      console.error('[MySQL] Erro ao gravar chamado:', error);
      return res.status(500).json({ error: 'Não foi possível registrar o chamado.' });
    }
  }
  supportTicketsStore.unshift(ticket);
  await recordAuditLog('ABRIR_CHAMADO', `Chamado ${ticket.id} aberto: ${ticket.subject}.`, req.user, req);
  res.status(201).json({ ticket, persisted: isDbConnected });
});

// GET /api/precos (Regional locations)
app.get('/api/precos', (req: Request, res: Response) => {
  res.json({
    locations: REGIONAL_LOCATIONS,
    disclaimer: 'Estimativa de materiais - Os preços são aproximados e ponderados pela região, loja, marca e data da compra.'
  });
});

function getEffectiveCalculationSettings(): CalculationSettings {
  const materialPriceOverrides = { ...calculationSettings.materialPriceOverrides };
  for (const material of materialsStore) {
    if (BASE_MATERIALS_CATALOG.some((catalogItem) => catalogItem.id === material.id) && material.price > 0) {
      materialPriceOverrides[material.id] = material.price;
    }
  }
  return { ...calculationSettings, materialPriceOverrides };
}

app.get('/api/calculation-settings', (req: Request, res: Response) => {
  res.json(getEffectiveCalculationSettings());
});

app.get('/api/system-settings', (req: Request, res: Response) => {
  res.json(systemSettings);
});

app.put('/api/admin/system-settings', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  if (!isSystemSettings(req.body)) {
    return res.status(400).json({ error: 'Nome do sistema ou termos de uso inválidos.' });
  }
  if (!isDbConnected || !dbPool) {
    return res.status(503).json({ error: 'MySQL é necessário para salvar configurações globais.' });
  }
  try {
    await dbPool.execute(
      `INSERT INTO configuracoes_sistema (chave, valor_json) VALUES ('system_settings', ?)
       ON DUPLICATE KEY UPDATE valor_json = VALUES(valor_json)`,
      [JSON.stringify(req.body)]
    );
    systemSettings = { systemName: req.body.systemName.trim(), termsOfUse: req.body.termsOfUse.trim() };
    await recordAuditLog('EDITAR_CONFIGURACAO', `Configurações gerais alteradas por ADM Master ${req.user?.name}.`, req.user, req);
    res.json({ settings: systemSettings, persisted: true });
  } catch (error) {
    console.error('[MySQL] Erro ao salvar configurações gerais:', error);
    res.status(500).json({ error: 'Não foi possível salvar as configurações gerais.' });
  }
});

app.put('/api/admin/calculation-settings', authenticateToken, requireOwner, async (req: AuthenticatedRequest, res: Response) => {
  const updatedSettings = req.body;
  if (!isCalculationSettings(updatedSettings)) {
    return res.status(400).json({
      error: 'Configuração inválida.',
      message: 'Desperdício deve ficar entre 0 e 100%; blocos entre 1 e 100 unidades/m²; tijolos entre 1 e 200 unidades/m².'
    });
  }
  if (!isDbConnected || !dbPool) {
    return res.status(503).json({ error: 'MySQL é necessário para salvar configurações globais de cálculo.' });
  }

  try {
    await dbPool.execute(
      `INSERT INTO configuracoes_sistema (chave, valor_json) VALUES ('calculation_settings', ?)
       ON DUPLICATE KEY UPDATE valor_json = VALUES(valor_json)`,
      [JSON.stringify(updatedSettings)]
    );
    calculationSettings = updatedSettings;
    await recordAuditLog('EDITAR_FORMULAS', `Configurações de cálculo alteradas por ADM Master ${req.user?.name}.`, req.user, req);
    res.json({ settings: calculationSettings, persisted: true });
  } catch (error) {
    console.error('[MySQL] Erro ao salvar configurações de cálculo:', error);
    res.status(500).json({ error: 'Não foi possível salvar as configurações de cálculo.' });
  }
});

// POST /api/calculos/:tipo
app.post('/api/calculos/:tipo', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const workType = req.params.tipo as WorkTypeKey;
    const params = req.body;
    
    let location = REGIONAL_LOCATIONS.find(l => l.uf === (params.uf || 'SP'));
    if (!location) {
      location = REGIONAL_LOCATIONS[0];
    }

    const calculationParams = {
      ...params,
      wastePercentage: params.wastePercentage ?? calculationSettings.defaultWasteByWorkType[workType],
      location
    };

    const effectiveSettings = getEffectiveCalculationSettings();
    const result = CalculationService.calculate(workType, calculationParams, effectiveSettings);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      error: 'Erro no cálculo',
      message: error.message || 'Parâmetros inválidos para cálculo.'
    });
  }
});

// POST /api/calculos
app.post('/api/calculos', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tipoObra, ...params } = req.body;
    if (!tipoObra) {
      return res.status(400).json({ error: 'tipoObra é obrigatório no corpo da requisição.' });
    }

    let location = REGIONAL_LOCATIONS.find(l => l.uf === (params.uf || 'SP'));
    if (!location) {
      location = REGIONAL_LOCATIONS[0];
    }

    const workType = tipoObra as WorkTypeKey;
    const result = CalculationService.calculate(workType, {
      ...params,
      wastePercentage: params.wastePercentage ?? getEffectiveCalculationSettings().defaultWasteByWorkType[workType],
      location
    }, getEffectiveCalculationSettings());

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      error: 'Erro no cálculo',
      message: error.message || 'Parâmetros inválidos para cálculo.'
    });
  }
});

// GET /api/orcamentos
app.get('/api/orcamentos', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (isDbConnected && dbPool) {
    try {
      const [rows]: any = await dbPool.execute('SELECT * FROM orcamentos WHERE owner_user_id = ? ORDER BY id DESC LIMIT 50', [req.user!.id]);
      if (Array.isArray(rows)) {
        const parsed = rows.map((r: any) => ({
          id: String(r.id),
          title: r.titulo || r.title,
          clientName: r.cliente_nome || r.clientName,
          workType: r.tipo_obra || r.workType || 'muro',
          workTypeName: r.tipo_obra_nome || r.workTypeName || 'Obra',
          location: typeof r.dados_localizacao === 'string' ? JSON.parse(r.dados_localizacao) : REGIONAL_LOCATIONS[0],
          calculationResult: typeof r.resultado_calculo === 'string' ? JSON.parse(r.resultado_calculo) : null,
          status: r.status || 'rascunho',
          createdAt: r.criado_em || new Date().toISOString(),
          updatedAt: r.atualizado_em || new Date().toISOString()
        }));
        return res.json(parsed);
      }
    } catch (error) {
      console.error('[MySQL] Erro ao consultar orçamentos do usuário:', error);
      return res.status(500).json({ error: 'Não foi possível carregar seus orçamentos.' });
    }
  }
  res.json(budgetsStore.filter(budget => (budget as SavedBudget & { userId?: string }).userId === req.user!.id));
});

// POST /api/orcamentos
app.post('/api/orcamentos', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const budgetData = req.body;
    if (!budgetData || typeof budgetData !== 'object' || Array.isArray(budgetData) ||
        typeof budgetData.title !== 'string' || typeof budgetData.workType !== 'string' ||
        !budgetData.calculationResult || typeof budgetData.calculationResult !== 'object') {
      return res.status(400).json({ error: 'Dados inválidos para salvar o orçamento.' });
    }
    const newBudget: SavedBudget = {
      ...budgetData,
      id: `orc_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      userId: req.user!.id,
      clientName: req.user!.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    budgetsStore.unshift(newBudget);

    // Adiciona na lista de obras do usuário para visualização do ADM
    const userWorkEntry: AdminUserWork = {
      id: newBudget.id,
      userId: req.user!.id,
      userName: req.user!.name,
      userEmail: req.user!.email,
      title: newBudget.title,
      workType: newBudget.workType,
      workTypeName: newBudget.workTypeName,
      status: newBudget.status,
      totalCost: newBudget.calculationResult?.totalEstimatedCost || 0,
      locationCity: newBudget.location?.city,
      locationUf: newBudget.location?.uf,
      createdAt: newBudget.createdAt,
      calculationResult: newBudget.calculationResult
    };
    userWorksStore.unshift(userWorkEntry);

    // Registra no histórico do sistema
    await recordAuditLog(
      'CRIAR_CALCULO',
      `Orçamento criado e salvo: "${newBudget.title}" (${newBudget.workTypeName}) com custo total de R$ ${(newBudget.calculationResult?.totalEstimatedCost || 0).toFixed(2)}.`,
      req.user,
      req
    );

    // Se MySQL estiver conectado, grava também na tabela relacional
    if (isDbConnected && dbPool) {
      try {
        const [insertResult] = await dbPool.query<ResultSetHeader>(
          `INSERT INTO orcamentos (owner_user_id, titulo, cliente_nome, tipo_obra, custo_total_estimado, status, dados_localizacao, resultado_calculo)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.user!.id,
            newBudget.title,
            newBudget.clientName || null,
            newBudget.workType,
            newBudget.calculationResult?.totalEstimatedCost || 0,
            newBudget.status || 'rascunho',
            JSON.stringify(newBudget.location || {}),
            JSON.stringify(newBudget.calculationResult || {})
          ]
        );
        newBudget.id = String(insertResult.insertId);
        const budgetIndex = budgetsStore.findIndex(budget => budget.userId === req.user!.id && budget.createdAt === newBudget.createdAt);
        if (budgetIndex !== -1) budgetsStore[budgetIndex].id = newBudget.id;
        const workIndex = userWorksStore.findIndex(work => work.userId === req.user!.id && work.createdAt === newBudget.createdAt);
        if (workIndex !== -1) userWorksStore[workIndex].id = newBudget.id;
      } catch (err: any) {
        console.error('[MySQL] Erro ao gravar orçamento no banco relacional:', err);
        budgetsStore = budgetsStore.filter(budget => budget.id !== newBudget.id);
        userWorksStore = userWorksStore.filter(work => work.id !== newBudget.id);
        return res.status(500).json({ error: 'Não foi possível persistir o orçamento no banco.' });
      }
    }

    res.status(201).json(newBudget);
  } catch (error: any) {
    res.status(400).json({ error: 'Falha ao salvar orçamento', message: error.message });
  }
});

// PUT /api/orcamentos/:id
app.put('/api/orcamentos/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const index = budgetsStore.findIndex(b => b.id === req.params.id && (b as SavedBudget & { userId?: string }).userId === req.user!.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Orçamento não encontrado' });
  }
  budgetsStore[index] = {
    ...budgetsStore[index],
    ...(typeof req.body.title === 'string' ? { title: req.body.title } : {}),
    ...(typeof req.body.status === 'string' ? { status: req.body.status } : {}),
    ...(typeof req.body.notes === 'string' ? { notes: req.body.notes } : {}),
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };
  if (isDbConnected && dbPool) {
    try {
      await dbPool.execute(
        'UPDATE orcamentos SET titulo = ?, status = ? WHERE id = ? AND owner_user_id = ?',
        [budgetsStore[index].title, budgetsStore[index].status, req.params.id, req.user!.id]
      );
    } catch (error) {
      console.error('[MySQL] Erro ao atualizar orçamento do usuário:', error);
      return res.status(500).json({ error: 'Não foi possível atualizar o orçamento.' });
    }
  }

  await recordAuditLog(
    'EDITAR_OBRA',
    `Orçamento "${budgetsStore[index].title}" foi atualizado.`,
    req.user,
    req
  );

  res.json(budgetsStore[index]);
});

// DELETE /api/orcamentos/:id
app.delete('/api/orcamentos/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const index = budgetsStore.findIndex(b => b.id === req.params.id && (b as SavedBudget & { userId?: string }).userId === req.user!.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Orçamento não encontrado.' });
  }
  const removedTitle = budgetsStore[index].title;

  if (isDbConnected && dbPool) {
    try {
      await dbPool.execute('DELETE FROM orcamentos WHERE id = ? AND owner_user_id = ?', [req.params.id, req.user!.id]);
    } catch (error) {
      console.error('[MySQL] Erro ao excluir orçamento do usuário:', error);
      return res.status(500).json({ error: 'Não foi possível excluir o orçamento.' });
    }
  }

  budgetsStore.splice(index, 1);
  userWorksStore = userWorksStore.filter(work => work.id !== req.params.id);
  await recordAuditLog('EXCLUIR_OBRA', `Orçamento "${removedTitle}" foi excluído pelo proprietário.`, req.user, req);
  res.status(204).send();
});

// -------------------------------------------------------------
// ENDPOINTS DO GUIA ÚNICO DO SISTEMA
// -------------------------------------------------------------
app.use('/documentacao', express.static(path.join(process.cwd(), 'documentacao')));

app.get('/api/docs/download', (req: Request, res: Response) => {
  const filePath = path.join(process.cwd(), 'documentacao', 'GUIA_COMPLETO_CONSTRUTEC.md');
  res.download(filePath, 'GUIA_COMPLETO_CONSTRUTEC.md', (err) => {
    if (err) {
      console.error('Erro ao baixar o guia do sistema:', err);
      if (!res.headersSent) {
        res.status(404).json({ error: 'Guia completo do sistema não encontrado.' });
      }
    }
  });
});

app.get('/api/docs/content', (req: Request, res: Response) => {
  try {
    const filePath = path.join(process.cwd(), 'documentacao', 'GUIA_COMPLETO_CONSTRUTEC.md');
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ content });
  } catch (err: any) {
    res.status(500).json({ error: 'Erro ao ler arquivo de documentação.' });
  }
});

// -------------------------------------------------------------
// VITE MIDDLEWARE / STATIC ASSETS
// -------------------------------------------------------------
async function startServer() {
  await initDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ConstruTec Server rodando em http://0.0.0.0:${PORT}`);
    console.log(`Segurança Backend Ativa: Middleware JWT, RBAC de ADM e Proprietários (Máx 5).`);
  });
}

startServer();

import mysql from 'mysql2/promise';

export const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'construtec_db'
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

export async function connectDatabase(): Promise<boolean> {
  const previousPool = dbPool;
  dbPool = null;
  isDbConnected = false;
  if (previousPool) {
    try {
      await previousPool.end();
    } catch (err) {
      console.error('[MySQL] Falha ao encerrar conexões anteriores:', err);
    }
  }
  const pool = mysql.createPool({
    ...DB_CONFIG,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 4000
  });
  try {
    const connection = await pool.getConnection();
    try {
      await connection.ping();
      for (const table of ['usuario', 'tipo_construcao', 'material', 'obra', 'medicao', 'historico', 'master_solicitacoes']) {
        await connection.query(`SELECT * FROM \`${table}\` LIMIT 0`);
      }
      await connection.query('SELECT reset_token, reset_token_expira, avatar_url FROM usuario LIMIT 0');
    } finally {
      connection.release();
    }
    dbPool = pool;
    isDbConnected = true;
    dbConnectionError = null;
    console.log(`[MySQL] Conectado ao banco '${DB_CONFIG.database}' em ${DB_CONFIG.host}:${DB_CONFIG.port}.`);
    return true;
  } catch (err: unknown) {
    try {
      await pool.end();
    } catch (closeError) {
      console.error('[MySQL] Falha ao encerrar conexões após erro:', closeError);
    }
    isDbConnected = false;
    dbPool = null;
    dbConnectionError = err instanceof Error ? err.message : 'Erro de conexão';
    console.error(`[MySQL] Falha de conexão ou estrutura. Verifique a configuração e execute npm run db:migrate quando necessário: ${dbConnectionError}`);
    return false;
  }
}

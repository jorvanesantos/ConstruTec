import 'dotenv/config';
import mysql from 'mysql2/promise';
import { DB_CONFIG } from '../backend/construtec-api/src/config/database';
import { ensureDatabaseSchema } from '../backend/construtec-api/src/config/database-schema';

async function migrate(): Promise<void> {
  const user = process.env.DB_ADMIN_USER;
  if (!user) {
    throw new Error('Defina DB_ADMIN_USER para executar a manutenção do banco.');
  }
  if (!/^[A-Za-z0-9_]{1,64}$/.test(DB_CONFIG.database)) {
    throw new Error('DB_NAME deve conter apenas letras, números e sublinhado (até 64 caracteres).');
  }
  const config = {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user,
    password: process.env.DB_ADMIN_PASSWORD || '',
    connectTimeout: 4000
  };
  const connection = await mysql.createConnection(config);
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await connection.end();
  }
  const pool = mysql.createPool({ ...config, database: DB_CONFIG.database, connectionLimit: 1 });
  try {
    await ensureDatabaseSchema(pool);
  } finally {
    await pool.end();
  }
  console.log(`[MySQL] Estrutura de '${DB_CONFIG.database}' preparada.`);
}

migrate().catch((err: unknown) => {
  console.error('[MySQL] Falha na manutenção do banco:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});

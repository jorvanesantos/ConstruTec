import mysql from 'mysql2/promise';

export const databaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  name: process.env.DB_NAME || 'construtec'
};

export function createMysqlPool(database?: string) {
  return mysql.createPool({
    host: databaseConfig.host,
    port: databaseConfig.port,
    user: databaseConfig.user,
    password: databaseConfig.password,
    ...(database ? { database } : {}),
    waitForConnections: true,
    connectionLimit: database ? 10 : 2,
    queueLimit: 0,
    connectTimeout: database ? 4000 : 3000
  });
}

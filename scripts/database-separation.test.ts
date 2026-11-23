import assert from 'node:assert/strict';
import test from 'node:test';
import mysql from 'mysql2/promise';
import type { Pool } from 'mysql2/promise';
import { connectDatabase, getDbState } from '../backend/construtec-api/src/config/database';
import { ensureDatabaseSchema } from '../backend/construtec-api/src/config/database-schema';

test('conexão da aplicação apenas consulta a estrutura e sinaliza estrutura ausente', async t => {
  const statements: string[] = [];
  let missingTable = false;
  let ended = 0;
  const pool = {
    async getConnection() {
      return {
        async ping() {},
        async query(sql: string) {
          statements.push(sql);
          if (missingTable && sql.includes('`obra`')) throw new Error('Tabela obra não encontrada');
          return [[]];
        },
        release() {}
      };
    },
    async end() { ended++; }
  };
  t.mock.method(mysql, 'createPool', () => pool as unknown as Pool);
  assert.equal(await connectDatabase(), true);
  assert.equal(statements.length, 8);
  assert.ok(statements.every(sql => /^\s*SELECT\b/i.test(sql)));
  missingTable = true;
  assert.equal(await connectDatabase(), false);
  assert.equal(getDbState().connected, false);
  assert.match(getDbState().error || '', /Tabela obra/);
  assert.equal(ended, 2);
});

test('manutenção aplica alterações necessárias e propaga falhas de DDL', async () => {
  const statements: string[] = [];
  let failAlter = false;
  const pool = {
    async query(sql: string) {
      statements.push(sql);
      if (sql.includes("COLUMN_NAME IN")) return [[{ COLUMN_NAME: 'reset_token' }]];
      if (sql.includes("COLUMN_NAME = 'avatar_url'")) return [[{ DATA_TYPE: 'text' }]];
      if (failAlter && sql.includes('ALTER TABLE')) throw new Error('Permissão ALTER negada');
      return [[]];
    }
  } as unknown as Pool;
  await ensureDatabaseSchema(pool);
  assert.ok(statements.some(sql => sql.includes('ADD COLUMN reset_token_expira')));
  assert.ok(statements.some(sql => sql.includes('MODIFY COLUMN avatar_url MEDIUMTEXT')));
  failAlter = true;
  await assert.rejects(ensureDatabaseSchema(pool), /Permissão ALTER negada/);
});

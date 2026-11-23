import '@angular/compiler';
import { HttpClient } from '@angular/common/http';
import { createEnvironmentInjector } from '@angular/core';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { OAuth2Client } from 'google-auth-library';
import mysql from 'mysql2/promise';
import { throwError } from 'rxjs';
import { createExpressApp } from '../backend/construtec-api/src/app.ts';
import { connectDatabase } from '../backend/construtec-api/src/config/database.ts';
import { hashPassword } from '../backend/construtec-api/src/utils/security.ts';
import { AuthService } from '../frontend/construtec-web/src/app/core/services/auth.service.ts';

test('autenticação e cadastro dependem de consultas e gravações reais ao banco', async t => {
  const rows = new Map();
  let unavailable = false;
  let insertFailure = false;
  let nextId = 1;
  const pool = {
    async getConnection() {
      return { async query() {}, async ping() {}, release() {} };
    },
    async end() {},
    async query(sql) {
      if (sql.includes('INFORMATION_SCHEMA.COLUMNS')) {
        return [[{ COLUMN_NAME: 'reset_token' }, { COLUMN_NAME: 'reset_token_expira' }]];
      }
      return [[]];
    },
    async execute(sql, params) {
      if (unavailable) throw new Error('conexão perdida');
      if (sql.includes('FROM usuario WHERE email')) return [rows.has(params[0]) ? [rows.get(params[0])] : []];
      if (sql.includes('INSERT INTO usuario')) {
        if (insertFailure) throw new Error('falha na gravação');
        const [name, email, passwordHash] = params;
        if (rows.has(email)) throw Object.assign(new Error('duplicado'), { code: 'ER_DUP_ENTRY' });
        const id = nextId++;
        rows.set(email, {
          id, nome: name, email, senha_hash: passwordHash, avatar_url: null, perfil: 'cliente',
          tipo_usuario: 'USUARIO', telefone: null, uf_padrao: 'SP', cidade_padrao: 'São Paulo',
          ativo: 1, criado_em: new Date()
        });
        return [{ insertId: id }];
      }
      throw new Error(`Consulta inesperada: ${sql}`);
    }
  };
  t.mock.method(mysql, 'createPool', () => pool);
  t.mock.method(OAuth2Client.prototype, 'verifyIdToken', async () => ({
    getPayload: () => ({ sub: 'google-id', email_verified: true, email: 'google@example.com', name: 'Google' })
  }));
  const originalClientId = process.env.GOOGLE_CLIENT_ID;
  process.env.GOOGLE_CLIENT_ID = 'test-client';
  const server = createServer(createExpressApp());
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/auth`;
    const post = async (route, body) => {
      const response = await fetch(`${base}/${route}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
      });
      return { status: response.status, body: await response.json() };
    };
    const login = { email: 'teste@example.com', password: 'senha123' };
    const register = { name: 'Teste', ...login };
    assert.equal((await post('login', login)).status, 503);
    assert.equal((await post('register', register)).status, 503);
    assert.equal((await post('google', { idToken: 'credential' })).status, 503);

    assert.equal(await connectDatabase(), true);
    assert.equal((await post('login', login)).status, 401);
    const created = await post('register', register);
    assert.equal(created.status, 201);
    assert.ok(created.body.token);
    assert.equal((await post('register', register)).status, 409);
    assert.equal((await post('login', login)).status, 200);
    assert.equal((await post('login', { ...login, password: 'incorreta' })).status, 401);
    rows.get(login.email).senha_hash = hashPassword('outra senha');
    assert.equal((await post('login', login)).status, 401);
    assert.equal((await post('login', { ...login, password: 'outra senha' })).status, 200);
    rows.get(login.email).ativo = 0;
    assert.equal((await post('login', { ...login, password: 'outra senha' })).status, 403);
    rows.get(login.email).ativo = 1;

    const me = () => fetch(`${base}/me`, { headers: { authorization: `Bearer ${created.body.token}` } });
    assert.equal((await me()).status, 200);
    assert.equal((await post('google', { idToken: 'credential' })).status, 200);
    unavailable = true;
    assert.equal((await post('login', login)).status, 503);
    assert.equal((await post('register', { ...register, email: 'novo@example.com' })).status, 503);
    assert.equal((await post('google', { idToken: 'credential' })).status, 503);
    assert.equal((await me()).status, 503);
    unavailable = false;
    insertFailure = true;
    assert.equal((await post('register', { ...register, email: 'novo@example.com' })).status, 503);
    assert.equal(rows.has('novo@example.com'), false);
    rows.delete('google@example.com');
    assert.equal((await post('google', { idToken: 'credential' })).status, 503);
    assert.equal(rows.has('google@example.com'), false);
  } finally {
    if (server.listening) await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalClientId;
  }
});

test('sessão armazenada não é aceita quando sua validação falha', async () => {
  const values = new Map([
    ['construtec_session_user', JSON.stringify({ id: '1', isLoggedIn: true, token: 'token' })],
    ['construtec_jwt_token', 'token']
  ]);
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: key => values.delete(key)
    }
  });
  const injector = createEnvironmentInjector([
    { provide: HttpClient, useValue: { get: () => throwError(() => ({ status: 503 })) } },
    AuthService
  ], null);
  try {
    const auth = injector.get(AuthService);
    assert.equal(auth.isLoggedIn(), true);
    assert.equal(await auth.verifySession(), false);
    assert.equal(auth.isLoggedIn(), false);
    assert.equal(values.has('construtec_jwt_token'), false);
  } finally {
    injector.destroy();
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
    else delete globalThis.localStorage;
  }
});

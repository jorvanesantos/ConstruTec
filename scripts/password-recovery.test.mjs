import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import test from 'node:test';
import mysql from 'mysql2/promise';
import nodemailer from 'nodemailer';
import { createExpressApp } from '../backend/construtec-api/src/app.ts';
import { connectDatabase } from '../backend/construtec-api/src/config/database.ts';
import { verifyPassword } from '../backend/construtec-api/src/utils/security.ts';

test('recuperação valida código temporário e permite redefinição apenas uma vez', async t => {
  const user = {
    id: 1, nome: 'Teste', email: 'teste@example.com', tipo_usuario: 'USUARIO',
    ativo: 1, senha_hash: 'senha antiga', reset_token: null, expired: false
  };
  let email;
  let failEmail = false;
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
      if (sql.includes('WHERE email = ?')) {
        return [params[0] === user.email ? [user] : []];
      }
      if (sql.includes('SET reset_token = ?, reset_token_expira')) {
        user.reset_token = params[0];
        user.expired = false;
        return [{ affectedRows: 1 }];
      }
      if (sql.includes('SET reset_token = NULL')) {
        if (user.reset_token === params[1]) user.reset_token = null;
        return [{ affectedRows: 1 }];
      }
      if (sql.includes('SELECT') && sql.includes('WHERE reset_token = ?')) {
        return [user.reset_token === params[0] && !user.expired && user.ativo ? [user] : []];
      }
      if (sql.includes('SET senha_hash = ?')) {
        if (user.reset_token !== params[2] || user.expired || !user.ativo) return [{ affectedRows: 0 }];
        user.senha_hash = params[0];
        user.reset_token = null;
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Consulta inesperada: ${sql}`);
    }
  };
  t.mock.method(mysql, 'createPool', () => pool);
  t.mock.method(nodemailer, 'createTransport', () => ({
    async sendMail(message) {
      if (failEmail) throw new Error('SMTP indisponível');
      email = message;
    }
  }));
  const originalUser = process.env.EMAIL_USER;
  const originalPass = process.env.EMAIL_PASS;
  process.env.EMAIL_USER = 'smtp@example.com';
  process.env.EMAIL_PASS = 'test-password';
  const server = createServer(createExpressApp());
  try {
    assert.equal(await connectDatabase(), true);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const base = `http://127.0.0.1:${server.address().port}/api/auth`;
    const post = async (route, body) => {
      const response = await fetch(`${base}/${route}`, {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
      });
      return { status: response.status, body: await response.json() };
    };
    const requestCode = async () => {
      const response = await post('esqueci-senha', { email: user.email });
      assert.equal(response.status, 200);
      assert.equal(response.body.message, unknown.body.message);
      const code = email.text.match(/Seu código temporário é: ([A-F0-9]{24})/)?.[1];
      assert.ok(code);
      assert.ok(email.html.includes(code));
      assert.equal(user.reset_token, createHash('sha256').update(code).digest('hex'));
      assert.notEqual(user.reset_token, code);
      return code;
    };

    const unknown = await post('esqueci-senha', { email: 'desconhecido@example.com' });
    const code = await requestCode();
    assert.equal(user.senha_hash, 'senha antiga');
    assert.equal((await post('verificar-codigo-recuperacao', { token: 'INVALIDO' })).status, 400);
    assert.equal((await post('verificar-codigo-recuperacao', { token: 'F'.repeat(24) })).status, 400);
    assert.equal((await post('verificar-codigo-recuperacao', { token: code.toLowerCase() })).status, 200);
    assert.equal((await post('redefinir-senha', { token: code, novaSenha: '123' })).status, 400);
    assert.equal((await post('redefinir-senha', { token: code.toLowerCase(), novaSenha: 'nova senha' })).status, 200);
    assert.ok(verifyPassword('nova senha', user.senha_hash));
    assert.equal((await post('verificar-codigo-recuperacao', { token: code })).status, 400);
    assert.equal((await post('redefinir-senha', { token: code, novaSenha: 'outra senha' })).status, 400);

    const oldCode = await requestCode();
    const newCode = await requestCode();
    assert.notEqual(oldCode, newCode);
    assert.equal((await post('verificar-codigo-recuperacao', { token: oldCode })).status, 400);
    user.ativo = 0;
    assert.equal((await post('verificar-codigo-recuperacao', { token: newCode })).status, 400);
    assert.equal((await post('redefinir-senha', { token: newCode, novaSenha: 'outra senha' })).status, 400);
    user.ativo = 1;
    user.expired = true;
    assert.equal((await post('verificar-codigo-recuperacao', { token: newCode })).status, 400);
    assert.equal((await post('redefinir-senha', { token: newCode, novaSenha: 'outra senha' })).status, 400);

    const legacy = 'a'.repeat(64);
    user.expired = false;
    user.reset_token = createHash('sha256').update(legacy).digest('hex');
    assert.equal((await post('redefinir-senha', { token: legacy, novaSenha: 'senha legada' })).status, 200);
    assert.ok(verifyPassword('senha legada', user.senha_hash));

    failEmail = true;
    assert.equal((await post('esqueci-senha', { email: user.email })).status, 503);
    assert.equal(user.reset_token, null);
    assert.ok(verifyPassword('senha legada', user.senha_hash));
  } finally {
    if (server.listening) await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    if (originalUser === undefined) delete process.env.EMAIL_USER; else process.env.EMAIL_USER = originalUser;
    if (originalPass === undefined) delete process.env.EMAIL_PASS; else process.env.EMAIL_PASS = originalPass;
  }
});

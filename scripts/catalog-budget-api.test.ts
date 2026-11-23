import '@angular/compiler';
import { HttpClient } from '@angular/common/http';
import { createEnvironmentInjector } from '@angular/core';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import mysql from 'mysql2/promise';
import { of, throwError } from 'rxjs';
import { createExpressApp } from '../backend/construtec-api/src/app';
import { connectDatabase } from '../backend/construtec-api/src/config/database';
import { budgetsStore } from '../backend/construtec-api/src/repositories/data.repository';
import { JWT_SECRET, signJwtToken } from '../backend/construtec-api/src/utils/security';
import { signCalculation, verifyCalculation } from '../backend/construtec-api/src/utils/calculation-integrity';
import { CalculationService } from '../backend/construtec-api/src/services/calculation.service';
import { ObraService } from '../frontend/construtec-web/src/app/core/services/obra.service';
import { SavedBudget } from '../frontend/construtec-web/src/app/core/models/types';

test('assinaturas sobrevivem à reordenação JSON e aceitam a versão anterior', () => {
  const calculation = CalculationService.calculate('muro', { length: 10, height: 2 });
  const signed = signCalculation(calculation, '1');
  const reordered = JSON.parse(JSON.stringify(signed, (_key, value: unknown) =>
    value && typeof value === 'object' && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).reverse())
      : value
  ));
  assert.equal(verifyCalculation(reordered, '1'), true);
  assert.equal(verifyCalculation(reordered, '2'), false);
  reordered.materials[0].unitPrice = 0;
  assert.equal(verifyCalculation(reordered, '1'), false);
  const legacySignature = createHmac('sha256', JWT_SECRET)
    .update('construtec-calculation-v1\0').update('1').update('\0')
    .update(JSON.stringify(calculation)).digest('hex');
  assert.equal(verifyCalculation({ ...calculation, signature: legacySignature }, '1'), true);
});

test('preços regionais são calculados pela API', async () => {
  const server = createServer(createExpressApp());
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const response = await fetch(`http://127.0.0.1:${address.port}/api/precos?uf=RJ`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.location.uf, 'RJ');
    assert.ok(data.items.length > 0);
    assert.equal(data.allLocations.length, 27);
    const typesResponse = await fetch(`http://127.0.0.1:${address.port}/api/calculadora/tipos`);
    assert.equal(typesResponse.status, 200);
    const types = await typesResponse.json();
    assert.equal(types.length, 9);
    assert.ok(types.some((type: { id: string }) => type.id === 'pintura'));
    for (const item of data.items) {
      assert.equal(item.uf, 'RJ');
      assert.equal(item.regionalPrice, Math.round(item.basePrice * data.location.priceMultiplier * 100) / 100);
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test('histórico só confirma exclusão persistida no banco', async t => {
  const budget = { id: 'teste-exclusao', userId: '1', userEmail: 'teste@example.com', title: 'Teste' };
  budgetsStore.push(budget as typeof budgetsStore[number]);
  let failDelete = false;
  const pool = {
    async getConnection() { return {
      async query(sql: string, values?: unknown[]) {
        if (sql.includes('INSERT INTO obra')) {
          insertedTotal = values?.[6] as number;
          return [{ insertId: 1 }];
        }
        return [{}];
      },
      async ping() {}, async beginTransaction() {}, async commit() {}, release() {}
    }; },
    async end() {},
    async query(sql: string) {
      if (sql.includes('INFORMATION_SCHEMA.COLUMNS')) return [[{ COLUMN_NAME: 'reset_token' }, { COLUMN_NAME: 'reset_token_expira' }]];
      return [[]];
    },
    async execute(sql: string, values?: unknown[]) {
      if (failDelete) throw new Error('falha simulada');
      if (sql.includes('UPDATE obra')) updatedTotal = values?.[5] as number;
      return [{ affectedRows: 1 }];
    }
  };
  let insertedTotal: number | undefined;
  let updatedTotal: number | undefined;
  t.mock.method(mysql, 'createPool', () => pool as unknown as ReturnType<typeof mysql.createPool>);
  const server = createServer(createExpressApp());
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const url = `http://127.0.0.1:${address.port}/api/orcamentos`;
    const token = signJwtToken({ id: '1', email: 'teste@example.com', name: 'Teste', role: 'cliente', userType: 'USUARIO' });
    const headers = { authorization: `Bearer ${token}` };
    assert.equal((await fetch(url, { headers })).status, 503);
    assert.equal((await fetch(`${url}/${budget.id}`, { method: 'DELETE', headers })).status, 503);
    assert.ok(budgetsStore.includes(budget as typeof budgetsStore[number]));
    assert.equal(await connectDatabase(), true);
    const calculation = CalculationService.calculate('muro', { length: 10, height: 2 });
    const signed = signCalculation(calculation, '1');
    const createResponse = await fetch(url, {
      method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        id: 'teste-total', calculationResults: [signed, signed]
      })
    });
    assert.equal(createResponse.status, 201);
    assert.equal(insertedTotal, Math.round(calculation.totalEstimatedCost * 200) / 100);
    const tampered = await fetch(url, {
      method: 'POST', headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'teste-invalido', calculationResults: [{ ...signed, totalEstimatedCost: 0 }] })
    });
    assert.equal(tampered.status, 400);
    const differentUserToken = signJwtToken({ id: '2', email: 'outro@example.com', name: 'Outro', role: 'cliente', userType: 'USUARIO' });
    const wrongUser = await fetch(url, {
      method: 'POST', headers: { authorization: `Bearer ${differentUserToken}`, 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'teste-outro', calculationResults: [signed] })
    });
    assert.equal(wrongUser.status, 400);
    const oldBudget = budgetsStore.find(item => item.id === 'teste-total');
    assert.ok(oldBudget);
    const oldResult = { ...signed };
    delete oldResult.signature;
    oldBudget.calculationResult = oldResult;
    oldBudget.calculationResults = [oldResult];
    const legacy = await fetch(`${url}/teste-total`, {
      method: 'PUT', headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Histórico preservado', calculationResults: [oldResult] })
    });
    assert.equal(legacy.status, 200);
    assert.equal(updatedTotal, calculation.totalEstimatedCost);
    const modifiedLegacy = await fetch(`${url}/teste-total`, {
      method: 'PUT', headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ calculationResults: [{ ...oldResult, totalEstimatedCost: 0 }] })
    });
    assert.equal(modifiedLegacy.status, 400);
    const signedWithMetadata = {
      ...JSON.parse(JSON.stringify(signed)),
      formValues: { length: 10 },
      location: { uf: 'SP', city: 'São Paulo' }
    };
    const addCalculation = await fetch(`${url}/teste-total`, {
      method: 'PUT', headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({ calculationResults: [oldResult, signedWithMetadata] })
    });
    assert.equal(addCalculation.status, 200);
    const saved = await addCalculation.json();
    assert.deepEqual(saved.calculationResults[1].formValues, { length: 10 });
    assert.equal(updatedTotal, Math.round(calculation.totalEstimatedCost * 200) / 100);
    const modifiedMaterial = await fetch(`${url}/teste-total`, {
      method: 'PUT', headers: { ...headers, 'content-type': 'application/json' },
      body: JSON.stringify({
        calculationResults: [oldResult, {
          ...signedWithMetadata,
          materials: signedWithMetadata.materials.map((material: { unitPrice: number }) => ({ ...material, unitPrice: 0 }))
        }]
      })
    });
    assert.equal(modifiedMaterial.status, 400);
    failDelete = true;
    assert.equal((await fetch(`${url}/${budget.id}`, { method: 'DELETE', headers })).status, 503);
    assert.ok(budgetsStore.includes(budget as typeof budgetsStore[number]));
    failDelete = false;
    assert.equal((await fetch(`${url}/${budget.id}`, { method: 'DELETE', headers })).status, 200);
    assert.equal(budgetsStore.includes(budget as typeof budgetsStore[number]), false);
  } finally {
    const index = budgetsStore.indexOf(budget as typeof budgetsStore[number]);
    if (index >= 0) budgetsStore.splice(index, 1);
    const created = budgetsStore.findIndex(item => item.id === 'teste-total');
    if (created >= 0) budgetsStore.splice(created, 1);
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test('falha de exclusão não remove orçamento da interface', async () => {
  const budget = { id: 'teste', title: 'Teste' } as SavedBudget;
  const injector = createEnvironmentInjector([
    { provide: HttpClient, useValue: {
      get: () => of([budget]),
      delete: () => throwError(() => new Error('falha simulada'))
    } },
    ObraService
  ], null);
  try {
    const service = injector.get(ObraService);
    await service.loadBudgets(true);
    assert.equal(service.budgets().length, 1);
    await assert.rejects(service.deleteBudget(budget.id));
    assert.equal(service.budgets().length, 1);
  } finally {
    injector.destroy();
  }
});

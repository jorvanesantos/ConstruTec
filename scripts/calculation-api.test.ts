import '@angular/compiler';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { createEnvironmentInjector } from '@angular/core';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { of, throwError } from 'rxjs';
import { createExpressApp } from '../backend/construtec-api/src/app';
import { CalculationService } from '../backend/construtec-api/src/services/calculation.service';
import { applyOfficialPrices } from '../backend/construtec-api/src/services/sinapi-pricing.service';
import { signJwtToken } from '../backend/construtec-api/src/utils/security';
import { WorkTypeKey } from '../frontend/construtec-web/src/app/core/models/types';
import { CalculoService, calculationErrorMessage } from '../frontend/construtec-web/src/app/core/services/calculo.service';

const types: WorkTypeKey[] = ['muro', 'parede', 'piso', 'pintura', 'concreto', 'fundacao', 'telhado', 'revestimento', 'outro'];
const params = {
  length: 10, wallLength: 10, height: 2.5, width: 4, heightOrDepth: 0.15,
  depthOrHeight: 0.15, widthOrDiameter: 4, linearMetersOrUnits: 10,
  wallsCount: 4, coats: 2, area: 20, thicknessCm: 6, wastePercentage: 10
};

test('todos os tipos de cálculo usam a API autenticada e preservam o resultado do backend', async () => {
  const server = createServer(createExpressApp());
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const url = `http://127.0.0.1:${address.port}/api/calculos`;
    const token = signJwtToken({ id: '1', email: 'teste@example.com', name: 'Teste', role: 'cliente', userType: 'USUARIO' });
    const post = (type: string, body: object, authenticated = true) => fetch(`${url}/${type}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(authenticated ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body)
    });

    assert.equal((await post('muro', params, false)).status, 401);
    for (const type of types) {
      const response = await post(type, params);
      assert.equal(response.status, 200, type);
      const actual = await response.json();
      const expected = applyOfficialPrices(CalculationService.calculate(type, params), new Map());
      assert.match(actual.signature, /^[a-f0-9]{64}$/);
      const { signature: _signature, ...unsigned } = actual;
      assert.deepEqual({ ...unsigned, calculatedAt: expected.calculatedAt }, expected, type);
      assert.equal(actual.workType, type);
      assert.ok(Array.isArray(actual.materials));
      assert.ok(Number.isFinite(actual.totalEstimatedCost));
    }
    const invalid = await post('pintura', { ...params, includeCeiling: true, ceilingArea: 0 });
    assert.equal(invalid.status, 400);
    assert.match((await invalid.json()).error, /área do teto maior que zero/);
    assert.equal((await post('desconhecido', params)).status, 400);
    const region = { uf: 'RJ', city: 'Niterói', priceMultiplier: 0.01 };
    const trusted = applyOfficialPrices(CalculationService.calculate('muro', { ...params, location: { ...region, priceMultiplier: 1.05 } }), new Map());
    const manipulated = await post('muro', { ...params, location: region });
    assert.equal(manipulated.status, 200);
    const manipulatedResult = await manipulated.json();
    assert.equal(manipulatedResult.totalEstimatedCost, trusted.totalEstimatedCost);
    assert.deepEqual(manipulatedResult.materials, trusted.materials);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

test('o cliente retorna a resposta da API e propaga erros sem calcular localmente', async () => {
  const result = { workType: 'muro', materials: [], totalEstimatedCost: 123 };
  let observedUrl = '';
  let observedBody: object | undefined;
  let failure: HttpErrorResponse | undefined;
  const injector = createEnvironmentInjector([
    {
      provide: HttpClient,
      useValue: {
        post: (url: string, body: object) => {
          observedUrl = url;
          observedBody = body;
          return failure ? throwError(() => failure) : of(result);
        }
      }
    },
    CalculoService
  ], null);
  try {
    const service = injector.get(CalculoService);
    assert.deepEqual(await service.calculateRemote('muro', params), result);
    assert.equal(observedUrl, '/api/calculos/muro');
    assert.equal(observedBody, params);
    for (const status of [0, 400, 401, 403, 500, 503]) {
      failure = new HttpErrorResponse({ status, error: { error: 'Erro de validação' } });
      await assert.rejects(service.calculateRemote('muro', params), error => error === failure);
    }
    assert.equal(calculationErrorMessage(new HttpErrorResponse({ status: 400, error: { error: 'Área inválida.' } })), 'Área inválida.');
    for (const status of [0, 500, 503]) {
      assert.match(calculationErrorMessage(new HttpErrorResponse({ status })), /servidor de cálculos/);
    }
    assert.match(calculationErrorMessage(new Error('erro inesperado')), /Não foi possível calcular/);
  } finally {
    injector.destroy();
  }
});

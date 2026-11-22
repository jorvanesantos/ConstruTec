import '@angular/compiler';
import { HttpClient } from '@angular/common/http';
import { createEnvironmentInjector } from '@angular/core';
import assert from 'node:assert/strict';
import test from 'node:test';
import { CalculationService } from '../backend/construtec-api/src/services/calculation.service';
import { CalculoService } from '../frontend/construtec-web/src/app/core/services/calculo.service';

const injector = createEnvironmentInjector([{ provide: HttpClient, useValue: {} }, CalculoService], null);
const local = injector.get(CalculoService);
const engines = [
  { name: 'API', calculate: (params: object) => CalculationService.calculatePintura(params) },
  { name: 'local', calculate: (params: object) => local.calculateLocal('pintura', params) }
];
const base = {
  wallLength: 10, height: 2, wallsCount: 2, coats: 2, wastePercentage: 0,
  needsSealer: true, needsPutty: true
};

for (const engine of engines) {
  test(`${engine.name}: teto altera área e quantidades de pintura`, () => {
    const walls = engine.calculate(base);
    const withCeiling = engine.calculate({ ...base, includeCeiling: true, ceilingArea: 100 });
    const disabled = engine.calculate({ ...base, includeCeiling: false, ceilingArea: 100 });
    assert.equal(walls.areaM2, 40);
    assert.equal(withCeiling.areaM2, 140);
    assert.equal(disabled.areaM2, 40);
    assert.equal(withCeiling.inputSummary['Área do teto'], '100 m²');
    assert.match(withCeiling.formulasUsed[0], /40\.00 m² de paredes \+ 100\.00 m² de teto/);
    for (const id of ['mat_tinta_acrilica_18l', 'mat_selador_acrilico_18l', 'mat_massa_corrida_25kg']) {
      const before = walls.materials.find(material => material.id === id);
      const after = withCeiling.materials.find(material => material.id === id);
      assert.ok(before && after);
      assert.ok(after.quantityRaw > before.quantityRaw, id);
    }
  });

  test(`${engine.name}: teto exige área válida`, () => {
    for (const ceilingArea of [0, -1, null, 'invalid']) {
      assert.throws(() => engine.calculate({ ...base, includeCeiling: true, ceilingArea }), /área do teto maior que zero/);
    }
  });
}

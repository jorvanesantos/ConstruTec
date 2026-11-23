import assert from 'node:assert/strict';
import test from 'node:test';
import { CalculationService } from '../backend/construtec-api/src/services/calculation.service';

const base = {
  wallLength: 10, height: 2, wallsCount: 2, coats: 2, wastePercentage: 0,
  needsSealer: true, needsPutty: true
};

test('API: teto altera área e quantidades de pintura', () => {
  const walls = CalculationService.calculatePintura(base);
  const withCeiling = CalculationService.calculatePintura({ ...base, includeCeiling: true, ceilingArea: 100 });
  const disabled = CalculationService.calculatePintura({ ...base, includeCeiling: false, ceilingArea: 100 });
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

test('API: teto exige área válida', () => {
  for (const ceilingArea of [0, -1, null, 'invalid']) {
    assert.throws(() => CalculationService.calculatePintura({ ...base, includeCeiling: true, ceilingArea }), /área do teto maior que zero/);
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import ExcelJS from 'exceljs';
import { zipSync } from 'fflate';
import { REGIONAL_LOCATIONS } from '../backend/construtec-api/src/models/catalog.data';
import { CalculationService } from '../backend/construtec-api/src/services/calculation.service';
import { readOfficialPrices, SINAPI_MATERIALS } from '../backend/construtec-api/src/services/sinapi-import.service';
import { applyOfficialPrices, OfficialQuote } from '../backend/construtec-api/src/services/sinapi-pricing.service';

async function fixture(unit = 'KG', reference = '10/2026'): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('ISD');
  sheet.getCell('B3').value = reference;
  sheet.getCell('A10').value = 'Classificação';
  REGIONAL_LOCATIONS.forEach((location, index) => { sheet.getRow(10).getCell(index + 6).value = location.uf; });
  Object.values(SINAPI_MATERIALS).forEach((item, index) => {
    const row = sheet.getRow(11 + index);
    row.getCell(1).value = 'MATERIAL';
    row.getCell(2).value = item.code;
    row.getCell(3).value = `Insumo ${item.code}`;
    row.getCell(4).value = item.code === 1379 ? unit : item.unit;
    REGIONAL_LOCATIONS.forEach((_location, i) => { row.getCell(i + 6).value = 0.72; });
  });
  const bytes = await workbook.xlsx.writeBuffer();
  return zipSync({ 'SINAPI_Referência_2026_10.xlsx': new Uint8Array(bytes) });
}

test('importação valida competência, estados e unidade dos insumos', async () => {
  const data = await readOfficialPrices(await fixture(), '2026-10');
  assert.equal(data.length, Object.keys(SINAPI_MATERIALS).length * 27);
  assert.equal(data.find(item => item.code === 1379 && item.uf === 'SP')?.price, 0.72);
  await assert.rejects(readOfficialPrices(await fixture('UN'), '2026-10'), /Unidade inesperada/);
  await assert.rejects(readOfficialPrices(await fixture('KG', '09/2026'), '2026-10'), /incompleta ou incompatível/);
});

test('conversão do cimento e preço ausente preservam origem e total', () => {
  const result = CalculationService.calculate('muro', { length: 10, height: 2 });
  const quote: OfficialQuote = { reference: '2026-10', uf: 'SP', code: 1379, description: 'CIMENTO PORTLAND COMPOSTO CP II-32', unit: 'KG', price: 0.72 * SINAPI_MATERIALS.mat_cimento_50kg.factor };
  const priced = applyOfficialPrices(result, new Map([['mat_cimento_50kg', quote]]));
  const cement = priced.materials.find(item => item.id === 'mat_cimento_50kg')!;
  assert.equal(cement.unitPrice, 36);
  assert.equal(cement.totalPrice, cement.quantityCommercial * 36);
  assert.match(cement.priceSource!, /SINAPI SP 2026-10/);
  assert.equal(priced.materials[0].priceSource, 'Estimativa não oficial');
  assert.equal(priced.totalEstimatedCost, Math.round(priced.materials.reduce((sum, item) => sum + item.totalPrice, 0) * 100) / 100);
});

test('novos blocos usam dimensões e materiais próprios', () => {
  for (const [type, id] of [['bloco_14_6', 'mat_bloco_concreto_14_6'], ['bloco_19', 'mat_bloco_concreto_19']]) {
    for (const work of ['muro', 'parede'] as const) {
      const result = CalculationService.calculate(work, { length: 10, height: 2, blockType: type });
      assert.equal(result.materials[0].id, id);
      assert.ok(result.materials[0].quantityCommercial > 0);
    }
  }
});

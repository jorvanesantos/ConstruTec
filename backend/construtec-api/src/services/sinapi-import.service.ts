import ExcelJS from 'exceljs';
import { unzipSync } from 'fflate';
import { Readable } from 'node:stream';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { REGIONAL_LOCATIONS } from '../models/catalog.data';
import { fetchCaixa, findLatestSinapiReport } from './sinapi-source.service';

export const SINAPI_MATERIALS: Record<string, { code: number; unit: string; factor: number }> = {
  mat_cimento_50kg: { code: 1379, unit: 'KG', factor: 50 },
  mat_areia_media: { code: 370, unit: 'M3', factor: 1 },
  mat_brita_1: { code: 4721, unit: 'M3', factor: 1 },
  mat_bloco_concreto_14: { code: 25070, unit: 'UN', factor: 1 },
  mat_bloco_concreto_14_6: { code: 34571, unit: 'UN', factor: 1 },
  mat_bloco_concreto_19: { code: 25067, unit: 'UN', factor: 1 },
  mat_bloco_concreto_09: { code: 25071, unit: 'UN', factor: 1 },
  mat_porcelanato: { code: 45190, unit: 'M2', factor: 1 },
  mat_piso_ceramico_padrao: { code: 1292, unit: 'M2', factor: 1 },
  mat_argamassa_ac1: { code: 1381, unit: 'KG', factor: 20 },
  mat_argamassa_ac2: { code: 34353, unit: 'KG', factor: 20 },
  mat_argamassa_ac3: { code: 37595, unit: 'KG', factor: 20 },
  mat_rejunte_cimenticio: { code: 34357, unit: 'KG', factor: 1 },
  mat_cal_hidratada: { code: 1106, unit: 'KG', factor: 20 },
  mat_tinta_acrilica_18l: { code: 7356, unit: 'L', factor: 18 },
  mat_selador_acrilico_18l: { code: 6085, unit: 'L', factor: 18 },
  mat_massa_corrida_25kg: { code: 43626, unit: 'KG', factor: 25 },
  mat_telha_fibrocimento: { code: 7194, unit: 'M2', factor: 2.44 * 1.10 }
};

interface OfficialPrice {
  code: number;
  uf: string;
  description: string;
  unit: string;
  price: number;
}

const MAX_ARCHIVE_BYTES = 30 * 1024 * 1024;
const MAX_WORKBOOK_BYTES = 25 * 1024 * 1024;

async function downloadArchive(url: string): Promise<Uint8Array> {
  const response = await fetchCaixa(url);
  const length = Number(response.headers.get('content-length') || 0);
  if (length > MAX_ARCHIVE_BYTES || !response.body) {
    await response.body?.cancel();
    throw new Error('Relatório SINAPI vazio ou maior que o limite permitido.');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > MAX_ARCHIVE_BYTES) throw new Error('Relatório SINAPI excedeu o limite de tamanho.');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks, total);
}

export async function readOfficialPrices(archive: Uint8Array, reference: string): Promise<OfficialPrice[]> {
  const expected = `SINAPI_Referência_${reference.replace('-', '_')}.xlsx`;
  const files = unzipSync(archive, {
    filter: file => file.name === expected && file.originalSize <= MAX_WORKBOOK_BYTES
  });
  const workbook = files[expected];
  if (!workbook || workbook.length > MAX_WORKBOOK_BYTES) throw new Error('Planilha de referência SINAPI não encontrada ou excede o limite.');
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(Readable.from([Buffer.from(workbook)]), {
    worksheets: 'emit', sharedStrings: 'cache', styles: 'ignore', hyperlinks: 'ignore'
  });
  const wanted = new Map(Object.values(SINAPI_MATERIALS).map(item => [item.code, item]));
  const expectedStates = new Set(REGIONAL_LOCATIONS.map(location => location.uf));
  const prices: OfficialPrice[] = [];
  let foundSheet = false;
  let foundHeader = false;
  let foundReference = false;
  for await (const sheet of reader) {
    if (!('name' in sheet) || sheet.name !== 'ISD') {
      for await (const _row of sheet) { /* consume worksheet */ }
      continue;
    }
    foundSheet = true;
    const columns = new Map<number, string>();
    for await (const row of sheet) {
      if (row.number === 3) {
        foundReference = String(row.getCell(2).value) === `${reference.slice(5)}/${reference.slice(0, 4)}`;
      }
      if (row.number === 10) {
        for (let col = 6; col <= 32; col++) {
          const uf = String(row.getCell(col).value || '');
          if (expectedStates.has(uf)) columns.set(col, uf);
        }
        foundHeader = String(row.getCell(1).value) === 'Classificação' &&
          columns.size === expectedStates.size && new Set(columns.values()).size === expectedStates.size;
      }
      if (row.number <= 10 || row.getCell(1).value !== 'MATERIAL') continue;
      const code = Number(row.getCell(2).value);
      const definition = wanted.get(code);
      if (!definition) continue;
      const unit = String(row.getCell(4).value || '');
      if (unit !== definition.unit) throw new Error(`Unidade inesperada para o insumo SINAPI ${code}: ${unit}.`);
      const description = String(row.getCell(3).value || '');
      if (!description || description.length > 500) throw new Error(`Descrição inválida do insumo SINAPI ${code}.`);
      for (const [col, uf] of columns) {
        const price = row.getCell(col).value;
        if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
          prices.push({ code, uf, description, unit, price });
        } else if (price !== null && price !== undefined && price !== '') {
          throw new Error(`Preço inválido para SINAPI ${code}, ${uf}.`);
        }
      }
    }
    break;
  }
  if (!foundSheet || !foundHeader || !foundReference || wanted.size === 0 ||
      [...wanted.keys()].some(code => !prices.some(price => price.code === code))) {
    throw new Error('Planilha SINAPI incompleta ou incompatível; nenhum preço foi importado.');
  }
  return prices;
}

export async function importLatestSinapi(pool: Pool): Promise<{ reference: string; count: number; imported: boolean }> {
  const connection = await pool.getConnection();
  let locked = false;
  try {
    const [lockRows] = await connection.query<RowDataPacket[]>("SELECT GET_LOCK('construtec_sinapi_import', 0) AS acquired");
    if (Number(lockRows[0]?.acquired) !== 1) throw new Error('Outra atualização SINAPI já está em andamento.');
    locked = true;
    const report = await findLatestSinapiReport();
    const [existing] = await connection.execute<RowDataPacket[]>('SELECT COUNT(*) AS count, COUNT(DISTINCT codigo) AS codes FROM sinapi_preco WHERE referencia = ?', [report.reference]);
    if (Number(existing[0]?.codes) === new Set(Object.values(SINAPI_MATERIALS).map(item => item.code)).size) {
      return { reference: report.reference, count: Number(existing[0].count), imported: false };
    }
    const prices = await readOfficialPrices(await downloadArchive(report.url), report.reference);
    await savePrices(connection, report.reference, report.url, prices);
    return { reference: report.reference, count: prices.length, imported: true };
  } finally {
    if (locked) {
      try { await connection.query("SELECT RELEASE_LOCK('construtec_sinapi_import')"); }
      catch (err) { console.error('[SINAPI] Falha ao liberar bloqueio:', err); }
    }
    connection.release();
  }
}

async function savePrices(connection: PoolConnection, reference: string, url: string, prices: OfficialPrice[]): Promise<void> {
  await connection.beginTransaction();
  try {
    for (const item of prices) {
      await connection.execute(
        `INSERT INTO sinapi_preco (referencia, codigo, uf, descricao, unidade, preco, fonte) VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE descricao=VALUES(descricao), unidade=VALUES(unidade), preco=VALUES(preco), fonte=VALUES(fonte)`,
        [reference, item.code, item.uf, item.description, item.unit, item.price, url]
      );
    }
    await connection.commit();
  } catch (err) {
    try { await connection.rollback(); } catch (rollbackError) { console.error('[SINAPI] Falha no rollback:', rollbackError); }
    throw err;
  }
}

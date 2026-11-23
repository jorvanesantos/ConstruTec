import type { RowDataPacket } from 'mysql2';
import { getDbPool, getDbState } from '../config/database';
import { CalculationResult } from '../models/types';
import { SINAPI_MATERIALS } from './sinapi-import.service';

export interface OfficialQuote {
  reference: string;
  uf: string;
  code: number;
  description: string;
  unit: string;
  price: number;
}

export async function officialPrices(uf: string): Promise<Map<string, OfficialQuote>> {
  const prices = new Map<string, OfficialQuote>();
  const pool = getDbPool();
  if (!getDbState().connected || !pool) return prices;
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT referencia, codigo, descricao, unidade, preco FROM sinapi_preco
       WHERE uf = ? AND referencia = (SELECT MAX(referencia) FROM sinapi_preco)`,
      [uf]
    );
    for (const [id, mapping] of Object.entries(SINAPI_MATERIALS)) {
      const row = rows.find(item => Number(item.codigo) === mapping.code && item.unidade === mapping.unit);
      if (row && Number.isFinite(Number(row.preco)) && Number(row.preco) > 0) {
        prices.set(id, {
          reference: String(row.referencia), uf, code: mapping.code, description: String(row.descricao),
          unit: mapping.unit, price: Math.round(Number(row.preco) * mapping.factor * 100) / 100
        });
      }
    }
  } catch (error) {
    console.error('[SINAPI] Preços oficiais indisponíveis; usando estimativas:', error);
  }
  return prices;
}

export function applyOfficialPrices(result: CalculationResult, prices: Map<string, OfficialQuote>): CalculationResult {
  const materials = result.materials.map(material => {
    const quote = prices.get(material.id);
    if (!quote) return { ...material, priceSource: 'Estimativa não oficial' };
    return {
      ...material,
      unitPrice: quote.price,
      totalPrice: Math.round(material.quantityCommercial * quote.price * 100) / 100,
      priceSource: `SINAPI ${quote.uf} ${quote.reference} — insumo ${quote.code} (${quote.description})`
    };
  });
  const total = Math.round(materials.reduce((sum, material) => sum + material.totalPrice, 0) * 100) / 100;
  const wasteCost = Math.round(total * result.wastePercentage) / 100;
  return {
    ...result,
    materials,
    totalEstimatedCost: total,
    wasteCost,
    subtotalMaterials: Math.round((total - wasteCost) * 100) / 100,
    priceDisclaimer: 'Preços identificados como SINAPI usam a última competência importada para a UF, que pode estar defasada; os demais são estimativas não oficiais. Valores não incluem necessariamente frete.'
  };
}

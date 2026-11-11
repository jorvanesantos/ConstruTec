import { Router, type Request, type Response } from 'express';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { WORK_TYPES } from '../data/catalog';
import type { WorkTypeKey } from '../types';

interface SavedCalculationsDependencies {
  getPool: () => Pool | null;
  isConnected: () => boolean;
}

interface SavedCalculationRow extends RowDataPacket {
  id: number;
  owner_user_id: string;
  tipo_obra: string;
  parametros_json: Record<string, unknown> | string;
  resultado_json: Record<string, unknown> | string;
  criado_em: Date | string;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isWorkTypeKey(value: unknown): value is WorkTypeKey {
  return typeof value === 'string' && WORK_TYPES.some((workType) => workType.id === value);
}

function parseJson(value: Record<string, unknown> | string): Record<string, unknown> {
  return typeof value === 'string' ? JSON.parse(value) as Record<string, unknown> : value;
}

function serializeCalculation(row: SavedCalculationRow) {
  return {
    id: String(row.id),
    tipoObra: row.tipo_obra,
    parametros: parseJson(row.parametros_json),
    resultado: parseJson(row.resultado_json),
    criadoEm: row.criado_em
  };
}

export function createSavedCalculationsRouter({ getPool, isConnected }: SavedCalculationsDependencies) {
  const router = Router();
  const getRequestUserId = (req: Request) => (req as Request & { user?: { id: string } }).user?.id;

  function getAvailablePool(res: Response): Pool | null {
    const pool = getPool();
    if (!isConnected() || !pool) {
      res.status(503).json({ error: 'Banco de dados indisponível. Verifique a conexão com o MySQL.' });
      return null;
    }
    return pool;
  }

  router.get('/', async (req: Request, res: Response) => {
    const pool = getAvailablePool(res);
    if (!pool) return;
    const userId = getRequestUserId(req);
    if (!userId) return res.status(401).json({ error: 'Autenticação necessária.' });

    try {
      const [rows] = await pool.execute<SavedCalculationRow[]>(
        'SELECT id, owner_user_id, tipo_obra, parametros_json, resultado_json, criado_em FROM calculos WHERE owner_user_id = ? ORDER BY id DESC LIMIT 50',
        [userId]
      );
      res.json(rows.map(serializeCalculation));
    } catch (error) {
      console.error('[MySQL] Erro ao listar cálculos salvos:', error);
      res.status(500).json({ error: 'Não foi possível listar os cálculos salvos.' });
    }
  });

  router.get('/:id', async (req: Request, res: Response) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
      return res.status(400).json({ error: 'O identificador do cálculo deve ser um número positivo.' });
    }

    const pool = getAvailablePool(res);
    if (!pool) return;
    const userId = getRequestUserId(req);
    if (!userId) return res.status(401).json({ error: 'Autenticação necessária.' });

    try {
      const [rows] = await pool.execute<SavedCalculationRow[]>(
        'SELECT id, owner_user_id, tipo_obra, parametros_json, resultado_json, criado_em FROM calculos WHERE id = ? AND owner_user_id = ? LIMIT 1',
        [req.params.id, userId]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Cálculo não encontrado.' });
      }
      res.json(serializeCalculation(rows[0]));
    } catch (error) {
      console.error('[MySQL] Erro ao consultar cálculo salvo:', error);
      res.status(500).json({ error: 'Não foi possível consultar o cálculo salvo.' });
    }
  });

  router.post('/', async (req: Request, res: Response) => {
    const { tipoObra, parametros, resultado } = req.body ?? {};
    if (!isWorkTypeKey(tipoObra)) {
      return res.status(400).json({ error: 'tipoObra deve corresponder a um tipo de obra cadastrado.' });
    }
    if (!isObject(parametros) || !isObject(resultado)) {
      return res.status(400).json({ error: 'parametros e resultado devem ser objetos JSON.' });
    }

    const pool = getAvailablePool(res);
    if (!pool) return;
    const userId = getRequestUserId(req);
    if (!userId) return res.status(401).json({ error: 'Autenticação necessária.' });

    try {
      const [insertResult] = await pool.execute<ResultSetHeader>(
        'INSERT INTO calculos (owner_user_id, tipo_obra, parametros_json, resultado_json) VALUES (?, ?, ?, ?)',
        [userId, tipoObra, JSON.stringify(parametros), JSON.stringify(resultado)]
      );
      const [rows] = await pool.execute<SavedCalculationRow[]>(
        'SELECT id, owner_user_id, tipo_obra, parametros_json, resultado_json, criado_em FROM calculos WHERE id = ? AND owner_user_id = ? LIMIT 1',
        [insertResult.insertId, userId]
      );
      if (rows.length === 0) {
        throw new Error('O cálculo foi inserido, mas não pôde ser recuperado.');
      }
      res.status(201).json(serializeCalculation(rows[0]));
    } catch (error) {
      console.error('[MySQL] Erro ao salvar cálculo:', error);
      res.status(500).json({ error: 'Não foi possível salvar o cálculo.' });
    }
  });

  return router;
}

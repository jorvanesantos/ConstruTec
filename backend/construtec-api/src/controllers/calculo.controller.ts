import { Request, Response } from 'express';
import { WorkTypeKey } from '../models/types';
import { CalculationService } from '../services/calculation.service';

export function calculateByType(req: Request, res: Response): void {
  try {
    const tipo = req.params.tipo as WorkTypeKey;
    const params = req.body || {};
    const result = CalculationService.calculate(tipo, params);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao executar cálculo da obra.' });
  }
}

export function calculateGeneric(req: Request, res: Response): void {
  try {
    const tipo = (req.body?.workType || req.body?.tipo || 'muro') as WorkTypeKey;
    const result = CalculationService.calculate(tipo, req.body || {});
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao processar parâmetros do cálculo.' });
  }
}

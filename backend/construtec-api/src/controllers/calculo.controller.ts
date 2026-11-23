import { Response } from 'express';
import { WorkTypeKey } from '../models/types';
import { CalculationService } from '../services/calculation.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { signCalculation } from '../utils/calculation-integrity';
import { applyOfficialPrices, officialPrices } from '../services/sinapi-pricing.service';
import { REGIONAL_LOCATIONS } from '../models/catalog.data';

export async function calculateByType(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const tipo = req.params.tipo as WorkTypeKey;
    const params = req.body || {};
    const result = CalculationService.calculate(tipo, params);
    if (!req.user) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }
    const uf = typeof params.location === 'string' ? params.location : params.location?.uf;
    const location = REGIONAL_LOCATIONS.find(item => item.uf === String(uf || '').toUpperCase()) || REGIONAL_LOCATIONS[0];
    const prices = await officialPrices(location.uf);
    if (tipo === 'piso' && (Number(params.tileSizeCm || 60) <= 50 || Number(params.tileSizeCm || 60) > 80)) prices.delete('mat_porcelanato');
    if (tipo === 'revestimento' || (tipo === 'piso' && Number(params.tileSizeCm || 60) <= 45)) prices.delete('mat_piso_ceramico_padrao');
    res.json(signCalculation(applyOfficialPrices(result, prices), req.user.id));
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao executar cálculo da obra.' });
  }
}

export async function calculateGeneric(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const tipo = (req.body?.workType || req.body?.tipo || 'muro') as WorkTypeKey;
    const result = CalculationService.calculate(tipo, req.body || {});
    if (!req.user) {
      res.status(401).json({ error: 'Autenticação necessária.' });
      return;
    }
    const uf = typeof req.body?.location === 'string' ? req.body.location : req.body?.location?.uf;
    const location = REGIONAL_LOCATIONS.find(item => item.uf === String(uf || '').toUpperCase()) || REGIONAL_LOCATIONS[0];
    const prices = await officialPrices(location.uf);
    if (tipo === 'piso' && (Number(req.body?.tileSizeCm || 60) <= 50 || Number(req.body?.tileSizeCm || 60) > 80)) prices.delete('mat_porcelanato');
    if (tipo === 'revestimento' || (tipo === 'piso' && Number(req.body?.tileSizeCm || 60) <= 45)) prices.delete('mat_piso_ceramico_padrao');
    res.json(signCalculation(applyOfficialPrices(result, prices), req.user.id));
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Erro ao processar parâmetros do cálculo.' });
  }
}

import { Request, Response } from 'express';
import { BASE_MATERIALS_CATALOG, REGIONAL_LOCATIONS } from '../models/catalog.data';
import { materialsStore, workTypesStore } from '../repositories/data.repository';

export function getWorkTypes(_req: Request, res: Response): void {
  res.json(workTypesStore.filter(w => w.active));
}

export function getMaterials(_req: Request, res: Response): void {
  res.json(materialsStore);
}

export function getMaterialById(req: Request, res: Response): void {
  const found =
    materialsStore.find(m => m.id === req.params.id) ||
    BASE_MATERIALS_CATALOG.find(m => m.id === req.params.id);
  if (!found) {
    res.status(404).json({ error: 'Material não encontrado.' });
    return;
  }
  res.json(found);
}

export function getRegionalPrices(req: Request, res: Response): void {
  const uf = String(req.query.uf || 'SP').toUpperCase();
  const location = REGIONAL_LOCATIONS.find(l => l.uf === uf) || REGIONAL_LOCATIONS[0];
  const items = BASE_MATERIALS_CATALOG.map(item => ({
    ...item,
    regionalPrice: Math.round(item.basePrice * location.priceMultiplier * 100) / 100,
    uf: location.uf
  }));
  res.json({ location, items, allLocations: REGIONAL_LOCATIONS });
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function findLocationMatch(ufCandidate?: string, stateCandidate?: string, cityCandidate?: string) {
  const cleanUf = String(ufCandidate || '')
    .replace(/^BR-/i, '')
    .toUpperCase()
    .trim();
  const byUf = REGIONAL_LOCATIONS.find(l => l.uf === cleanUf);
  if (byUf) {
    return {
      ...byUf,
      city: cityCandidate ? `${cityCandidate} (${byUf.uf})` : byUf.city
    };
  }

  if (stateCandidate) {
    const target = normalizeText(stateCandidate);
    const byName = REGIONAL_LOCATIONS.find(l => normalizeText(l.stateName) === target);
    if (byName) {
      return {
        ...byName,
        city: cityCandidate ? `${cityCandidate} (${byName.uf})` : byName.city
      };
    }
  }

  return null;
}

function extractClientIp(req: Request): string | null {
  const forwarded = req.headers['x-forwarded-for'];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded || req.headers['x-real-ip'] || req.ip || '';
  const ip = String(raw).split(',')[0].trim().replace(/^::ffff:/, '');
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('10.') || ip.startsWith('192.168.') || /^172\.(1[6-9]|2\d|3[01])\./.test(ip)) {
    return null;
  }
  return ip;
}

export async function detectRegion(req: Request, res: Response): Promise<void> {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);

  if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const geoResp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&accept-language=pt-BR`,
        {
          headers: { 'User-Agent': 'ConstruTec/1.0' },
          signal: controller.signal
        }
      );
      clearTimeout(timeout);
      if (geoResp.ok) {
        const data: any = await geoResp.json();
        const addr = data?.address || {};
        if (String(addr.country_code || '').toLowerCase() === 'br') {
          const isoState = addr['ISO3166-2-lvl4'] || addr.state_code;
          const city = addr.city || addr.town || addr.municipality || addr.village;
          const matched = findLocationMatch(isoState, addr.state, city);
          if (matched) {
            res.json({ detected: true, source: 'gps', location: matched });
            return;
          }
        }
      }
    } catch {
      // Fallback para detecção via IP
    }
  }

  const clientIp = extractClientIp(req);
  if (clientIp) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const ipResp = await fetch(`https://ipwho.is/${encodeURIComponent(clientIp)}`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (ipResp.ok) {
        const data: any = await ipResp.json();
        if (data?.success !== false && String(data?.country_code || '').toUpperCase() === 'BR') {
          const matched = findLocationMatch(data.region_code, data.region, data.city);
          if (matched) {
            res.json({ detected: true, source: 'ip', location: matched });
            return;
          }
        }
      }
    } catch {
      // Fallback silencioso
    }
  }

  res.json({ detected: false, source: 'default', location: REGIONAL_LOCATIONS[0] });
}

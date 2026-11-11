import type { WorkTypeKey } from '../types';

export interface CalculationSettings {
  defaultWasteByWorkType: Record<WorkTypeKey, number>;
  masonryUnitsPerM2: {
    concreteBlock: number;
    ceramicBrick: number;
  };
  materialPriceOverrides?: Record<string, number>;
}

export const DEFAULT_CALCULATION_SETTINGS: CalculationSettings = {
  defaultWasteByWorkType: {
    muro: 10,
    parede: 10,
    piso: 12,
    pintura: 8,
    concreto: 10,
    fundacao: 12,
    telhado: 10,
    revestimento: 10,
    outro: 10
  },
  masonryUnitsPerM2: {
    concreteBlock: 12.5,
    ceramicBrick: 25
  },
  materialPriceOverrides: {}
};

export function isCalculationSettings(value: unknown): value is CalculationSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Partial<CalculationSettings>;
  const workTypes: WorkTypeKey[] = [
    'muro',
    'parede',
    'piso',
    'pintura',
    'concreto',
    'fundacao',
    'telhado',
    'revestimento',
    'outro'
  ];

  return Boolean(
    settings.defaultWasteByWorkType &&
    workTypes.every((type) => {
      const waste = settings.defaultWasteByWorkType?.[type];
      return typeof waste === 'number' && Number.isFinite(waste) && waste >= 0 && waste <= 100;
    }) &&
    settings.masonryUnitsPerM2 &&
    typeof settings.masonryUnitsPerM2.concreteBlock === 'number' &&
    Number.isFinite(settings.masonryUnitsPerM2.concreteBlock) &&
    settings.masonryUnitsPerM2.concreteBlock >= 1 &&
    settings.masonryUnitsPerM2.concreteBlock <= 100 &&
    typeof settings.masonryUnitsPerM2.ceramicBrick === 'number' &&
    Number.isFinite(settings.masonryUnitsPerM2.ceramicBrick) &&
    settings.masonryUnitsPerM2.ceramicBrick >= 1 &&
    settings.masonryUnitsPerM2.ceramicBrick <= 200 &&
    (settings.materialPriceOverrides === undefined ||
      (settings.materialPriceOverrides !== null &&
        typeof settings.materialPriceOverrides === 'object' &&
        Object.entries(settings.materialPriceOverrides).every(([id, price]) =>
          /^[a-zA-Z0-9_-]{1,80}$/.test(id) &&
          typeof price === 'number' &&
          Number.isFinite(price) &&
          price >= 0 &&
          price <= 10000000
        )))
  );
}

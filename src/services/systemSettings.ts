export interface SystemSettings {
  systemName: string;
  termsOfUse: string;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  systemName: 'ConstruTec',
  termsOfUse: 'Os resultados da plataforma são estimativas e não substituem orçamento, projeto ou avaliação de profissional habilitado.'
};

export function isSystemSettings(value: unknown): value is SystemSettings {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Partial<SystemSettings>;
  return typeof settings.systemName === 'string' &&
    settings.systemName.trim().length >= 2 &&
    settings.systemName.trim().length <= 80 &&
    typeof settings.termsOfUse === 'string' &&
    settings.termsOfUse.length <= 10000;
}

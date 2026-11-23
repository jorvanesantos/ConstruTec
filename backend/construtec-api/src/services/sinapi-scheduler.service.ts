import { getDbPool, getDbState } from '../config/database';
import { importLatestSinapi } from './sinapi-import.service';

let timer: ReturnType<typeof setInterval> | undefined;
let running = false;

async function update(): Promise<void> {
  if (running) return;
  const pool = getDbPool();
  if (!getDbState().connected || !pool) {
    console.warn('[SINAPI] Atualização adiada: banco indisponível.');
    return;
  }
  running = true;
  try {
    const result = await importLatestSinapi(pool);
    console.log(`[SINAPI] Referência ${result.reference}: ${result.imported ? 'importada' : 'já disponível'} (${result.count} preços).`);
  } catch (error) {
    console.error('[SINAPI] Falha na atualização. Últimos preços serão mantidos; nova tentativa em até 24 horas:', error);
  } finally {
    running = false;
  }
}

export function startSinapiScheduler(): void {
  if (timer) return;
  void update();
  timer = setInterval(() => { void update(); }, 24 * 60 * 60 * 1000);
  timer.unref();
}

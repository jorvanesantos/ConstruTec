import { fetchCaixa, findLatestSinapiReport } from '../backend/construtec-api/src/services/sinapi-source.service';

async function check(): Promise<void> {
  const report = await findLatestSinapiReport();
  const response = await fetchCaixa(report.url);
  const reader = response.body?.getReader();
  if (!reader) throw new Error('O relatório da CAIXA não contém dados.');
  let bytes = new Uint8Array();
  try {
    while (bytes.length < 4) {
      const chunk = await reader.read();
      if (chunk.done) break;
      const combined = new Uint8Array(bytes.length + chunk.value.length);
      combined.set(bytes);
      combined.set(chunk.value, bytes.length);
      bytes = combined;
    }
  } finally {
    await reader.cancel();
  }
  if (bytes.length < 4 || bytes[0] !== 0x50 || bytes[1] !== 0x4b || bytes[2] !== 0x03 || bytes[3] !== 0x04) {
    throw new Error('O relatório recebido não é um arquivo ZIP válido.');
  }
  console.log(`[SINAPI] Acesso à CAIXA confirmado. Última referência disponível: ${report.reference}.`);
  console.log(`[SINAPI] Relatório: ${report.url}`);
}

check().catch((err: unknown) => {
  console.error('[SINAPI] Falha ao verificar a fonte oficial:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchCaixa, findLatestSinapiReport } from '../backend/construtec-api/src/services/sinapi-source.service';

test('acesso ao índice preserva cookie do redirecionamento e identifica o relatório mais recente', async () => {
  let calls = 0;
  const fakeFetch: typeof fetch = async (input, init) => {
    calls++;
    const url = String(input);
    if (calls === 1) {
      return new Response(null, { status: 302, headers: { location: url, 'set-cookie': 'security=test; Path=/; Secure' } });
    }
    assert.equal(new Headers(init?.headers).get('cookie'), 'security=test');
    return Response.json({ d: { results: [
      { FileLeafRef: 'SINAPI-2026-09-formato-xlsx.zip', EncodedAbsUrl: 'http://www.caixa.gov.br/Downloads/sinapi-relatorios-mensais/SINAPI-2026-09-formato-xlsx.zip' },
      { FileLeafRef: 'SINAPI-2026-10-formato-xlsx.zip', EncodedAbsUrl: 'http://www.caixa.gov.br/Downloads/sinapi-relatorios-mensais/SINAPI-2026-10-formato-xlsx.zip' },
      { FileLeafRef: 'SINAPI-2026-10-formato-pdf.zip', EncodedAbsUrl: 'http://www.caixa.gov.br/Downloads/sinapi-relatorios-mensais/SINAPI-2026-10-formato-pdf.zip' }
    ] } });
  };
  const report = await findLatestSinapiReport(fakeFetch);
  assert.equal(report.reference, '2026-10');
  assert.equal(report.url, 'https://www.caixa.gov.br/Downloads/sinapi-relatorios-mensais/SINAPI-2026-10-formato-xlsx.zip');
  assert.equal(calls, 2);
});

test('não envia cookies a redirecionamentos externos e limita ciclos', async () => {
  let calls = 0;
  const external: typeof fetch = async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: 'https://example.com/', 'set-cookie': 'security=test' } });
  };
  await assert.rejects(fetchCaixa('https://www.caixa.gov.br/', { fetcher: external }), /não pertence/);
  assert.equal(calls, 1);
  const looping: typeof fetch = async input => new Response(null, { status: 302, headers: { location: String(input) } });
  await assert.rejects(fetchCaixa('https://www.caixa.gov.br/', { fetcher: looping }), /limite de redirecionamentos/);
});

test('recusa índice inválido ou relatório com endereço externo', async () => {
  const invalid: typeof fetch = async () => Response.json({ d: {} });
  await assert.rejects(findLatestSinapiReport(invalid), /formato inesperado/);
  const external: typeof fetch = async () => Response.json({ d: { results: [
    { FileLeafRef: 'SINAPI-2026-10-formato-xlsx.zip', EncodedAbsUrl: 'https://example.com/SINAPI-2026-10-formato-xlsx.zip' }
  ] } });
  await assert.rejects(findLatestSinapiReport(external), /não pertence/);
});

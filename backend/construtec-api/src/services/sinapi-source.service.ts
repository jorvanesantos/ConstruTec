const CAIXA_ORIGIN = 'https://www.caixa.gov.br';
const INDEX_URL = `${CAIXA_ORIGIN}/_api/web/lists/getbytitle('Downloads')/Items?$select=Title,FileLeafRef,EncodedAbsUrl,Categoria/ID&$expand=Categoria&$filter=Categoria/ID%20eq%20888%20and%20FSObjType%20eq%200%20and%20OData__ModerationStatus%20eq%200&$top=5000`;
const REPORT_NAME = /^SINAPI-(\d{4})-(0[1-9]|1[0-2])-formato-xlsx\.zip$/i;

export interface SinapiReport {
  reference: string;
  url: string;
}

function caixaUrl(value: string, base = CAIXA_ORIGIN): URL {
  const url = new URL(value, base);
  if (url.protocol !== 'https:' || url.origin !== CAIXA_ORIGIN || url.username || url.password) {
    throw new Error('O endereço informado não pertence ao portal HTTPS oficial da CAIXA.');
  }
  return url;
}

export async function fetchCaixa(value: string, options: { accept?: string; fetcher?: typeof fetch } = {}): Promise<Response> {
  const fetcher = options.fetcher ?? fetch;
  let url = caixaUrl(value);
  const cookies = new Map<string, string>();
  const signal = AbortSignal.timeout(30000);

  for (let redirects = 0; redirects <= 5; redirects++) {
    const headers: Record<string, string> = { accept: options.accept ?? '*/*' };
    if (cookies.size) headers.cookie = Array.from(cookies, ([name, val]) => `${name}=${val}`).join('; ');
    const response = await fetcher(url, { headers, redirect: 'manual', signal });
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(';', 1)[0];
      const separator = pair.indexOf('=');
      if (separator > 0) cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
    if (response.status < 300 || response.status >= 400) {
      if (!response.ok) {
        await response.body?.cancel();
        throw new Error(`O portal da CAIXA respondeu com HTTP ${response.status}.`);
      }
      return response;
    }
    const location = response.headers.get('location');
    await response.body?.cancel();
    if (!location) throw new Error('O portal da CAIXA retornou um redirecionamento sem endereço.');
    const next = caixaUrl(location, url.href);
    if (next.href === url.href && response.headers.getSetCookie().length === 0) {
      await new Promise(resolve => setTimeout(resolve, 250 * (redirects + 1)));
    }
    url = next;
  }
  throw new Error('O portal da CAIXA excedeu o limite de redirecionamentos.');
}

export async function findLatestSinapiReport(fetcher?: typeof fetch): Promise<SinapiReport> {
  const response = await fetchCaixa(INDEX_URL, { accept: 'application/json;odata=verbose', fetcher });
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('d' in data) ||
      !data.d || typeof data.d !== 'object' || !('results' in data.d) ||
      !Array.isArray(data.d.results)) {
    throw new Error('O índice de relatórios da CAIXA tem formato inesperado.');
  }
  const reports: SinapiReport[] = [];
  for (const item of data.d.results) {
    if (!item || typeof item !== 'object' || typeof item.FileLeafRef !== 'string' || typeof item.EncodedAbsUrl !== 'string') continue;
    const match = REPORT_NAME.exec(item.FileLeafRef);
    if (!match) continue;
    const url = new URL(item.EncodedAbsUrl);
    if (url.protocol === 'http:') url.protocol = 'https:';
    const checked = caixaUrl(url.href);
    if (!checked.pathname.startsWith('/Downloads/sinapi-relatorios-mensais/') ||
        decodeURIComponent(checked.pathname.split('/').pop() || '') !== item.FileLeafRef ||
        checked.search || checked.hash) {
      throw new Error('O índice da CAIXA contém endereço de relatório inesperado.');
    }
    reports.push({ reference: `${match[1]}-${match[2]}`, url: checked.href });
  }
  reports.sort((a, b) => b.reference.localeCompare(a.reference));
  if (!reports.length) throw new Error('Nenhum relatório mensal SINAPI em XLSX foi encontrado no portal da CAIXA.');
  return reports[0];
}

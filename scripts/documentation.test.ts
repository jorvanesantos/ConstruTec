import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import test from 'node:test';
import { createExpressApp } from '../backend/construtec-api/src/app';

test('a API apresenta e disponibiliza o README', async () => {
  const server = createServer(createExpressApp());
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}/api/docs`;
    const readme = await readFile('README.md', 'utf8');

    const response = await fetch(`${base}/content`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { content: readme });

    for (const route of ['download', 'download-word', 'download-txt']) {
      const download = await fetch(`${base}/${route}`);
      assert.equal(download.status, 200);
      assert.match(download.headers.get('content-disposition') || '', /README\.md/);
      assert.equal(await download.text(), readme);
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
  }
});

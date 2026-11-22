import fs from 'fs';
import path from 'path';

const readme = path.resolve('README.md');

if (!fs.existsSync(readme)) {
  console.error('[DOCS] README não encontrado:', readme);
  process.exit(1);
}

const content = fs.readFileSync(readme, 'utf8');
if (!content.startsWith('# ConstruTec')) {
  console.error('[DOCS] README possui formato inválido.');
  process.exit(1);
}

console.log(`[DOCS] README validado: ${readme}`);

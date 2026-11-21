import fs from 'fs';
import path from 'path';

const docsDir = path.resolve('docs');
const consolidatedDoc = path.join(docsDir, 'DOCUMENTACAO_COMPLETA.md');

if (!fs.existsSync(consolidatedDoc)) {
  console.error('[DOCS] Documento consolidado não encontrado:', consolidatedDoc);
  process.exit(1);
}

const content = fs.readFileSync(consolidatedDoc, 'utf8');
if (!content.includes('# ConstruTec - Documentacao Completa')) {
  console.error('[DOCS] Documento consolidado possui formato inválido.');
  process.exit(1);
}

console.log(`[DOCS] Documentação consolidada validada: ${consolidatedDoc}`);

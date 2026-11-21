import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

const DOCS_DIR = path.resolve(process.cwd(), 'docs');
const CONSOLIDATED_DOC = 'DOCUMENTACAO_COMPLETA.md';

function getConsolidatedDocPath(): string {
  return path.join(DOCS_DIR, CONSOLIDATED_DOC);
}

export function downloadWordDoc(req: Request, res: Response): void {
  void req;
  const filePath = getConsolidatedDocPath();
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Documentacao consolidada nao encontrada.' });
    return;
  }
  res.download(filePath, CONSOLIDATED_DOC);
}

export function downloadTxtDoc(_req: Request, res: Response): void {
  const filePath = getConsolidatedDocPath();
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Documentacao consolidada nao encontrada.' });
    return;
  }
  res.download(filePath, CONSOLIDATED_DOC);
}

export function getDocContent(_req: Request, res: Response): void {
  const filePath = getConsolidatedDocPath();
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Conteudo da documentacao indisponivel.' });
    return;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  res.json({ content });
}

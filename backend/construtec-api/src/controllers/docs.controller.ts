import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

const DOCS_DIR = path.resolve(process.cwd(), 'docs/requisitos');

export function downloadWordDoc(req: Request, res: Response): void {
  const isAdsGuide = req.query.doc === 'ads';
  const fileName = isAdsGuide ? 'GUIA_DE_ARQUITETURA_E_FLUXO_ADS.docx' : 'ESPECIFICACAO_COMPLETA_SISTEMA_CONSTRUTEC.docx';
  const filePath = path.join(DOCS_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Arquivo de documentação Word não encontrado.' });
    return;
  }

  res.download(filePath, fileName);
}

export function downloadTxtDoc(_req: Request, res: Response): void {
  const fileName = 'ESPECIFICACAO_COMPLETA_SISTEMA_CONSTRUTEC.txt';
  const filePath = path.join(DOCS_DIR, fileName);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Arquivo de especificação TXT não encontrado.' });
    return;
  }

  res.download(filePath, fileName);
}

export function getDocContent(_req: Request, res: Response): void {
  const txtPath = path.join(DOCS_DIR, 'ESPECIFICACAO_COMPLETA_SISTEMA_CONSTRUTEC.txt');
  const mdPath = path.join(DOCS_DIR, 'ESPECIFICACAO_COMPLETA_SISTEMA_CONSTRUTEC.md');
  const target = fs.existsSync(txtPath) ? txtPath : mdPath;

  if (!fs.existsSync(target)) {
    res.status(404).json({ error: 'Conteúdo da documentação indisponível.' });
    return;
  }

  const content = fs.readFileSync(target, 'utf-8');
  res.json({ content });
}

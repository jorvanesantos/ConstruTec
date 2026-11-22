import fs from 'fs';
import path from 'path';
import { Request, Response } from 'express';

const README_PATH = path.resolve(process.cwd(), 'README.md');

export function downloadReadme(_req: Request, res: Response): void {
  res.download(README_PATH, 'README.md', err => {
    if (err) {
      console.error('[Documentação] Erro ao baixar README:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Não foi possível baixar a documentação.' });
    }
  });
}

export async function getDocContent(_req: Request, res: Response): Promise<void> {
  try {
    const content = await fs.promises.readFile(README_PATH, 'utf-8');
    res.json({ content });
  } catch (err) {
    console.error('[Documentação] Erro ao ler README:', err);
    res.status(500).json({ error: 'Conteúdo da documentação indisponível.' });
  }
}

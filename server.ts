import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './backend/construtec-api/src/app';
import { connectDatabase } from './backend/construtec-api/src/config/database';
import { syncDataFromMySQL } from './backend/construtec-api/src/repositories/data.repository';

dotenv.config();

async function startServer() {
  const port = 3000;
  const app = createExpressApp();

  const dbConnected = await connectDatabase();
  if (dbConnected) {
    await syncDataFromMySQL();
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[ConstruTec] Servidor full-stack (Angular 19 + Express + MySQL) rodando em http://localhost:${port}`);
  });
}

startServer().catch(err => {
  console.error('[ConstruTec] Falha fatal ao iniciar servidor:', err);
  process.exit(1);
});

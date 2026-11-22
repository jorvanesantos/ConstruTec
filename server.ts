import 'dotenv/config';
import express from 'express';
import { createServer } from 'node:http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createExpressApp } from './backend/construtec-api/src/app';
import { connectDatabase } from './backend/construtec-api/src/config/database';
import { syncDataFromMySQL } from './backend/construtec-api/src/repositories/data.repository';

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production' || process.argv.includes('--production');
  if (isProduction) {
    process.env.NODE_ENV = 'production';
  }
  const app = createExpressApp();
  const server = createServer(app);

  const dbConnected = await connectDatabase();
  if (dbConnected) {
    await syncDataFromMySQL();
  }

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server }
      },
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

  const host = isProduction ? '0.0.0.0' : '127.0.0.1';
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen({ port: 3000, host, exclusive: true }, () => {
      server.off('error', reject);
      resolve();
    });
  });
  console.log('[ConstruTec] Servidor full-stack (Angular 19 + Express + MySQL) rodando em http://127.0.0.1:3000');
}

startServer().catch(err => {
  if (err?.code === 'EADDRINUSE') {
    console.error('[ConstruTec] A porta 3000 está ocupada. Pare o outro servidor (por exemplo, o Five Server) e execute o comando novamente.');
    process.exit(1);
  }
  console.error('[ConstruTec] Falha fatal ao iniciar servidor:', err);
  process.exit(1);
});

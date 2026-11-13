import express from 'express';
import path from 'path';
import { apiRouter } from './routes/api.routes';

export function createExpressApp() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  app.use('/api', apiRouter);

  // Alias estático opcional para documentação técnica
  const docsPath = path.resolve(process.cwd(), 'docs/requisitos');
  app.use('/documentacao', express.static(docsPath));

  return app;
}

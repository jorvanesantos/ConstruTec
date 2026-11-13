import dotenv from 'dotenv';
import { createExpressApp } from './app';
import { connectDatabase } from './config/database';
import { syncDataFromMySQL } from './repositories/data.repository';

dotenv.config();

export async function bootstrapBackend(port = Number(process.env.PORT || 3000)) {
  const app = createExpressApp();
  const connected = await connectDatabase();
  if (connected) {
    await syncDataFromMySQL();
  }
  return { app, port };
}

if (process.argv[1]?.endsWith('backend/construtec-api/src/server.ts')) {
  bootstrapBackend().then(({ app, port }) => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`[ConstruTec API] Servidor backend standalone ativo na porta ${port}`);
    });
  });
}

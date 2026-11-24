import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { identifyPlantRouter } from './server/routes/identifyPlant.ts';
import { plantAssistantRouter } from './server/routes/plantAssistant.ts';
import { diagnosePlantRouter } from './server/routes/diagnosePlant.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Parse JSON request bodies up to 25MB for image uploads
app.use(express.json({ limit: '25mb' }));

// Register API routes
app.use('/api', identifyPlantRouter);
app.use('/api', plantAssistantRouter);
app.use('/api', diagnosePlantRouter);

// Serve static files from public directory
app.use(express.static(path.resolve(__dirname, 'public')));

// Setup Vite dev server or static production files
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SproutCare server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

import express from 'express';
import { createServer as createViteServer } from 'vite';
import emailRoutes from './server/routes/email.ts';
import shortenerRoutes from './server/routes/shortener.ts';
import { store } from './server/store.ts';
import { connectMongoDB, isMongoConnected } from './server/db/connection.ts';
import { scanWebsiteSecurity } from './server/security-scanner.ts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // Dev server must run on port 3000 (container nginx reverse proxy listens on 8080 and forwards to 3000)
  const portArgIndex = process.argv.indexOf('--port');
  const cliPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? Number(process.argv[portArgIndex + 1]) : null;
  const PORT = cliPort || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  // Connect to MongoDB via Mongoose (MERN Stack) with non-blocking error handling
  try {
    await connectMongoDB();
    await store.syncFromMongo();
  } catch (err: any) {
    console.warn('MongoDB initialization fallback:', err?.message || err);
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api/email', emailRoutes);
  app.use('/api/shorten', shortenerRoutes);

  // Website Health & Security Checker API
  app.post('/api/checker', async (req, res) => {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid URL to analyze.' });
    }

    try {
      const result = await scanWebsiteSecurity(url);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to scan target website.' });
    }
  });

  // Short link redirect endpoint: /s/:code
  app.get('/s/:code', (req, res) => {
    const code = req.params.code;
    const link = store.getShortLink(code);

    if (!link) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <title>Link Expired or Not Found - QuickNest</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { background: #020617; color: #f8fafc; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
            .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 36px; max-width: 440px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
            h2 { color: #f43f5e; margin: 0 0 12px; font-size: 22px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
            a { display: inline-block; background: #06b6d4; color: #020617; text-decoration: none; font-weight: 600; padding: 10px 24px; border-radius: 8px; transition: opacity 0.2s; }
            a:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Link Not Found or Expired</h2>
            <p>This short link has either expired, been quarantined for security violations, or never existed.</p>
            <a href="/">Return to QuickNest</a>
          </div>
        </body>
        </html>
      `);
      return;
    }

    // If marked malicious or direct redirect is disabled, route to safety inspection preview
    if (link.isMalicious || !link.allowDirectRedirect) {
      res.redirect(302, `/preview/${code}`);
      return;
    }

    // Record click count & access timestamp
    store.recordLinkClick(code);
    res.redirect(302, link.originalUrl);
  });

  // Health and metrics endpoint (MERN Stack)
  app.get('/api/stats', (_req, res) => {
    res.json({
      status: 'operational',
      stack: 'MERN (MongoDB, Express, React, Node.js)',
      database: isMongoConnected() ? 'MongoDB (Connected via Mongoose)' : 'MongoDB (Resilient in-memory fallback active)',
      isMongoConnected: isMongoConnected(),
      uptime: process.uptime(),
      ...store.getSystemMetrics()
    });
  });

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`QuickNest Server running on port ${PORT}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
    } else {
      console.error('Server listen error:', err);
    }
  });
}

startServer().catch((err) => {
  console.error('Fatal error during startServer:', err);
});

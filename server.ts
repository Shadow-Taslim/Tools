import express from 'express';
import { createServer as createViteServer } from 'vite';
import emailRoutes from './server/routes/email.ts';
import shortenerRoutes from './server/routes/shortener.ts';
import { store } from './server/store.ts';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // API Routes
  app.use('/api/email', emailRoutes);
  app.use('/api/shorten', shortenerRoutes);

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

  // Health and metrics endpoint
  app.get('/api/stats', (_req, res) => {
    res.json({
      status: 'operational',
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QuickNest Server running on port ${PORT}`);
  });
}

startServer();

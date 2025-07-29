import path from 'path';
import express from 'express';

/**
 * Sets up static file serving for the Express app
 * @param app Express application instance
 */
export function setupStaticServing(app: express.Application) {
  // Serve static files from dist/public (your React frontend)
  const publicDir = path.join(process.cwd(), 'dist', 'public');
  app.use(express.static(publicDir));

  // Fallback: serve index.html for all other frontend routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

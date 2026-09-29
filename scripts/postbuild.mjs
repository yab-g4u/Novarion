import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  const html = fs.readFileSync(indexHtmlPath, 'utf-8');

  // 1. Write 404.html and 200.html SPA fallbacks for static hosts
  fs.writeFileSync(path.join(distDir, '404.html'), html, 'utf-8');
  fs.writeFileSync(path.join(distDir, '200.html'), html, 'utf-8');

  // 2. Pre-create static route directories so static servers without rewrite rules still resolve
  const staticRoutes = [
    'r',
    'r/T4fTpH',
    'r/pnPWbh',
    'workspace',
    'workspace/T4fTpH',
    'workspace/pnPWbh',
    'investigation',
    'share',
    'signin',
    'app',
    'app/research',
    'app/testing',
    'app/evidence',
    'app/calendar',
  ];

  for (const route of staticRoutes) {
    const routeDir = path.join(distDir, route);
    fs.mkdirSync(routeDir, { recursive: true });
    fs.writeFileSync(path.join(routeDir, 'index.html'), html, 'utf-8');
  }

  console.log('[Probe Postbuild] Generated SPA fallback pages (404.html, 200.html, route index files).');
}

// 3. Configure Nixpacks / Coolify Caddyfile if present in container environment
const caddyfilePath = '/assets/Caddyfile';
if (fs.existsSync(caddyfilePath)) {
  try {
    const caddyConfig = `:80 {
  root * /app/dist
  encode gzip
  try_files {path} {path}/ /index.html
  file_server
}
`;
    fs.writeFileSync(caddyfilePath, caddyConfig, 'utf-8');
    console.log('[Probe Postbuild] Updated /assets/Caddyfile with SPA try_files fallback.');
  } catch (err) {
    console.warn('[Probe Postbuild] Could not update /assets/Caddyfile:', err);
  }
}

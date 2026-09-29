import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

// Plugin to duplicate index.html into 404.html and 200.html so all static hosts
// (Vercel, Caddy/Nixpacks, Cloudflare, Surge, GitHub Pages) serve the SPA on /r/:roomId
const spaFallbackPlugin = () => ({
  name: 'probe-spa-fallback',
  closeBundle() {
    const distDir = path.resolve(__dirname, 'dist');
    const indexHtml = path.join(distDir, 'index.html');
    if (fs.existsSync(indexHtml)) {
      fs.copyFileSync(indexHtml, path.join(distDir, '404.html'));
      fs.copyFileSync(indexHtml, path.join(distDir, '200.html'));
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallbackPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-router-dom'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
      'lucide-react',
      'gsap',
      '@gsap/react',
      '@xyflow/react',
      'ogl',
      'clsx',
      'tailwind-merge',
      '@supabase/supabase-js',
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});

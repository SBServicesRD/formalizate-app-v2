import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Base absoluta para despliegue SPA (evita rutas rotas en producción)
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Firebase: TODO en un solo chunk para evitar ReferenceError
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            // React + router en un vendor dedicado
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router-dom')
            ) {
              return 'vendor-react';
            }
            // UI / iconos
            if (id.includes('lucide') || id.includes('framer-motion')) {
              return 'vendor-ui';
            }
          }
        },
      },
    },
  },
});

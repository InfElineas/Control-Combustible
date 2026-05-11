import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom'],
          'vendor-query':   ['@tanstack/react-query'],
          'vendor-supabase':['@supabase/supabase-js'],
          'vendor-ui':      ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs', '@radix-ui/react-checkbox', '@radix-ui/react-switch'],
          'vendor-charts':  ['recharts'],
          'vendor-pdf':     ['jspdf', 'jspdf-autotable', 'html2canvas'],
          'vendor-excel':   ['exceljs'],
        },
      },
    },
  },
});

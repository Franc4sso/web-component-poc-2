import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    lib: {
      entry: 'src/component-entry.jsx',
      name: 'ConceptMap',
      fileName: () => 'concept-map.js',
      formats: ['es'],
    }
  }
});

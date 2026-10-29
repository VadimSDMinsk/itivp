import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '127.0.0.1',
    proxy: {
      '/auth': 'http://localhost:3000',
      '/trips': 'http://localhost:3000',
      '/profile': 'http://localhost:3000',
      '/admin': 'http://localhost:3000'
    }
  }
});
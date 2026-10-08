import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = process.env.VITE_API_BASE_URL || 'https://farmer-customer.onrender.com';

const adminRewritePlugin = () => ({
  name: 'admin-rewrite',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/admin/login' || req.url === '/admin/login/') {
        req.url = '/admin-login.html';
      } else if (req.url === '/admin/dashboard' || req.url === '/admin/dashboard/') {
        req.url = '/admin-dashboard.html';
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), adminRewritePlugin()],
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        products: 'products.html',
        farmer: 'farmer-dashboard.html',
        admin: 'admin-dashboard.html',
        adminLogin: 'admin-login.html'
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false
      },
      '/uploads': {
        target: API_TARGET,
        changeOrigin: true,
        secure: false
      }
    }
  }
});

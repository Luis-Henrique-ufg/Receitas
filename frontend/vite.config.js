import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react({
      include: [/\.js$/, /\.jsx$/, /\.tsx$/, /\.md$/],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://back-end:9823',
        changeOrigin: true,
        secure: false,
      },
      '/serve-video': {
        target: 'http://back-end:9823',
        changeOrigin: true,
        secure: false,
      },
      '/serve-txt': {
        target: 'http://back-end:9823',
        changeOrigin: true,
        secure: false,
      },
      '/serve-files': {
        target: 'http://back-end:9823',
        changeOrigin: true,
        secure: false,
      },
      '/serve-content': {
        target: 'http://back-end:9823',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://back-end:9823',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    proxy: {
      '/api': {
        target: 'http://back-end:9823',
        changeOrigin: true,
        secure: false,
      },
      '/serve-video': {
        target: 'http://back-end:9823',
        changeOrigin: true,
        secure: false,
      },
      '/serve-txt': {
        target: 'http://back-end:9823',
        changeOrigin: true,
        secure: false,
      },
      '/serve-files': {
        target: 'http://back-end:9823',
        changeOrigin: true,
        secure: false,
      },
      '/serve-content': {
        target: 'http://back-end:9823',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://back-end:9823',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});

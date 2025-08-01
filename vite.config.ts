import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path, { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": resolve(__dirname, "client", "src"),
      "@shared": resolve(__dirname, "shared"),
      "@assets": resolve(__dirname, "attached_assets"),
    },
  },
  root: resolve(__dirname, "client"),
  build: {
    outDir: resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/ia": {
        target: "http://192.168.77.3:5000",
        changeOrigin: true,
        secure: false,
      },
      "/api": {
        target: "http://192.168.77.3:5000",
        changeOrigin: true,
        secure: false,
      },
      // Adicione outras rotas de API aqui se necessário
    },
    hmr: {
      port: 24678,
      host: 'localhost'
    }
  },
});

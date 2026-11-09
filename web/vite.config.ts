/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Mesmo alias do tsconfig ("/src" = raiz do projeto): import { cn } from "@/lib/cn"
    alias: { "@": "/src" },
  },
  server: {
    // `npm run dev` usa a API publicada pelo docker compose em 127.0.0.1:8081
    proxy: { "/api": "http://127.0.0.1:8081" },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});

/// <reference types="vitest/config" />
// Sem @types/node no projeto (Princípio II: nenhuma dependência nova): o Vite roda no Node e
// estes dois módulos existem; só os tipos faltam para o `tsc --noEmit` do build.
// @ts-expect-error -- módulo do Node sem tipos instalados
import { createHash } from "node:crypto";
// @ts-expect-error -- módulo do Node sem tipos instalados
import { existsSync, readFileSync } from "node:fs";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Versão do web (spec 011, plan P14/P21): cada build ganha um identificador e leva o resumo de
 * novidades de `novidades.md` (comentários HTML ignorados; vazio = sem resumo).
 */
const NOTES_LIMIT = 300;
const notes = existsSync("novidades.md")
  ? readFileSync("novidades.md", "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/\s+/g, " ").trim()
  : "";
if (notes.length > NOTES_LIMIT) {
  throw new Error(`novidades.md tem ${notes.length} caracteres; o limite é ${NOTES_LIMIT}.`);
}
const notesId = notes ? createHash("sha256").update(notes).digest("hex").slice(0, 12) : "";
const buildId = new Date().toISOString();

/** Grava dist/version.json, lido pelo app aberto para perceber a versão nova. */
function versionFile(): Plugin {
  return {
    name: "habits-version",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ version: buildId, notes, notesId }),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), versionFile()],
  define: {
    __APP_VERSION__: JSON.stringify(buildId),
    __APP_NOTES__: JSON.stringify(notes),
    __APP_NOTES_ID__: JSON.stringify(notesId),
  },
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

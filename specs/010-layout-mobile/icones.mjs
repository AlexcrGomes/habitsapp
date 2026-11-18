// Gera os ícones PNG do app (spec 010, T012) a partir do logo-icone.svg da spec 009, com o Edge sem interface.
// Uso: node icones.mjs <logo-icone.svg> <pasta web/public>
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [svgPath, outDir] = process.argv.slice(2);
const svg = readFileSync(svgPath, "utf8").replace(/<title[^>]*>.*?<\/title>/s, "");
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

// [arquivo, lado em px, fração do quadro ocupada pela logo]
const icons = [
  ["icon-192.png", 192, 0.66],
  ["icon-512.png", 512, 0.66],
  ["icon-maskable-512.png", 512, 0.6], // dentro da zona segura (círculo de 80%)
];

const profile = mkdtempSync(join(tmpdir(), "edge-icones-"));
const edge = spawn(EDGE, ["--headless=new", "--remote-debugging-port=9334", `--user-data-dir=${profile}`, "about:blank"]);
let target;
for (let i = 0; i < 50 && !target; i++) {
  await new Promise((r) => setTimeout(r, 200));
  try { target = (await (await fetch("http://127.0.0.1:9334/json")).json()).find((t) => t.type === "page"); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0;
const pending = new Map();
ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

for (const [file, size, fraction] of icons) {
  await send("Emulation.setDeviceMetricsOverride", { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  const logo = Math.round(size * fraction);
  const html = `<!doctype html><html><body style="margin:0;width:${size}px;height:${size}px;background:#fff;display:grid;place-items:center">
    <div style="width:${logo}px;height:${logo}px">${svg.replace("<svg ", `<svg width="${logo}" height="${logo}" `)}</div></body></html>`;
  await send("Page.navigate", { url: "data:text/html;base64," + Buffer.from(html).toString("base64") });
  await new Promise((r) => setTimeout(r, 500));
  const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: size, height: size, scale: 1 } });
  writeFileSync(join(outDir, file), Buffer.from(shot.result.data, "base64"));
  console.log("ok", file);
}
ws.close();
edge.kill();

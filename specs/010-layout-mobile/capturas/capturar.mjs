// Capturas da Semana (spec 010, T001/T025): conta de demonstração LOCAL + Edge sem interface via CDP.
// Uso (app local em http://localhost:8080): node specs/010-layout-mobile/capturas/capturar.mjs <pasta> <prefixo>
// Comparação: powershell -File specs/010-layout-mobile/capturas/diff.ps1 <pastaA> <prefixoA> <pastaB> <prefixoB>
// Duas rodadas do mesmo build diferem em ~200–530 px de antialiasing fraco; mudança real aparece como "diferença forte".
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = "http://localhost:8080";
const EMAIL = "demo-010@habits.test";
const PASSWORD = "demo-010-local-senha";
const [outDir, prefix] = process.argv.slice(2);
const EDGE = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

// --- API com cookies e CSRF ---
const jar = new Map();
async function api(method, path, body) {
  const headers = { Accept: "application/json", Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join("; ") };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (method !== "GET" && jar.has("XSRF-TOKEN")) headers["X-XSRF-TOKEN"] = decodeURIComponent(jar.get("XSRF-TOKEN"));
  const res = await fetch(BASE + "/api" + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  for (const c of res.headers.getSetCookie()) {
    const [pair] = c.split(";");
    const i = pair.indexOf("=");
    jar.set(pair.slice(0, i), pair.slice(i + 1));
  }
  const text = await res.text();
  return { status: res.status, data: text ? JSON.parse(text) : null };
}

const sp = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });
const today = sp.format(new Date());
const addDays = (key, n) => { const d = new Date(key + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

async function seed() {
  await api("GET", "/auth/me");
  let r = await api("POST", "/auth/login", { email: EMAIL, password: PASSWORD });
  if (r.status !== 200) {
    r = await api("POST", "/auth/register", { name: "Demo Layout", email: EMAIL, password: PASSWORD });
    if (r.status !== 201) throw new Error("cadastro: " + JSON.stringify(r));
  }
  await api("PUT", "/me/settings", { weekMode: "rolling" });
  const list = (await api("GET", "/habits")).data;
  if (list.length === 0) {
    const habits = [
      ["Ler 20 páginas", "📚", 4, [0, 1, 3]],
      ["Correr", "🏃", 3, [0, 2, 4]],
      ["Beber 2 litros de água", "💧", 7, [0, 1, 2, 3, 4, 5]],
      ["Meditar", "🧘", null, [1, 5]],
      ["Dormir antes das 23h", "😴", 2, [0, 6]],
    ];
    for (const [name, emoji, goal, back] of habits) {
      const h = (await api("POST", "/habits", { name, emoji, goal })).data;
      for (const b of back) await api("PUT", `/checks/${h.id}/${addDays(today, -b)}`);
    }
  }
  return jar.get("SESSION");
}

// --- CDP ---
async function capture(session) {
  const profile = mkdtempSync(join(tmpdir(), "edge-010-"));
  const edge = spawn(EDGE, ["--headless=new", "--remote-debugging-port=9333", `--user-data-dir=${profile}`, "--hide-scrollbars", "about:blank"]);
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try { target = (await (await fetch("http://127.0.0.1:9333/json")).json()).find((t) => t.type === "page"); } catch {}
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

  await send("Network.enable");
  await send("Network.setCookie", { name: "SESSION", value: session, url: BASE, httpOnly: true });
  const sizes = [
    ["1280", 1280, 900, false],
    ["1024", 1024, 900, false],
    ["768", 768, 1024, false],
    ["375", 375, 812, true],
  ];
  mkdirSync(outDir, { recursive: true });
  for (const [label, width, height, mobile] of sizes) {
    await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
    await send("Emulation.setTouchEmulationEnabled", { enabled: mobile });
    await send("Page.navigate", { url: BASE + "/" });
    await new Promise((r) => setTimeout(r, 2500));
    const shot = await send("Page.captureScreenshot", { format: "png" });
    const file = join(outDir, `${prefix}-${label}.png`);
    writeFileSync(file, Buffer.from(shot.result.data, "base64"));
    console.log("ok", file);
  }
  ws.close();
  edge.kill();
}

const session = await seed();
await capture(session);

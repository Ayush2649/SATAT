/** Isolated UI harness: real client components, demo Firestore, fixed scan response. */
import { build } from "esbuild";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import { createRequire } from "node:module";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
const require = createRequire(import.meta.url);
const root = process.cwd();
// Load the real rules into this demo namespace as well as the rules-test one.
// Never initialize this fixture with the production Firebase project/config.
const environment = await initializeTestEnvironment({ projectId: "demo-satat-audit", firestore: { host: "127.0.0.1", port: 8088, rules: await fs.readFile("firestore.rules", "utf8") } });
await environment.cleanup();
const adapter = path.join(root, "tests/browser/audit-adapters.tsx");
const aliases = new Set(["next-auth/react", "next/navigation", "@/components/FirebaseAuthProvider", "@/lib/firebase", "./firebase"]);
await fs.mkdir("artifacts", { recursive: true });
await build({ entryPoints: ["tests/browser/audit-fixture.tsx"], outfile: "artifacts/audit-browser.js", bundle: true, platform: "browser", format: "esm", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' }, plugins: [{ name: "isolated-demo-adapters", setup(build) {
  build.onResolve({ filter: /^(next-auth\/react|next\/navigation|next\/image|next\/link|@\/components\/FirebaseAuthProvider|@\/lib\/firebase|\.\/firebase)$/ }, args => {
    if (args.path === "next/image" || args.path === "next/link") return { path: args.path, namespace: "audit-test" };
    if (aliases.has(args.path)) return { path: adapter };
  });
  build.onLoad({ filter: /.*/, namespace: "audit-test" }, args => ({ contents: `export { ${args.path.endsWith("image") ? "TestImage" : "TestLink"} as default } from ${JSON.stringify(adapter.replaceAll("\\", "/"))};`, loader: "js", resolveDir: root }));
} }] });
const config = require(path.join(root, "tailwind.config.ts")).default;
const styles = [await fs.readFile("styles/satat.tokens.css", "utf8"), await fs.readFile("styles/app-shell.css", "utf8"), "@tailwind base; @tailwind components; @tailwind utilities;"];
const css = await postcss([tailwindcss({ ...config, content: [...config.content, "./tests/browser/**/*.tsx"] }), autoprefixer]).process(styles.join("\n"), { from: undefined });
await fs.writeFile("artifacts/audit-browser.css", css.css);
const foods = [{ name: "Steamed Rice", quantity: 180, unit: "g", grams: 180, calories: 234, proteinG: 5, carbsG: 52, fatG: 1, source: "canonical" }, { name: "Dal Fry", quantity: 150, unit: "g", grams: 150, calories: 125, proteinG: 8, carbsG: 21, fatG: 2, source: "canonical" }, { name: "Plain Roti", quantity: 70, unit: "g", grams: 70, calories: 208, proteinG: 6, carbsG: 42, fatG: 1, source: "canonical" }, { name: "Bhindi Masala", quantity: 70, unit: "g", grams: 70, calories: 62, proteinG: 2, carbsG: 7, fatG: 4, source: "canonical" }];
const html = '<!doctype html><html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated SATAT audit</title><link rel="stylesheet" href="/audit.css"><body style="margin:0;padding:16px;background:var(--satat-bg);color:var(--satat-text-primary);font-family:Arial,sans-serif"><div id="root"></div><script type="module" src="/audit.js"></script></body></html>';
const assets = { "/audit.js": ["artifacts/audit-browser.js", "text/javascript"], "/audit.css": ["artifacts/audit-browser.css", "text/css"] };
http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/api/analyze-meal") { req.resume(); res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ name: "Rice, dal, roti and bhindi", foods, reviewSuggestions: [], requiresManualReview: true })); return; }
  if (req.url === "/" || (req.url?.startsWith("/dashboard") || req.url?.startsWith("/onboarding"))) { res.writeHead(200, { "Content-Type": "text/html" }); res.end(html); return; }
  const asset = assets[req.url]; if (!asset) { res.writeHead(404); res.end(); return; }
  try { res.writeHead(200, { "Content-Type": asset[1] }); res.end(await fs.readFile(asset[0])); } catch { res.writeHead(500); res.end(); }
}).listen(4180, "localhost", () => console.log("Isolated audit fixture: http://localhost:4180 · demo-satat-audit emulator 127.0.0.1:8088"));

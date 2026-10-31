#!/usr/bin/env node
// Local coding assistant: a zero-dependency Node server that
//   · serves the chat front end (index.html),
//   · finds the right skill in ../.claude/skills for each request and gives it to the model,
//   · streams answers from a local model through Ollama (http://127.0.0.1:11434),
//   · lets the page read repo files and write files ONLY after you confirm in the page.
// It never runs commands: shell blocks are copied and you run them yourself.
// Every /api call needs the secret token this process prints into the page, and a same-origin request,
// so other websites open in your browser cannot use it.
// Run:  node local-ai/server.mjs   then open http://localhost:8787
// Options (env): PORT=8787  OLLAMA=http://127.0.0.1:11434  MODEL=qwen2.5-coder:7b  ROOT=<repo folder>
import http from "node:http";
import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, resolve, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(process.env.ROOT || join(HERE, ".."));
const SKILLS = join(ROOT, ".claude", "skills");
const PORT = +(process.env.PORT || 8787);
const OLLAMA = process.env.OLLAMA || "http://127.0.0.1:11434";
const MODEL = process.env.MODEL || "qwen2.5-coder:7b";
const TOKEN = randomBytes(24).toString("hex");   // new every start; only the page this server serves knows it
const SKILL_CHARS = 9000;     // how much of a skill's text goes into the prompt (small models have small context)

// —— skills: name + description from the SKILL.md front matter, body for the prompt ——
function loadSkills() {
  if (!existsSync(SKILLS)) return [];
  return readdirSync(SKILLS).flatMap((dir) => {
    const file = join(SKILLS, dir, "SKILL.md");
    if (!existsSync(file)) return [];
    const text = readFileSync(file, "utf8");
    const fm = text.match(/^---\n([\s\S]*?)\n---\n?/);
    const get = (k) => (fm ? (fm[1].match(new RegExp(`^${k}:\\s*(.*)$`, "m")) || [])[1] || "" : "").replace(/^["']|["']$/g, "");
    return [{ name: get("name") || dir, description: get("description"), body: fm ? text.slice(fm[0].length) : text, dir }];
  });
}
const STOP = new Set("a an the and or of to in on for with when use this that is are be as it its by from at any your you user asks".split(" "));
const words = (s) => (s.toLowerCase().match(/[a-z0-9][a-z0-9-]+/g) || []).filter((w) => !STOP.has(w) && w.length > 2);
// pick the skill whose name/description shares the most words with the request (name hits count triple)
export function pickSkill(skills, request) {
  const want = new Set(words(request));
  let best = null, score = 0;
  for (const s of skills) {
    let sc = 0;
    for (const w of new Set(words(s.description))) if (want.has(w)) sc += 1;
    for (const w of s.name.split("-")) if (want.has(w)) sc += 3;
    if (sc > score) { score = sc; best = s; }
  }
  return score >= 2 ? best : null;
}
function systemPrompt(skill) {
  let p = `You are a careful coding assistant working in the user's repository at ${ROOT}.
Answer in the user's language. Prefer complete, working code in fenced blocks.
When you create or change a file, put the path on the line before the code block as: File: path/relative/to/repo
When a shell command is needed, put it in a \`\`\`sh block: the user runs it and pastes back the output. The user confirms every file write.
Never claim you ran or tested something: the user runs it.`;
  if (skill) p += `\n\nUse this skill for the request. Its folder is .claude/skills/${skill.dir}/ (paths in it are relative to that folder).\n<skill name="${skill.name}">\n${skill.body.slice(0, SKILL_CHARS)}\n</skill>`;
  return p;
}

// —— repo access, never outside ROOT ——
function inRoot(p) {
  const full = resolve(ROOT, p || ".");
  if (full !== ROOT && !full.startsWith(ROOT + sep)) throw new Error("path outside the repository");
  return full;
}
const body = (req) => new Promise((ok, no) => { let s = ""; req.on("data", (d) => { s += d; if (s.length > 5e6) no(new Error("too large")); }); req.on("end", () => { try { ok(s ? JSON.parse(s) : {}); } catch (e) { no(e); } }); });
const json = (res, code, obj) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "GET" && url.pathname === "/") { res.writeHead(200, { "content-type": "text/html; charset=utf-8", "x-frame-options": "DENY" }); return res.end(readFileSync(join(HERE, "index.html"), "utf8").replace("__TOKEN__", TOKEN)); }
    // every API call: our token, and no request from another site
    const origin = req.headers.origin, host = req.headers.host || "";
    if (url.pathname.startsWith("/api/") && (req.headers["x-token"] !== TOKEN || (origin && origin !== "http://" + host) || !/^(localhost|127\.0\.0\.1):\d+$/.test(host))) return json(res, 403, { error: "forbidden" });
    if (url.pathname === "/api/skills") return json(res, 200, loadSkills().map(({ name, description }) => ({ name, description })));
    if (url.pathname === "/api/models") {
      try { const r = await fetch(OLLAMA + "/api/tags"); const j = await r.json(); return json(res, 200, { models: (j.models || []).map((m) => m.name), default: MODEL, ok: true }); }
      catch { return json(res, 200, { models: [], default: MODEL, ok: false }); }
    }
    if (url.pathname === "/api/files") {
      const full = inRoot(url.searchParams.get("path") || ".");
      const st = statSync(full);
      if (st.isDirectory()) return json(res, 200, { dir: relative(ROOT, full) || ".", entries: readdirSync(full).filter((n) => n !== ".git" && n !== "node_modules").map((n) => ({ name: n, dir: statSync(join(full, n)).isDirectory() })).sort((a, b) => b.dir - a.dir || a.name.localeCompare(b.name)) });
      if (st.size > 400_000) return json(res, 413, { error: "file too large to attach (over 400 KB)" });
      return json(res, 200, { path: relative(ROOT, full), content: readFileSync(full, "utf8") });
    }
    if (req.method === "POST" && url.pathname === "/api/write") {
      const { path, content, confirmed } = await body(req);
      if (confirmed !== true) return json(res, 400, { error: "not confirmed" });
      const full = inRoot(path); mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, content);
      return json(res, 200, { wrote: relative(ROOT, full), bytes: Buffer.byteLength(content) });
    }
    if (req.method === "POST" && url.pathname === "/api/chat") {
      const { messages = [], model, skill: forced } = await body(req);
      const skills = loadSkills();
      const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";
      let skill = null;
      const slash = lastUser.match(/^\/([a-z0-9-:]+)/i);
      if (slash) skill = skills.find((s) => s.name === slash[1] || s.dir === slash[1]) || null;
      if (!skill && forced && forced !== "auto") skill = skills.find((s) => s.name === forced) || null;
      if (!skill && forced !== "none") skill = pickSkill(skills, lastUser);
      res.writeHead(200, { "content-type": "application/x-ndjson", "cache-control": "no-cache" });
      res.write(JSON.stringify({ skill: skill?.name || null }) + "\n");
      let r;
      try {
        r = await fetch(OLLAMA + "/api/chat", { method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ model: model || MODEL, stream: true, messages: [{ role: "system", content: systemPrompt(skill) }, ...messages], options: { num_ctx: 16384 } }) });
      } catch { res.write(JSON.stringify({ error: `Cannot reach Ollama at ${OLLAMA}. Is it running? (ollama serve)` }) + "\n"); return res.end(); }
      if (!r.ok) { res.write(JSON.stringify({ error: `Ollama said ${r.status}: ${await r.text()}` }) + "\n"); return res.end(); }
      const dec = new TextDecoder(); let buf = "";
      for await (const chunk of r.body) {
        buf += dec.decode(chunk, { stream: true });
        let i; while ((i = buf.indexOf("\n")) >= 0) {
          const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (!line) continue;
          try { const j = JSON.parse(line); if (j.message?.content) res.write(JSON.stringify({ t: j.message.content }) + "\n"); if (j.done) res.write(JSON.stringify({ done: true }) + "\n"); } catch {}
        }
      }
      return res.end();
    }
    json(res, 404, { error: "not found" });
  } catch (e) { if (!res.headersSent) json(res, 400, { error: String(e.message || e) }); else res.end(); }
});
server.listen(PORT, "127.0.0.1", () => console.log(`Local AI ready: http://localhost:${PORT}  (repo ${ROOT}, model ${MODEL}, ${loadSkills().length} skills)`));

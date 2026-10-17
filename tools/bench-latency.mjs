#!/usr/bin/env node
// 星系生成延遲基準：固定 10 題 × 指定的 AI 供應商，記錄 TTFN（第一顆節點）、TTLN（最後一顆節點）、總時間與解析／修復結果。
// 會實際呼叫模型並消耗額度，所以不在 npm test 裡跑；用法：
//   node tools/bench-latency.mjs --providers claude,codex --model "" --runs 1
// 結果逐行附加到 bench/latency.jsonl（已在 .gitignore）。
import fs from "node:fs";
import path from "node:path";
import { spawnGalaxy } from "../apps/cli/src/spawn.mjs";
import { ROOT } from "./transpile.mjs";

const PROMPTS = [
  "如何挑選洗碗機？",
  "我喜歡又甜又酸的食物，但又不想吃了會讓身體太有負擔，有哪些選擇適合我？",
  "多版型、多主題的前端系統該怎麼設計？",
  "前端團隊要不要導入 monorepo？",
  "小型 SaaS 要先做免費方案衝用戶，還是一開始就收費？",
  "要不要把舊的 React SPA 遷移到 Next.js？",
  "週末兩天要怎麼安排，才能休息又把副業進度往前推？",
  "第一台電動機車要買換電還是充電？",
  "Microservices 還是 Modular Monolith？",
  "家裡要不要養第二隻貓？",
];

const arg = (name, fallback) => { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : fallback; };
const providers = arg("--providers", process.env.INTENT_GALAXY_PROVIDER || "claude").split(",").map((s) => s.trim()).filter(Boolean);
const model = arg("--model", "") || undefined;
const runs = Number(arg("--runs", "1"));
const out = path.join(ROOT, "bench/latency.jsonl");
fs.mkdirSync(path.dirname(out), { recursive: true });

function runOnce(provider, goal) {
  return new Promise((resolve) => {
    const t0 = Date.now();
    let ttfn = null, ttln = null, nodes = 0;
    spawnGalaxy(goal, (ev) => {
      if (ev.t === "node") { nodes++; ttfn ??= Date.now() - t0; ttln = Date.now() - t0; }
      if (ev.t === "repaired" || ev.t === "error") {
        resolve({ provider, model: model ?? "", goal, ttfn, ttln, totalMs: Date.now() - t0, streamedNodes: nodes,
          ok: ev.t === "repaired", error: ev.t === "error" ? ev.code : null,
          warnings: ev.t === "repaired" ? ev.findings.filter((f) => f.level === "warning").length : null });
      }
    }, { provider, model });
  });
}

for (let r = 0; r < runs; r++) {
  for (const provider of providers) {
    for (const goal of PROMPTS) {
      const row = { at: new Date().toISOString(), run: r, ...(await runOnce(provider, goal)) };
      fs.appendFileSync(out, JSON.stringify(row) + "\n");
      console.log(`${row.ok ? "✓" : "✗"} ${provider} ${String(row.totalMs).padStart(7)}ms TTFN=${row.ttfn ?? "-"} ${goal}`);
    }
  }
}
console.log(`結果已附加到 ${path.relative(ROOT, out)}`);

// Task 3 整合測試：init-hook 安裝 → 真實 git commit 經過 kill-gate（沉默期、到期攔截、判決、第四刀、刪檔）。
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildIntentLock, repairAnalysis, solveGalaxy } from "../../../libs/core/src/index.ts";
import { SAMPLE_GALAXY } from "../../web/sample-galaxy.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const BIN = path.join(ROOT, "apps/cli/bin/intent-galaxy.mjs");
const DAY = 86_400_000;
// 隔離使用者的全域 git 設定（例如全域 core.hooksPath）。
const env = { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1", GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t", GIT_COMMITTER_NAME: "t", GIT_COMMITTER_EMAIL: "t@t" };
const analysis = repairAnalysis(SAMPLE_GALAXY).analysis;
const makeLock = (decidedAt) => buildIntentLock({ analysis, solution: solveGalaxy(analysis, "alpha", new Map()), baseKey: "alpha", goal: "測試", decidedAt, scopePaths: ["src"] });

function repo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "intent-kill-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, env, encoding: "utf8" }).trim();
  const commit = (msg) => spawnSync("git", ["commit", "-q", "-m", msg], { cwd: dir, env, encoding: "utf8" });
  const write = (rel, text) => { fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true }); fs.writeFileSync(path.join(dir, rel), text); };
  git("init", "-q", "-b", "main");
  write("README.md", "x\n");
  const out = execFileSync(process.execPath, [BIN, "init-hook"], { cwd: dir, env, encoding: "utf8" });
  git("add", "-A");
  assert.equal(commit("init").status, 0);
  return { dir, git, commit, write, out };
}

const dirs = [];
try {
  // init-hook：三個碰撞面都裝好，且只新增不覆寫
  const r = repo(); dirs.push(r.dir);
  assert.equal(r.git("config", "--get", "core.hooksPath"), ".intent/hooks");
  for (const f of [".intent/hooks/kill-gate.mjs", ".intent/hooks/commit-msg", ".github/workflows/intent-kill.yml"]) assert.ok(fs.existsSync(path.join(r.dir, f)), f);
  const settings = JSON.parse(fs.readFileSync(path.join(r.dir, ".claude/settings.json"), "utf8"));
  assert.equal(settings.hooks.SessionStart[0].hooks[0].command, "node .intent/hooks/kill-gate.mjs session");
  assert.match(execFileSync(process.execPath, [BIN, "init-hook"], { cwd: r.dir, env, encoding: "utf8" }), /沒有變更/);
  const { detectHookInstalled } = await import("../src/init-hook.mjs");
  assert.equal(detectHookInstalled(r.dir), true);

  // 沉默期：剛簽的鎖，範圍內 commit 不需要 trailer
  const fresh = await makeLock(new Date());
  r.write(".intent.lock.json", JSON.stringify(fresh, null, 2));
  r.write("src/a.js", "1\n");
  r.git("add", "-A");
  assert.equal(r.commit("sign").status, 0);
  assert.equal(execFileSync("node", [".intent/hooks/kill-gate.mjs", "session"], { cwd: r.dir, env, encoding: "utf8" }), "");

  const r2 = repo(); dirs.push(r2.dir);
  const old = await makeLock(new Date(Date.now() - 15 * DAY));
  r2.write(".intent.lock.json", JSON.stringify(old, null, 2));
  r2.git("add", "-A");
  // 到期且命中範圍（動到鎖檔本身）：沒有 trailer 就拒絕，訊息只有牌上那刀
  const blocked = r2.commit("add old lock");
  assert.notEqual(blocked.status, 0);
  assert.ok(blocked.stderr.includes(old.weldedKill.killCondition14d) && blocked.stderr.includes(`Intent-Lock: ${old.specHash}`), blocked.stderr);
  assert.ok(!blocked.stderr.includes(old.withheldKill.fatalPremise), "第四刀不可提前揭露");
  // session 模式只印字、不阻斷
  const session = execFileSync("node", [".intent/hooks/kill-gate.mjs", "session"], { cwd: r2.dir, env, encoding: "utf8" });
  assert.ok(session.includes(old.weldedKill.fatalPremise));
  // Evidence 少於 12 字視同沒寫
  assert.notEqual(r2.commit(`x\n\nIntent-Lock: ${old.specHash}\nIntent-Kill: dead\nIntent-Kill-Evidence: 太短`).status, 0);
  // 判決 dead（全形冒號也接受）→ 放行
  assert.equal(r2.commit(`autopsy\n\nIntent-Lock: ${old.specHash}\nIntent-Kill： dead\nIntent-Kill-Evidence: 單日帳單 $340，已超過 $200 熔斷線`).status, 0);
  // dead 之後下一次命中範圍的 commit 才揭露第四刀，並要求 Intent-Withheld
  r2.write("src/b.js", "2\n"); r2.git("add", "-A");
  const withheld = r2.commit("next");
  assert.notEqual(withheld.status, 0);
  assert.ok(withheld.stderr.includes(old.withheldKill.fatalPremise), withheld.stderr);
  assert.equal(r2.commit(`next\n\nIntent-Lock: ${old.specHash}\nIntent-Withheld: card`).status, 0);
  const { readVerdicts } = await import("../src/init-hook.mjs");
  assert.deepEqual(readVerdicts(r2.dir), ["dead"], "太短的 Evidence 不算判決");
  // 範圍外的 commit 不受影響
  r2.write("docs/x.md", "x\n"); r2.git("add", "-A");
  assert.equal(r2.commit("docs").status, 0);

  // 簽署超過 10 分鐘、尚未驗屍：換 specHash 拒絕；刪鎖檔拒絕
  const r3 = repo(); dirs.push(r3.dir);
  r3.write(".intent.lock.json", JSON.stringify(await makeLock(new Date(Date.now() - 3600_000)), null, 2)); r3.git("add", "-A");
  assert.equal(r3.commit("sign").status, 0);
  r3.write(".intent.lock.json", JSON.stringify(await makeLock(new Date()), null, 2)); r3.git("add", "-A");
  const swap = r3.commit("swap");
  assert.notEqual(swap.status, 0);
  assert.ok(swap.stderr.includes("specHash 現在不能換"), swap.stderr);
  r3.git("checkout", "-q", "HEAD", "--", ".intent.lock.json");
  r3.git("rm", "-q", ".intent.lock.json");
  assert.notEqual(r3.commit("delete").status, 0);

  // 既有 husky：只在 .husky/commit-msg 追加一行，不改 core.hooksPath
  const r4dir = fs.mkdtempSync(path.join(os.tmpdir(), "intent-husky-")); dirs.push(r4dir);
  execFileSync("git", ["init", "-q"], { cwd: r4dir, env });
  fs.mkdirSync(path.join(r4dir, ".husky")); fs.writeFileSync(path.join(r4dir, ".husky/commit-msg"), "npx commitlint --edit $1\n");
  execFileSync(process.execPath, [BIN, "init-hook"], { cwd: r4dir, env });
  assert.equal(fs.readFileSync(path.join(r4dir, ".husky/commit-msg"), "utf8"), 'npx commitlint --edit $1\nnode .intent/hooks/kill-gate.mjs commit-msg "$1"\n');
  assert.equal(spawnSync("git", ["config", "--get", "core.hooksPath"], { cwd: r4dir, env }).status, 1);
  console.log("✅ kill-gate & init-hook verified!");
} finally {
  for (const d of dirs) fs.rmSync(d, { recursive: true, force: true });
}

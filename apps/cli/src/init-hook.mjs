// `npx intent-engineering-galaxy init-hook`：把 kill-gate 掛到使用者 repo 的三個碰撞面（Grok 審查 §2.3、§2.5）。
// 1. commit-msg  2. GitHub PR 檢查 intent-kill  3. Claude Code SessionStart。只新增，不覆寫既有設定。
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const KILL_GATE_SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../hooks/kill-gate.mjs");
const HOOK_LINE = 'node .intent/hooks/kill-gate.mjs commit-msg "$1"';
const SESSION_CMD = "node .intent/hooks/kill-gate.mjs session";
const WRAPPER = `#!/bin/sh
ROOT=$(git rev-parse --show-toplevel) || exit 1
exec node "$ROOT/.intent/hooks/kill-gate.mjs" commit-msg "$1"
`;
const WORKFLOW = `name: intent-kill
on:
  pull_request:
permissions:
  contents: read
jobs:
  kill:
    name: intent-kill
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Welded kill check
        env:
          INTENT_BASE_SHA: \${{ github.event.pull_request.base.sha }}
        run: node .intent/hooks/kill-gate.mjs pull-request
`;

const git = (cwd, args) => {
  try { return execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return null; }
};
const read = (f) => fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;

/** .git/hooks 裡是否有使用者自己的（非 .sample）hook：有的話不能改 core.hooksPath，否則它們會失效。 */
function customGitHooks(gitHooksDir) {
  if (!fs.existsSync(gitHooksDir)) return [];
  return fs.readdirSync(gitHooksDir).filter((f) => !f.endsWith(".sample") && fs.statSync(path.join(gitHooksDir, f)).isFile());
}

/** 判斷 kill-gate 的 commit-msg hook 是否已生效（寫進鎖檔的 hookInstalled）。 */
export function detectHookInstalled(cwd = process.cwd()) {
  const root = git(cwd, ["rev-parse", "--show-toplevel"]);
  if (!root) return false;
  const hooksPath = git(root, ["config", "--get", "core.hooksPath"]) ?? "";
  const gitHooks = git(root, ["rev-parse", "--git-path", "hooks"]);
  const candidates = [
    path.join(root, ".husky/commit-msg"),
    hooksPath ? path.join(root, hooksPath, "commit-msg") : null,
    gitHooks && !hooksPath ? path.resolve(root, gitHooks, "commit-msg") : null,
  ].filter(Boolean);
  return fs.existsSync(path.join(root, ".intent/hooks/kill-gate.mjs")) && candidates.some((f) => (read(f) ?? "").includes("kill-gate.mjs"));
}

/** 這個 repo 歷來有效的 Intent-Kill 判決（由舊到新），規則與 kill-gate.mjs 相同：Evidence 至少 12 個 code point。 */
export function readVerdicts(cwd = process.cwd()) {
  const raw = git(cwd, ["log", "--reverse", "-F", "--grep", "Intent-Kill", "--format=%B%x1e"]);
  if (!raw) return [];
  const verdicts = [];
  for (const message of raw.split("\u001e")) {
    const t = {};
    for (const line of message.split(/\r?\n/)) {
      const m = line.trim().match(/^(Intent-(?:Kill|Kill-Evidence))\s*[:：]\s*(.+)$/);
      if (m) t[m[1]] = m[2].trim();
    }
    if (/^(alive|dead|unobservable)$/.test(t["Intent-Kill"] ?? "") && [...(t["Intent-Kill-Evidence"] ?? "")].length >= 12) verdicts.push(t["Intent-Kill"]);
  }
  return verdicts;
}

export function initHook(cwd = process.cwd(), log = console.log) {
  const root = git(cwd, ["rev-parse", "--show-toplevel"]);
  if (!root) throw new Error("init-hook 必須在 git repo 內執行");
  const changes = [];
  const rel = (f) => path.relative(root, f);

  // 0. kill-gate 本體：複製進 repo，讓 commit、CI、SessionStart 都不必安裝本套件。
  const gate = path.join(root, ".intent/hooks/kill-gate.mjs");
  const src = fs.readFileSync(KILL_GATE_SRC, "utf8");
  if (read(gate) !== src) {
    fs.mkdirSync(path.dirname(gate), { recursive: true });
    fs.writeFileSync(gate, src, { mode: 0o755 });
    changes.push(`寫入 ${rel(gate)}`);
  }

  // 1. commit-msg：husky → 空的 core.hooksPath → 都不是就不覆蓋。
  const hooksPath = git(root, ["config", "--get", "core.hooksPath"]) ?? "";
  const husky = path.join(root, ".husky");
  let hookInstalled = false, hookNote = "";
  if (fs.existsSync(husky) && (fs.existsSync(path.join(husky, "commit-msg")) || hooksPath.startsWith(".husky"))) {
    const file = path.join(husky, "commit-msg");
    const cur = read(file);
    if (!(cur ?? "").includes("kill-gate.mjs")) {
      fs.writeFileSync(file, (cur ? cur.replace(/\n?$/, "\n") : "") + HOOK_LINE + "\n", { mode: 0o755 });
      changes.push(cur ? `在 ${rel(file)} 末尾追加一行 kill-gate` : `建立 ${rel(file)}`);
    }
    hookInstalled = true;
  } else if (!hooksPath) {
    const gitHooks = path.resolve(root, git(root, ["rev-parse", "--git-path", "hooks"]) ?? ".git/hooks");
    const custom = customGitHooks(gitHooks);
    if (custom.length === 0) {
      const wrapper = path.join(root, ".intent/hooks/commit-msg");
      fs.writeFileSync(wrapper, WRAPPER, { mode: 0o755 });
      execFileSync("git", ["config", "core.hooksPath", ".intent/hooks"], { cwd: root });
      changes.push(`寫入 ${rel(wrapper)}`, "git config core.hooksPath .intent/hooks（只改這個 repo 的 .git/config）");
      hookInstalled = true;
    } else if (!custom.includes("commit-msg")) {
      // 已有其他自訂 hook：改 core.hooksPath 會讓它們失效，所以只在 .git/hooks 加 commit-msg。
      fs.writeFileSync(path.join(gitHooks, "commit-msg"), WRAPPER, { mode: 0o755 });
      changes.push(`寫入 ${path.relative(root, path.join(gitHooks, "commit-msg"))}（保留既有 hook：${custom.join(", ")}）`);
      hookInstalled = true;
    } else hookNote = `.git/hooks/commit-msg 已存在，沒有覆蓋。請手動在其中加入：${HOOK_LINE}`;
  } else hookNote = `core.hooksPath 已設為 ${hooksPath}，沒有覆蓋。請手動在 ${hooksPath}/commit-msg 加入：${HOOK_LINE}`;

  // 2. GitHub PR 檢查（required check 名稱 intent-kill）
  const workflow = path.join(root, ".github/workflows/intent-kill.yml");
  if (!fs.existsSync(workflow)) {
    fs.mkdirSync(path.dirname(workflow), { recursive: true });
    fs.writeFileSync(workflow, WORKFLOW);
    changes.push(`寫入 ${rel(workflow)}`);
  }

  // 3. Claude Code SessionStart：合併進專案 .claude/settings.json，保留其他設定。
  const settingsFile = path.join(root, ".claude/settings.json");
  const raw = read(settingsFile);
  let settings = null;
  try { settings = raw ? JSON.parse(raw) : {}; } catch { hookNote += `${hookNote ? "\n" : ""}${rel(settingsFile)} 不是合法 JSON，沒有加入 SessionStart hook。`; }
  if (settings) {
    const groups = settings.hooks?.SessionStart ?? [];
    if (!JSON.stringify(groups).includes("kill-gate.mjs session")) {
      settings.hooks = { ...settings.hooks, SessionStart: [...groups, { hooks: [{ type: "command", command: SESSION_CMD }] }] };
      fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + "\n");
      changes.push(`${raw ? "在" : "建立"} ${rel(settingsFile)} ${raw ? "加入" : "並加入"} SessionStart hook`);
    }
  }

  log(changes.length ? `🔒 kill-gate 已安裝：\n${changes.map((c) => `  - ${c}`).join("\n")}` : "🔒 kill-gate 已是最新，沒有變更。");
  if (hookNote) log(`⚠️  ${hookNote}`);
  log("請把 .intent/、.github/workflows/intent-kill.yml 與 .claude/settings.json 一起 commit，並在 GitHub 把 intent-kill 設為 required check。");
  return { hookInstalled, changes, note: hookNote };
}

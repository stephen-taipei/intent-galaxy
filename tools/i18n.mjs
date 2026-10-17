#!/usr/bin/env node
// 多語系字串：apps/web/locales/_parts/*.json 是原文（繁中 zh-Hant-TW 與英文 en），apps/web/locales/src/<語系>.json 是其他語系的譯文。
// node tools/i18n.mjs          產生 apps/web/locales/<語系>.js（瀏覽器用的 ES module）
// node tools/i18n.mjs --check  只檢查：每個語系都有全部的 key，{佔位符} 與 HTML 標籤和英文一致
// node tools/i18n.mjs --todo   列出每個語系缺少或過時的 key（翻譯用）
import fs from "node:fs";
import path from "node:path";
import { ROOT, isMain } from "./transpile.mjs";

const DIR = path.join(ROOT, "apps/web/locales");
export const LOCALES = [
  "zh-Hant-TW", "zh-Hant", "zh-Hant-HK", "zh-Hans", "vi", "uk", "tr", "th", "sv", "sk", "ru", "ro", "pt", "pt-BR", "pl", "nl", "nb",
  "my", "ms", "lo", "ko", "km", "ja", "it", "id", "hu", "hr", "hi", "he", "fr", "fil", "fi", "es", "es-MX", "en", "el", "de", "da", "cs", "ca", "ar",
];

/** 原文：{ key: { "zh-Hant-TW": …, en: … } }，依 key 排序。 */
export function sources() {
  const out = {};
  for (const f of fs.readdirSync(path.join(DIR, "_parts")).filter((f) => f.endsWith(".json")).sort()) {
    Object.assign(out, JSON.parse(fs.readFileSync(path.join(DIR, "_parts", f), "utf8")));
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

export function translations(code) {
  const src = sources();
  if (code === "en" || code === "zh-Hant-TW") return Object.fromEntries(Object.entries(src).map(([k, v]) => [k, v[code]]));
  const file = path.join(DIR, "src", `${code}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : {};
}

const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(",");
const tags = (s) => [...String(s).matchAll(/<\/?([a-z0-9]+)\b[^>]*>/gi)].map((m) => m[0].replace(/\s.*>/, ">").toLowerCase()).sort().join("");

/** 每個語系的問題：缺 key、多餘 key、佔位符或 HTML 標籤與英文不同。 */
export function check() {
  const src = sources(), problems = {};
  for (const code of LOCALES) {
    const tr = translations(code), list = [];
    for (const [key, v] of Object.entries(src)) {
      const s = tr[key];
      if (typeof s !== "string" || !s.trim()) { list.push(`${key}: missing`); continue; }
      if (placeholders(s) !== placeholders(v.en)) list.push(`${key}: placeholders ${placeholders(s)} ≠ ${placeholders(v.en)}`);
      if (tags(s) !== tags(v.en)) list.push(`${key}: html tags differ`);
    }
    for (const key of Object.keys(tr)) if (!(key in src)) list.push(`${key}: unknown key`);
    if (list.length) problems[code] = list;
  }
  return problems;
}

// 擴充功能 manifest 與工具列提示用 chrome.i18n（跟著瀏覽器介面語言），語系目錄名稱照 Chrome 的寫法；zh-Hant 沒有對應，由 zh_TW 涵蓋。
const CHROME_LOCALE = { "zh-Hant-TW": "zh_TW", "zh-Hant": null, "zh-Hant-HK": "zh_HK", "zh-Hans": "zh_CN", "es-MX": "es_419", pt: "pt_PT" };
export const chromeLocale = (code) => (code in CHROME_LOCALE ? CHROME_LOCALE[code] : code.replace("-", "_"));
const EXT_LOCALES = path.join(ROOT, "apps/extension/_locales");

export function build() {
  fs.rmSync(EXT_LOCALES, { recursive: true, force: true });
  for (const code of LOCALES) {
    const tr = translations(code);
    fs.writeFileSync(path.join(DIR, `${code}.js`), `// 由 tools/i18n.mjs 產生，請改 apps/web/locales/_parts 或 src/${code}.json。\nexport default ${JSON.stringify(tr, null, 1)};\n`);
    const dir = chromeLocale(code);
    if (!dir) continue;
    // ext.xxx → messages.json 的 xxx；{sites} 之類的佔位符改成 chrome.i18n.getMessage 的 $1，字面上的 $ 要寫成 $$
    const messages = Object.fromEntries(Object.entries(tr).filter(([k]) => k.startsWith("ext.")).map(([k, s]) => {
      let n = 0;
      return [k.slice(4), { message: s.replace(/\$/g, "$$$$").replace(/\{\w+\}/g, () => `$${++n}`) }];
    }));
    fs.mkdirSync(path.join(EXT_LOCALES, dir), { recursive: true });
    fs.writeFileSync(path.join(EXT_LOCALES, dir, "messages.json"), JSON.stringify(messages, null, 1) + "\n");
  }
  return LOCALES.length;
}

if (isMain(import.meta.url)) {
  if (process.argv.includes("--todo")) {
    for (const [code, list] of Object.entries(check())) console.log(`${code}: ${list.length}`);
  } else if (process.argv.includes("--check")) {
    const problems = check();
    for (const [code, list] of Object.entries(problems)) console.error(`✗ ${code}\n  ${list.slice(0, 20).join("\n  ")}`);
    if (Object.keys(problems).length) process.exit(1);
    console.log(`✅ i18n verified (${LOCALES.length} locales, ${Object.keys(sources()).length} keys)`);
  } else console.log(`✅ built ${build()} locale files`);
}

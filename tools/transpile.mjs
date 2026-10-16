// 零依賴建置共用：剝除 TypeScript 型別，並把 import 路徑的 .ts 改成 .js，保留原本的相對目錄結構。
import fs from "node:fs";
import path from "node:path";
import { stripTypeScriptTypes } from "node:module";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// stripTypeScriptTypes 在 Node 22/24 仍標示 experimental；只靜音這一則警告。
const emitWarning = process.emitWarning;
process.emitWarning = (w, ...rest) => String(w?.message ?? w).includes("stripTypeScriptTypes") ? undefined : emitWarning.call(process, w, ...rest);

/** 列出 libs/<name>/src 底下的原始碼（排除 verify* 測試檔）。 */
export function libSources(...names) {
  return names.flatMap((name) => fs.readdirSync(path.join(ROOT, "libs", name, "src"))
    .filter((f) => f.endsWith(".ts") && !f.startsWith("verify"))
    .map((f) => `libs/${name}/src/${f}`));
}

/** 把 ROOT 下的 rel 轉譯後寫到 outDir/rel（.ts 改名為 .js）。 */
export function transpileTo(outDir, rel) {
  let code = fs.readFileSync(path.join(ROOT, rel), "utf8");
  if (rel.endsWith(".ts")) code = stripTypeScriptTypes(code);
  if (/\.(ts|js|mjs|html)$/.test(rel)) code = code.replace(/((?:from|import)\s*\(?\s*["'][^"']+)\.ts(["'])/g, "$1.js$2");
  const dest = path.join(outDir, rel.replace(/\.ts$/, ".js"));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, code);
  return dest;
}

export const isMain = (url) => process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(url);

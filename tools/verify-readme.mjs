// 多語系 README 檢查：每個語系都要有語言切換列，且標題、Mermaid 圖、表格列、程式碼區塊數量與英文版一致。
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["README.md", "README.zh-TW.md", "README.zh-CN.md", "README.ja.md", "README.ko.md"];

const shape = (text) => {
  const lines = text.split("\n");
  return {
    headings: lines.filter((l) => /^#{1,3} /.test(l)).map((l) => l.match(/^#+/)[0]).join(""),
    mermaid: lines.filter((l) => l.startsWith("```mermaid")).length,
    fences: lines.filter((l) => l.startsWith("```")).length,
    tableRows: lines.filter((l) => l.startsWith("|")).length,
  };
};

const base = shape(fs.readFileSync(path.join(ROOT, FILES[0]), "utf8"));
for (const file of FILES) {
  const text = fs.readFileSync(path.join(ROOT, file), "utf8");
  for (const other of FILES.slice(1)) assert.ok(file === other || text.includes(`/blob/main/${other}`), `${file} 的語言切換列缺少 ${other}`);
  if (file !== FILES[0]) assert.ok(text.includes("/blob/main/README.md"), `${file} 的語言切換列缺少 README.md`);
  assert.deepEqual(shape(text), base, `${file} 結構與 README.md 不同`);
  // 頁內錨點必須對得到標題（GitHub slug 規則）
  const slugs = new Set(text.split("\n").filter((l) => /^#{1,3} /.test(l))
    .map((l) => l.replace(/^#+ /, "").trim().toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-")));
  for (const [, a, b] of text.matchAll(/href="#([^"]+)"|\]\(#([^)]+)\)/g)) {
    const anchor = decodeURIComponent(a ?? b);
    assert.ok(slugs.has(anchor), `${file}: #${anchor} 找不到對應標題`);
  }
}
console.log(`✅ ${FILES.length} README locales verified!`);

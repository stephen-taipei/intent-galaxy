// Turns a topic export (`intent-galaxy.topic-export` v1) into one Markdown note that
// Mind Galaxy v0.14 imports as-is (POST /imports, V-2 flat frontmatter; see the
// mind-galaxy repo, MIND_GALAXY_DECISIONS.md V-2 and libs/vault/src/parse.ts).
//
// Rules taken from that parser and the decisions behind it:
// - Only V-2 keys, so the import has no "unknown key" warnings.
// - `why` stays empty: it holds the user's own words only, never generated text (B-2).
// - Dates carry a precision; `source_date` is the topic's creation day in Asia/Taipei.
// - Egress defaults to deny (B-4).
// - The output is deterministic: Mind Galaxy skips a file whose sha256 it has already
//   imported, so exporting an unchanged topic twice does not create a second node.
//   That is why no export timestamp is written.

const COPY = {
  zh: {
    sep: "：", mandala: "九宮格", decision: "決策", goal: "目標", progress: "進度",
    progressLine: (done, skipped, total) => `完成 ${done}／${total}${skipped ? `，略過 ${skipped}` : ""}`, open: "（", close: "）", join: "，",
    skipped: "略過", due: "期限", reviews: "回顧", question: "問題", direction: "鎖定的方向", result: "產出",
    empty: "這個主題還沒有九宮格或決策。",
  },
  en: {
    sep: ": ", mandala: "Mandala", decision: "Decision", goal: "Goal", progress: "Progress",
    progressLine: (done, skipped, total) => `${done} of ${total} done${skipped ? `, ${skipped} skipped` : ""}`, open: " (", close: ")", join: ", ",
    skipped: "skipped", due: "due", reviews: "Reviews", question: "Question", direction: "Locked direction", result: "Result",
    empty: "This topic has no chart or decision yet.",
  },
};

// JSON strings are valid YAML double-quoted scalars, so this quotes any title safely.
const yamlString = (value) => JSON.stringify(String(value));
const oneLine = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const block = (value) => String(value ?? "").replace(/\r\n?/g, "\n").trim();

// A fence longer than any backtick run inside the text, so pasted code cannot close it.
function fenced(text, lang = "text") {
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const fence = "`".repeat(Math.max(3, longest + 1));
  return `${fence}${lang}\n${text}\n${fence}`;
}

export function taipeiDate(iso) {
  const time = new Date(iso);
  if (!Number.isFinite(time.valueOf())) return null;
  return new Date(time.valueOf() + 8 * 3600 * 1000).toISOString().slice(0, 10);
}

// Same idea as Mind Galaxy's own export names (slug-<id 8>.md): keep CJK, drop
// characters that file systems or Obsidian links reject.
export function mindGalaxyFileName(title, id) {
  const slug = oneLine(title).normalize("NFC").replace(/\p{Cc}/gu, "").replace(/[/\\:*?"<>|#^[\]]/g, "")
    .replace(/ +/g, "-").replace(/-{2,}/g, "-").replace(/\.{2,}/g, ".").replace(/^[-.\s]+|[-.\s]+$/gu, "");
  const short = Array.from(slug).slice(0, 80).join("").replace(/^[-.\s]+|[-.\s]+$/gu, "") || "topic";
  const suffix = String(id ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
  return `${short}${suffix ? `-${suffix}` : ""}.md`;
}

function mandalaSection(doc, c) {
  const chart = doc.data?.chart ?? doc.data ?? {};
  const reviews = Array.isArray(doc.data?.reviews) ? doc.data.reviews : [];
  const lines = [`## ${c.mandala}${c.sep}${oneLine(chart.title || doc.title)}`, ""];
  if (oneLine(chart.goal)) lines.push(`${c.goal}${c.sep}${oneLine(chart.goal)}`);
  const actions = (chart.themes ?? []).flatMap((t) => t.actions ?? []).filter((a) => oneLine(a.text));
  if (actions.length) {
    const done = actions.filter((a) => a.done).length, skipped = actions.filter((a) => !a.done && a.skipped).length;
    lines.push(`${c.progress}${c.sep}${c.progressLine(done, skipped, actions.length)}`);
  }
  for (const theme of chart.themes ?? []) {
    const items = (theme.actions ?? []).filter((a) => oneLine(a.text));
    if (!oneLine(theme.title) && !items.length) continue;
    lines.push("", `### ${oneLine(theme.title) || "—"}`, "");
    for (const a of items) {
      const extras = [a.dueDate ? `${c.due} ${a.dueDate}` : "", !a.done && a.skipped ? c.skipped : ""].filter(Boolean);
      lines.push(`- [${a.done ? "x" : " "}] ${oneLine(a.text)}${extras.length ? `${c.open}${extras.join(c.join)}${c.close}` : ""}`);
      if (oneLine(a.notes)) lines.push(`  - ${oneLine(a.notes)}`);
    }
  }
  const written = reviews.filter((r) => oneLine(r.notes));
  if (written.length) {
    lines.push("", `### ${c.reviews}`, "");
    for (const r of written) lines.push(`- ${oneLine(r.date)}${c.sep}${oneLine(r.notes)}`);
  }
  return lines.join("\n");
}

function studioSection(doc, c) {
  const data = doc.data ?? {};
  const lines = [`## ${c.decision}${c.sep}${oneLine(doc.title)}`, ""];
  const goal = oneLine(data.contract?.goal);
  if (goal) lines.push(`${c.question}${c.sep}${goal}`);
  const direction = block(data.selectionText);
  if (direction) lines.push("", `### ${c.direction}`, "", fenced(direction));
  const result = block(typeof data.artifact === "string" ? data.artifact : data.artifact?.content);
  if (result) lines.push("", `### ${c.result}`, "", result);
  return lines.join("\n");
}

/**
 * @param {object} exported  body of GET /api/topics/:id/export
 * @param {{ origin: string, lang?: string }} options
 * @returns {{ fileName: string, markdown: string }}
 */
export function topicToMindGalaxyNote(exported, { origin, lang = "zh" }) {
  if (exported?.format !== "intent-galaxy.topic-export" || exported.version !== 1 || !exported.topic?.id) {
    throw new TypeError("Unsupported topic export");
  }
  const c = COPY[lang] ?? COPY.zh;
  const { topic } = exported;
  const day = taipeiDate(topic.createdAt);
  const docs = [...(exported.documents ?? [])].sort((a, b) =>
    (a.product === b.product ? 0 : a.product === "mandala" ? -1 : 1) || String(a.id).localeCompare(String(b.id)));
  const sections = docs.map((d) => d.product === "mandala" ? mandalaSection(d, c) : d.product === "studio" ? studioSection(d, c) : "")
    .filter(Boolean);
  const frontmatter = [
    "---",
    `title: ${yamlString(oneLine(topic.title))}`,
    "type: note",
    `source: ${yamlString(new URL(`/t/${encodeURIComponent(topic.id)}`, origin).href)}`,
    day ? `source_date: ${yamlString(day)}` : "source_date:",
    `source_date_precision: ${day ? "exact" : "unknown"}`,
    "acquired_date:",
    "acquired_date_precision: unknown",
    "why:",
    "domains: []",
    "media: []",
    "inspired_by: []",
    "model_egress: deny",
    "backup_egress: deny",
    "---",
  ].join("\n");
  const body = sections.length ? sections.join("\n\n") : c.empty;
  return { fileName: mindGalaxyFileName(topic.title, topic.id), markdown: `${frontmatter}\n${body}\n` };
}

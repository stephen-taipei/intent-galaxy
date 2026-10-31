// Chart exports without dependencies: a 1080×1350 image for sharing, an
// image-based PDF, and an .xlsx workbook (stored ZIP, inline strings).
import { THEME_POSITIONS } from "./model.js";

const ACTION_POSITIONS = [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [1, 0]];
const FONT = '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", system-ui, sans-serif';
const encoder = new TextEncoder();

/** 9×9 cells in reading order: { text, role: goal | theme | action, done }. */
export function chartCells(chart) {
  const cells = Array.from({ length: 9 }, () => Array(9).fill(null));
  THEME_POSITIONS.forEach(([r, c], ti) => {
    const theme = chart.themes[ti];
    cells[3 + r][3 + c] = { text: theme.title, role: "theme" };
    cells[r * 3 + 1][c * 3 + 1] = { text: theme.title, role: "theme" };
    ACTION_POSITIONS.forEach(([ar, ac], ai) => { const action = theme.actions[ai]; cells[r * 3 + ar][c * 3 + ac] = { text: action.text, role: "action", done: action.done === true }; });
  });
  cells[4][4] = { text: chart.goal, role: "goal" };
  return cells;
}

function wrap(ctx, text, width, maxLines) {
  const lines = []; let line = "";
  for (const char of String(text || "")) {
    if (char === "\n" || ctx.measureText(line + char).width > width) { lines.push(line); line = char === "\n" ? "" : char; if (lines.length === maxLines) break; }
    else line += char;
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && lines.join("").length < String(text || "").replace(/\n/g, "").length) lines[maxLines - 1] = `${lines[maxLines - 1].slice(0, -1)}…`;
  return lines;
}

/** Draws the share image. footer is a short brand line such as the site address. */
export function renderChartCanvas(chart, { author = "", footer = "" } = {}) {
  const canvas = document.createElement("canvas"); canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = "#1f2340"; ctx.font = `700 46px ${FONT}`; ctx.textBaseline = "top";
  wrap(ctx, chart.title || chart.goal, 1000, 1).forEach((l) => ctx.fillText(l, 40, 44));
  ctx.fillStyle = "#5b6078"; ctx.font = `400 26px ${FONT}`;
  wrap(ctx, author ? `${author}・${chart.goal}` : chart.goal, 1000, 2).forEach((l, i) => ctx.fillText(l, 40, 112 + i * 36));
  const top = 200; const size = 1000 / 9; const cells = chartCells(chart);
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) {
    const cell = cells[r][c]; const x = 40 + c * size; const y = top + r * size;
    ctx.fillStyle = cell.role === "goal" ? "#5b4cdb" : cell.role === "theme" ? "#ece9ff" : cell.done ? "#e3f6ec" : "#f7f8fc";
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    ctx.fillStyle = cell.role === "goal" ? "#ffffff" : "#1f2340"; ctx.font = `${cell.role === "action" ? 400 : 700} ${cell.role === "goal" ? 18 : 15}px ${FONT}`;
    const lines = wrap(ctx, cell.text, size - 16, 5);
    lines.forEach((l, i) => ctx.fillText(l, x + 8, y + 8 + i * 20));
    if (cell.done) { ctx.fillStyle = "#1e9e63"; ctx.font = `700 16px ${FONT}`; ctx.fillText("✓", x + size - 22, y + size - 24); }
  }
  ctx.strokeStyle = "#5b4cdb"; ctx.lineWidth = 3; ctx.beginPath();
  for (let i = 0; i <= 3; i++) { ctx.moveTo(40 + i * 3 * size, top); ctx.lineTo(40 + i * 3 * size, top + 1000); ctx.moveTo(40, top + i * 3 * size); ctx.lineTo(1040, top + i * 3 * size); }
  ctx.stroke();
  ctx.fillStyle = "#8a8fa8"; ctx.font = `400 24px ${FONT}`; ctx.fillText(footer, 40, 1250);
  const done = chart.themes.reduce((n, t) => n + t.actions.filter((a) => a.done).length, 0);
  const label = `${done}/64`; ctx.fillText(label, 1040 - ctx.measureText(label).width, 1250);
  return canvas;
}

export function canvasBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Image export failed")), type, quality));
}

function concat(parts) {
  const bytes = parts.map((p) => typeof p === "string" ? encoder.encode(p) : p);
  const out = new Uint8Array(bytes.reduce((n, b) => n + b.length, 0)); let at = 0;
  for (const b of bytes) { out.set(b, at); at += b.length; }
  return out;
}

/** One-page PDF holding the share image as a JPEG. Text is not selectable. */
export async function chartPdf(canvas) {
  const jpeg = new Uint8Array(await (await canvasBlob(canvas, "image/jpeg", 0.92)).arrayBuffer());
  const width = 595; const height = Math.round(width * canvas.height / canvas.width);
  const content = `q ${width} 0 0 ${height} 0 0 cm /Im0 Do Q`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`,
    [`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, "\nendstream"],
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  const parts = ["%PDF-1.4\n%âãÏÓ\n"]; const offsets = [];
  let length = concat(parts).length;
  objects.forEach((body, i) => {
    offsets.push(length);
    const chunk = concat([`${i + 1} 0 obj\n`, ...(Array.isArray(body) ? body : [body]), "\nendobj\n"]);
    parts.push(chunk); length += chunk.length;
  });
  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  parts.push(`${xref}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${length}\n%%EOF\n`);
  return new Blob([concat(parts)], { type: "application/pdf" });
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(bytes) { let c = 0xffffffff; for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function u16(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff]); }
function u32(n) { return new Uint8Array([n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]); }

/** Uncompressed ZIP archive from { path: string } entries. */
export function zipStore(files) {
  const locals = []; const central = []; let offset = 0;
  for (const [path, text] of Object.entries(files)) {
    const name = encoder.encode(path); const data = encoder.encode(text); const crc = crc32(data);
    const head = concat([u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name]);
    locals.push(head, data);
    central.push(concat([u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name]));
    offset += head.length + data.length;
  }
  const directory = concat(central);
  return concat([...locals, directory, u32(0x06054b50), u16(0), u16(0), u16(central.length), u16(central.length), u32(directory.length), u32(offset), u16(0)]);
}

const xml = (value) => String(value ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
const column = (i) => String.fromCharCode(65 + i);
function sheet(rows, widths, style = () => 0) {
  const cols = `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("")}</cols>`;
  const body = rows.map((row, r) => `<row r="${r + 1}">${row.map((value, c) => `<c r="${column(c)}${r + 1}" t="inlineStr" s="${style(r, c)}"><is><t xml:space="preserve">${xml(value)}</t></is></c>`).join("")}</row>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${body}</sheetData></worksheet>`;
}

/** Workbook with the 9×9 chart and a flat action list. */
export function chartXlsx(chart, { gridName = "九宮格", listName = "行動清單", headers = ["主題", "行動", "完成"] } = {}) {
  const cells = chartCells(chart);
  const grid = sheet(cells.map((row) => row.map((cell) => cell.text)), Array(9).fill(18), (r, c) => cells[r][c].role === "goal" ? 2 : cells[r][c].role === "theme" ? 1 : 3);
  const rows = [headers, ...chart.themes.flatMap((t) => t.actions.map((a) => [t.title, a.text, a.done ? "✓" : ""]))];
  const list = sheet(rows, [24, 60, 8], (r) => r === 0 ? 1 : 0);
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFECE9FF"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9D3FF"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="1" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const files = {
    "[Content_Types].xml": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
    "_rels/.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
    "xl/workbook.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${xml(gridName)}" sheetId="1" r:id="rId1"/><sheet name="${xml(listName)}" sheetId="2" r:id="rId2"/></sheets></workbook>`,
    "xl/_rels/workbook.xml.rels": '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
    "xl/styles.xml": styles,
    "xl/worksheets/sheet1.xml": grid,
    "xl/worksheets/sheet2.xml": list,
  };
  return new Blob([zipStore(files)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

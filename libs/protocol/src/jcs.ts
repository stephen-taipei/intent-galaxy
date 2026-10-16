// RFC 8785 JSON Canonicalization Scheme（JCS）與 SHA-256 specHash。零依賴，Node 22+ 與瀏覽器皆可用（Web Crypto）。

/**
 * 依 RFC 8785 正規化：物件鍵依 UTF-16 code unit 排序、數字用 ECMAScript Number→String、
 * 字串用 ECMAScript JSON 跳脫。輸入必須是 I-JSON：拒絕 NaN/Infinity 與孤立代理字元。
 */
export function canonicalize(value: unknown): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean": return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) throw new TypeError("JCS: 數字必須是有限值");
      return JSON.stringify(value);
    case "string":
      if (!value.isWellFormed()) throw new TypeError("JCS: 字串含孤立代理字元");
      return JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) return `[${value.map((v) => canonicalize(v === undefined ? null : v)).join(",")}]`;
      const obj = value as Record<string, unknown>;
      // Array.prototype.sort 預設即以 UTF-16 code unit 比較，符合 RFC 8785 §3.2.3。
      const keys = Object.keys(obj).filter((k) => obj[k] !== undefined).sort();
      return `{${keys.map((k) => `${canonicalize(k)}:${canonicalize(obj[k])}`).join(",")}}`;
    }
    default:
      throw new TypeError(`JCS: 不支援的型別 ${typeof value}`);
  }
}

/** 小寫十六進位 SHA-256。 */
export async function sha256Hex(text: string): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** specHash = SHA-256(JCS(payload))，小寫十六進位。 */
export function specHash(payload: unknown): Promise<string> {
  return sha256Hex(canonicalize(payload));
}

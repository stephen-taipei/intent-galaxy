// 介面多語系：依瀏覽器語言挑 41 個語系之一，載入 ./locales/<語系>.js；缺的字串退回英文。
// 用法：await ready; t("key", { name: "值" })。字串裡的 {name} 會被替換；值不會被跳脫，HTML 的地方由呼叫端自己 esc。
import EN from "./locales/en.js";

export const LOCALES = [
  "zh-Hant-TW", "zh-Hant", "zh-Hant-HK", "zh-Hans", "vi", "uk", "tr", "th", "sv", "sk", "ru", "ro", "pt", "pt-BR", "pl", "nl", "nb",
  "my", "ms", "lo", "ko", "km", "ja", "it", "id", "hu", "hr", "hi", "he", "fr", "fil", "fi", "es", "es-MX", "en", "el", "de", "da", "cs", "ca", "ar",
];
const RTL = new Set(["ar", "he"]);
// 舊語言代碼與同義代碼
const ALIAS = { iw: "he", in: "id", tl: "fil", no: "nb", nn: "nb", "zh-tw": "zh-Hant-TW", "zh-hk": "zh-Hant-HK", "zh-mo": "zh-Hant-HK", "zh-cn": "zh-Hans", "zh-sg": "zh-Hans" };

/** 把瀏覽器的語言偏好（BCP 47）對應到支援的語系；都不支援時用英文。 */
export function pickLocale(langs = globalThis.navigator?.languages ?? [globalThis.navigator?.language ?? "en"]) {
  for (const raw of langs) {
    if (!raw) continue;
    const tag = String(raw).replace(/_/g, "-");
    const low = tag.toLowerCase();
    if (ALIAS[low]) return ALIAS[low];
    const exact = LOCALES.find((l) => l.toLowerCase() === low);
    if (exact) return exact;
    const [lang, ...rest] = low.split("-");
    if (ALIAS[lang]) return ALIAS[lang];
    if (lang === "zh") {
      if (rest.includes("hans")) return "zh-Hans";
      if (rest.includes("hk") || rest.includes("mo")) return "zh-Hant-HK";
      if (rest.includes("tw")) return "zh-Hant-TW";
      if (rest.includes("hant")) return "zh-Hant";
      return "zh-Hans";
    }
    // 拉丁美洲西班牙文（es-419、es-AR…）用 es-MX；巴西以外的葡萄牙文用 pt
    if (lang === "es") return rest.length && rest[0] !== "es" ? "es-MX" : "es";
    if (lang === "pt") return rest[0] === "br" ? "pt-BR" : "pt";
    const base = LOCALES.find((l) => l.toLowerCase() === lang);
    if (base) return base;
  }
  return "en";
}

let dict = EN;
export let locale = "en";
export const isRtl = () => RTL.has(locale);

/** 載入某個語系（失敗時維持英文）。 */
export async function setLocale(code) {
  if (!LOCALES.includes(code)) code = "en";
  try { dict = code === "en" ? EN : { ...EN, ...(await import(`./locales/${code}.js`)).default }; locale = code; }
  catch { dict = EN; locale = "en"; }
  return locale;
}

/** 啟動時依瀏覽器語言載入；介面第一次畫面前 await 它。 */
export const ready = setLocale(pickLocale());

export function t(key, vars) {
  const s = dict[key] ?? EN[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}

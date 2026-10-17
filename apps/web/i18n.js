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
/** 使用者手動選的語系；"" 表示跟著瀏覽器語言。 */
export let preference = "";
export const isRtl = () => RTL.has(locale);
/** 示範星系只有繁中、簡中、英文三版：中文語系用對應的中文版，其他語系用英文版。 */
export const pickSample = (variants) => variants[locale === "zh-Hans" ? "zh-Hans" : locale.startsWith("zh") ? "zh-Hant" : "en"] ?? variants["zh-Hant"];

const listeners = new Set();
/** 語系換掉時呼叫 cb（手動切換，或擴充功能的另一個頁面切換了）。回傳取消訂閱的函式。 */
export function onLocaleChange(cb) { listeners.add(cb); return () => listeners.delete(cb); }

/** 載入某個語系（失敗時維持英文）。 */
export async function setLocale(code) {
  if (!LOCALES.includes(code)) code = "en";
  const before = locale;
  try { dict = code === "en" ? EN : { ...EN, ...(await import(`./locales/${code}.js`)).default }; locale = code; }
  catch { dict = EN; locale = "en"; }
  if (locale !== before) for (const cb of listeners) { try { cb(locale); } catch { /* 單一訂閱者失敗不影響其他 */ } }
  return locale;
}

// 偏好存在哪：擴充功能（面板、AI 網頁上的內容腳本）用 storage.local，各頁共用；本機網頁版用 localStorage。
const PREF_KEY = "ig:locale";
const extStore = globalThis.browser?.storage?.local ?? globalThis.chrome?.storage?.local;
async function loadPreference() {
  try {
    const v = extStore ? (await extStore.get(PREF_KEY))?.[PREF_KEY] : globalThis.localStorage?.getItem(PREF_KEY);
    return LOCALES.includes(v) ? v : "";
  } catch { return ""; }
}

/** 手動選語系（"" ＝跟著瀏覽器語言），並記住選擇。 */
export async function chooseLocale(code) {
  preference = LOCALES.includes(code) ? code : "";
  try {
    if (extStore) await (preference ? extStore.set({ [PREF_KEY]: preference }) : extStore.remove(PREF_KEY));
    else if (preference) globalThis.localStorage?.setItem(PREF_KEY, preference);
    else globalThis.localStorage?.removeItem(PREF_KEY);
  } catch { /* 無法儲存時只在這一頁生效 */ }
  return setLocale(preference || pickLocale());
}

// 擴充功能的另一個頁面改了偏好：這一頁也跟著換。
(globalThis.browser?.storage ?? globalThis.chrome?.storage)?.onChanged?.addListener((changes, area) => {
  if (area !== "local" || !(PREF_KEY in changes)) return;
  const v = changes[PREF_KEY].newValue;
  preference = LOCALES.includes(v) ? v : "";
  setLocale(preference || pickLocale());
});

/** 語系的自稱名稱（例如 de → Deutsch），選單用。 */
const NAMES = { "zh-Hant-TW": "繁體中文（台灣）", "zh-Hant": "繁體中文", "zh-Hant-HK": "繁體中文（香港）", "zh-Hans": "简体中文", id: "Bahasa Indonesia", ms: "Bahasa Melayu" };
export function languageName(code) {
  if (NAMES[code]) return NAMES[code];
  try {
    const name = new Intl.DisplayNames([code], { type: "language" }).of(code);
    return name ? name.charAt(0).toLocaleUpperCase(code) + name.slice(1) : code;
  } catch { return code; }
}

/** 啟動時載入：有手動選過就用它，否則依瀏覽器語言。介面第一次畫面前 await 它。 */
export const ready = loadPreference().then((p) => { preference = p; return setLocale(p || pickLocale()); });

export function t(key, vars) {
  const s = dict[key] ?? EN[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : s;
}

/** Resolve a consumer-provided copy override without changing the default locale fallback. */
export function resolveCopyOverride(overrides, name, fallback) {
  const value = overrides?.[name];
  if (typeof value === "function") return value();
  return value ?? fallback();
}

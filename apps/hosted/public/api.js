export class ApiError extends Error {
  constructor(code, message, status = 0) {
    super(message || code || "Request failed");
    this.name = "ApiError";
    this.code = code || "request_failed";
    this.status = status;
  }
}

const randomKey = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const GUEST_TURNSTILE_ACTION = "guest_trial";

export function guestTurnstileOptions(sitekey, { onToken, onError }) {
  return {
    sitekey,
    action: GUEST_TURNSTILE_ACTION,
    callback: onToken,
    "error-callback": onError,
    "expired-callback": onError,
  };
}

/** Small same-origin client for the fixed hosted HTTP DTO. */
export class HostedApi {
  constructor(fetchImpl = globalThis.fetch?.bind(globalThis)) {
    if (!fetchImpl) throw new Error("fetch is unavailable");
    this.fetch = fetchImpl;
    this.csrfToken = "";
    this.config = null;
    this.session = null;
  }

  async request(path, { method = "GET", body, idempotencyKey } = {}) {
    const verb = method.toUpperCase();
    const headers = { Accept: "application/json" };
    const init = { method: verb, credentials: "same-origin", cache: "no-store", headers };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(body);
    }
    if (verb !== "GET" && verb !== "HEAD") {
      if (!this.csrfToken) throw new ApiError("session_required", "A session CSRF token is not available.");
      headers["X-CSRF-Token"] = this.csrfToken;
    }
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    let response;
    try { response = await this.fetch(path, init); }
    catch { throw new ApiError("network_error", "The server could not be reached."); }
    let data;
    try { data = await response.json(); }
    catch { data = null; }
    if (!response.ok) {
      const err = data?.error;
      throw new ApiError(err?.code ?? "request_failed", err?.message ?? `Request failed (${response.status}).`, response.status);
    }
    if (!data || typeof data !== "object") throw new ApiError("invalid_response", "The server returned an invalid response.", response.status);
    return data;
  }

  async bootstrap() {
    const session = await this.request("/api/session");
    this.session = session;
    this.csrfToken = typeof session.csrfToken === "string" ? session.csrfToken : "";
    this.config = await this.request("/api/config");
    return { session: this.session, config: this.config };
  }

  async refreshSession() {
    const session = await this.request("/api/session");
    this.session = session;
    this.csrfToken = typeof session.csrfToken === "string" ? session.csrfToken : "";
    return session;
  }

  async createGuest(turnstileToken = "") {
    const result = await this.request("/api/guest", { method: "POST", body: { turnstileToken } });
    await this.refreshSession();
    return result;
  }

  async logout() {
    await this.request("/api/auth/logout", { method: "POST", body: {} });
    return this.refreshSession();
  }

  async submitJob(request, idempotencyKey = randomKey()) {
    const response = await this.request("/api/jobs", { method: "POST", body: request, idempotencyKey });
    return { ...response, idempotencyKey };
  }

  jobStatus(id) { return this.request(`/api/jobs/${encodeURIComponent(id)}`); }

  documents(product, kind) {
    const params = new URLSearchParams({ product, kind });
    return this.request(`/api/documents?${params}`);
  }

  getDocument(id) { return this.request(`/api/documents/${encodeURIComponent(id)}`); }

  saveDocument({ product, kind, title, data, id, revision }) {
    if (id) {
      return this.request(`/api/documents/${encodeURIComponent(id)}`, { method: "PUT", body: { title, data, revision } });
    }
    return this.request("/api/documents", { method: "POST", body: { product, kind, title, data } });
  }

  deleteDocument(id) { return this.request(`/api/documents/${encodeURIComponent(id)}`, { method: "DELETE" }); }

  versions(id) { return this.request(`/api/documents/${encodeURIComponent(id)}/versions`); }

  invites() { return this.request("/api/invites"); }

  createInvite() { return this.request("/api/invites", { method: "POST", body: {} }); }

  async redeemInvite(code, turnstileToken = "") {
    const result = await this.request("/api/invites/redeem", { method: "POST", body: { code, turnstileToken } });
    await this.refreshSession();
    return result;
  }

  async deleteAccount() {
    await this.request("/api/account", { method: "DELETE" });
    return this.refreshSession();
  }

  profile() { return this.request("/api/profile"); }

  saveProfile(profile) { return this.request("/api/profile", { method: "PUT", body: profile }); }

  feed({ sort = "new", window = "7d", source = "all", lang, tag, offset = 0 } = {}) {
    const params = new URLSearchParams({ sort, window, source, offset: String(offset) });
    if (lang) params.set("lang", lang);
    if (tag) params.set("tag", tag);
    return this.request(`/api/feed?${params}`);
  }

  publicChart(id) { return this.request(`/api/public/${encodeURIComponent(id)}`); }

  myPublicCharts() { return this.request("/api/public/mine"); }

  publish(documentId, tags) { return this.request("/api/public", { method: "POST", body: { documentId, tags } }); }

  unpublish(id) { return this.request(`/api/public/${encodeURIComponent(id)}`, { method: "DELETE" }); }

  encourage(id, on) { return this.request(`/api/public/${encodeURIComponent(id)}/encourage`, { method: "POST", body: { on } }); }

  copyPublic(id) { return this.request(`/api/public/${encodeURIComponent(id)}/copy`, { method: "POST", body: {} }); }

  report(id, reason) { return this.request(`/api/public/${encodeURIComponent(id)}/report`, { method: "POST", body: { reason } }); }

  event(name, product, templateId) { return this.request("/api/events", { method: "POST", body: { name, product, ...(templateId ? { templateId } : {}) } }); }

  checkout(product) {
    return this.request("/api/billing/checkout", { method: "POST", body: { product }, idempotencyKey: randomKey() });
  }
}

export { randomKey };

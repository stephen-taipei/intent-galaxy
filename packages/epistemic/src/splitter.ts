export type StreamEvent =
  | { t: "skeleton"; runId: number; core: unknown; quadrants: unknown }
  | { t: "node"; runId: number; id: string; node: unknown }
  | { t: "edges"; runId: number; edges: unknown[] }
  | { t: "archetype"; runId: number; key: "alpha" | "beta" | "gamma"; archetype: unknown }
  | { t: "done"; runId: number; nodeCount: number }
  | { t: "error"; runId: number; code: "bad_json" | "bad_shape" | "truncated" | "no_root"; retryable: boolean };

const NODE_ID = /^N(?:[1-9]|1[0-2])$/;
const ARCH_KEY = new Set(["alpha", "beta", "gamma"]);

export class IntentNdjsonSplitter {
  #buf = ""; #pos = 0;
  #stack: ("o" | "a")[] = [];
  #expectKey: boolean[] = [];
  #keys: string[] = [];
  #inStr = false; #esc = false; #strStart = 0; #strIsKey = false;
  #capStart = -1; #capDepth = -1; #capKind: "root" | "node" | "arch" | "plain" = "plain"; #capKey = "";
  #core: unknown; #nodeCount = 0; #done = false; #failed = false; #started = false;
  readonly runId: number;

  constructor(runId: number) { this.runId = runId; }

  push(chunk: string): StreamEvent[] {
    if (this.#done || this.#failed) return [];
    this.#buf += chunk;
    const out: StreamEvent[] = [];
    for (; this.#pos < this.#buf.length && !this.#failed && !this.#done; this.#pos++) {
      this.#step(this.#buf[this.#pos], out);
    }
    if (this.#capStart < 0 && !this.#inStr && this.#pos > 0) {
      this.#buf = this.#buf.slice(this.#pos); this.#pos = 0;
    }
    return out;
  }

  end(): StreamEvent[] {
    if (this.#done || this.#failed) return [];
    return [this.#fail(this.#started ? "truncated" : "no_root", true)];
  }

  #step(c: string, out: StreamEvent[]) {
    if (this.#inStr) {
      if (this.#esc) this.#esc = false;
      else if (c === "\\") this.#esc = true;
      else if (c === "\"") {
        this.#inStr = false;
        if (this.#strIsKey) this.#keys[this.#stack.length] = JSON.parse(this.#buf.slice(this.#strStart, this.#pos + 1));
        else this.#valueEnd(out, this.#pos + 1);
      }
      return;
    }
    if (c === "\"") {
      this.#inStr = true; this.#strStart = this.#pos;
      const top = this.#stack.length - 1;
      this.#strIsKey = top >= 0 && this.#stack[top] === "o" && this.#expectKey[top];
      if (!this.#strIsKey) this.#maybeStartCapture(this.#pos, false);
      return;
    }
    if (c === "{" || c === "[") {
      if (!this.#started) { if (c !== "{") return; this.#started = true; }
      this.#maybeStartCapture(this.#pos, true);
      this.#stack.push(c === "{" ? "o" : "a"); this.#expectKey.push(c === "{");
      return;
    }
    if (c === "}" || c === "]") {
      if (!this.#started) return;
      this.#stack.pop(); this.#expectKey.pop(); this.#keys.length = this.#stack.length + 1;
      if (this.#stack.length === 0) { this.#finishRoot(out); return; }
      this.#valueEnd(out, this.#pos + 1);
      return;
    }
    if (c === ":") { const t = this.#stack.length - 1; if (t >= 0) this.#expectKey[t] = false; return; }
    if (c === ",") { const t = this.#stack.length - 1; if (t >= 0 && this.#stack[t] === "o") this.#expectKey[t] = true; }
  }

  #maybeStartCapture(at: number, isContainer: boolean) {
    const d = this.#stack.length;
    if (this.#capStart >= 0 || d === 0) return;
    if (d === 1) {
      const k = this.#keys[1];
      if (k === "nodes" || k === "archetypes" || k === "_scratchpad" || k === "withheld_kill") return;
      this.#begin(at, 1, "plain", k);
    } else if (d === 2 && isContainer) {
      const k1 = this.#keys[1];
      if (k1 === "nodes") this.#begin(at, 2, "node", this.#keys[2]);
      else if (k1 === "archetypes") this.#begin(at, 2, "arch", this.#keys[2]);
    }
  }

  #begin(at: number, depth: number, kind: "node" | "arch" | "plain", key: string) {
    this.#capStart = at; this.#capDepth = depth; this.#capKind = kind; this.#capKey = key;
  }

  #valueEnd(out: StreamEvent[], end: number) {
    if (this.#capStart < 0) return;
    if (this.#stack.length !== this.#capDepth) return;
    let v: unknown;
    try { v = JSON.parse(this.#buf.slice(this.#capStart, end)); }
    catch { out.push(this.#fail("bad_json", false)); return; }
    this.#capStart = -1;
    const key = this.#capKey, runId = this.runId;
    if (this.#capKind === "node") {
      if (!NODE_ID.test(key) || typeof v !== "object" || v === null) { out.push(this.#fail("bad_shape", false)); return; }
      this.#nodeCount++; out.push({ t: "node", runId, id: key, node: v });
    } else if (this.#capKind === "arch") {
      if (!ARCH_KEY.has(key) || typeof v !== "object" || v === null) { out.push(this.#fail("bad_shape", false)); return; }
      out.push({ t: "archetype", runId, key: key as "alpha" | "beta" | "gamma", archetype: v });
    } else if (key === "core") this.#core = v;
    else if (key === "quadrants") out.push({ t: "skeleton", runId, core: this.#core ?? null, quadrants: v });
    else if (key === "edges" && Array.isArray(v)) out.push({ t: "edges", runId, edges: v });
  }

  #finishRoot(out: StreamEvent[]) {
    this.#done = true;
    out.push(this.#nodeCount === 12 ? { t: "done", runId: this.runId, nodeCount: 12 } : this.#fail("bad_shape", true));
  }

  #fail(code: "bad_json" | "bad_shape" | "truncated" | "no_root", retryable: boolean): StreamEvent {
    this.#failed = true; this.#capStart = -1;
    return { t: "error", runId: this.runId, code, retryable };
  }
}

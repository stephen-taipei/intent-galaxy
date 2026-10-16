// 零依賴 Stdio MCP Server（JSON-RPC 2.0，每行一則訊息）。stdout 只能寫協議訊息，日誌一律寫 stderr。
import { SPAWNER_SYSTEM_PROMPT, buildSpawnerUserMessage } from "../../../libs/epistemic/src/index.ts";
import { repairAnalysis } from "../../../libs/core/src/index.ts";

const TOOLS = [
  {
    name: "intent_spawner_prompt",
    description: "Step 1 of the Intent Galaxy flow. Returns the INTENT-SPAWNER system prompt and wire schema for a goal. Generate the IntentAnalysisResponse JSON yourself by following it exactly, then call intent_open_galaxy with that JSON.",
    inputSchema: { type: "object", properties: { goal: { type: "string", description: "The user's fuzzy goal, verbatim." } }, required: ["goal"] },
  },
  {
    name: "intent_open_galaxy",
    description: "Step 2 of the Intent Galaxy flow. Validates and deterministically repairs (V1-V18) an IntentAnalysisResponse JSON, opens the 12-node galaxy UI on 127.0.0.1, waits until the user locks it with Enter, and returns the LOCKED INTENT AST markdown. Follow the AST as hard constraints.",
    inputSchema: {
      type: "object",
      properties: {
        goal: { type: "string", description: "The user's goal, verbatim." },
        analysis: { description: "IntentAnalysisResponse object (or its JSON string) produced from intent_spawner_prompt." },
        wait: { type: "boolean", description: "Wait for the user to lock the galaxy (default true). false returns right after opening the UI." },
      },
      required: ["analysis"],
    },
  },
];

const text = (t, isError = false) => ({ content: [{ type: "text", text: t }], ...(isError ? { isError: true } : {}) });
const findingLines = (fs) => fs.map(f => `- [${f.level}] ${f.code} ${f.msg}`).join("\n");

/** hub：{ publish(goal, analysis, findings, source) → { id, url }, waitForLock(id, timeoutMs) → Promise<lock|null> } */
export function startMcp(hub, { version, input = process.stdin, output = process.stdout } = {}) {
  const send = (msg) => output.write(JSON.stringify(msg) + "\n");
  const reply = (id, result) => send({ jsonrpc: "2.0", id, result });
  const error = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } });

  async function callTool(name, args = {}) {
    if (name === "intent_spawner_prompt") {
      if (typeof args.goal !== "string" || !args.goal.trim()) return text("goal is required", true);
      return text(`${SPAWNER_SYSTEM_PROMPT}\n\n---\n${buildSpawnerUserMessage(args.goal)}\n\nAfter producing the JSON, call intent_open_galaxy with { goal, analysis }.`);
    }
    if (name === "intent_open_galaxy") {
      let analysis = args.analysis;
      if (typeof analysis === "string") { try { analysis = JSON.parse(analysis); } catch (e) { return text(`analysis is not valid JSON: ${e.message}`, true); } }
      const repaired = repairAnalysis(analysis);
      if (!repaired.ok) return text(`Galaxy rejected by repair pipeline. Fix these and call again:\n${findingLines(repaired.findings)}`, true);
      const { id, url } = hub.publish(typeof args.goal === "string" ? args.goal : "", repaired.analysis, repaired.findings, "mcp");
      const notes = repaired.findings.length ? `\n\nRepair findings:\n${findingLines(repaired.findings)}` : "";
      if (args.wait === false) return text(`Galaxy opened at ${url}. The user has not locked it yet.${notes}`);
      const lock = await hub.waitForLock(id, 30 * 60_000);
      if (!lock) return text(`The user did not lock the galaxy at ${url} within 30 minutes.${notes}`, true);
      const hook = lock.hookInstalled ? "" : "\nkill-gate hook 尚未安裝：執行 `npx intent-engineering-galaxy init-hook`，14 天後才會有人擋下 commit。";
      return text(`${lock.payload.ast}\n\n.intent.lock.json specHash: ${lock.specHash} · auditDueAt: ${lock.auditDueAt}${hook}${notes}`);
    }
    return null;
  }

  async function handle(msg) {
    const { id, method, params } = msg;
    const isRequest = id !== undefined && id !== null;
    if (method === "initialize") return reply(id, {
      protocolVersion: params?.protocolVersion ?? "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "intent-galaxy", version },
    });
    if (method === "ping") return reply(id, {});
    if (method === "tools/list") return reply(id, { tools: TOOLS });
    if (method === "tools/call") {
      const result = await callTool(params?.name, params?.arguments);
      return result ? reply(id, result) : error(id, -32602, `Unknown tool: ${params?.name}`);
    }
    if (isRequest) error(id, -32601, `Method not found: ${method}`);
  }

  let buf = "";
  input.setEncoding("utf8");
  input.on("data", (chunk) => {
    buf += chunk;
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
      if (!line) continue;
      let msg;
      try { msg = JSON.parse(line); } catch { send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }); continue; }
      handle(msg).catch((e) => { if (msg.id !== undefined) error(msg.id, -32603, e.message); });
    }
  });
  input.on("end", () => process.exit(0));
}

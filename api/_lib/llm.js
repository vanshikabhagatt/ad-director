// Minimal OpenAI-compatible client with model fallbacks.
// Works with Groq's free tier by default. Any OpenAI-compatible endpoint works
// (set LLM_BASE_URL, LLM_API_KEY, LLM_MODELS).

const DEFAULT_BASE = "https://api.groq.com/openai/v1";
// Llama 3.3 70B was retired on Groq in Aug 2026; gpt-oss models are the current fast defaults.
const DEFAULT_MODELS = "openai/gpt-oss-20b,openai/gpt-oss-120b,llama-3.1-8b-instant";

export function llmConfig(env = process.env) {
  const key = env.LLM_API_KEY || env.GROQ_API_KEY || "";
  const base = (env.LLM_BASE_URL || DEFAULT_BASE).replace(/\/$/, "");
  const models = (env.LLM_MODELS || env.GROQ_MODEL || DEFAULT_MODELS).split(",").map((m) => m.trim()).filter(Boolean);
  const provider = base.includes("groq.com") ? "Groq" : base.includes("openrouter") ? "OpenRouter" : "custom";
  return { enabled: Boolean(key), key, base, models, provider };
}

export class LLMError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

async function once(cfg, model, messages, { json, timeoutMs, extras }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const body = { model, messages, temperature: 0.7, max_tokens: 1400 };
  if (json) body.response_format = { type: "json_object" };
  if (extras && /gpt-oss/.test(model)) body.reasoning_effort = "low";
  try {
    const r = await fetch(`${cfg.base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.key}` },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
    const text = await r.text();
    if (!r.ok) throw new LLMError(`HTTP ${r.status}: ${text.slice(0, 200)}`, r.status);
    const data = JSON.parse(text);
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new LLMError("Empty response", 502);
    return content;
  } catch (e) {
    if (e.name === "AbortError") throw new LLMError("Timed out", 504);
    if (e instanceof LLMError) throw e;
    throw new LLMError(e.message || "Network error", 502);
  } finally {
    clearTimeout(timer);
  }
}

export async function chat(cfg, messages, { json = true, timeoutMs = 14000 } = {}) {
  if (!cfg.enabled) throw new LLMError("AI is not configured", 503);
  const started = Date.now();
  let lastErr;
  for (const model of cfg.models) {
    const budget = timeoutMs - (Date.now() - started);
    if (budget < 1500) break;
    // Try with JSON mode + low reasoning first; if the provider rejects a parameter, retry plain.
    for (const variant of [{ json, extras: true }, { json: false, extras: false }]) {
      try {
        const content = await once(cfg, model, messages, { ...variant, timeoutMs: Math.min(budget, 12000) });
        return { content, model };
      } catch (e) {
        lastErr = e;
        if (e.status === 400 && variant.extras) continue; // parameter not supported: retry plain
        break; // other errors: move to next model
      }
    }
    if (lastErr?.status === 401 || lastErr?.status === 403) break; // bad key: no point trying others
  }
  throw lastErr || new LLMError("No model available", 503);
}

export function parseJSON(content) {
  if (!content) return null;
  const cleaned = String(content).replace(/```(?:json)?/gi, "").trim();
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* ignore */ }
  }
  return null;
}

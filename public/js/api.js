// api.js — talks to /api/chat. Every call resolves to null on any problem,
// so the caller can fall back to the built-in engine without an error screen.

export const AI = { ready: false, model: null, provider: null, checked: false };

async function request(method, body, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch("/api/chat", {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal
    });
    if (!r.ok) return null;
    const type = r.headers.get("content-type") || "";
    if (!type.includes("application/json")) return null; // static hosting returns index.html
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function checkAI() {
  const data = await request("GET", null, 4000);
  AI.checked = true;
  AI.ready = Boolean(data?.ai);
  AI.model = data?.model || null;
  AI.provider = data?.provider || null;
  return AI;
}

function markDown(data) {
  // If the server says AI failed (rate limit, bad key), stop asking for a while.
  if (data?.fallback && ["bad_key", "AI not configured"].includes(data.reason)) AI.ready = false;
}

export async function askSupport(message, history) {
  if (!AI.ready) return null;
  const data = await request("POST", { mode: "support", message, history }, 11000);
  if (!data || data.fallback || !data.reply) { markDown(data); return null; }
  return data;
}

export async function askDirector({ storyboard, message, history, task }) {
  if (!AI.ready) return null;
  const data = await request("POST", { mode: "director", storyboard, message, history, task }, task === "polish" ? 24000 : 17000);
  if (!data || data.fallback) { markDown(data); return null; }
  return { reply: data.reply || "", ops: Array.isArray(data.ops) ? data.ops : [], model: data.model };
}

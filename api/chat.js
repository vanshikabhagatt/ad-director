// /api/chat — one endpoint for both assistants.
//   GET                      -> { ai, provider, model }   (never exposes the key)
//   POST { mode: "support" } -> { reply, source, handoff }
//   POST { mode: "director"} -> { reply, ops }
// If AI isn't configured or fails, it returns { fallback: true } and the browser
// uses its built-in engine, so the app never breaks.

import { llmConfig, chat, parseJSON } from "./_lib/llm.js";
import { kbAsText } from "../public/js/support.js";
import { TEMPLATES, TONES, PLATFORMS } from "../public/js/data.js";

const KB_TEXT = kbAsText();
const TEMPLATE_LIST = TEMPLATES.map((t) => `${t.id} (${t.name}; variations: ${t.variations.map((v) => v.id).join(", ")})`).join("\n");

const hits = new Map();
function limited(ip, max = 40, windowMs = 60_000) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

const str = (v, max) => String(v ?? "").replace(/[\u0000-\u0008\u000b-\u001f]/g, " ").slice(0, max);
const plain = (v, max) => str(v, max * 2).replace(/<[^>]*>/g, "").slice(0, max);

function history(h) {
  if (!Array.isArray(h)) return [];
  return h.slice(-8)
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: str(m.content, 600) }));
}

const SUPPORT_SYSTEM = `You are the help assistant on HexCoded's website. HexCoded is an AI creative studio.
Answer ONLY using the knowledge base below. If the answer is not in it, say you don't have that information and point to https://hexcoded.ai/contact. Never invent prices, plan limits, dates or features.
Keep replies to 1-3 short sentences, plain text, no markdown. Match the user's language (reply in Hinglish if they write Hinglish).
If the user wants creative help making an ad (hooks, script, ideas, storyboard), set handoff to true.
Respond with JSON only: {"reply": string, "source": string (a URL from the knowledge base or ""), "handoff": boolean}

KNOWLEDGE BASE
${KB_TEXT}`;

const DIRECTOR_SYSTEM = `You are HexCoded Director, the ad-planning assistant inside HexCoded (an AI creative studio with 30+ video/image models, 1,000+ licensed actors and 70+ languages).
You edit a short-form video ad storyboard that the user can see. You never rewrite the whole JSON; you send small edit operations.

Respond with JSON only: {"reply": string, "ops": array}
- reply: 1-3 sentences, plain text, no markdown, say what you changed and why it helps.
- ops: zero or more of:
  {"op":"set_scene","index":N,"fields":{"line"?:string,"visual"?:string,"onScreen"?:string,"camera"?:string}}
  {"op":"set_hooks","hooks":[5 strings]}
  {"op":"set_meta","fields":{"tone"?:one of ${TONES.join("|")},"platform"?:one of ${PLATFORMS.join("|")},"duration"?:15|30|45|60,"product"?:string,"audience"?:string,"offer"?:string,"benefit"?:string,"problem"?:string,"language"?:string}}
  {"op":"rebuild","templateId":string,"variationId"?:string}
  {"op":"remove_scene","index":N}

Rules:
- Scene "index" is 0-based. Users count from 1, so "scene 2" is index 1.
- Only change what the user asked for. If they name one scene, only edit that scene.
- A spoken line must not exceed its scene's "maxWords". Hooks must be 9 words or fewer and work in under 3 seconds.
- Write lines and hooks in the storyboard's "language". Hinglish means Hindi words in Latin script.
- Be specific to the product, audience, benefit and problem. Avoid generic filler.
- Never invent statistics, ratings, awards, prices, or medical, financial or legal claims.
- Keep the product name exactly as given. No other brand names.
- Visuals describe what the camera sees in one sentence. No text overlays inside "visual".
- For questions (not edits), answer in reply and return "ops": [].
- Templates you can switch to (rebuild):
${TEMPLATE_LIST}`;

const POLISH_TASK = "Polish this storyboard for the product and audience: rewrite every spoken line (keep empty lines empty) and write 5 fresh, specific hooks. Use set_scene for each scene with a line and one set_hooks. Keep each scene's purpose. Reply in one sentence.";

function validOps(ops, sceneCount) {
  if (!Array.isArray(ops)) return [];
  const allowed = new Set(["set_scene", "set_hooks", "set_meta", "rebuild", "remove_scene", "retake", "new_hooks", "use_hook"]);
  return ops.filter((o) => o && allowed.has(o.op)).slice(0, 20).filter((o) => {
    if ("index" in o) return Number.isInteger(o.index) && o.index >= 0 && o.index < sceneCount;
    if (o.op === "rebuild") return TEMPLATES.some((t) => t.id === o.templateId);
    return true;
  });
}

export async function handle(method, body, { env = process.env, ip = "local" } = {}) {
  const cfg = llmConfig(env);
  if (method === "GET") {
    return { status: 200, json: { ai: cfg.enabled, provider: cfg.enabled ? cfg.provider : null, model: cfg.enabled ? cfg.models[0] : null } };
  }
  if (method !== "POST") return { status: 405, json: { error: "Use GET or POST" } };
  if (limited(ip)) return { status: 429, json: { error: "Too many requests. Wait a minute and try again.", fallback: true } };
  if (!cfg.enabled) return { status: 200, json: { fallback: true, reason: "AI not configured" } };

  let b = body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = null; } }
  if (!b || typeof b !== "object") return { status: 400, json: { error: "Send a JSON body" } };

  const mode = b.mode;
  const message = str(b.message, 1200).trim();

  try {
    if (mode === "support") {
      if (!message) return { status: 400, json: { error: "message is required" } };
      const { content, model } = await chat(cfg, [
        { role: "system", content: SUPPORT_SYSTEM },
        ...history(b.history),
        { role: "user", content: message }
      ], { timeoutMs: 9000 });
      const out = parseJSON(content);
      const reply = plain(out?.reply ?? (out ? "" : content), 700).trim();
      if (!reply) return { status: 200, json: { fallback: true, reason: "empty" } };
      const source = typeof out?.source === "string" && /^https:\/\/(actors\.)?hexcoded\.ai/.test(out.source) ? out.source : "";
      return { status: 200, json: { reply, source, handoff: Boolean(out?.handoff), model } };
    }

    if (mode === "director") {
      const sb = b.storyboard;
      if (!sb || !Array.isArray(sb.scenes)) return { status: 400, json: { error: "storyboard is required" } };
      const task = b.task === "polish" ? POLISH_TASK : message;
      if (!task) return { status: 400, json: { error: "message is required" } };
      const board = JSON.stringify(sb).slice(0, 9000);
      const { content, model } = await chat(cfg, [
        { role: "system", content: DIRECTOR_SYSTEM },
        ...history(b.history),
        { role: "user", content: `CURRENT STORYBOARD:\n${board}\n\nREQUEST: ${task}` }
      ], { timeoutMs: b.task === "polish" ? 20000 : 14000 });
      const out = parseJSON(content);
      if (!out) return { status: 200, json: { fallback: true, reason: "unparseable" } };
      const ops = validOps(out.ops, sb.scenes.length);
      const reply = plain(out.reply, 500).trim() || (ops.length ? "Done." : "");
      return { status: 200, json: { reply, ops, model } };
    }

    return { status: 400, json: { error: "mode must be support or director" } };
  } catch (e) {
    return { status: 200, json: { fallback: true, reason: e.status === 429 ? "rate_limited" : e.status === 401 ? "bad_key" : "ai_unavailable" } };
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
  const { status, json } = await handle(req.method, req.body, { ip });
  res.status(status).json(json);
}

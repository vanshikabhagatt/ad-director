// director.js — builds and edits a shot-by-shot ad plan. Deterministic and offline.
// The AI layer (api/chat.js) only sends small "ops" that are applied here, so
// the storyboard structure can never be broken by a bad model response.

import { TEMPLATES, LINES, HOOKS, HOOK_COMPANIONS, TONE_FAMILY, SHOT_MODELS, CREDIT_RATES, PLATFORM_SPECS, LABELS, TONES, PLATFORMS, HEX_TOOLS } from "./data.js";
import { parseBrief, rankVariations, recommend } from "./recommender.js";

export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function fill(str, ctx) {
  return String(str || "")
    .replace(/\{(\w+)\}/g, (_, k) => (ctx[k] !== undefined && ctx[k] !== "" ? ctx[k] : `[${k}]`))
    .replace(/\s+([.,!?])/g, "$1")
    .replace(/^([a-z])/, (m) => m.toUpperCase());
}

function ctxOf(sb) {
  const benefitVerb = String(sb.benefit || "").replace(/^(a|an|the)\s+/i, "");
  return {
    product: sb.product,
    audience: sb.audience,
    benefit: sb.benefit,
    benefitVerb: `get ${benefitVerb}`,
    problem: sb.problem,
    setting: sb.setting,
    offer: sb.offer || "a limited-time offer",
    cta: sb.cta
  };
}

function ctaFor(sb) {
  const o = sb.objective;
  if (sb.offer && (o === "sales" || sb.festive)) return `Grab ${sb.offer} today.`;
  if (o === "leads") return "Sign up free — link below.";
  if (o === "launch") return `Be first to try ${sb.product}.`;
  if (o === "trust") return `See why people love ${sb.product}.`;
  if (o === "awareness") return `Follow for more from ${sb.product}.`;
  return `Shop ${sb.product} now.`;
}

function pickLine(purpose, tone, seed) {
  const fam = TONE_FAMILY[tone] || "friendly";
  const pool = LINES[purpose]?.[fam] || LINES[purpose]?.friendly || [""];
  return pool[Math.abs(seed) % pool.length];
}

function selectBeats(tpl, duration) {
  const beats = tpl.beats.map((b, i) => ({ ...b, idx: i }));
  const target = duration <= 15 ? 4 : duration <= 30 ? 5 : beats.length;
  // Drop the least important beats first; the hook and the call to action always stay.
  while (beats.length > target) {
    const removable = beats.filter((b) => b.p !== "hook" && b.p !== "cta");
    const pool = removable.some((b) => !b.core) ? removable.filter((b) => !b.core) : removable;
    if (!pool.length) break;
    const drop = pool.reduce((a, b) => (b.s < a.s ? b : a));
    beats.splice(beats.indexOf(drop), 1);
  }
  return beats;
}

const words = (t) => (t ? String(t).trim().split(/\s+/).length : 0);
// Fast creator pace is about 3 words a second; allow a little headroom.
export const maxWords = (sec) => Math.max(6, Math.floor(sec * 3.3));

function timeScenes(scenes, duration, hookMax = 3) {
  // The hook is capped to what the platform allows; the rest share the remaining time.
  let hookLen = 0;
  if (scenes.length > 1 && scenes[0].purpose === "hook") {
    const all = scenes.reduce((a, s) => a + s.share, 0) || 1;
    const wanted = Math.max(Math.round((scenes[0].share / all) * duration), Math.ceil(words(scenes[0].line) / 3.3));
    hookLen = Math.max(2, Math.min(hookMax, wanted));
  }
  const rest = hookLen ? scenes.slice(1) : scenes;
  const total = rest.reduce((a, s) => a + s.share, 0) || 1;
  const remaining = duration - hookLen;
  let t = 0;
  scenes.forEach((s, i) => {
    const len = hookLen && i === 0 ? hookLen
      : i === scenes.length - 1 ? duration - t
      : Math.max(2, Math.round((s.share / total) * remaining));
    s.start = t;
    s.end = Math.min(duration, t + len);
    t = s.end;
  });
  if (scenes.length) scenes[scenes.length - 1].end = duration;
  return scenes;
}

export function tc(sec) {
  const s = Math.max(0, Math.round(sec));
  return `0:${String(s).padStart(2, "0")}`;
}

function modelFor(shot, variation) {
  if (variation?.pace === "slow" && shot !== "actor") return SHOT_MODELS.cinematic;
  return SHOT_MODELS[shot] || SHOT_MODELS.mixed;
}

export function buildPrompt(scene, sb) {
  const tpl = getTemplate(sb.templateId);
  const variation = tpl.variations.find((v) => v.id === sb.variationId) || tpl.variations[0];
  const aspect = PLATFORM_SPECS[sb.platform]?.aspect || "9:16";
  const who = scene.shot === "product" || scene.shot === "cinematic" ? "No people on screen; hands only if needed." : `${tpl.actor}, natural expression, believable performance.`;
  const speech = scene.line && scene.shot !== "product" && scene.shot !== "cinematic" ? ` Spoken line (${sb.language}): "${scene.line}"` : "";
  return `${aspect} ${LABELS.tone[sb.tone]?.toLowerCase() || ""} ad shot. ${scene.visual}. ${who} Camera: ${scene.camera}. Look: ${variation.look}. Product: ${sb.product}, clearly visible, label facing camera. ${Math.max(1, scene.end - scene.start)} seconds.${speech} No extra logos or on-screen text.`.replace(/\s+/g, " ").trim();
}

export function makeHooks(sb, seed = 0) {
  const tpl = getTemplate(sb.templateId);
  const variation = tpl.variations.find((v) => v.id === sb.variationId) || tpl.variations[0];
  const ctx = ctxOf(sb);
  const order = [variation.hook, ...(HOOK_COMPANIONS[sb.objective] || ["pov", "curiosity", "problem"])];
  if (sb.tone === "funny") order.unshift("funny");
  if (sb.festive) order.splice(1, 0, "festive");
  if (!sb.offer) { const i = order.indexOf("offer"); if (i > -1) order.splice(i, 1); }
  const out = [];
  const seen = new Set();
  let round = 0;
  while (out.length < 5 && round < 6) {
    for (const style of order) {
      const pool = HOOKS[style] || [];
      if (!pool.length) continue;
      const line = fill(pool[(seed + round) % pool.length], ctx);
      if (!seen.has(line) && !/\[\w+\]/.test(line)) { seen.add(line); out.push(line); }
      if (out.length >= 5) break;
    }
    round++;
  }
  return [...out.filter((h) => words(h) <= maxWords(3)), ...out.filter((h) => words(h) > maxWords(3))];
}

function makeScene(beat, sb, seed) {
  const tpl = getTemplate(sb.templateId);
  const variation = tpl.variations.find((v) => v.id === sb.variationId) || tpl.variations[0];
  const ctx = ctxOf(sb);
  const tone = sb.tone;
  const line = beat.p === "hook" ? (sb.hooks?.[0] || "") : fill(pickLine(beat.p, tone, seed), ctx);
  const m = modelFor(beat.shot, variation);
  return {
    id: `s${beat.idx}-${Math.random().toString(36).slice(2, 7)}`,
    beat: beat.idx,
    purpose: beat.p,
    shot: beat.shot,
    share: beat.s,
    visual: fill(beat.v, ctx),
    camera: beat.cam,
    onScreen: beat.p === "hook" ? "" : fill(beat.t, ctx).replace(/^\[\w+\]$/, ""),
    line: variation.hook === "asmr" && beat.p !== "cta" ? "" : line,
    tone,
    model: m.model,
    modelWhy: m.why,
    seed,
    changed: false
  };
}

export function recompute(sb) {
  sb.cta = ctaFor(sb);
  timeScenes(sb.scenes, sb.duration, (PLATFORM_SPECS[sb.platform]?.maxHookSec || 2) + 1);
  const tpl = getTemplate(sb.templateId);
  sb.aspect = PLATFORM_SPECS[sb.platform]?.aspect || "9:16";
  sb.tool = { name: tpl.tool, why: HEX_TOOLS[tpl.tool] };
  sb.scenes.forEach((s) => {
    if (s.purpose === "cta" && !s.userLine) s.line = fill(pickLine("cta", s.tone || sb.tone, s.seed), ctxOf(sb));
    // Swap an auto-written line that can't be said in its slot for one that can.
    if (!s.userLine && s.line && s.purpose !== "hook" && words(s.line) > maxWords(s.end - s.start)) {
      for (let k = 1; k <= 8; k++) {
        const alt = fill(pickLine(s.purpose, s.tone || sb.tone, s.seed + k), ctxOf(sb));
        if (alt && words(alt) <= maxWords(s.end - s.start)) { s.line = alt; break; }
      }
    }
    if (s.purpose === "cta" || s.purpose === "offer") s.onScreen = fill(s.purpose === "cta" ? "{cta}" : "{offer}", ctxOf(sb));
    s.prompt = buildPrompt(s, sb);
  });
  sb.credits = estimateCredits(sb);
  sb.checks = qualityChecks(sb);
  return sb;
}

export function estimateCredits(sb, quality = sb.quality || "hd") {
  const clips = sb.scenes.reduce((n, s) => n + Math.max(1, Math.ceil((s.end - s.start) / 5)), 0);
  const rate = CREDIT_RATES[quality] || CREDIT_RATES.hd;
  const frames = sb.scenes.length * CREDIT_RATES.still;
  return {
    clips,
    quality: rate.label,
    final: clips * rate.perClip,
    draft: clips * CREDIT_RATES.draft.perClip,
    frames,
    note: "Rough estimate from HexCoded's public pricing. HexCoded shows the exact cost before you render, and failed renders are free."
  };
}

export function qualityChecks(sb) {
  const checks = [];
  const spec = PLATFORM_SPECS[sb.platform] || { maxHookSec: 3 };
  const hook = sb.scenes[0];
  checks.push(hook && hook.end - hook.start <= spec.maxHookSec + 1
    ? { ok: true, text: `Hook lands in the first ${hook.end - hook.start}s` }
    : { ok: false, text: `Hook runs ${hook ? hook.end - hook.start : "?"}s; aim for ${spec.maxHookSec}s or less on ${LABELS.platform[sb.platform] || "this platform"}` });
  checks.push(sb.product && sb.product !== "your product"
    ? { ok: true, text: "Product is named" }
    : { ok: false, text: "Add your product name so prompts and lines are specific" });
  checks.push(sb.audienceKnown ? { ok: true, text: `Written for ${sb.audience}` } : { ok: false, text: "No audience given; lines are generic. Try \"for college students\"" });
  checks.push(sb.scenes.some((s) => s.purpose === "cta") ? { ok: true, text: "Ends on a clear call to action" } : { ok: false, text: "No call-to-action scene" });
  const claims = sb.scenes.some((s) => /\b(proven|clinically|guaranteed|#1|best in)\b/i.test(`${s.line} ${s.onScreen}`));
  checks.push(claims ? { ok: false, text: "A line makes a claim you'll need proof for" } : { ok: true, text: "No unsupported claims" });
  const longLine = sb.scenes.find((s) => s.line && words(s.line) > maxWords(s.end - s.start));
  checks.push(longLine ? { ok: false, text: `Scene ${sb.scenes.indexOf(longLine) + 1} line is long for ${longLine.end - longLine.start}s` } : { ok: true, text: "Lines fit their scene length" });
  return checks;
}

export function buildStoryboard(input, opts = {}) {
  const brief = input.raw !== undefined && input.detected ? input : parseBrief(input);
  const templateId = opts.templateId || recommend(brief, { limit: 1 })[0].template.id;
  const tpl = getTemplate(templateId);
  const ranked = rankVariations(tpl, brief);
  const variation = tpl.variations.find((v) => v.id === opts.variationId) || ranked[0];
  const duration = opts.duration || (tpl.durations.includes(brief.duration) ? brief.duration : tpl.durations.reduce((a, b) => (Math.abs(b - brief.duration) < Math.abs(a - brief.duration) ? b : a)));

  const sb = {
    version: 1,
    ...brief,
    templateId: tpl.id,
    variationId: variation.id,
    tone: opts.tone || brief.tone || variation.tone,
    objective: brief.objective || "awareness",
    platform: brief.platform || "reels",
    duration,
    quality: "hd",
    hookSeed: 0,
    scenes: []
  };
  sb.cta = ctaFor(sb);
  sb.hooks = makeHooks(sb, 0);
  sb.scenes = selectBeats(tpl, duration).map((b, i) => makeScene(b, sb, i));
  if (tpl.id === "festive-offer" && !sb.offer) sb.offer = "festive offers live now";
  return recompute(sb);
}

/* ------------------------------------------------------------------ */
/* Ops: the only way anything (UI buttons, offline intents, the LLM)   */
/* changes a storyboard.                                               */
/* ------------------------------------------------------------------ */

const TEXT_FIELDS = ["line", "visual", "onScreen", "camera"];
const clean = (v, max = 220) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

export function applyOps(sbIn, ops = []) {
  let sb = structuredClone(sbIn);
  sb.scenes.forEach((s) => { s.changed = false; });
  sb.hooksChanged = false;
  const log = [];
  for (const op of Array.isArray(ops) ? ops.slice(0, 20) : []) {
    try {
      const res = applyOne(sb, op);
      if (res?.sb) sb = res.sb;
      if (res?.log) log.push(res.log);
    } catch { /* ignore one bad op, keep the rest */ }
  }
  recompute(sb);
  return { sb, log };
}

function sceneIndex(sb, i) {
  if (typeof i !== "number" || !Number.isInteger(i) || i < 0 || i >= sb.scenes.length) return -1;
  return i;
}

function applyOne(sb, op) {
  switch (op?.op) {
    case "set_scene": {
      const i = sceneIndex(sb, op.index);
      if (i < 0 || !op.fields) return null;
      const s = sb.scenes[i];
      for (const f of TEXT_FIELDS) {
        if (typeof op.fields[f] === "string" && op.fields[f].trim()) { s[f] = clean(op.fields[f], f === "line" ? 160 : 220); if (f === "line") s.userLine = true; }
      }
      if (TONES.includes(op.fields.tone)) s.tone = op.fields.tone;
      s.changed = true;
      return { log: `Updated scene ${i + 1}` };
    }
    case "retake": {
      const i = sceneIndex(sb, op.index);
      if (i < 0) return null;
      const s = sb.scenes[i];
      const tone = TONES.includes(op.tone) ? op.tone : s.tone || sb.tone;
      s.tone = tone;
      s.seed = (s.seed || 0) + 1;
      if (s.purpose === "hook") {
        sb.hookSeed = (sb.hookSeed || 0) + 1;
        const tmp = { ...sb, tone };
        const hooks = makeHooks(tmp, sb.hookSeed);
        s.line = hooks.find((h) => h !== s.line) || hooks[0];
      } else {
        let line = fill(pickLine(s.purpose, tone, s.seed), ctxOf(sb));
        if (line === s.line) line = fill(pickLine(s.purpose, tone, s.seed + 1), ctxOf(sb));
        s.line = line;
      }
      s.userLine = false;
      s.changed = true;
      return { log: `Retook scene ${i + 1}${op.tone ? ` as ${tone}` : ""}` };
    }
    case "remove_scene": {
      const i = sceneIndex(sb, op.index);
      if (i < 0 || sb.scenes.length <= 2) return null;
      if (sb.scenes[i].purpose === "cta") return { log: "Kept the call-to-action scene; every ad needs one" };
      sb.scenes.splice(i, 1);
      return { log: `Removed scene ${i + 1}` };
    }
    case "set_hooks": {
      const hooks = (op.hooks || []).map((h) => clean(h, 140)).filter(Boolean).slice(0, 5);
      if (!hooks.length) return null;
      sb.hooks = hooks;
      sb.hooksChanged = true;
      return { log: "Wrote new hooks" };
    }
    case "new_hooks": {
      sb.hookSeed = (sb.hookSeed || 0) + 1;
      sb.hooks = makeHooks(sb, sb.hookSeed);
      sb.hooksChanged = true;
      return { log: "Wrote new hooks" };
    }
    case "use_hook": {
      const h = sb.hooks[Number(op.index)];
      if (!h || !sb.scenes[0]) return null;
      sb.scenes[0].line = h;
      sb.scenes[0].changed = true;
      return { log: "Swapped the opening line" };
    }
    case "set_meta": {
      const f = op.fields || {};
      const rebuild = {};
      const done = [];
      if (TONES.includes(f.tone) && f.tone !== sb.tone) {
        done.push(`Made the whole ad ${LABELS.tone[f.tone] ? LABELS.tone[f.tone].toLowerCase() : f.tone}: new lines and hooks`);
        sb.tone = f.tone;
        sb.scenes.forEach((s) => {
          s.tone = f.tone;
          if (s.purpose !== "hook") { s.line = fill(pickLine(s.purpose, f.tone, s.seed), ctxOf(sb)); s.userLine = false; }
          s.changed = true;
        });
        sb.hooks = makeHooks(sb, sb.hookSeed || 0);
        if (sb.scenes[0]?.purpose === "hook") sb.scenes[0].line = sb.hooks[0];
        sb.hooksChanged = true;
      }
      if (PLATFORMS.includes(f.platform) && f.platform !== sb.platform) {
        sb.platform = f.platform;
        const spec = PLATFORM_SPECS[f.platform] || {};
        done.push(`Set for ${LABELS.platform[f.platform] || f.platform}${spec.aspect ? ` (${spec.aspect})` : ""}; prompts now use that frame`);
      }
      if ([15, 30, 45, 60].includes(Number(f.duration)) && Number(f.duration) !== sb.duration) rebuild.duration = Number(f.duration);
      if (typeof f.product === "string" && f.product.trim()) { sb.product = clean(f.product, 60); rebuild.text = true; }
      if (typeof f.audience === "string" && f.audience.trim()) { sb.audience = clean(f.audience, 60); sb.audienceKnown = true; rebuild.text = true; }
      if (typeof f.offer === "string" && clean(f.offer, 60) !== (sb.offer || "")) {
        sb.offer = clean(f.offer, 60);
        if (sb.offer && !sb.objective) sb.objective = "sales";
        done.push(sb.offer ? `Added the offer: ${sb.offer}` : "Removed the offer");
      }
      if (typeof f.benefit === "string" && f.benefit.trim()) { sb.benefit = clean(f.benefit, 80); rebuild.text = true; }
      if (typeof f.problem === "string" && f.problem.trim()) { sb.problem = clean(f.problem, 80); rebuild.text = true; }
      if (typeof f.language === "string" && f.language.trim()) sb.language = clean(f.language, 30);
      
      if (["awareness", "sales", "launch", "trust", "leads"].includes(f.objective)) sb.objective = f.objective;
      if (rebuild.duration || rebuild.text) {
        const next = rebuildFrom(sb, { duration: rebuild.duration || sb.duration });
        return { sb: next, log: [...done, rebuild.duration ? `Re-cut to ${next.duration}s` : "Rewrote the script for the new details"].join(". ") };
      }
      return done.length ? { log: done.join(". ") } : null;
    }
    case "rebuild": {
      const tpl = TEMPLATES.find((t) => t.id === op.templateId);
      if (!tpl) return null;
      const vId = tpl.variations.some((v) => v.id === op.variationId) ? op.variationId : undefined;
      const next = rebuildFrom(sb, { templateId: tpl.id, variationId: vId, keepTone: false });
      return { sb: next, log: `Switched to ${tpl.name}` };
    }
    default:
      return null;
  }
}

function rebuildFrom(sb, { templateId = sb.templateId, variationId, duration = sb.duration, keepTone = true } = {}) {
  const brief = { ...sb, detected: sb.detected || {} };
  const tpl = getTemplate(templateId);
  const d = tpl.durations.includes(duration) ? duration : tpl.durations.reduce((a, b) => (Math.abs(b - duration) < Math.abs(a - duration) ? b : a));
  const vId = variationId || (templateId === sb.templateId ? sb.variationId : undefined);
  const next = buildStoryboard(brief, { templateId, variationId: vId, duration: d, tone: keepTone ? sb.tone : undefined });
  next.quality = sb.quality;
  next.language = sb.language;
  next.offer = sb.offer;
  next.scenes.forEach((s) => { s.changed = true; });
  return recompute(next);
}

/* ------------------------------------------------------------------ */
/* Offline chat intents                                                */
/* ------------------------------------------------------------------ */

const TEMPLATE_ALIASES = {
  "ugc-review": /\bugc\b|creator review|\bskit\b/,
  unboxing: /unbox/,
  "try-on": /try[- ]?on|fit check|outfit/,
  "product-demo": /\bdemo\b|tutorial|how[- ]to/,
  "problem-solution": /problem[- ](to[- ])?solution|before (and|&) after|pain point/,
  testimonial: /testimonial|customer stor|review montage/,
  cinematic: /cinematic|brand film/,
  "founder-story": /founder/,
  asmr: /\basmr\b|sensory/,
  "festive-offer": /festive|festival|diwali|sale ad/,
  comparison: /comparison|\bcompare\b|\bvs\.?\b|versus|us vs them/
};

const ORD = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7 };
const TONE_WORDS = {
  funny: /funn(y|ier)|humou?r|comed|witty|joke|meme/,
  premium: /premium|luxur|elegant|classy|high[- ]end|posh/,
  energetic: /energ|hype|punch|exciting|pumped/,
  calm: /calm|soft|gentle|soothing|chill/,
  emotional: /emotional|heartfelt|touching|warm(er)?\b/,
  informative: /informative|clear(er)?|professional|explain/,
  bold: /bold|edgy|confident|aggressive/,
  friendly: /friendl|casual|relatable/
};

function findScenes(text, sb) {
  const out = new Set();
  for (const m of text.matchAll(/scenes?\s*#?\s*(\d+)(?:\s*(?:and|&|,)\s*(\d+))?/g)) {
    [m[1], m[2]].filter(Boolean).forEach((n) => out.add(Number(n) - 1));
  }
  for (const [w, n] of Object.entries(ORD)) if (new RegExp(`\\b${w}\\s+(scene|shot)`).test(text)) out.add(n - 1);
  if (/\b(last|final)\s+(scene|shot)|\b(ending|outro)\b|\bcta\b|call to action/.test(text)) out.add(sb.scenes.length - 1);
  if (/\b(opening|intro scene|first line)\b/.test(text) || /\bhook\b/.test(text) && !/hooks/.test(text)) out.add(0);
  return [...out].filter((i) => i >= 0 && i < sb.scenes.length);
}

export function interpret(message, sb) {
  const text = String(message || "").toLowerCase();
  const ops = [];
  let reply = "";
  let structural = false;

  if (/^(hi|hey|hello|yo|namaste)\b/.test(text) && text.length < 20) {
    return { ops, reply: "Hi! Tell me what you're selling, or ask me to change any scene: \"make scene 2 funnier\", \"cut it to 15 seconds\", \"switch to try-on\".", structural: true, handled: true };
  }
  if (/what can you do|^help\b|commands|how does this work/.test(text)) {
    return { ops, reply: helpText(), structural: true, handled: true };
  }
  if (!sb) return { ops, reply: "", structural: false, handled: false };

  // Structural edits: always handled locally, instantly.
  const dur = text.match(/\b(15|30|45|60)\s*(s|sec|secs|second|seconds)\b/);
  if (dur && Number(dur[1]) === sb.duration) { reply = `It's already ${sb.duration} seconds.`; structural = true; }
  else if (dur) {
    const tpl = getTemplate(sb.templateId);
    if (!tpl.durations.includes(Number(dur[1]))) reply = `${tpl.name} works best at ${tpl.durations.join(", ")}s, so I used the closest length.`;
    ops.push({ op: "set_meta", fields: { duration: Number(dur[1]) } }); structural = true;
  }
  else if (/\b(shorter|tighter|cut it down|trim)\b/.test(text) && !findScenes(text, sb).length) {
    const next = [15, 30, 45, 60].filter((d) => d < sb.duration).pop();
    if (next) { ops.push({ op: "set_meta", fields: { duration: next } }); structural = true; }
  } else if (/\b(longer|extend)\b/.test(text) && !findScenes(text, sb).length) {
    const next = [15, 30, 45, 60].find((d) => d > sb.duration);
    if (next) { ops.push({ op: "set_meta", fields: { duration: next } }); structural = true; }
  }

  for (const [key, words] of Object.entries({ reels: /reels|instagram/, shorts: /shorts/, tiktok: /tiktok/, youtube: /youtube(?! shorts)|16:9|landscape/, meta: /facebook|meta feed|1:1|square/, linkedin: /linkedin/, website: /website|landing page/ })) {
    if (/\b(for|on|to|switch|make it)\b/.test(text) && words.test(text)) { ops.push({ op: "set_meta", fields: { platform: key } }); structural = true; break; }
  }

  const wantsSwitch = /\b(switch|change|turn (it|this)|convert|make (it|this) (an?|into)|use (the|a|an)|try (the|a|an))\b/.test(text);
  const tplHit = wantsSwitch ? TEMPLATES.find((t) => TEMPLATE_ALIASES[t.id]?.test(text)) : null;
  if (tplHit && tplHit.id !== sb.templateId) {
    ops.push({ op: "rebuild", templateId: tplHit.id }); structural = true;
  }

  const offer = text.match(/(\d{1,2})\s*%\s*(off|discount)/) || text.match(/(?:₹|rs\.?\s?)(\d[\d,]*)\s*off/);
  if (offer) { ops.push({ op: "set_meta", fields: { offer: offer[0].includes("%") ? `${offer[1]}% off` : `₹${offer[1]} off`, objective: "sales" } }); structural = true; }
  if (/remove (the )?offer|no offer/.test(text)) { ops.push({ op: "set_meta", fields: { offer: "" } }); structural = true; }

  const prod = message.match(/(?:product is called|product name is|rename (?:the )?product to|it'?s called|product is)\s+["']?([^"'.,!?]{2,40})/i);
  if (prod) { ops.push({ op: "set_meta", fields: { product: prod[1].trim() } }); structural = true; }
  const aud = message.match(/(?:audience is|target(?:ing)?|make it for|aimed at)\s+([^.,!?]{3,40})/i);
  if (aud && !/reels|shorts|tiktok|youtube|linkedin|website|\d|second|scene|funn|premium|short|long/i.test(aud[1])) { ops.push({ op: "set_meta", fields: { audience: aud[1].trim() } }); structural = true; }

  const lang = text.match(/\b(in|to)\s+(hindi|hinglish|tamil|telugu|bengali|marathi|kannada|spanish|french|german|arabic|japanese|korean)\b/);
  if (lang) { ops.push({ op: "set_meta", fields: { language: cap(lang[2]) } }); structural = true; reply = `Voiceover language set to ${cap(lang[2])}. It's in every shot prompt now.`; }

  
  const rm = text.match(/(remove|delete|drop|cut)\s+(scene\s*\d+|the\s+\w+\s+scene)/);
  if (rm) { findScenes(text, sb).forEach((i) => ops.push({ op: "remove_scene", index: i })); structural = true; }

  const useHook = text.match(/use hook\s*#?\s*(\d)/);
  if (useHook) { ops.push({ op: "use_hook", index: Number(useHook[1]) - 1 }); structural = true; }

  
  if (/which model|what model|models?\b.*(use|best)/.test(text) && !ops.length) {
    const byModel = {};
    sb.scenes.forEach((s, i) => { (byModel[s.model] ||= { why: s.modelWhy, list: [] }).list.push(i + 1); });
    const lines = Object.entries(byModel).map(([m, v]) => `${m} for scene${v.list.length > 1 ? "s" : ""} ${v.list.join(", ")} (${v.why})`);
    return { ops, structural: true, handled: true, reply: `My picks: ${lines.join("; ")}. Tip: draft everything on Seedance 2 Fast first, then re-render only the keepers.` };
  }
  if (/which tool|what tool|where do i make|how do i make this/.test(text) && !ops.length) {
    return { ops, structural: true, handled: true, reply: `Build this in ${sb.tool.name}. ${sb.tool.why}` };
  }

  // Creative edits: the AI does these better, but we can do them offline too.
  const targets = findScenes(text, sb);
  let tone = null;
  for (const [t, re] of Object.entries(TONE_WORDS)) if (re.test(text)) { tone = t; break; }

  if (/\b(new|more|different|other|fresh|better)\s+hooks?\b|rewrite (the )?hooks|hooks? again/.test(text)) {
    ops.push({ op: "new_hooks" });
  }
  if (targets.length && (tone || /retake|redo|regenerate|rewrite|different|another|change|better|improve/.test(text))) {
    targets.forEach((i) => ops.push({ op: "retake", index: i, tone: tone || undefined }));
  } else if (tone && !targets.length) {
    ops.push({ op: "set_meta", fields: { tone } });
  }

  return { ops, reply, structural, handled: ops.length > 0 || (structural && Boolean(reply)) };
}

const fmt = (n) => Number(n).toLocaleString("en-IN");

export function helpText() {
  return "Try things like: \"make scene 2 funnier\", \"retake the hook\", \"new hooks\", \"use hook 3\", \"cut it to 15 seconds\", \"switch to unboxing\", \"for YouTube\", \"add 20% off\", \"target new moms\", \"in Hindi\", \"remove scene 3\", \"which model?\"";
}

export function describeBoard(sb) {
  const tpl = getTemplate(sb.templateId);
  const v = tpl.variations.find((x) => x.id === sb.variationId);
  return `${tpl.name} · ${v?.name}. ${sb.scenes.length} scenes, ${sb.duration}s, ${LABELS.platform[sb.platform]} (${sb.aspect}). Build it in ${sb.tool.name}.`;
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

export function toMarkdown(sb) {
  const tpl = getTemplate(sb.templateId);
  const v = tpl.variations.find((x) => x.id === sb.variationId);
  const rows = sb.scenes.map((s, i) => `### Scene ${i + 1} · ${tc(s.start)}–${tc(s.end)} · ${cap(s.purpose)}\n- **Visual:** ${s.visual}\n- **Line:** ${s.line || "(no dialogue)"}\n- **On screen:** ${s.onScreen || "—"}\n- **Camera:** ${s.camera}\n- **Model:** ${s.model}\n- **Prompt:** ${s.prompt}\n`).join("\n");
  return `# ${sb.product} — ad plan\n\n**Template:** ${tpl.name} / ${v?.name}  \n**Platform:** ${LABELS.platform[sb.platform]} (${sb.aspect}) · ${sb.duration}s  \n**Tone:** ${LABELS.tone[sb.tone]} · **Goal:** ${LABELS.objective[sb.objective]}  \n**Audience:** ${sb.audience}  \n**Voiceover:** ${sb.language}  \n**Build in HexCoded:** ${sb.tool.name}\n\n## Hooks\n${sb.hooks.map((h, i) => `${i + 1}. ${h}`).join("\n")}\n\n## Storyboard\n${rows}\n`;
}

export function compactForAI(sb) {
  return {
    product: sb.product, audience: sb.audience, benefit: sb.benefit, problem: sb.problem, offer: sb.offer,
    template: getTemplate(sb.templateId).name, variation: sb.variationId, tone: sb.tone, objective: sb.objective,
    platform: sb.platform, duration: sb.duration, language: sb.language, hooks: sb.hooks,
    scenes: sb.scenes.map((s, i) => ({ index: i, time: `${s.start}-${s.end}s`, maxWords: maxWords(s.end - s.start), purpose: s.purpose, shot: s.shot, visual: s.visual, line: s.line, onScreen: s.onScreen, camera: s.camera }))
  };
}

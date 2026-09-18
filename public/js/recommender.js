// recommender.js — turns a free-text brief into signals, then ranks templates.
// Improvements over the original rule-based scorer:
//  1. Understands free text (no need to pick every dropdown).
//  2. Weighted affinity scores instead of hard if/else, so every template gets a fair score.
//  3. Explains each match in plain words.
//  4. Diversity: avoids recommending three near-identical formats.
//  5. Learns lightly from what this user picks (stored in the browser).

import { TEMPLATES, LEXICON, CATEGORY_DEFAULTS, TONE_FAMILY, PLATFORM_SPECS, LABELS } from "./data.js";

const WEIGHTS = { category: 0.34, objective: 0.24, platform: 0.16, tone: 0.2, duration: 0.06 };

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function countHits(text, words) {
  let hits = 0;
  for (const w of words) {
    // Word-ish boundary so "app" doesn't match "happy", but "creditcard" style phrases still match.
    const re = new RegExp(`(^|[^a-z])${escapeRe(w)}`, "i");
    if (re.test(text)) hits += w.includes(" ") ? 2 : 1;
  }
  return hits;
}

function bestKey(text, table) {
  let best = null; let bestHits = 0;
  for (const [key, words] of Object.entries(table)) {
    const h = countHits(text, words);
    if (h > bestHits) { best = key; bestHits = h; }
  }
  return best;
}

function extractOffer(text) {
  const pct = text.match(/(\d{1,2})\s*%\s*off/i);
  if (pct) return `${pct[1]}% off`;
  const flat = text.match(/(?:flat\s*)?(?:₹|rs\.?|inr|\$)\s?(\d[\d,]*)\s*off/i);
  if (flat) return `${/\$/.test(flat[0]) ? "$" : "₹"}${flat[1]} off`;
  if (/buy\s*1\s*get\s*1|bogo/i.test(text)) return "buy 1 get 1 free";
  if (/free (shipping|delivery)/i.test(text)) return "free delivery";
  return "";
}

function extractAudience(raw) {
  const m = raw.match(/\b(?:for|targeting|aimed at|audience[:\s]+)\s+([a-z0-9 '\-]+?)(?=[,.;!?]|\s+(?:who|that|on|in|with|to|and want|during)\b|$)/i);
  if (!m) return "";
  let a = m[1].trim();
  // Skip "for Reels", "for Diwali", etc.
  const lower = a.toLowerCase();
  const skip = [...Object.values(LEXICON.platform).flat(), ...LEXICON.festive, "sale", "launch", "ads", "an ad", "a video"];
  if (skip.some((w) => lower === w || lower.startsWith(w + " "))) return "";
  if (a.split(" ").length > 6) a = a.split(" ").slice(0, 6).join(" ");
  return a;
}

function extractBenefit(raw) {
  const m = raw.match(/\b(?:helps?(?: you)?(?: to)?|so (?:that )?you can|gives you|keeps (?:you|your)|makes (?:it|your))\s+([^,.;!?]{4,60})/i);
  return m ? m[1].trim() : "";
}

function extractProblem(raw) {
  const m = raw.match(/\b(?:without|no more|tired of|struggl\w* with|fixes|solves|stops?)\s+([^,.;!?]{4,50})/i);
  return m ? m[1].trim() : "";
}

const REQUEST_PREFIX = /^(?:(?:hey|hi|hello)[,!\s]+)?(?:please\s+)?(?:(?:can|could|would) you\s+)?(?:please\s+)?(?:help me\s+)?(?:(?:write|make|create|plan|generate|draft|give me|i need|i want|need)\s+)?(?:me\s+)?(?:(?:an?|some|the)\s+)?(?:(?:video|short|funny|quick|new|good)\s+)*(?:(?:ads?|advert|script|hooks?|storyboard|ideas?|reels?|videos?|campaign|plan)\s+)*(?:(?:for|about)\s+)?(?:(?:my|our|a|an|the)\s+)?/i;

function guessProductName(raw) {
  const stripped = raw.replace(REQUEST_PREFIX, "");
  const first = (stripped || raw).split(/[.,:;\n!?]| for | that | which | to | with /i)[0].trim();
  const words = first.split(/\s+/).filter(Boolean).slice(0, 5);
  return words.join(" ");
}

export function parseBrief(input = {}) {
  const raw = String(input.description || "").trim();
  const text = norm(`${input.product || ""} ${raw}`);
  const category = input.category && input.category !== "auto" ? input.category : bestKey(text, LEXICON.category);
  const objective = input.objective && input.objective !== "auto" ? input.objective : (bestKey(text, LEXICON.objective) || "");
  const tone = input.tone && input.tone !== "auto" ? input.tone : (bestKey(text, LEXICON.tone) || "");
  const platform = input.platform && input.platform !== "auto" ? input.platform : (bestKey(text, LEXICON.platform) || "");
  const festive = LEXICON.festive.find((w) => text.includes(w)) || "";
  const sensory = LEXICON.sensory.some((w) => text.includes(w));
  const defaults = CATEGORY_DEFAULTS[category] || CATEGORY_DEFAULTS.general;
  const duration = Number(input.duration) || (platform === "youtube" || platform === "website" ? 30 : platform ? 15 : 30);
  let offer = extractOffer(text);
  if (!offer && festive) offer = "festive offers live now";

  const product = String(input.product || "").trim() || guessProductName(raw) || "your product";
  const audienceRaw = String(input.audience || "").trim() || extractAudience(raw);

  return {
    raw,
    product,
    audience: audienceRaw || "people like you",
    audienceKnown: Boolean(audienceRaw),
    category: category || "",
    objective,
    tone,
    platform,
    festive,
    sensory,
    offer,
    duration: [15, 30, 45, 60].includes(duration) ? duration : 30,
    benefit: extractBenefit(raw) || defaults.benefit,
    problem: extractProblem(raw) || defaults.problem,
    setting: defaults.setting,
    language: input.language || "English",
    detected: {
      category: Boolean(category) && !(input.category && input.category !== "auto"),
      objective: Boolean(objective) && !(input.objective && input.objective !== "auto"),
      tone: Boolean(tone) && !(input.tone && input.tone !== "auto"),
      platform: Boolean(platform) && !(input.platform && input.platform !== "auto")
    }
  };
}

/* ---------------- light personalisation (browser only) ---------------- */

const PREF_KEY = "hxd:prefs:v1";

export function loadPrefs() {
  try {
    if (typeof localStorage === "undefined") return {};
    return JSON.parse(localStorage.getItem(PREF_KEY) || "{}") || {};
  } catch { return {}; }
}

export function recordPick(templateId) {
  try {
    if (typeof localStorage === "undefined") return;
    const prefs = loadPrefs();
    prefs[templateId] = Math.min((prefs[templateId] || 0) + 1, 10);
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch { /* storage can be unavailable; personalisation is optional */ }
}

/* ---------------- scoring ---------------- */

function componentScore(tpl, key, value) {
  if (!value) return { v: 0.55, known: false }; // unknown signal: neutral
  const v = tpl.affinity[key]?.[value];
  return { v: typeof v === "number" ? v : 0.4, known: true };
}

function durationScore(tpl, duration) {
  if (tpl.durations.includes(duration)) return 1;
  const nearest = tpl.durations.reduce((a, b) => (Math.abs(b - duration) < Math.abs(a - duration) ? b : a));
  return Math.max(0, 1 - Math.abs(nearest - duration) / 45);
}

const REASON_TEXT = {
  category: (t, b) => `Works well for ${LABELS.category[b.category]?.toLowerCase() || "this category"}`,
  objective: (t, b) => `Built to ${LABELS.objective[b.objective]?.toLowerCase() || "hit your goal"}`,
  platform: (t, b) => `Fits ${LABELS.platform[b.platform] || "your platform"} (${PLATFORM_SPECS[b.platform]?.aspect || "any ratio"})`,
  tone: (t, b) => `Suits a ${b.tone} tone`,
  festive: (t, b) => `Made for ${String(b.festive).replace(/\b\w/g, (c) => c.toUpperCase())} campaigns`,
  sensory: () => "Leans into sound and texture",
  learned: () => "You've picked this format before"
};

export function scoreTemplate(tpl, brief, prefs = {}) {
  const parts = {
    category: componentScore(tpl, "category", brief.category),
    objective: componentScore(tpl, "objective", brief.objective),
    platform: componentScore(tpl, "platform", brief.platform),
    tone: componentScore(tpl, "tone", brief.tone)
  };
  let score = 0;
  for (const k of Object.keys(parts)) score += WEIGHTS[k] * parts[k].v;
  score += WEIGHTS.duration * durationScore(tpl, brief.duration);

  const bonus = [];
  if (brief.festive && tpl.festiveBoost) { score += tpl.festiveBoost; bonus.push("festive"); }
  if (brief.sensory && tpl.id === "asmr") { score += 0.15; bonus.push("sensory"); }
  if (brief.offer && brief.objective === "sales" && tpl.id === "festive-offer" && !brief.festive) score += 0.05;
  const picks = prefs[tpl.id] || 0;
  if (picks) { score += Math.min(0.06, picks * 0.015); bonus.push("learned"); }

  // Poor category fit is a strong negative signal (a cinematic film for a budgeting app is a stretch).
  if (parts.category.known && parts.category.v < 0.2) score -= 0.12;

  score = Math.max(0, Math.min(1, score));

  const reasons = Object.entries(parts)
    .filter(([, p]) => p.known && p.v >= 0.8)
    .sort((a, b) => WEIGHTS[b[0]] * b[1].v - WEIGHTS[a[0]] * a[1].v)
    .map(([k]) => REASON_TEXT[k](tpl, brief));
  for (const b of bonus) reasons.unshift(REASON_TEXT[b](tpl, brief));

  const warnings = Object.entries(parts)
    .filter(([, p]) => p.known && p.v < 0.35)
    .map(([k]) => `Weaker fit for ${k === "category" ? LABELS.category[brief.category]?.toLowerCase() : k === "platform" ? LABELS.platform[brief.platform] : `a ${brief[k]} ${k}`}`);

  return { score, reasons: reasons.slice(0, 3), warnings: warnings.slice(0, 1) };
}

export function rankVariations(tpl, brief) {
  const fam = TONE_FAMILY[brief.tone];
  const pace = PLATFORM_SPECS[brief.platform]?.pace;
  const hookFor = { sales: ["offer", "problem", "contrarian"], leads: ["question", "problem"], trust: ["personal", "story", "social-proof"], launch: ["reveal", "curiosity"], awareness: ["pov", "curiosity", "reveal", "asmr"] };
  return tpl.variations
    .map((v, i) => {
      let s = 0;
      if (brief.tone && v.tone === brief.tone) s += 3;
      else if (fam && TONE_FAMILY[v.tone] === fam) s += 2;
      if (brief.objective && hookFor[brief.objective]?.includes(v.hook)) s += 1.5;
      if (pace && v.pace === pace) s += 1;
      if (brief.festive && v.hook === "festive") s += 2;
      if (brief.sensory && v.hook === "asmr") s += 1.5;
      return { ...v, _s: s - i * 0.01 };
    })
    .sort((a, b) => b._s - a._s);
}

export function recommend(brief, { limit = 3, prefs = loadPrefs(), all = false } = {}) {
  const scored = TEMPLATES.map((t) => ({ template: t, ...scoreTemplate(t, brief, prefs) }))
    .sort((a, b) => b.score - a.score);
  if (all) return scored.map((s) => ({ ...s, match: toMatch(s.score), variations: rankVariations(s.template, brief) }));

  // Maximal-marginal-relevance style pick: penalise repeating a family.
  const chosen = [];
  const pool = [...scored];
  while (chosen.length < limit && pool.length) {
    let bestIdx = 0; let bestVal = -Infinity;
    pool.forEach((s, i) => {
      const repeat = chosen.some((c) => c.template.family === s.template.family);
      const val = s.score - (repeat ? 0.12 : 0);
      if (val > bestVal) { bestVal = val; bestIdx = i; }
    });
    chosen.push(pool.splice(bestIdx, 1)[0]);
  }
  return chosen.map((s) => ({ ...s, match: toMatch(s.score), variations: rankVariations(s.template, brief) }));
}

function toMatch(score) {
  return Math.max(10, Math.min(99, Math.round(score * 100)));
}

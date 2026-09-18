// support.js — instant help-centre answers. Runs in the browser, so replies are immediate.
// Retrieval: keyword phrases (weighted) + BM25 over title/answer, with synonyms.
// If nothing matches well, the app asks the AI (grounded on the same KB) or offers contact.

import { KB } from "./data.js";

const STOP = new Set("a an the is are am i me my we our you your it its to of in on for and or can do does how what which who why when where with be this that there any much many get have has will would should could please about".split(" "));

const SYN = {
  price: "pricing", prices: "pricing", cost: "pricing", costs: "pricing", pay: "pricing", paid: "pricing", plans: "plan", subscribe: "subscription",
  refunds: "refund", money: "pricing", rupees: "pricing", dollars: "pricing",
  credit: "credits", tokens: "credits", coins: "credits",
  avatar: "actor", avatars: "actor", actors: "actor", people: "actor", person: "actor", influencer: "actor",
  lang: "language", languages: "language", dubbing: "language", hindi: "language", tamil: "language", telugu: "language",
  ai: "ai", models: "model", engine: "model", engines: "model",
  watermarks: "watermark", commercially: "commercial", ownership: "own",
  resolution: "resolution", hd: "resolution", "4k": "resolution", quality: "resolution",
  cancelling: "cancel", canceling: "cancel", cancellation: "cancel", cancelled: "cancel", unsubscribe: "cancel",
  teammates: "team", colleagues: "team", seats: "team"
};

const tok = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9%:+ ]/g, " ").split(/\s+/)
  .filter((w) => w.length > 1 && !STOP.has(w))
  .map((w) => {
    if (SYN[w]) return SYN[w];
    const stem = w.replace(/(ies)$/, "y").replace(/(?<!s)s$/, "");
    return SYN[stem] || stem;
  });

const DOCS = KB.map((d) => ({ ...d, terms: tok(`${d.title} ${d.title} ${d.answer}`) }));
const N = DOCS.length;
const avgLen = DOCS.reduce((a, d) => a + d.terms.length, 0) / N;
const df = {};
DOCS.forEach((d) => new Set(d.terms).forEach((t) => { df[t] = (df[t] || 0) + 1; }));
const idf = (t) => Math.log(1 + (N - (df[t] || 0) + 0.5) / ((df[t] || 0) + 0.5));

function bm25(qTerms, d) {
  const k1 = 1.4; const b = 0.7;
  let s = 0;
  for (const t of new Set(qTerms)) {
    const f = d.terms.filter((x) => x === t).length;
    if (!f) continue;
    s += idf(t) * ((f * (k1 + 1)) / (f + k1 * (1 - b + b * (d.terms.length / avgLen))));
  }
  return s;
}

function keyScore(q, d) {
  let s = 0;
  for (const k of d.keys) {
    if (q.includes(k)) s += k.includes(" ") ? 3 : 2;
  }
  return s;
}

const CREATIVE = /\b(script|hook|hooks|storyboard|ad idea|ad ideas|idea for|ideas for|make an ad|make a video for|video for my|ad for my|caption|concept|write (me )?an? (ad|script)|help me (make|create|plan)|shot list|scene)\b/;
const GREETING = /^(hi|hey|hello|yo|namaste|hii+|good (morning|evening|afternoon))\b/;
const THANKS = /^(thanks|thank you|thx|ty|great|cool|ok(ay)?|nice)\b/;
const HUMAN = /\b(human|real person|agent|talk to (someone|a person)|call me|speak to)\b/;

export function answerSupport(message) {
  const q = String(message || "").toLowerCase().trim();
  if (!q) return { kind: "empty" };
  if (GREETING.test(q) && q.length < 25) {
    return { kind: "greeting", text: "Hi! I can answer questions about HexCoded plans, credits, actors and tools, or help you plan an ad. What do you need?" };
  }
  if (THANKS.test(q) && q.length < 20) return { kind: "thanks", text: "Anytime. Anything else?" };
  if (HUMAN.test(q)) {
    const d = KB.find((x) => x.id === "support");
    return { kind: "answer", id: d.id, title: d.title, text: d.answer, link: d.link, confidence: 1 };
  }

  const creative = CREATIVE.test(q);
  const qTerms = tok(q);
  const ranked = DOCS.map((d) => ({ d, s: bm25(qTerms, d) + keyScore(q, d) }))
    .sort((a, b) => b.s - a.s);
  const top = ranked[0];
  const second = ranked[1];
  const confidence = top.s <= 0 ? 0 : Math.min(1, top.s / 6) * (second && second.s > 0 ? Math.min(1, 0.55 + (top.s - second.s) / Math.max(top.s, 1)) : 1);

  if (creative && top.s < 4) {
    return { kind: "handoff", text: "That's a creative job, so the Director is the better place for it. It writes hooks, a scene-by-scene script and shot prompts, and you can edit any scene by chatting." };
  }
  if (top.s >= 2.2) {
    const related = ranked.slice(1, 4).filter((r) => r.s > 1.2).map((r) => r.d.title);
    return { kind: "answer", id: top.d.id, title: top.d.title, text: top.d.answer, link: top.d.link, confidence, related, creative };
  }
  return { kind: "unknown", confidence, creative };
}

export function kbAsText() {
  return KB.map((d) => `Q: ${d.title}\nA: ${d.answer}\nSource: ${d.link}`).join("\n\n");
}

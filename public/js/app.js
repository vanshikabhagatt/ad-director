import { TEMPLATES, LABELS, OBJECTIVES, PLATFORMS, TONES, SUPPORT_SUGGESTIONS, CATEGORIES } from "./data.js";
import { parseBrief, recommend, recordPick, loadPrefs } from "./recommender.js";
import { buildStoryboard, applyOps, interpret, helpText, describeBoard, toMarkdown, compactForAI, getTemplate, tc } from "./director.js";
import { answerSupport } from "./support.js";
import { AI, checkAI, askDirector, askSupport } from "./api.js";

/* ---------------- helpers ---------------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (n) => Number(n || 0).toLocaleString("en-IN");
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : "");

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
// Pick whichever text colour gives better contrast on the swatch.
const isLight = (hex) => (lum(hex) + 0.05) / (0.0137 + 0.05) > 1.05 / (lum(hex) + 0.05);

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); }
  catch {
    const ta = Object.assign(document.createElement("textarea"), { value: text });
    document.body.append(ta); ta.select();
    try { document.execCommand("copy"); } catch { /* ignore */ }
    ta.remove();
  }
  toast("Copied");
}

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (s) => String(s || "ad").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "ad";

/* ---------------- state ---------------- */
const STORE = "hxd:state:v1";
const state = { brief: null, form: null, sb: null, rev: 0, dirLog: [], helpLog: [], polishing: false, busy: false, helpBusy: false, filter: "All", query: "", pendingTemplate: null };

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify({ form: state.form, sb: state.sb, dirLog: state.dirLog.slice(-40) }));
  } catch { /* storage full or blocked; the app still works */ }
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE) || "null");
    if (!d) return;
    if (d.form) { state.form = d.form; state.brief = parseBrief(d.form); }
    if (d.sb?.scenes?.length) state.sb = d.sb;
    if (Array.isArray(d.dirLog)) state.dirLog = d.dirLog;
  } catch { /* ignore corrupt storage */ }
}

function setSB(next) {
  state.sb = next;
  state.rev++;
  save();
  renderBoard();
  renderDirSuggest();
}

/* ---------------- AI status ---------------- */
function renderStatus() {
  const el = $("#ai-status");
  el.dataset.state = AI.ready ? "ai" : "offline";
  el.textContent = AI.ready ? `AI on · ${AI.model}` : "Built-in engine";
  el.title = AI.ready
    ? `Creative edits and open questions go to ${AI.model} via ${AI.provider}. Structure, timing and credits are computed locally.`
    : "No AI key configured (or AI unreachable). Everything still works with the built-in engine.";
}

/* ---------------- router ---------------- */
const ROUTES = { "": "brief", "#": "brief", "#/": "brief", "#/templates": "templates", "#/director": "director" };
let firstRoute = true;
function route() {
  const view = ROUTES[location.hash] || "brief";
  $$(".view").forEach((s) => { s.hidden = s.dataset.view !== view; });
  $$(".tabs a").forEach((a) => { if (a.dataset.route === view) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
  if (view === "templates") renderTemplates();
  if (view === "director") { renderBoard(); renderDirLog(); renderDirSuggest(); }
  if (!firstRoute) {
    window.scrollTo({ top: 0 });
    const h = $(`#view-${view} h1, #view-${view} h2`);
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  firstRoute = false;
}

/* ---------------- brief ---------------- */
const EXAMPLES = [
  { label: "Sunscreen, funny Reels", product: "SunDrop SPF 50", description: "Light sunscreen for college students that leaves no white cast. Funny Instagram Reels, 20% off this week." },
  { label: "Earbuds, Diwali sale", product: "Pulse Buds", description: "Wireless earbuds with 40-hour battery for daily commuters. Diwali sale on Meta, flat ₹500 off." },
  { label: "Silver necklace launch", product: "Noor Pendant", description: "Handmade silver necklace for women who love minimal jewellery. Premium launch film for YouTube." },
  { label: "Budgeting app, sign-ups", product: "Paisa Plan", description: "Budgeting app that helps you track spending for first-jobbers. Get sign-ups on YouTube Shorts." }
];

function fillSelect(el, values, labels) {
  el.innerHTML = `<option value="auto">Auto</option>` + values.map((v) => `<option value="${v}">${esc(labels[v])}</option>`).join("");
}

function readForm() {
  return {
    product: $("#f-product").value.trim(),
    description: $("#f-desc").value.trim(),
    platform: $("#f-platform").value,
    objective: $("#f-objective").value,
    tone: $("#f-tone").value,
    duration: $("#f-duration").value === "auto" ? "" : $("#f-duration").value
  };
}

function writeForm(f) {
  $("#f-product").value = f.product || "";
  $("#f-desc").value = f.description || "";
  $("#f-platform").value = f.platform || "auto";
  $("#f-objective").value = f.objective || "auto";
  $("#f-tone").value = f.tone || "auto";
  $("#f-duration").value = f.duration || "auto";
}

function runBrief() {
  const f = readForm();
  if (!f.product && f.description.length < 3) {
    toast("Add a product name or a short description first");
    $("#f-desc").focus();
    return null;
  }
  state.form = f;
  state.brief = parseBrief(f);
  save();
  renderResults();
  return state.brief;
}

function signal(label, value, detected) {
  if (!value) return `<span class="signal missing">${esc(label)}: not given</span>`;
  return `<span class="signal">${esc(label)}: <b>${esc(value)}</b>${detected ? " (read from your text)" : ""}</span>`;
}

function renderResults() {
  const b = state.brief;
  const box = $("#brief-results");
  if (!b) { box.innerHTML = ""; return; }
  const recs = recommend(b, { limit: 3 });
  box.innerHTML = `
    <h2>Best templates for ${esc(b.product)}</h2>
    <div class="signals">
      ${signal("Category", LABELS.category[b.category], b.detected.category)}
      ${signal("Goal", LABELS.objective[b.objective], b.detected.objective)}
      ${signal("Platform", LABELS.platform[b.platform], b.detected.platform)}
      ${signal("Tone", LABELS.tone[b.tone], b.detected.tone)}
      ${signal("Audience", b.audienceKnown ? b.audience : "", true)}
      ${b.offer ? signal("Offer", b.offer, true) : ""}
      ${b.festive ? signal("Occasion", cap(b.festive), true) : ""}
    </div>
    <div class="rec-grid">${recs.map((r) => tplCard(r.template, { match: r.match, reasons: r.reasons, warnings: r.warnings, variation: r.variations[0], primary: true })).join("")}</div>`;
}

/* ---------------- template cards ---------------- */
function tplCard(t, { match, reasons = [], warnings = [], variation, primary } = {}) {
  const light = isLight(t.hex);
  const v = variation || t.variations[0];
  return `
  <article class="chipcard" style="--hex:${t.hex}">
    <div class="swatch ${light ? "light" : ""}">
      <div><div class="fam">${esc(t.family)}</div><div class="hex">${t.hex}</div></div>
      <div class="mini-frames" aria-hidden="true"><i></i><i></i><i></i></div>
    </div>
    <div class="chipcard-body">
      <div class="chipcard-title">
        <h3>${esc(t.name)}</h3>
        ${match !== undefined ? `<span class="match" aria-label="${match} percent match">${match}<small>% match</small></span>` : ""}
      </div>
      <p class="summary">${esc(t.summary)}</p>
      ${reasons.length || warnings.length ? `<ul class="reasons">${reasons.map((r) => `<li>${esc(r)}</li>`).join("")}${warnings.map((w) => `<li class="warn">${esc(w)}</li>`).join("")}</ul>` : ""}
      <p class="meta-line">${primary ? "Suggested style" : "Styles"}: <b>${primary ? esc(v.name) : t.variations.length}</b> · Build in <b>${esc(t.tool)}</b></p>
      <div class="card-actions">
        <button class="btn primary" type="button" data-act="plan" data-t="${t.id}" data-v="${v.id}">Plan this ad</button>
        <button class="btn quiet" type="button" data-act="open-tpl" data-t="${t.id}">See ${t.variations.length} styles</button>
      </div>
    </div>
  </article>`;
}

function renderTemplates() {
  const fams = ["All", ...new Set(TEMPLATES.map((t) => t.family))];
  $("#tpl-filters").innerHTML = fams.map((f) => `<button class="chip" type="button" data-filter="${esc(f)}" aria-pressed="${f === state.filter}">${esc(f)}</button>`).join("");
  const q = state.query.toLowerCase().trim();
  const b = state.brief;
  const scored = b ? recommend(b, { all: true }) : TEMPLATES.map((t) => ({ template: t, variations: t.variations }));
  const list = scored.filter(({ template: t }) => {
    if (state.filter !== "All" && t.family !== state.filter) return false;
    if (!q) return true;
    const strongCats = CATEGORIES.filter((c) => t.affinity.category[c] >= 0.8).map((c) => `${c} ${LABELS.category[c]}`);
    const hay = [t.name, t.summary, t.family, t.bestFor, t.tool, ...t.variations.flatMap((v) => [v.name, v.tone, v.description]), ...strongCats].join(" ").toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  });
  const total = TEMPLATES.reduce((n, t) => n + t.variations.length, 0);
  $("#tpl-sub").innerHTML = b
    ? `Sorted for <b>${esc(b.product)}</b>. <button class="link-btn" type="button" data-act="clear-brief">Show default order</button>`
    : `${TEMPLATES.length} formats and ${total} styles. Add a brief to sort them for your product.`;
  $("#tpl-grid").innerHTML = list.length
    ? list.map((r) => tplCard(r.template, { match: r.match, reasons: r.reasons, warnings: r.warnings, variation: r.variations[0], primary: Boolean(b) })).join("")
    : `<div class="empty">No templates match “${esc(state.query)}”. Try “review”, “festive” or “funny”.</div>`;
}

function openTemplate(id) {
  const t = getTemplate(id);
  const b = state.brief;
  const best = b ? recommend(b, { all: true }).find((r) => r.template.id === id)?.variations[0]?.id : null;
  const light = isLight(t.hex);
  const dlg = $("#tpl-dialog");
  dlg.style.setProperty("--hex", t.hex);
  dlg.innerHTML = `
    <div class="dlg-head ${light ? "light" : ""}">
      <div>
        <h2 id="tpl-dialog-title" style="font-size:var(--step-2)">${esc(t.name)}</h2>
        <p>${esc(t.summary)}</p>
      </div>
      <button class="icon-btn" type="button" data-act="close-dlg" aria-label="Close">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <div class="dlg-body">
      <p class="meta-line">Best for <b>${esc(t.bestFor)}</b> · Cast <b>${esc(t.actor)}</b> · Build in <b>${esc(t.tool)}</b> · Lengths <b>${t.durations.join(", ")} s</b></p>
      <div>
        <p class="meta-line" style="margin-bottom:6px">Story beats (bold ones stay in 15-second cuts)</p>
        <div class="beats">${t.beats.map((x) => `<span class="${x.core ? "core" : ""}" style="--s:${Math.round(x.s * 100)}" title="${esc(cap(x.p))}">${esc(cap(x.p))}</span>`).join("")}</div>
      </div>
      <div class="var-list">
        ${t.variations.map((v) => `
          <div class="var">
            <h3>${esc(v.name)}</h3>
            <p>${esc(v.description)}</p>
            <div class="tags">${v.id === best ? `<span class="tag best">Best for your brief</span>` : ""}<span class="tag">${esc(LABELS.tone[v.tone])}</span><span class="tag">${esc(v.pace)} pace</span><span class="tag">${esc(v.look)}</span></div>
            <button class="btn primary" type="button" data-act="plan" data-t="${t.id}" data-v="${v.id}">Use this style</button>
          </div>`).join("")}
      </div>
    </div>`;
  if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
}

function closeDialog() {
  const dlg = $("#tpl-dialog");
  if (dlg.open) { if (typeof dlg.close === "function") dlg.close(); else dlg.removeAttribute("open"); }
}

/* ---------------- director: plan lifecycle ---------------- */
function startPlan(templateId, variationId) {
  closeDialog();
  recordPick(templateId);
  const t = getTemplate(templateId);
  if (!state.brief) {
    state.pendingTemplate = { templateId, variationId };
    const v = t.variations.find((x) => x.id === variationId);
    bot(`Good pick: ${t.name}, ${v?.name || ""}. What are you selling, and who's it for? One sentence is enough.`);
    location.hash = "#/director";
    setTimeout(() => $("#dir-input")?.focus(), 50);
    return;
  }
  const sb = buildStoryboard(state.brief, { templateId, variationId });
  state.dirLog.push({ role: "bot", text: `Here's your plan. ${describeBoard(sb)} Change anything by chatting, or use the buttons on each scene.` });
  setSB(sb);
  location.hash = "#/director";
  polish();
}

function newPlanFromText(text) {
  const brief = parseBrief({ description: text });
  state.brief = brief;
  state.form = { product: "", description: text, platform: "auto", objective: "auto", tone: "auto", duration: "" };
  writeForm(state.form);
  const pt = state.pendingTemplate;
  state.pendingTemplate = null;
  const sb = buildStoryboard(brief, pt || {});
  recordPick(sb.templateId);
  const guessed = !/^[A-Z]/.test(text.trim()) || brief.product.split(" ").length > 3;
  bot(`Here's a plan for ${sb.product}. ${describeBoard(sb)}${guessed ? " If the product name is off, click it on the board to rename it." : ""}`);
  setSB(sb);
  polish();
}

async function polish() {
  if (!AI.ready || !state.sb) return;
  const rev = state.rev;
  state.polishing = true;
  renderBoard();
  const res = await askDirector({ storyboard: compactForAI(state.sb), task: "polish" });
  state.polishing = false;
  renderStatus();
  if (res && res.ops.length && rev === state.rev) {
    const { sb } = applyOps(state.sb, res.ops);
    bot(res.reply || `Polished the lines for ${sb.product}.`, { by: res.model });
    setSB(sb);
  } else {
    renderBoard();
  }
}

function resetPlan() {
  state.sb = null;
  state.rev++;
  state.pendingTemplate = null;
  state.dirLog = [{ role: "bot", text: "Fresh start. What are you selling, and who's it for?" }];
  save();
  renderDirLog(); renderBoard(); renderDirSuggest();
}

/* ---------------- director: chat ---------------- */
function bot(text, extra = {}) {
  state.dirLog.push({ role: "bot", text, ...extra });
  renderDirLog();
  save();
}

function msgHTML(m) {
  const actions = m.actions?.length ? `<div class="msg-actions">${m.actions.map((a) => `<button class="chip" type="button" data-act="${esc(a.act)}" data-arg="${esc(a.arg || "")}">${esc(a.label)}</button>`).join("")}</div>` : "";
  const src = m.src ? `<a class="src" href="${esc(m.src)}" target="_blank" rel="noopener">Source: ${esc(m.src.replace(/^https:\/\//, ""))}</a>` : "";
  const by = m.by ? `<span class="by">Written by ${esc(m.by)}</span>` : "";
  return `<div class="msg ${m.role === "user" ? "user" : "bot"}">${esc(m.text)}${src}${actions}${by}</div>`;
}

function renderDirLog() {
  const log = $("#dir-log");
  if (!state.dirLog.length) {
    state.dirLog.push({ role: "bot", text: "Hi, I'm Director. Tell me what you're selling and who it's for, and I'll plan the ad scene by scene. Or pick a brief below." });
  }
  log.innerHTML = state.dirLog.map(msgHTML).join("") + (state.busy ? `<div class="msg bot typing" aria-label="Director is typing"><i></i><i></i><i></i></div>` : "");
  log.scrollTop = log.scrollHeight;
}

function renderDirSuggest() {
  const box = $("#dir-suggest");
  if (!box) return;
  let items;
  if (!state.sb) {
    items = EXAMPLES.map((e) => ({ label: e.label, send: `${e.product}: ${e.description}` }));
  } else {
    const other = recommend(state.sb, { limit: 3 }).map((r) => r.template).find((t) => t.id !== state.sb.templateId);
    const idx = Math.min(1, state.sb.scenes.length - 1) + 1;
    items = [
      { label: `Make scene ${idx} funnier`, send: `Make scene ${idx} funnier` },
      { label: "New hooks", send: "Give me new hooks" },
      { label: state.sb.duration > 15 ? "Cut to 15 seconds" : "Make it 30 seconds", send: state.sb.duration > 15 ? "Cut it to 15 seconds" : "Make it 30 seconds" },
      other ? { label: `Switch to ${other.name.replace(/^[A-Z][a-z]/, (m) => m.toLowerCase())}`, send: `Switch to ${other.name.toLowerCase()}` } : null,
      { label: "Which models?", send: "Which model should I use for each scene?" }
    ].filter(Boolean);
  }
  box.innerHTML = items.map((i) => `<button class="chip" type="button" data-send="${esc(i.send)}">${esc(i.label)}</button>`).join("");
}

function historyFrom(log) {
  return log.slice(-8).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
}

async function sendDirector(raw) {
  const text = String(raw || "").trim();
  if (!text || state.busy) return;
  state.dirLog.push({ role: "user", text });
  renderDirLog();

  if (/^(new plan|start over|reset|clear)\b/i.test(text)) { resetPlan(); return; }

  const r = interpret(text, state.sb);
  if (!state.sb) {
    if (r.handled) { bot(r.reply); return; }
    if (text.split(/\s+/).length < 2) { bot("Tell me a little more: what's the product, and who's it for?"); return; }
    newPlanFromText(text);
    return;
  }

  if (/\b(new ad|another ad|different product|plan (an|a) ad for)\b/i.test(text)) {
    bot("Want me to start a new plan for that? Your current one will be replaced.", { actions: [{ label: "Start a new plan", act: "new-plan-from", arg: text.replace(/^.*?\b(for|about)\b\s*/i, "") }] });
    return;
  }

  if (r.handled && (r.structural || !AI.ready)) {
    applyLocal(r.ops, r.reply);
    return;
  }

  if (AI.ready) {
    state.busy = true;
    renderDirLog();
    const res = await askDirector({ storyboard: compactForAI(state.sb), message: text, history: historyFrom(state.dirLog.slice(0, -1)) });
    state.busy = false;
    renderStatus();
    if (res) {
      if (res.ops.length) {
        const { sb, log } = applyOps(state.sb, res.ops);
        bot(res.reply || `${log.join(". ")}.`, { by: res.model });
        setSB(sb);
      } else {
        bot(res.reply || "Could you say that another way?", { by: res.model });
      }
      return;
    }
    if (r.handled) { applyLocal(r.ops, r.reply ? r.reply : "", "The AI is busy right now, so the built-in engine made this edit. "); return; }
    bot(`The AI is busy right now, and the built-in engine couldn't match that to an edit. ${helpText()}`);
    return;
  }
  bot(`I couldn't match that to an edit. ${helpText()}`);
}

function applyLocal(ops, reply, prefix = "") {
  if (!ops.length) { bot(prefix + (reply || "Done.")); return; }
  const { sb, log } = applyOps(state.sb, ops);
  const said = [reply, log.length ? `${log.join(". ")}.` : ""].filter(Boolean).join(" ") || "Nothing to change there.";
  bot(prefix + said);
  setSB(sb);
}

/* ---------------- director: board ---------------- */
const GLYPH = {
  actor: `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="14" r="7" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M7 36c1.5-8 7-12 13-12s11.5 4 13 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  product: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M16 5h8v6l3.5 4v19a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2V15L16 11z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 22h12" stroke="currentColor" stroke-width="2.5"/></svg>`,
  mixed: `<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="13" cy="14" r="5" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M3 34c1-6 5-9 10-9s9 3 10 9" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M28 12h6v4l2 3v15h-10V19l2-3z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>`,
  cinematic: `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M14 3h12l10 34H4z" fill="currentColor" opacity=".22"/><path d="M17 20h6v3l2 2v10h-10V25l2-2z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg>`
};

function sel(name, options, value, label) {
  return `<label>${esc(label)}<select data-meta="${name}">${options.map(([v, l]) => `<option value="${esc(v)}" ${String(v) === String(value) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select></label>`;
}

function renderBoard() {
  const board = $("#board");
  const sb = state.sb;
  if (!sb) {
    board.innerHTML = `
      <div class="board-empty">
        <h2>No plan yet</h2>
        <p class="dim">Describe your product in the chat, or start from a brief to see ranked templates first.</p>
        <div class="actions"><a class="btn ghost" href="#/">Write a brief</a><a class="btn quiet" href="#/templates">Browse templates</a></div>
      </div>`;
    return;
  }
  const t = getTemplate(sb.templateId);
  const light = isLight(t.hex);
  const ar = (sb.aspect || "9:16").replace(":", " / ");
  board.style.setProperty("--hex", t.hex);

  board.innerHTML = `
    <section class="board-head" aria-label="Plan settings">
      <div class="title-row">
        <label class="sr-only" for="product-name">Product name</label>
        <input class="product-input" id="product-name" value="${esc(sb.product)}" maxlength="60">
        <div class="export-row">
          <button class="btn quiet" type="button" data-act="copy-all">Copy all prompts</button>
          <button class="btn quiet" type="button" data-act="dl-md">Download .md</button>
          <button class="btn quiet" type="button" data-act="dl-json">Download .json</button>
        </div>
      </div>
      <div class="meta-row">
        ${sel("template", TEMPLATES.map((x) => [x.id, x.name]), sb.templateId, "Template")}
        ${sel("variation", t.variations.map((v) => [v.id, v.name]), sb.variationId, "Style")}
        ${sel("platform", PLATFORMS.map((p) => [p, LABELS.platform[p]]), sb.platform, "Platform")}
        ${sel("duration", t.durations.map((d) => [d, `${d} s`]), sb.duration, "Length")}
        ${sel("tone", TONES.map((x) => [x, LABELS.tone[x]]), sb.tone, "Tone")}
        ${sel("objective", OBJECTIVES.map((x) => [x, LABELS.objective[x]]), sb.objective, "Goal")}
        
      </div>
      <p class="plan-facts">
        <span>Build in <b>${esc(sb.tool.name)}</b></span>
        <span>Format <b>${esc(sb.aspect)}</b></span>
        <span>For <b>${esc(sb.audience)}</b></span>
        <span>Voiceover <b>${esc(sb.language)}</b></span>
        ${sb.offer ? `<span>Offer <b>${esc(sb.offer)}</b></span>` : ""}
        ${state.polishing ? `<span class="polishing">Polishing lines with AI…</span>` : ""}
      </p>
    </section>

    <section class="frames" aria-label="Storyboard">
      ${sb.scenes.map((s, i) => `
        <article class="panel ${s.changed ? "is-changed" : ""}" aria-label="Scene ${i + 1}">
          <div class="panel-top"><span class="n">${i + 1}</span><span class="t">${tc(s.start)}–${tc(s.end)}</span></div>
          <div class="stage">
            <div class="frame ${light ? "light" : ""}" style="--ar:${ar}">
              ${s.onScreen ? `<span class="ots">${esc(s.onScreen)}</span>` : ""}
              ${GLYPH[s.shot] || GLYPH.mixed}
              <span class="purpose">${esc(cap(s.purpose))}</span>
            </div>
          </div>
          <div class="panel-body">
            <p class="line ${s.line ? "" : "none"}">${s.line ? `“${esc(s.line)}”` : "No dialogue: sound and visuals only"}</p>
            <p class="visual">${esc(s.visual)}</p>
            <p class="dim">${esc(s.camera)}</p>
            <span class="model-chip" title="${esc(s.modelWhy)}">${esc(s.model)}</span>
            <details class="prompt"><summary>Shot prompt</summary><p>${esc(s.prompt)}</p></details>
          </div>
          <div class="panel-actions">
            <button class="btn quiet" type="button" data-act="retake" data-i="${i}">Retake</button>
            <button class="btn quiet" type="button" data-act="retake" data-i="${i}" data-tone="funny">Funnier</button>
            <button class="btn quiet" type="button" data-act="retake" data-i="${i}" data-tone="premium">Premium</button>
            ${AI.ready ? `<button class="btn quiet" type="button" data-act="ai-scene" data-i="${i}">Rewrite with AI</button>` : ""}
            <button class="btn quiet" type="button" data-act="copy-prompt" data-i="${i}">Copy prompt</button>
            ${s.purpose !== "cta" && sb.scenes.length > 2 ? `<button class="btn quiet" type="button" data-act="remove" data-i="${i}" aria-label="Remove scene ${i + 1}">Remove</button>` : ""}
          </div>
        </article>`).join("")}
    </section>

    <section class="lower">
      <div class="sheet">
        <div class="title-row"><h2>Hooks</h2><button class="btn quiet" type="button" data-act="new-hooks">New hooks</button></div>
        <ol class="hooks">
          ${sb.hooks.map((h, i) => `<li><span class="${sb.hooksChanged ? "is-changed" : ""}">${esc(h)}</span><button class="btn quiet" type="button" data-act="use-hook" data-i="${i}" ${sb.scenes[0]?.line === h ? "disabled" : ""}>${sb.scenes[0]?.line === h ? "In use" : "Use"}</button></li>`).join("")}
        </ol>
      </div>
      <div class="sheet">
        <h2>Checks</h2>
        <ul class="checks">${sb.checks.map((k) => `<li class="${k.ok ? "" : "bad"}">${esc(k.text)}</li>`).join("")}</ul>
      </div>
      
    </section>`;
}

async function boardAction(btn) {
  const sb = state.sb;
  if (!sb) return;
  const act = btn.dataset.act;
  const i = Number(btn.dataset.i);
  switch (act) {
    case "retake": {
      const { sb: next } = applyOps(sb, [{ op: "retake", index: i, tone: btn.dataset.tone }]);
      setSB(next);
      toast(`Scene ${i + 1} retaken`);
      break;
    }
    case "remove": {
      const { sb: next } = applyOps(sb, [{ op: "remove_scene", index: i }]);
      setSB(next);
      toast(`Scene ${i + 1} removed`);
      break;
    }
    case "ai-scene":
      location.hash = "#/director";
      await sendDirector(`Rewrite scene ${i + 1} so it's more specific to ${sb.product} and ${sb.audience}. Keep it the same length.`);
      break;
    case "copy-prompt": copy(sb.scenes[i].prompt); break;
    case "use-hook": {
      const { sb: next } = applyOps(sb, [{ op: "use_hook", index: i }]);
      setSB(next);
      toast("Opening line swapped");
      break;
    }
    case "new-hooks": {
      const { sb: next } = applyOps(sb, [{ op: "new_hooks" }]);
      setSB(next);
      break;
    }
    case "copy-all":
      copy(sb.scenes.map((s, n) => `Scene ${n + 1} (${tc(s.start)}–${tc(s.end)}) · ${s.model}\n${s.prompt}`).join("\n\n"));
      break;
    case "dl-md": download(`${slug(sb.product)}-ad-plan.md`, toMarkdown(sb), "text/markdown"); break;
    case "dl-json": {
      const clean = JSON.parse(JSON.stringify(sb, (k, v) => (["changed", "userLine", "hooksChanged", "share", "seed", "detected", "raw"].includes(k) ? undefined : v)));
      download(`${slug(sb.product)}-ad-plan.json`, JSON.stringify(clean, null, 2), "application/json");
      break;
    }
    default: break;
  }
}

function metaChange(el) {
  const sb = state.sb;
  if (!sb) return;
  const name = el.dataset.meta;
  const value = el.value;
  let ops;
  if (name === "template") ops = [{ op: "rebuild", templateId: value }];
  else if (name === "variation") ops = [{ op: "rebuild", templateId: sb.templateId, variationId: value }];
  else ops = [{ op: "set_meta", fields: { [name]: name === "duration" ? Number(value) : value } }];
  const { sb: next, log } = applyOps(sb, ops);
  if (name === "template") recordPick(value);
  setSB(next);
  if (log.length) toast(log[log.length - 1]);
}

/* ---------------- help widget ---------------- */
function helpBot(text, extra = {}) {
  state.helpLog.push({ role: "bot", text, ...extra });
  renderHelp();
}

function renderHelp() {
  const log = $("#help-log");
  log.innerHTML = state.helpLog.map(msgHTML).join("") + (state.helpBusy ? `<div class="msg bot typing" aria-label="Typing"><i></i><i></i><i></i></div>` : "");
  log.scrollTop = log.scrollHeight;
}

function renderHelpSuggest(items = SUPPORT_SUGGESTIONS) {
  $("#help-suggest").innerHTML = items.slice(0, 4).map((q) => `<button class="chip" type="button" data-ask="${esc(q)}">${esc(q)}</button>`).join("");
}

function toggleHelp(open) {
  const panel = $("#help-panel");
  const fab = $("#help-fab");
  const show = open ?? panel.hidden;
  panel.hidden = !show;
  fab.setAttribute("aria-expanded", String(show));
  if (show) {
    if (!state.helpLog.length) {
      helpBot("Hi! Ask me anything about HexCoded: plans, credits, actors, languages or which tool to use. For ad ideas, I'll hand you to Director.");
      renderHelpSuggest();
    }
    setTimeout(() => $("#help-input").focus(), 30);
  } else {
    fab.focus();
  }
}

async function sendHelp(raw) {
  const text = String(raw || "").trim();
  if (!text || state.helpBusy) return;
  state.helpLog.push({ role: "user", text });
  renderHelp();
  const a = answerSupport(text);
  const handoff = { label: "Plan it in Director", act: "handoff", arg: text };

  if (a.kind === "greeting" || a.kind === "thanks") { helpBot(a.text); return; }
  if (a.kind === "handoff") { helpBot(a.text, { actions: [handoff] }); return; }

  const localAnswer = a.kind === "answer"
    ? { text: a.text, src: a.link, actions: a.creative ? [handoff] : undefined }
    : null;

  if (localAnswer && (a.confidence >= 0.45 || !AI.ready)) {
    helpBot(localAnswer.text, { src: localAnswer.src, actions: localAnswer.actions });
    if (a.related?.length) renderHelpSuggest(a.related);
    return;
  }

  if (AI.ready) {
    state.helpBusy = true;
    renderHelp();
    const res = await askSupport(text, historyFrom(state.helpLog.slice(0, -1)));
    state.helpBusy = false;
    renderStatus();
    if (res) {
      helpBot(res.reply, { src: res.source || undefined, by: res.model, actions: res.handoff || a.creative ? [handoff] : undefined });
      return;
    }
  }
  if (localAnswer) { helpBot(localAnswer.text, { src: localAnswer.src, actions: localAnswer.actions }); return; }
  helpBot("I don't have an answer for that yet. The HexCoded team can help on the contact page.", {
    src: "https://hexcoded.ai/contact",
    actions: a.creative ? [handoff] : undefined
  });
  renderHelpSuggest();
}

/* ---------------- events ---------------- */
function bind() {
  fillSelect($("#f-platform"), PLATFORMS, LABELS.platform);
  fillSelect($("#f-objective"), OBJECTIVES, LABELS.objective);
  fillSelect($("#f-tone"), TONES, LABELS.tone);
  $("#examples").innerHTML = `<span>Try:</span>` + EXAMPLES.map((e, i) => `<button class="chip" type="button" data-example="${i}">${esc(e.label)}</button>`).join("");

  $("#brief-form").addEventListener("submit", (e) => { e.preventDefault(); if (runBrief()) $("#brief-results").scrollIntoView({ behavior: "smooth", block: "start" }); });
  $("#plan-best").addEventListener("click", () => {
    const b = runBrief();
    if (!b) return;
    const top = recommend(b, { limit: 1 })[0];
    startPlan(top.template.id, top.variations[0].id);
  });
  $("#examples").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-example]");
    if (!btn) return;
    const ex = EXAMPLES[Number(btn.dataset.example)];
    writeForm({ product: ex.product, description: ex.description });
    runBrief();
  });

  // Delegated actions shared across views
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "plan") startPlan(btn.dataset.t, btn.dataset.v);
    else if (act === "open-tpl") openTemplate(btn.dataset.t);
    else if (act === "close-dlg") closeDialog();
    else if (act === "clear-brief") { state.brief = null; renderTemplates(); }
    else if (act === "new-plan-from") newPlanFromText(btn.dataset.arg);
    else if (act === "handoff") {
      toggleHelp(false);
      location.hash = "#/director";
      if (state.sb) {
        state.dirLog.push({ role: "user", text: btn.dataset.arg });
        bot("Want a new plan for this? It will replace the one on the board.", { actions: [{ label: "Start a new plan", act: "new-plan-from", arg: btn.dataset.arg }] });
      } else {
        sendDirector(btn.dataset.arg);
      }
    }
    else if (btn.closest("#board")) boardAction(btn);
  });

  $("#tpl-dialog").addEventListener("click", (e) => { if (e.target.id === "tpl-dialog") closeDialog(); });
  $("#tpl-filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-filter]");
    if (!b) return;
    state.filter = b.dataset.filter;
    renderTemplates();
  });
  $("#tpl-search").addEventListener("input", (e) => { state.query = e.target.value; renderTemplates(); });

  // Director
  const dirInput = $("#dir-input");
  $("#dir-form").addEventListener("submit", (e) => { e.preventDefault(); const v = dirInput.value; dirInput.value = ""; sendDirector(v); });
  dirInput.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); $("#dir-form").requestSubmit(); } });
  $("#dir-suggest").addEventListener("click", (e) => { const b = e.target.closest("[data-send]"); if (b) sendDirector(b.dataset.send); });
  $("#dir-reset").addEventListener("click", resetPlan);
  $("#board").addEventListener("change", (e) => {
    if (e.target.matches("[data-meta]")) metaChange(e.target);
    if (e.target.id === "product-name" && e.target.value.trim() && e.target.value.trim() !== state.sb?.product) {
      const { sb } = applyOps(state.sb, [{ op: "set_meta", fields: { product: e.target.value.trim() } }]);
      setSB(sb);
      toast("Product renamed");
    }
  });
  $("#board").addEventListener("keydown", (e) => { if (e.target.id === "product-name" && e.key === "Enter") e.target.blur(); });

  // Help
  $("#help-fab").addEventListener("click", () => toggleHelp());
  $("#help-close").addEventListener("click", () => toggleHelp(false));
  $("#help-form").addEventListener("submit", (e) => { e.preventDefault(); const v = $("#help-input").value; $("#help-input").value = ""; sendHelp(v); });
  $("#help-suggest").addEventListener("click", (e) => { const b = e.target.closest("[data-ask]"); if (b) sendHelp(b.dataset.ask); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#help-panel").hidden && !$("#tpl-dialog").open) toggleHelp(false); });

  window.addEventListener("hashchange", route);
}

/* ---------------- boot ---------------- */
load();
bind();
if (state.form) writeForm(state.form);
if (state.brief) renderResults();
route();
checkAI().then(() => { renderStatus(); if (!$("#view-director").hidden) renderBoard(); });

// Expose for quick debugging in the console.
window.director = { state, loadPrefs };

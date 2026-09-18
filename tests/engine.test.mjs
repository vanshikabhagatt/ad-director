import { test } from "node:test";
import assert from "node:assert/strict";
import { TEMPLATES, PLATFORMS, TONES, KB } from "../public/js/data.js";
import { parseBrief, recommend } from "../public/js/recommender.js";
import { buildStoryboard, applyOps, interpret, toMarkdown } from "../public/js/director.js";
import { answerSupport } from "../public/js/support.js";

const BAD = /undefined|NaN|\[object|\[(product|audience|benefit|problem|offer|cta|setting|benefitVerb)\]|\{\w+\}/;

test("brief parser reads free text", () => {
  const b = parseBrief({ product: "SunDrop SPF 50", description: "Light sunscreen for college students. Funny Instagram Reels, 20% off this week." });
  assert.equal(b.category, "beauty");
  assert.equal(b.tone, "funny");
  assert.equal(b.platform, "reels");
  assert.equal(b.offer, "20% off");
  assert.equal(b.audience, "college students");
  assert.equal(b.objective, "sales");

  const e = parseBrief({ description: "Wireless earbuds for daily commuters. Diwali sale on Meta, flat ₹500 off." });
  assert.equal(e.category, "tech");
  assert.equal(e.festive, "diwali");
  assert.equal(e.offer, "₹500 off");
  assert.equal(e.platform, "meta");

  const app = parseBrief({ description: "Budgeting app that helps you track spending for first-jobbers. Get sign-ups on YouTube Shorts." });
  assert.equal(app.category, "app");
  assert.equal(app.objective, "leads");
  assert.equal(app.platform, "shorts");
  assert.match(app.benefit, /track spending/);
});

test("explicit dropdowns win over detected values", () => {
  const b = parseBrief({ description: "funny reels", tone: "premium", platform: "youtube" });
  assert.equal(b.tone, "premium");
  assert.equal(b.platform, "youtube");
  assert.equal(b.detected.tone, false);
});

test("recommendations make sense", () => {
  const top = (d) => recommend(parseBrief({ description: d }), { limit: 3 }).map((r) => r.template.id);
  assert.equal(top("Wireless earbuds Diwali sale 20% off on Instagram reels")[0], "festive-offer");
  assert.ok(["cinematic", "try-on"].includes(top("Handmade silver necklace, premium launch film for YouTube")[0]));
  assert.ok(top("Light sunscreen for college students, funny Reels, build trust").includes("ugc-review"));
  const app = top("Budgeting app for first-jobbers, get sign-ups, explain how it works");
  assert.ok(app.includes("product-demo") || app.includes("problem-solution"));
  assert.ok(!app.includes("try-on") && !app.includes("asmr"), "never suggests try-on or ASMR for an app");
  assert.equal(top("ASMR candle, calm and cozy, Reels")[0], "asmr");
});

test("top picks are diverse and explained", () => {
  const recs = recommend(parseBrief({ description: "Protein bar for gym beginners, funny TikTok, drive sales" }), { limit: 3 });
  assert.equal(recs.length, 3);
  const fams = recs.map((r) => r.template.family);
  assert.equal(new Set(fams).size, fams.length, `families repeat: ${fams}`);
  recs.forEach((r) => {
    assert.ok(r.match >= 10 && r.match <= 99);
    assert.ok(r.reasons.length >= 1, `${r.template.id} has no reasons`);
  });
  assert.ok(recs[0].match >= recs[1].match - 12);
});

test("empty brief still produces a valid plan", () => {
  const sb = buildStoryboard({ description: "" });
  assert.ok(sb.scenes.length >= 4);
  assert.equal(sb.product, "your product");
  assert.ok(sb.checks.some((c) => !c.ok));
});

test("every template × style × length × platform × tone builds cleanly", () => {
  const brief = parseBrief({ product: "Glow Serum", description: "Vitamin C serum for busy moms, 15% off" });
  let count = 0, hookFails = 0, lineFails = 0;
  for (const t of TEMPLATES) {
    for (const v of t.variations) {
      for (const d of t.durations) {
        for (const p of PLATFORMS) {
          for (const tone of TONES) {
            let sb = buildStoryboard({ ...brief, platform: p }, { templateId: t.id, variationId: v.id, duration: d, tone });
            count++;
            assert.equal(sb.scenes[0].start, 0);
            assert.equal(sb.scenes.at(-1).end, d, `${t.id}/${v.id} ends at ${sb.scenes.at(-1).end} not ${d}`);
            for (let i = 1; i < sb.scenes.length; i++) assert.equal(sb.scenes[i].start, sb.scenes[i - 1].end);
            sb.scenes.forEach((s) => assert.ok(s.end > s.start, `${t.id} zero-length scene`));
            assert.equal(sb.hooks.length, 5);
            assert.equal(new Set(sb.hooks).size, 5);
            if (sb.scenes[0].purpose === "hook") hookFails += sb.checks[0].ok ? 0 : 1;
            lineFails += sb.checks.at(-1).ok ? 0 : 1;
            assert.ok(sb.scenes.some((s) => s.purpose === "cta"));
            const text = JSON.stringify({ h: sb.hooks, s: sb.scenes.map((s) => [s.line, s.visual, s.onScreen, s.prompt, s.model]), c: sb.credits, cta: sb.cta });
            assert.doesNotMatch(text, BAD, `${t.id}/${v.id}/${d}/${p}/${tone}`);
            assert.doesNotMatch(toMarkdown(sb), /undefined|NaN/);
            // retake every scene in another tone
            sb = applyOps(sb, sb.scenes.map((_, i) => ({ op: "retake", index: i, tone: "funny" }))).sb;
            assert.doesNotMatch(JSON.stringify(sb.scenes.map((s) => s.line)), BAD);
          }
        }
      }
    }
  }
  assert.ok(count > 3000, `only ${count} combos`);
  console.log(`# fuzz: ${count} combos, hook-check fails ${hookFails}, line-length fails ${lineFails}`);
  assert.equal(hookFails, 0, "fresh plans should never fail their own hook check");
  assert.equal(lineFails, 0, "fresh plans should never have lines too long for their scene");
});

test("ops: retake changes only the target scene", () => {
  const sb = buildStoryboard({ product: "Pulse Buds", description: "earbuds for commuters" }, { templateId: "ugc-review" });
  const { sb: next } = applyOps(sb, [{ op: "retake", index: 1, tone: "funny" }]);
  assert.notEqual(next.scenes[1].line, sb.scenes[1].line);
  assert.equal(next.scenes[1].tone, "funny");
  assert.ok(next.scenes[1].changed);
  assert.equal(next.scenes[2].line, sb.scenes[2].line);
  assert.ok(!next.scenes[2].changed);
});

test("ops: garbage from a model can't break the board", () => {
  const sb = buildStoryboard({ product: "X", description: "app for students" });
  const junk = [null, 5, "x", { op: "set_scene" }, { op: "set_scene", index: 99, fields: { line: "a" } }, { op: "set_scene", index: -1 },
    { op: "set_scene", index: 0, fields: { line: "<img src=x onerror=alert(1)>" } }, { op: "rebuild", templateId: "nope" },
    { op: "set_meta", fields: { duration: 7, tone: "angry", platform: "myspace" } }, { op: "remove_scene", index: "0" }, { op: "set_hooks", hooks: [] }, { op: "drop_tables" }];
  const { sb: next } = applyOps(sb, junk);
  assert.equal(next.scenes.length, sb.scenes.length);
  assert.equal(next.duration, sb.duration);
  assert.doesNotMatch(next.scenes[0].line, /[<>]/);
  assert.equal(applyOps(sb, "not an array").sb.scenes.length, sb.scenes.length);
});

test("ops: cannot remove the CTA or go below two scenes", () => {
  let sb = buildStoryboard({ product: "X", description: "candle" }, { templateId: "asmr", duration: 15 });
  const cta = sb.scenes.findIndex((s) => s.purpose === "cta");
  sb = applyOps(sb, [{ op: "remove_scene", index: cta }]).sb;
  assert.ok(sb.scenes.some((s) => s.purpose === "cta"));
  for (let k = 0; k < 6; k++) sb = applyOps(sb, [{ op: "remove_scene", index: 0 }]).sb;
  assert.ok(sb.scenes.length >= 2);
});

test("ops: switching template, length and product rebuilds consistently", () => {
  let sb = buildStoryboard({ product: "Noor Pendant", description: "silver necklace for women, premium" });
  sb = applyOps(sb, [{ op: "rebuild", templateId: "try-on" }]).sb;
  assert.equal(sb.templateId, "try-on");
  sb = applyOps(sb, [{ op: "set_meta", fields: { duration: 15 } }]).sb;
  assert.equal(sb.duration, 15);
  assert.equal(sb.scenes.at(-1).end, 15);
  sb = applyOps(sb, [{ op: "set_meta", fields: { product: "Noor Chain" } }]).sb;
  assert.ok(sb.scenes.some((s) => s.prompt.includes("Noor Chain")));
  assert.ok(!JSON.stringify(sb.scenes).includes("Noor Pendant"));
});

test("chat intents", () => {
  const sb = buildStoryboard({ product: "Pulse Buds", description: "earbuds for commuters, reels" }, { templateId: "ugc-review", duration: 30 });
  const cases = [
    ["make scene 2 funnier", (r) => r.ops[0].op === "retake" && r.ops[0].index === 1 && r.ops[0].tone === "funny"],
    ["retake the hook", (r) => r.ops[0].op === "retake" && r.ops[0].index === 0],
    ["make the last scene more premium", (r) => r.ops[0].index === sb.scenes.length - 1 && r.ops[0].tone === "premium"],
    ["cut it to 15 seconds", (r) => r.structural && r.ops[0].fields.duration === 15],
    ["shorter please", (r) => r.ops[0].fields.duration === 15],
    ["switch to unboxing", (r) => r.ops[0].op === "rebuild" && r.ops[0].templateId === "unboxing"],
    ["can we try the try-on template", (r) => r.ops[0].templateId === "try-on"],
    ["make it for youtube", (r) => r.ops[0].fields.platform === "youtube"],
    ["add 25% off", (r) => r.ops[0].fields.offer === "25% off"],
    ["write it in hindi", (r) => r.ops[0].fields.language === "Hindi"],
    ["give me new hooks", (r) => r.ops[0].op === "new_hooks"],
    ["use hook 3", (r) => r.ops[0].op === "use_hook" && r.ops[0].index === 2],
    ["remove scene 3", (r) => r.ops[0].op === "remove_scene" && r.ops[0].index === 2],
    ["make it funnier", (r) => r.ops[0].op === "set_meta" && r.ops[0].fields.tone === "funny"],
    ["target new moms", (r) => r.ops[0].fields.audience === "new moms"],
    ["the product is called Pulse Buds Pro", (r) => r.ops[0].fields.product === "Pulse Buds Pro"],
    ["how many credits?", (r) => r.handled && /credits/.test(r.reply)],
    ["which model should I use", (r) => r.handled && /Veo|Kling|Seedance/.test(r.reply)],
    ["help", (r) => r.handled && /scene 2/.test(r.reply)]
  ];
  for (const [msg, ok] of cases) {
    const r = interpret(msg, sb);
    assert.ok(ok(r), `${msg} -> ${JSON.stringify(r)}`);
  }
  // Things that must NOT trigger a template switch
  for (const msg of ["make it funnier for them", "make scene 2 better", "use a warmer tone"]) {
    const r = interpret(msg, sb);
    assert.ok(!r.ops.some((o) => o.op === "rebuild"), `${msg} switched template`);
  }
  // Unknown creative request is left for the AI
  assert.equal(interpret("write something about the rain and the city", sb).handled, false);
});

test("support bot answers common questions instantly", () => {
  const expect = {
    "how much does hexcoded cost": "pricing",
    "is there a free trial?": "free",
    "do my credits expire": "rollover",
    "can I speak hindi in the video": "languages",
    "can i run the videos as facebook ads": "rights",
    "what happens if a render fails": "failed",
    "do you have an api": "api",
    "does it support 4k": "resolution",
    "can my team share credits": "team",
    "is veo available": "models",
    "are the real actors paid": ["consent", "actors"],
    "I want to talk to a human": "support",
    "cancel my subscription": "billing",
    "what is url to ad": "tools"
  };
  for (const [q, id] of Object.entries(expect)) {
    const a = answerSupport(q);
    assert.equal(a.kind, "answer", `${q} -> ${a.kind}`);
    assert.ok([].concat(id).includes(a.id), `${q} -> ${a.id}`);
  }
  assert.equal(answerSupport("hello").kind, "greeting");
  assert.equal(answerSupport("write me hooks for my candle brand").kind, "handoff");
  assert.equal(answerSupport("what's the weather in paris").kind, "unknown");
  KB.forEach((d) => assert.ok(d.link.startsWith("https://")));
});

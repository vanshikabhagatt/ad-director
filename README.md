# Director for HexCoded

**Live demo:** _add your Vercel URL here_

A working prototype of three features I'd add to [HexCoded](https://hexcoded.ai):

1. **A smarter template marketplace.** A one-line brief ranks 11 ad formats (37 styles) for the product, goal, platform and tone, and says *why* each one fits.
2. **Director, an AI ad assistant.** It turns the brief into a shot-by-shot plan: five hooks, a timed script, a ready prompt and model pick for every shot and quality checks. You change anything by chatting ("make scene 2 funnier", "cut it to 15 seconds", "in Hinglish").
3. **An instant help assistant.** It answers pricing, credits, plans and language questions from HexCoded's public pages, with a source link, and passes creative requests to Director.

It uses a free AI tier (Groq), and it keeps working with no AI at all.

---

## Why these three

HexCoded already covers *generation*: 30+ models, 1,000+ actors, 70+ languages and four tools (Creative Studio, Talking actors, Make a custom video, URL → Ad). The hard part for a small brand comes before that: **deciding what ad to make and how to shoot it.**

- **LTX Studio** turns a script into a storyboard, but it's built for filmmakers, not performance ads.
- **OpenArt and ImagineArt** offer large template libraries, but you browse them rather than get matched to one.
- **Magnific** is excellent at making images better, not at planning an ad.

Director sits in that gap. Every plan ends in prompts that are ready to paste into HexCoded's own tools, so it leads straight to more renders. It also fits HexCoded's direction toward agentic chat and node workflows: each storyboard scene maps naturally to a node.

## Run it locally

```bash
npm start            # http://localhost:3000, Node 20+, no dependencies
```

To turn on AI, copy `.env.example` to `.env` and paste a free key from <https://console.groq.com/keys> (no card needed).

## Deploy to Vercel (free)

1. Push this folder to a GitHub repo.
2. On vercel.com, go to **Add New → Project**, import the repo, and keep the default settings.
3. Under **Environment Variables**, add `GROQ_API_KEY`.
4. Deploy. The badge in the top-right of the page should read **AI on**.

**Render or Railway** also work: use `npm start` as the start command and set the same variable.

## How it works

```
public/            static app (vanilla JS modules, no build step)
  js/data.js         templates, styles, story beats, hook and line libraries, HexCoded facts, help knowledge base
  js/recommender.js  brief parser + weighted, explainable scoring with diversity
  js/director.js     storyboard engine, edit operations ("ops"), offline chat intents
  js/support.js      BM25 retrieval over the knowledge base
  js/app.js          UI
api/chat.js        one serverless endpoint for both assistants
api/_lib/llm.js    OpenAI-compatible client with model fallback
server.mjs         zero-dependency local / Render server
```

**The AI never owns the plan.** Structure, timing, and checks are computed in the browser. The AI only returns small, validated edit operations (`set_scene`, `set_hooks`, `set_meta`, `rebuild`, `remove_scene`).

That design has three consequences:
- A bad or malicious model reply can't break the board.
- Edits like length, platform and offer are instant and free.
- If the key is missing, rate-limited, slow or invalid, the app quietly uses the built-in engine and says so.

**The help bot answers confident questions locally in milliseconds.** It only calls the AI for questions it isn't sure about, and the AI is restricted to the knowledge base, so it can't invent prices.

**Default models** are `openai/gpt-oss-20b`, then `openai/gpt-oss-120b`, then `llama-3.1-8b-instant`. Any OpenAI-compatible provider works through `LLM_BASE_URL`, `LLM_API_KEY` and `LLM_MODELS`.

## Tests

```bash
npm test         # engine tests
npm run test:ui  # browser tests (needs Python + Playwright)
```

**Engine tests** cover all 5,656 combinations of template, style, length, platform and tone. They check that every plan:
- has no `undefined`, `NaN` or unfilled placeholders,
- has contiguous timing,
- has five unique hooks,
- always keeps a call to action,
- passes its own hook-length and line-length checks.

They also check that malicious or garbage model output is rejected.

**Browser tests** exercise every button, export, chat edit and the help widget, plus mobile layout.

The AI path is tested against a fake provider (`tests/fake-llm.mjs`) in five situations: normal replies, malicious output, unreadable output, rate limits, slow responses and a bad key.

## Notes

- **Where the HexCoded facts come from:** plans, credits, tools, models and languages were taken from hexcoded.ai and hexcoded.ai/pricing in September 2026.
- **Credit estimates are rough.** HexCoded shows the exact cost before rendering.
- **Everything here is original.** The prototype contains no HexCoded-generated media.
- **Earlier version:** [AdTemplateAI](https://github.com/vanshikabhagatt/AdTemplateAI).

// data.js — shared by the browser app and the serverless API.
// Everything about HexCoded here comes from hexcoded.ai and hexcoded.ai/pricing (Sept 2026).

export const CATEGORIES = ["beauty", "fashion", "jewellery", "tech", "food", "fitness", "home", "app", "education", "finance", "travel"];
export const OBJECTIVES = ["awareness", "sales", "launch", "trust", "leads"];
export const PLATFORMS = ["reels", "shorts", "tiktok", "meta", "youtube", "linkedin", "website"];
export const TONES = ["friendly", "funny", "premium", "energetic", "calm", "informative", "emotional", "bold"];

export const LABELS = {
  category: { beauty: "Beauty & skincare", fashion: "Fashion", jewellery: "Jewellery & watches", tech: "Tech & gadgets", food: "Food & drink", fitness: "Fitness", home: "Home & decor", app: "Apps & software", education: "Courses & learning", finance: "Finance", travel: "Travel & stays" },
  objective: { awareness: "Build awareness", sales: "Drive sales", launch: "Launch a product", trust: "Build trust", leads: "Get sign-ups" },
  platform: { reels: "Instagram Reels", shorts: "YouTube Shorts", tiktok: "TikTok", meta: "Meta feed", youtube: "YouTube (16:9)", linkedin: "LinkedIn", website: "Website hero" },
  tone: { friendly: "Friendly", funny: "Funny", premium: "Premium", energetic: "Energetic", calm: "Calm", informative: "Informative", emotional: "Emotional", bold: "Bold" }
};

export const PLATFORM_SPECS = {
  reels: { aspect: "9:16", pace: "fast", maxHookSec: 2 },
  shorts: { aspect: "9:16", pace: "fast", maxHookSec: 2 },
  tiktok: { aspect: "9:16", pace: "fast", maxHookSec: 2 },
  meta: { aspect: "1:1", pace: "medium", maxHookSec: 3 },
  youtube: { aspect: "16:9", pace: "medium", maxHookSec: 5 },
  linkedin: { aspect: "1:1", pace: "medium", maxHookSec: 3 },
  website: { aspect: "16:9", pace: "slow", maxHookSec: 4 }
};

// Words people actually type, mapped to signals.
export const LEXICON = {
  category: {
    beauty: ["serum", "skincare", "skin care", "sunscreen", "spf", "moisturiser", "moisturizer", "lipstick", "makeup", "face wash", "facewash", "shampoo", "hair oil", "conditioner", "cream", "lotion", "beauty", "cosmetic", "nail", "kajal", "perfume", "fragrance", "deodorant"],
    fashion: ["saree", "sari", "kurta", "lehenga", "dress", "shoes", "sneakers", "t-shirt", "tshirt", "hoodie", "jeans", "handbag", "bag", "apparel", "clothing", "ethnic wear", "outfit", "jacket", "sandals", "fashion", "streetwear"],
    jewellery: ["necklace", "ring", "earring", "jewellery", "jewelry", "gold", "silver", "bracelet", "watch", "pendant", "bangle", "anklet"],
    tech: ["earbuds", "headphones", "phone", "charger", "gadget", "laptop", "smartwatch", "speaker", "power bank", "powerbank", "camera", "device", "keyboard", "mouse", "tablet", "drone", "router"],
    food: ["snack", "coffee", "tea", "chai", "chocolate", "drink", "juice", "restaurant", "sauce", "masala", "bakery", "cafe", "cookie", "pickle", "granola", "cereal", "ice cream", "food", "meal"],
    fitness: ["gym", "protein", "yoga", "dumbbell", "supplement", "fitness", "workout", "running", "whey", "creatine", "water bottle", "bottle", "treadmill", "resistance band"],
    home: ["candle", "lamp", "bedsheet", "decor", "cookware", "kitchen", "sofa", "cushion", "diffuser", "cleaner", "plant", "mattress", "pillow", "curtain", "furniture", "air purifier"],
    app: ["app", "saas", "software", "platform", "dashboard", "subscription", "extension", "crm", "startup", "ai tool", "website builder", "plugin", "tool"],
    education: ["course", "coaching", "class", "tutor", "learn", "bootcamp", "workshop", "ebook", "cohort", "exam", "upsc", "neet", "jee"],
    finance: ["loan", "credit card", "insurance", "investment", "mutual fund", "upi", "bank", "trading", "budget", "savings", "fintech", "tax"],
    travel: ["hotel", "trip", "travel", "resort", "homestay", "flight", "tour", "villa", "hostel", "staycation"]
  },
  objective: {
    launch: ["launch", "new", "introducing", "coming soon", "just dropped", "debut", "first ever"],
    sales: ["sale", "discount", "offer", "% off", "buy", "conversion", "orders", "sell", "deal", "coupon", "cod", "free shipping", "roas"],
    trust: ["trust", "review", "credib", "testimonial", "proof", "authentic", "honest"],
    leads: ["signup", "sign up", "sign-up", "lead", "demo", "book a call", "waitlist", "register", "enquir", "inquir", "download", "install"],
    awareness: ["awareness", "reach", "brand", "visibility", "followers", "viral", "introduce"]
  },
  tone: {
    funny: ["funny", "humor", "humour", "meme", "comedy", "witty", "hilarious", "quirky", "playful", "sarcastic"],
    premium: ["luxury", "premium", "elegant", "high-end", "classy", "sophisticated", "exclusive"],
    energetic: ["hype", "energetic", "fast", "punchy", "high energy", "exciting"],
    calm: ["calm", "soothing", "asmr", "relax", "cozy", "cosy", "minimal", "aesthetic"],
    emotional: ["emotional", "heartfelt", "story", "touching", "nostalgic", "family"],
    informative: ["professional", "informative", "explain", "educational", "how it works", "tutorial", "clear"],
    bold: ["bold", "edgy", "disruptive", "loud", "confident"],
    friendly: ["friendly", "casual", "relatable", "fun", "warm", "gen z", "genz"]
  },
  platform: {
    shorts: ["shorts", "youtube short"],
    reels: ["reels", "reel", "instagram", "insta"],
    tiktok: ["tiktok", "tik tok"],
    meta: ["facebook", "meta ads", "meta", "fb"],
    youtube: ["youtube", "pre-roll", "preroll", "16:9", "landscape"],
    linkedin: ["linkedin", "b2b"],
    website: ["website", "landing page", "homepage", "hero video"]
  },
  festive: ["diwali", "holi", "eid", "christmas", "rakhi", "raksha bandhan", "navratri", "wedding", "black friday", "onam", "pongal", "new year", "valentine", "mother's day", "festive", "festival", "durga puja", "ganesh"],
  sensory: ["asmr", "texture", "satisfying", "sound", "crunch", "pour", "glow"]
};

// Fallback copy so scripts feel specific even when the brief is short.
export const CATEGORY_DEFAULTS = {
  beauty: { benefit: "skin that still looks fresh at 6 pm", problem: "skin that looks tired by lunch", setting: "a sunlit bathroom counter" },
  fashion: { benefit: "a look that works from class to dinner", problem: "a full wardrobe and nothing to wear", setting: "a bedroom mirror with good daylight" },
  jewellery: { benefit: "a piece you'll wear every single day", problem: "jewellery that only comes out once a year", setting: "a soft velvet surface with warm light" },
  tech: { benefit: "a setup that just works when you need it", problem: "dead batteries and tangled wires", setting: "a clean desk next to a window" },
  food: { benefit: "flavour you'll actually crave", problem: "boring snacks you finish out of habit", setting: "a kitchen counter with morning light" },
  fitness: { benefit: "workouts you'll actually stick to", problem: "motivation that disappears by week two", setting: "a home workout corner" },
  home: { benefit: "a room that feels calm the moment you walk in", problem: "a space that never feels finished", setting: "a cosy living room at golden hour" },
  app: { benefit: "the busywork done in minutes, not hours", problem: "ten tabs open and nothing getting done", setting: "a laptop on a café table" },
  education: { benefit: "a plan that makes progress feel obvious", problem: "hours of studying that don't stick", setting: "a desk with notes and a laptop" },
  finance: { benefit: "knowing exactly where your money goes", problem: "salary gone before the month ends", setting: "a phone screen at a kitchen table" },
  travel: { benefit: "a stay that feels like a real break", problem: "trips that feel more tiring than home", setting: "a balcony with a view" },
  general: { benefit: "an everyday upgrade you'll notice", problem: "putting up with something that should be easier", setting: "a bright, lived-in home" }
};

// HexCoded tools (from hexcoded.ai "The toolset").
export const HEX_TOOLS = {
  "Talking actors": "A real face speaks your script. Pick an actor, type the words, get the video.",
  "Make a custom video": "Describe it in plain words; script, cast and render in one pass.",
  "URL → Ad": "Paste a store or product link and it becomes an ad with your chosen actor.",
  "Creative Studio": "Direct 30+ frontier models for images and video: create, edit, add motion, extend."
};

// Model suggestions per shot type. Names are from HexCoded's model list.
export const SHOT_MODELS = {
  actor: { model: "Veo 3.1", why: "on-camera talent with speech" },
  product: { model: "Kling 3.0", why: "product motion and camera moves" },
  mixed: { model: "Seedance 2.5", why: "people and product in one shot" },
  cinematic: { model: "Veo 3.1", why: "polished, cinematic hero shots" },
  draft: { model: "Seedance 2 Fast", why: "cheap, quick drafts before the final render" },
  still: { model: "Nano Banana Pro", why: "storyboard frames and product stills" }
};

export const HEX_MODELS = {
  video: ["Seedance 2.5", "Seedance 2.0", "Seedance 2 Fast", "Seedance 2 Mini", "Kling 3.0", "Kling 3.0 Turbo", "Veo 3.1", "Veo 3.1 Fast", "Veo 3.1 Lite", "Grok Imagine 1.5", "Hailuo 2.3", "MiniMax H3", "Wan 2.7", "Wan 2.6", "Vidu Q3-Turbo", "LTX-2.3 Fast", "HappyHorse 1.1"],
  image: ["Nano Banana Pro", "Nano Banana 2", "Nano Banana 2 Lite", "GPT Image 2", "GPT Image 1 Mini", "FLUX.2 Max", "FLUX.2 Pro", "FLUX.2 Klein 4B", "Seedream 5.0 Pro", "Seedream 4.5", "Recraft 4.1"],
  edit: ["Kling Omni-Edit", "Kling Motion Control", "Gemini Omni Flash"]
};

// Rough credit maths from hexcoded.ai/pricing: a ~5 s clip starts ~60–90 credits at low res,
// a polished 15 s 1080p ad is ≈2,000 credits, an image from ≈12 credits.
export const CREDIT_RATES = {
  draft: { label: "480p draft", perClip: 75 },
  hd: { label: "1080p", perClip: 667 },
  uhd: { label: "4K", perClip: 1100 },
  still: 12
};

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* p = purpose, s = share of runtime, shot = actor|product|mixed|cinematic
   core = kept in 15 s cuts. v = visual, cam = camera, t = on-screen text */
/* ------------------------------------------------------------------ */

const A = (defaults, overrides) => Object.assign({}, defaults, overrides);
const CAT0 = Object.fromEntries(CATEGORIES.map((c) => [c, 0.4]));
const OBJ0 = Object.fromEntries(OBJECTIVES.map((c) => [c, 0.4]));
const PLAT0 = Object.fromEntries(PLATFORMS.map((c) => [c, 0.4]));
const TONE0 = Object.fromEntries(TONES.map((c) => [c, 0.4]));

export const TEMPLATES = [
  {
    id: "ugc-review", name: "UGC review", family: "Creator", hex: "#FF6B4A",
    summary: "A creator talks to camera about why they switched. Feels native to the feed.",
    bestFor: "Trust and discovery on short-form social",
    tool: "Talking actors", actor: "AI creator or real licensed actor", durations: [15, 30, 45],
    affinity: {
      category: A(CAT0, { beauty: 1, fashion: 0.8, food: 0.9, fitness: 0.9, tech: 0.8, home: 0.7, app: 0.6, finance: 0.5 }),
      objective: A(OBJ0, { trust: 1, awareness: 0.8, sales: 0.8, leads: 0.6 }),
      platform: A(PLAT0, { reels: 1, tiktok: 1, shorts: 0.9, meta: 0.8, youtube: 0.3, website: 0.3 }),
      tone: A(TONE0, { friendly: 1, funny: 0.9, energetic: 0.8, informative: 0.6, premium: 0.2 })
    },
    beats: [
      { p: "hook", s: 0.12, shot: "actor", core: true, v: "Creator holds {product} close to the lens, mid-sentence, as if we walked in on them", cam: "Handheld selfie, slight push-in", t: "Hook" },
      { p: "problem", s: 0.18, shot: "actor", v: "Creator reacts to {problem} in {setting}", cam: "Handheld, natural light", t: "The problem" },
      { p: "intro", s: 0.16, shot: "mixed", core: true, v: "Creator picks up {product} and shows the packaging", cam: "Over-the-shoulder to close-up", t: "{product}" },
      { p: "demo", s: 0.2, shot: "mixed", core: true, v: "Hands use {product}; quick jump-cuts between steps", cam: "Macro close-ups, jump cuts", t: "How I use it" },
      { p: "proof", s: 0.16, shot: "actor", v: "Creator shows the result and reacts honestly", cam: "Mirror or selfie framing", t: "What changed" },
      { p: "cta", s: 0.18, shot: "actor", core: true, v: "Creator points at {product}, then at the on-screen button", cam: "Static selfie, product in frame", t: "{cta}" }
    ],
    variations: [
      { id: "first-impressions", name: "Honest first impressions", tone: "friendly", hook: "personal", pace: "medium", look: "Handheld, window light, lived-in room", description: "A creator shares a real first reaction, no hard sell." },
      { id: "problem-to-product", name: "Problem to product", tone: "friendly", hook: "problem", pace: "medium", look: "Everyday setting, relatable mess", description: "Opens on a relatable annoyance and lands on the product as the fix." },
      { id: "fast-review", name: "60-second verdict", tone: "energetic", hook: "pov", pace: "fast", look: "Fast cuts, bold captions, close-ups", description: "Quick-fire pros, one con, and a verdict. Built for scrolling thumbs." },
      { id: "skit-review", name: "Funny skit review", tone: "funny", hook: "contrarian", pace: "fast", look: "Creator plays two characters, bright light", description: "A two-character sketch: the sceptic versus the convert." }
    ]
  },
  {
    id: "unboxing", name: "Unboxing", family: "Creator", hex: "#F2A93B",
    summary: "The first-open moment: packaging, reveal, first touch. Built on anticipation.",
    bestFor: "Launches, gifting and premium packaging",
    tool: "Make a custom video", actor: "Hands only or AI creator", durations: [15, 30],
    affinity: {
      category: A(CAT0, { tech: 1, beauty: 0.8, jewellery: 0.9, fashion: 0.7, home: 0.6, food: 0.6, app: 0.1, finance: 0.05, education: 0.1, travel: 0.1 }),
      objective: A(OBJ0, { launch: 1, awareness: 0.8, sales: 0.7, trust: 0.5, leads: 0.2 }),
      platform: A(PLAT0, { reels: 1, tiktok: 0.9, shorts: 0.9, meta: 0.6, youtube: 0.6 }),
      tone: A(TONE0, { friendly: 0.8, calm: 0.8, energetic: 0.7, premium: 0.7, emotional: 0.6, funny: 0.5 })
    },
    beats: [
      { p: "hook", s: 0.14, shot: "product", core: true, v: "Sealed box of {product} lands on {setting}", cam: "Top-down, box drops into frame", t: "Hook" },
      { p: "detail", s: 0.18, shot: "product", v: "Hands slide off the sleeve and lift the lid slowly", cam: "Macro, shallow depth of field", t: "First look" },
      { p: "reveal", s: 0.2, shot: "product", core: true, v: "{product} revealed, turned to catch the light", cam: "Slow orbit", t: "{product}" },
      { p: "demo", s: 0.2, shot: "mixed", core: true, v: "First use of {product}, genuine reaction", cam: "Close-up hands, then face", t: "First use" },
      { p: "benefit", s: 0.12, shot: "mixed", v: "Everything that came in the box laid out neatly", cam: "Top-down flat lay", t: "In the box" },
      { p: "cta", s: 0.16, shot: "product", core: true, v: "{product} back in its box, lid half-open", cam: "Static hero angle", t: "{cta}" }
    ],
    variations: [
      { id: "first-look", name: "First look reaction", tone: "friendly", hook: "curiosity", pace: "medium", look: "Desk setup, soft daylight", description: "An honest first-open with small, real reactions." },
      { id: "asmr-unbox", name: "ASMR unbox", tone: "calm", hook: "asmr", pace: "slow", look: "Dark backdrop, crisp sound, no talking", description: "No voiceover. Tape peels, paper rustles, the product clicks." },
      { id: "gift-reveal", name: "Gift reveal", tone: "emotional", hook: "reveal", pace: "medium", look: "Warm fairy lights, wrapped box", description: "Someone opens it as a gift; the reaction sells it." }
    ]
  },
  {
    id: "try-on", name: "Try-on", family: "Fashion", hex: "#D94F8A",
    summary: "Show it worn, in motion, on a real body. Outfit switches and fit checks.",
    bestFor: "Apparel, jewellery and accessories",
    tool: "Make a custom video", actor: "AI model or real licensed actor", durations: [15, 30],
    affinity: {
      category: A(CAT0, { fashion: 1, jewellery: 1, beauty: 0.6, fitness: 0.5, tech: 0.2, app: 0, finance: 0, education: 0, food: 0.05, home: 0.1, travel: 0.2 }),
      objective: A(OBJ0, { sales: 1, launch: 0.8, awareness: 0.8, trust: 0.6, leads: 0.2 }),
      platform: A(PLAT0, { reels: 1, tiktok: 1, shorts: 0.8, meta: 0.7 }),
      tone: A(TONE0, { energetic: 0.9, friendly: 0.9, funny: 0.7, premium: 0.7, emotional: 0.6 })
    },
    beats: [
      { p: "hook", s: 0.14, shot: "actor", core: true, v: "Model in a plain outfit looks into {setting}, then snaps", cam: "Full-length mirror shot", t: "Hook" },
      { p: "reveal", s: 0.2, shot: "actor", core: true, v: "Hard cut: the same model now wearing {product}", cam: "Match cut on the snap", t: "{product}" },
      { p: "detail", s: 0.18, shot: "mixed", v: "Close-ups of fabric, finish and how it moves", cam: "Macro, slow pan", t: "The details" },
      { p: "demo", s: 0.2, shot: "actor", core: true, v: "Model walks, turns and moves naturally in {product}", cam: "Tracking shot, 360 turn", t: "How it moves" },
      { p: "benefit", s: 0.12, shot: "actor", v: "Two quick ways to style it", cam: "Split screen", t: "Style it two ways" },
      { p: "cta", s: 0.16, shot: "actor", core: true, v: "Model poses, product name appears", cam: "Static full-length", t: "{cta}" }
    ],
    variations: [
      { id: "outfit-switch", name: "Outfit switch", tone: "energetic", hook: "pov", pace: "fast", look: "Beat-synced transitions, bright room", description: "Snap, spin, new look. Every transition lands on the beat." },
      { id: "festive-look", name: "Festive look", tone: "emotional", hook: "festive", pace: "medium", look: "Diyas, marigolds, warm light", description: "Getting ready for a celebration, ending with family." },
      { id: "fit-check", name: "Honest fit check", tone: "friendly", hook: "personal", pace: "medium", look: "Bedroom mirror, natural light", description: "Size worn, how it fits, what to pair it with." },
      { id: "expectation-reality", name: "Expectation vs reality", tone: "funny", hook: "contrarian", pace: "fast", look: "Split screen, comic timing", description: "A bad past purchase on the left, this one on the right." }
    ]
  },
  {
    id: "product-demo", name: "Product demo", family: "Explainer", hex: "#2F9E8F",
    summary: "How it works, step by step. Clear, fast and hard to misunderstand.",
    bestFor: "Gadgets, apps and anything with a 'how'",
    tool: "URL → Ad", actor: "Presenter or product-only", durations: [15, 30, 45, 60],
    affinity: {
      category: A(CAT0, { tech: 1, app: 1, home: 0.8, fitness: 0.6, food: 0.5, education: 0.7, finance: 0.7, beauty: 0.5, fashion: 0.2, jewellery: 0.2 }),
      objective: A(OBJ0, { leads: 1, sales: 0.9, launch: 0.8, awareness: 0.5, trust: 0.6 }),
      platform: A(PLAT0, { youtube: 1, website: 1, linkedin: 0.9, meta: 0.8, shorts: 0.7, reels: 0.6, tiktok: 0.5 }),
      tone: A(TONE0, { informative: 1, friendly: 0.8, bold: 0.6, energetic: 0.6, calm: 0.5, funny: 0.3 })
    },
    beats: [
      { p: "hook", s: 0.12, shot: "mixed", core: true, v: "Presenter holds up {product} and asks one sharp question", cam: "Medium shot, eye level", t: "Hook" },
      { p: "problem", s: 0.14, shot: "mixed", v: "Quick montage of {problem}", cam: "Fast montage", t: "The old way" },
      { p: "intro", s: 0.14, shot: "product", core: true, v: "{product} on a clean surface, key parts called out", cam: "Slow push-in", t: "{product}" },
      { p: "demo", s: 0.26, shot: "mixed", core: true, v: "Three steps shown with numbered captions", cam: "Over-the-shoulder, screen or hand close-ups", t: "Step 1 · 2 · 3" },
      { p: "benefit", s: 0.16, shot: "mixed", v: "The result: {benefit}", cam: "Before/after wipe", t: "The result" },
      { p: "cta", s: 0.18, shot: "mixed", core: true, v: "{product} with a clear button and link", cam: "Static, centred", t: "{cta}" }
    ],
    variations: [
      { id: "step-by-step", name: "Step by step", tone: "informative", hook: "question", pace: "medium", look: "Clean studio, numbered captions", description: "Three numbered steps from box to result." },
      { id: "feature-spotlight", name: "Feature spotlight", tone: "bold", hook: "reveal", pace: "fast", look: "Dark studio, rim light, bold type", description: "One killer feature, shown three ways." },
      { id: "daily-routine", name: "In a real day", tone: "friendly", hook: "pov", pace: "medium", look: "Lifestyle, morning to night", description: "Follows someone through a day and shows where it fits." }
    ]
  },
  {
    id: "problem-solution", name: "Problem → solution", family: "Performance", hex: "#3D5AFE",
    summary: "Name the pain in second one, then show the fix. The workhorse of paid social.",
    bestFor: "Conversions and paid social",
    tool: "Talking actors", actor: "AI creator", durations: [15, 30, 45],
    affinity: {
      category: A(CAT0, { app: 1, finance: 1, education: 0.9, fitness: 0.9, beauty: 0.8, home: 0.8, tech: 0.7, food: 0.5, fashion: 0.4, jewellery: 0.2 }),
      objective: A(OBJ0, { sales: 1, leads: 1, trust: 0.6, awareness: 0.5, launch: 0.5 }),
      platform: A(PLAT0, { meta: 1, reels: 0.9, tiktok: 0.9, shorts: 0.8, youtube: 0.7, linkedin: 0.7 }),
      tone: A(TONE0, { bold: 1, friendly: 0.8, funny: 0.8, energetic: 0.8, informative: 0.7, premium: 0.2 })
    },
    beats: [
      { p: "hook", s: 0.12, shot: "actor", core: true, v: "Frustrated creator in {setting}, dealing with {problem}", cam: "Tight close-up", t: "Hook" },
      { p: "problem", s: 0.18, shot: "actor", core: true, v: "Montage of the problem getting worse", cam: "Jump cuts", t: "Sound familiar?" },
      { p: "intro", s: 0.16, shot: "mixed", core: true, v: "{product} enters the frame", cam: "Whip pan to product", t: "{product}" },
      { p: "transformation", s: 0.2, shot: "mixed", v: "Same scene, now calm, thanks to {product}", cam: "Before/after split", t: "Before / after" },
      { p: "proof", s: 0.14, shot: "actor", v: "Creator lists the one result that mattered", cam: "Medium, direct to camera", t: "What changed" },
      { p: "cta", s: 0.2, shot: "actor", core: true, v: "Creator points to the button", cam: "Static, product in hand", t: "{cta}" }
    ],
    variations: [
      { id: "everyday-frustration", name: "Everyday frustration", tone: "friendly", hook: "problem", pace: "medium", look: "Relatable home setting", description: "A tiny daily annoyance, fixed on screen." },
      { id: "before-after", name: "Before and after", tone: "bold", hook: "reveal", pace: "fast", look: "Split-screen contrast", description: "Hard contrast between life without and with." },
      { id: "myth-buster", name: "Myth buster", tone: "bold", hook: "contrarian", pace: "fast", look: "Text-heavy, confident presenter", description: "Calls out a common belief and replaces it." },
      { id: "funny-rant", name: "Funny rant", tone: "funny", hook: "problem", pace: "fast", look: "Over-the-top reactions, zoom punches", description: "A dramatic rant about the problem, then the calm fix." }
    ]
  },
  {
    id: "testimonial", name: "Testimonial", family: "Social proof", hex: "#7A4DD8",
    summary: "Real-feeling customers explain what changed. Consented, licensed actors make it safe.",
    bestFor: "Trust, reviews and considered purchases",
    tool: "Talking actors", actor: "Real licensed actors", durations: [15, 30, 45, 60],
    affinity: {
      category: A(CAT0, { finance: 1, education: 1, app: 0.9, beauty: 0.8, fitness: 0.8, home: 0.6, travel: 0.8, food: 0.6, tech: 0.6 }),
      objective: A(OBJ0, { trust: 1, leads: 0.9, sales: 0.8, awareness: 0.5, launch: 0.3 }),
      platform: A(PLAT0, { meta: 1, youtube: 0.9, linkedin: 0.9, website: 1, reels: 0.7, shorts: 0.6, tiktok: 0.6 }),
      tone: A(TONE0, { emotional: 1, friendly: 0.9, informative: 0.8, calm: 0.6, premium: 0.5, funny: 0.3 })
    },
    beats: [
      { p: "hook", s: 0.14, shot: "actor", core: true, v: "Customer looks into camera, mid-thought", cam: "Interview framing, off-centre", t: "Hook" },
      { p: "story", s: 0.2, shot: "actor", v: "Customer describes life before: {problem}", cam: "Interview, slow push-in", t: "Before" },
      { p: "intro", s: 0.14, shot: "mixed", core: true, v: "B-roll of customer finding {product}", cam: "Handheld b-roll", t: "{product}" },
      { p: "proof", s: 0.22, shot: "actor", core: true, v: "Customer explains the specific result", cam: "Interview close-up", t: "The result" },
      { p: "benefit", s: 0.12, shot: "mixed", v: "B-roll of customer enjoying {benefit}", cam: "Lifestyle b-roll", t: "Now" },
      { p: "cta", s: 0.18, shot: "actor", core: true, v: "Customer smiles; product and button appear", cam: "Static interview", t: "{cta}" }
    ],
    variations: [
      { id: "customer-story", name: "Customer story", tone: "emotional", hook: "story", pace: "slow", look: "Soft interview lighting", description: "One person, one real change, told slowly." },
      { id: "rating-montage", name: "Review montage", tone: "energetic", hook: "social-proof", pace: "fast", look: "Many faces, quick cuts", description: "Five customers, one sentence each." },
      { id: "expert-take", name: "Expert take", tone: "informative", hook: "question", pace: "medium", look: "Professional setting", description: "A professional explains why it works." }
    ]
  },
  {
    id: "cinematic", name: "Cinematic product film", family: "Brand", hex: "#1F2A44",
    summary: "Mood, light and movement. The product is the hero; words are minimal.",
    bestFor: "Premium launches and brand awareness",
    tool: "Creative Studio", actor: "Product-only", durations: [15, 30, 45],
    affinity: {
      category: A(CAT0, { jewellery: 1, beauty: 0.9, fashion: 0.8, tech: 0.8, travel: 0.9, home: 0.7, food: 0.6, app: 0.1, finance: 0.2, education: 0.1, fitness: 0.5 }),
      objective: A(OBJ0, { launch: 1, awareness: 1, sales: 0.4, trust: 0.4, leads: 0.1 }),
      platform: A(PLAT0, { youtube: 1, website: 1, reels: 0.7, meta: 0.6, shorts: 0.5, tiktok: 0.3, linkedin: 0.4 }),
      tone: A(TONE0, { premium: 1, calm: 0.9, emotional: 0.8, bold: 0.6, funny: 0.05, friendly: 0.2 })
    },
    beats: [
      { p: "hook", s: 0.16, shot: "cinematic", core: true, v: "Darkness; a single light sweeps across {product}", cam: "Slow light sweep, locked off", t: "" },
      { p: "detail", s: 0.2, shot: "cinematic", v: "Extreme close-ups of texture and finish", cam: "Macro slider", t: "" },
      { p: "story", s: 0.18, shot: "cinematic", v: "{product} placed in {setting}", cam: "Crane down", t: "" },
      { p: "reveal", s: 0.2, shot: "cinematic", core: true, v: "Full hero shot of {product}", cam: "Slow orbit, 180°", t: "{product}" },
      { p: "benefit", s: 0.12, shot: "cinematic", v: "One line of copy over a still frame", cam: "Locked off", t: "{benefit}" },
      { p: "cta", s: 0.14, shot: "cinematic", core: true, v: "Logo lock-up with {product}", cam: "Fade to black", t: "{cta}" }
    ],
    variations: [
      { id: "premium-reveal", name: "Premium reveal", tone: "premium", hook: "reveal", pace: "slow", look: "Black studio, hard rim light", description: "Light finds the product, piece by piece." },
      { id: "lifestyle-story", name: "Lifestyle story", tone: "emotional", hook: "story", pace: "slow", look: "Golden hour, shallow focus", description: "The product inside a quiet, aspirational moment." },
      { id: "minimal-film", name: "Minimal brand film", tone: "calm", hook: "reveal", pace: "slow", look: "One colour background, controlled motion", description: "Nothing extra. Colour, shape, product." }
    ]
  },
  {
    id: "founder-story", name: "Founder story", family: "Brand", hex: "#8A6D3B",
    summary: "The founder explains why it exists. Works well with an AI twin.",
    bestFor: "D2C launches, startups and LinkedIn",
    tool: "Talking actors", actor: "Your AI twin", durations: [30, 45, 60],
    affinity: {
      category: A(CAT0, { app: 1, food: 0.8, beauty: 0.8, fashion: 0.7, education: 0.9, finance: 0.8, home: 0.7, travel: 0.6 }),
      objective: A(OBJ0, { launch: 1, trust: 1, awareness: 0.8, leads: 0.7, sales: 0.4 }),
      platform: A(PLAT0, { linkedin: 1, website: 1, youtube: 0.9, reels: 0.6, meta: 0.6 }),
      tone: A(TONE0, { emotional: 1, friendly: 0.9, informative: 0.7, bold: 0.6, calm: 0.5, funny: 0.2 })
    },
    beats: [
      { p: "hook", s: 0.14, shot: "actor", core: true, v: "Founder in their workspace, looking straight at camera", cam: "Medium close-up", t: "Hook" },
      { p: "story", s: 0.2, shot: "actor", core: true, v: "Founder remembers {problem}", cam: "Slow push-in", t: "Why we started" },
      { p: "intro", s: 0.16, shot: "mixed", core: true, v: "Early sketches and first versions of {product}", cam: "Handheld b-roll", t: "{product}" },
      { p: "proof", s: 0.18, shot: "mixed", v: "Team at work, first customers", cam: "B-roll montage", t: "Built with customers" },
      { p: "benefit", s: 0.14, shot: "actor", v: "Founder explains {benefit}", cam: "Medium, warm light", t: "What it does" },
      { p: "cta", s: 0.18, shot: "actor", core: true, v: "Founder invites the viewer in", cam: "Static, direct address", t: "{cta}" }
    ],
    variations: [
      { id: "why-we-built", name: "Why we built it", tone: "emotional", hook: "story", pace: "slow", look: "Warm workspace", description: "The moment that started it all." },
      { id: "behind-scenes", name: "Behind the scenes", tone: "friendly", hook: "curiosity", pace: "medium", look: "Workshop or office b-roll", description: "How it's made, shown honestly." },
      { id: "launch-day", name: "Launch day", tone: "energetic", hook: "reveal", pace: "fast", look: "Countdown energy, team moments", description: "Today's the day. Here it is." }
    ]
  },
  {
    id: "asmr", name: "ASMR sensory", family: "Sensory", hex: "#6FA37A",
    summary: "Sound and texture do the selling. No voiceover, very replayable.",
    bestFor: "Food, beauty and home products",
    tool: "Creative Studio", actor: "Hands only", durations: [15, 30],
    affinity: {
      category: A(CAT0, { food: 1, beauty: 1, home: 1, fitness: 0.5, tech: 0.5, jewellery: 0.6, fashion: 0.4, app: 0, finance: 0, education: 0, travel: 0.3 }),
      objective: A(OBJ0, { awareness: 1, sales: 0.6, launch: 0.6, trust: 0.4, leads: 0.1 }),
      platform: A(PLAT0, { reels: 1, tiktok: 1, shorts: 0.9, meta: 0.5 }),
      tone: A(TONE0, { calm: 1, premium: 0.7, friendly: 0.4, funny: 0.1, bold: 0.1, informative: 0.2 })
    },
    beats: [
      { p: "hook", s: 0.16, shot: "product", core: true, v: "Extreme close-up: the most satisfying texture of {product}", cam: "Macro, locked off", t: "" },
      { p: "detail", s: 0.2, shot: "product", core: true, v: "Hands open, pour, press or tap {product}", cam: "Macro, slow motion", t: "" },
      { p: "demo", s: 0.22, shot: "product", core: true, v: "The product in use, sound up close", cam: "Top-down", t: "" },
      { p: "benefit", s: 0.2, shot: "product", v: "Finished result in {setting}", cam: "Slow pull-back", t: "{benefit}" },
      { p: "cta", s: 0.22, shot: "product", core: true, v: "Product at rest, name fades in", cam: "Static", t: "{cta}" }
    ],
    variations: [
      { id: "texture", name: "Texture close-ups", tone: "calm", hook: "asmr", pace: "slow", look: "Macro, dark backdrop", description: "Nothing but texture and sound." },
      { id: "morning-ritual", name: "Morning ritual", tone: "calm", hook: "pov", pace: "slow", look: "Soft morning light", description: "A slow routine with the product at the centre." },
      { id: "satisfying-loop", name: "Satisfying loop", tone: "energetic", hook: "asmr", pace: "fast", look: "Rhythmic cuts that loop", description: "Edited to loop, so people watch it twice." }
    ]
  },
  {
    id: "festive-offer", name: "Festive offer", family: "Seasonal", hex: "#E0592A",
    summary: "Festival moment plus a clear offer. Diwali, Eid, Rakhi, wedding season, big sales.",
    bestFor: "Sale periods and gifting",
    tool: "URL → Ad", actor: "AI creator or family cast", durations: [15, 30],
    affinity: {
      category: A(CAT0, { jewellery: 1, fashion: 1, food: 0.9, home: 0.9, beauty: 0.8, tech: 0.8, travel: 0.6, app: 0.3, finance: 0.4, education: 0.3 }),
      objective: A(OBJ0, { sales: 1, awareness: 0.6, launch: 0.5, trust: 0.3, leads: 0.4 }),
      platform: A(PLAT0, { reels: 1, meta: 1, shorts: 0.8, tiktok: 0.7, youtube: 0.6 }),
      tone: A(TONE0, { emotional: 0.9, energetic: 0.9, friendly: 0.8, funny: 0.6, premium: 0.6 })
    },
    festiveBoost: 0.35,
    beats: [
      { p: "hook", s: 0.14, shot: "mixed", core: true, v: "Festive home, lights on, {product} in the middle of it", cam: "Wide, slow push-in", t: "Hook" },
      { p: "story", s: 0.18, shot: "actor", v: "Family getting ready; the gift question comes up", cam: "Handheld, warm", t: "The festive rush" },
      { p: "reveal", s: 0.18, shot: "mixed", core: true, v: "{product} unwrapped or worn", cam: "Close-up reveal", t: "{product}" },
      { p: "offer", s: 0.2, shot: "product", core: true, v: "Offer card animates over the product", cam: "Static, bold type", t: "{offer}" },
      { p: "benefit", s: 0.12, shot: "actor", v: "The moment it's used or gifted", cam: "Medium, candid", t: "{benefit}" },
      { p: "cta", s: 0.18, shot: "product", core: true, v: "Product, offer and deadline together", cam: "Static", t: "{cta}" }
    ],
    variations: [
      { id: "sale-countdown", name: "Sale countdown", tone: "energetic", hook: "offer", pace: "fast", look: "Bold type, countdown timer", description: "Deadline-first. The offer is the hero." },
      { id: "gifting-guide", name: "Gifting guide", tone: "friendly", hook: "festive", pace: "medium", look: "Wrapped boxes, warm lights", description: "Who to gift it to, and why it works." },
      { id: "family-moment", name: "Family moment", tone: "emotional", hook: "festive", pace: "slow", look: "Diyas, family, candid moments", description: "A small, warm scene with the product at its centre." }
    ]
  },
  {
    id: "comparison", name: "Us vs them", family: "Performance", hex: "#4A4F59",
    summary: "Side by side against the usual option. No brand-bashing, just a fair test.",
    bestFor: "Crowded categories and switch campaigns",
    tool: "Make a custom video", actor: "AI creator or product-only", durations: [15, 30, 45],
    affinity: {
      category: A(CAT0, { tech: 1, app: 1, finance: 0.9, food: 0.7, home: 0.8, fitness: 0.8, beauty: 0.7, education: 0.6, fashion: 0.3, jewellery: 0.3 }),
      objective: A(OBJ0, { sales: 1, leads: 0.8, trust: 0.7, awareness: 0.4, launch: 0.5 }),
      platform: A(PLAT0, { meta: 1, youtube: 0.9, shorts: 0.8, reels: 0.8, tiktok: 0.8, linkedin: 0.6 }),
      tone: A(TONE0, { bold: 1, informative: 0.9, funny: 0.8, energetic: 0.7, friendly: 0.6, premium: 0.2 })
    },
    beats: [
      { p: "hook", s: 0.12, shot: "mixed", core: true, v: "Split screen: the usual option vs {product}", cam: "Locked off split", t: "Hook" },
      { p: "compare", s: 0.22, shot: "product", core: true, v: "Test 1: same task, both sides", cam: "Split, synchronised", t: "Test 1" },
      { p: "compare", s: 0.22, shot: "product", v: "Test 2: the detail that matters most", cam: "Split close-up", t: "Test 2" },
      { p: "benefit", s: 0.16, shot: "mixed", core: true, v: "Winner highlighted: {benefit}", cam: "Push-in on winning side", t: "The difference" },
      { p: "proof", s: 0.12, shot: "actor", v: "Creator gives a one-line verdict", cam: "Direct to camera", t: "Verdict" },
      { p: "cta", s: 0.16, shot: "mixed", core: true, v: "{product} alone in frame", cam: "Static", t: "{cta}" }
    ],
    variations: [
      { id: "side-by-side", name: "Side-by-side test", tone: "informative", hook: "contrarian", pace: "medium", look: "Clean split screen, labels", description: "Two fair tests, one clear winner." },
      { id: "price-value", name: "Price vs value", tone: "bold", hook: "offer", pace: "fast", look: "Price tags, bold numbers", description: "What you pay versus what you get." },
      { id: "funny-switch", name: "Funny switch", tone: "funny", hook: "contrarian", pace: "fast", look: "Comic split screen", description: "The old option fails in increasingly silly ways." }
    ]
  }
];

/* ------------------------------------------------------------------ */
/* Script lines by purpose and tone family                            */
/* ------------------------------------------------------------------ */

export const TONE_FAMILY = { friendly: "friendly", informative: "friendly", funny: "funny", premium: "premium", calm: "premium", energetic: "energetic", bold: "energetic", emotional: "heartfelt" };

export const LINES = {
  problem: {
    friendly: ["Okay, real talk: {problem} was my whole life.", "If you're dealing with {problem}, same. Every single day."],
    funny: ["Me, fighting {problem} like it owes me money.", "Nobody talks about {problem} and honestly? I'm unwell."],
    premium: ["Some things shouldn't be a compromise.", "You've settled for {problem} long enough."],
    energetic: ["Stop. Accepting. {problem}.", "{problem}? Not anymore."],
    heartfelt: ["For a long time, {problem} just felt normal.", "I didn't realise how much {problem} was costing me."]
  },
  intro: {
    friendly: ["Then I found {product}.", "So a friend told me about {product}."],
    funny: ["Enter {product}, my new favourite personality trait.", "And then {product} walked in like the main character."],
    premium: ["Meet {product}.", "{product}. Made with intention."],
    energetic: ["This is {product}.", "{product}. Let's go."],
    heartfelt: ["That's when {product} came into my life.", "{product} changed the way I see this."]
  },
  demo: {
    friendly: ["Here's how I use it. It takes about a minute.", "Watch: step one, step two, done."],
    funny: ["Step one: use it. Step two: feel smug. That's it.", "It's so easy I was almost offended."],
    premium: ["Every detail, considered.", "Effortless, from the first touch."],
    energetic: ["One, two, three. Done.", "Fast. Simple. Watch this."],
    heartfelt: ["It fits into my mornings without me even thinking.", "It's become a small ritual I look forward to."]
  },
  benefit: {
    friendly: ["The best part? {benefit}.", "Now I actually get {benefit}."],
    funny: ["Result: {benefit}. My ex could never.", "{benefit}. I'm not crying, you're crying."],
    premium: ["{benefit}.", "Designed for {benefit}."],
    energetic: ["{benefit}. Every. Single. Time.", "Hello, {benefit}!"],
    heartfelt: ["What it gave me was {benefit}.", "It's really about {benefit}."]
  },
  proof: {
    friendly: ["I've used it for weeks now and I'm not going back.", "Honestly? It does what it says."],
    funny: ["My mom asked what changed. I said {product}. She stole it.", "Even my most judgmental friend approved. Rare."],
    premium: ["Quality you can feel.", "Once you notice the difference, you can't stop noticing it."],
    energetic: ["People are switching, and here's why.", "The difference is obvious."],
    heartfelt: ["It's the first thing that actually worked for me.", "I wish I'd found this years ago."]
  },
  detail: {
    friendly: ["Look at this finish. So good.", "The little details? They thought of everything."],
    funny: ["Zoom in. Yes, closer. Now admire it.", "The details are so good I'm slightly suspicious."],
    premium: ["Crafted to be noticed up close.", "Texture. Weight. Finish."],
    energetic: ["Check. This. Out.", "Every detail, dialled in."],
    heartfelt: ["You can tell someone cared about this.", "Made slowly, and it shows."]
  },
  story: {
    friendly: ["So here's the story.", "Let me tell you how this started."],
    funny: ["Picture this: me, completely lost.", "Once upon a time, I had no idea what I was doing."],
    premium: ["It began with a simple idea.", "Some stories start quietly."],
    energetic: ["It started with one problem we couldn't ignore.", "We built this because nobody else would."],
    heartfelt: ["I remember the exact moment I knew we had to build this.", "This started at my kitchen table."]
  },
  reveal: {
    friendly: ["And here it is.", "Ta-da. Isn't it lovely?"],
    funny: ["Drumroll please… okay, stop, it's here.", "Behold. Yes, I said behold."],
    premium: ["{product}.", "Revealed."],
    energetic: ["BOOM. {product}.", "Here. It. Is."],
    heartfelt: ["This is the one.", "Worth the wait."]
  },
  transformation: {
    friendly: ["Before, chaos. After, this.", "Same me, same day, so much easier."],
    funny: ["Before: gremlin. After: functioning adult.", "Left: villain arc. Right: redemption arc."],
    premium: ["From ordinary to exceptional.", "The difference is quiet, and unmistakable."],
    energetic: ["Before. After. No contest.", "Watch the switch."],
    heartfelt: ["It's not a big change. It just made everything lighter.", "That small change changed my whole routine."]
  },
  compare: {
    friendly: ["Same test, both sides. Watch.", "Let's make it fair: same task, same time."],
    funny: ["The usual option tried its best. Bless.", "One of these is struggling, and it's not ours."],
    premium: ["Side by side, the choice is clear.", "Compare the details."],
    energetic: ["Head to head. Go.", "Round two. Still no contest."],
    heartfelt: ["I tested both so you don't have to.", "I wanted to be sure, so I compared them properly."]
  },
  offer: {
    friendly: ["And right now there's {offer}.", "Good news: {offer} for a limited time."],
    funny: ["{offer}. Your wallet says thank you.", "{offer}. Yes, really. Go, go, go."],
    premium: ["For a limited time: {offer}.", "An invitation: {offer}."],
    energetic: ["{offer}. Ends soon!", "{offer}. Don't sleep on this."],
    heartfelt: ["This festive season, {offer}.", "Our way of saying thank you: {offer}."]
  },
  cta: {
    friendly: ["{cta} Link's right there.", "Try it yourself. {cta}"],
    funny: ["{cta} Before I buy them all.", "Go. {cta} Thank me later."],
    premium: ["{cta}", "Discover more. {cta}"],
    energetic: ["{cta} Now!", "Don't wait. {cta}"],
    heartfelt: ["{cta} You deserve this.", "When you're ready, {cta}"]
  }
};

/* ------------------------------------------------------------------ */
/* Hooks                                                               */
/* ------------------------------------------------------------------ */

export const HOOKS = {
  personal: ["I didn't expect {product} to become part of my routine.", "Honest review: two weeks with {product}.", "I was so wrong about {product}."],
  problem: ["If {problem} sounds like you, keep watching.", "Tired of {problem}? Same.", "Nobody warned me about {problem}."],
  pov: ["POV: you finally fixed {problem}.", "POV: you found {benefit}.", "POV: {audience} discovers {product}."],
  curiosity: ["Wait till you see what's inside.", "I found the thing everyone's been asking about.", "This is why {audience} are obsessed with {product}."],
  question: ["What if {benefit} took one minute?", "Why does nobody talk about {problem}?", "Do you know the fastest way to {benefitVerb}?"],
  reveal: ["Stop scrolling. This is {product}.", "Three seconds. That's all it takes.", "You've never seen {product} like this."],
  contrarian: ["Stop buying the usual stuff for {problem}.", "Unpopular opinion: you don't need more, you need {product}.", "Everyone's doing this wrong."],
  "social-proof": ["Why are so many {audience} switching to {product}?", "The reviews made me try {product}.", "{audience}, this one's for you."],
  offer: ["{offer} — and it's ending soon.", "The deal you've been waiting for: {offer}.", "Read this before the offer ends."],
  festive: ["The easiest gift you'll buy this season.", "Getting festive-ready with {product}.", "This season, gift {benefit}."],
  asmr: ["(sound on)", "Just listen.", "The most satisfying 3 seconds of your day."],
  story: ["It started with {problem}.", "This is how {product} began.", "Let me tell you why this exists."],
  funny: ["My therapist: 'and what about {problem}?' Me: {product}.", "Tell me you have {problem} without telling me.", "I'm not dramatic, {problem} is literally ruining my life.", "Rating {product} like it's a Bollywood villain."]
};

export const HOOK_COMPANIONS = {
  sales: ["offer", "problem", "social-proof"],
  leads: ["question", "problem", "pov"],
  trust: ["personal", "social-proof", "story"],
  launch: ["reveal", "curiosity", "story"],
  awareness: ["pov", "curiosity", "reveal"]
};

/* ------------------------------------------------------------------ */
/* Help-centre knowledge base (from hexcoded.ai and /pricing)          */
/* ------------------------------------------------------------------ */

export const KB = [
  { id: "what", title: "What is HexCoded?", keys: ["what is hexcoded", "about", "hexcoded", "platform", "studio", "what do you do", "company"],
    answer: "HexCoded is an AI creative studio for creative teams and professionals. It brings 30+ frontier image and video models, 70+ languages and 1,000+ licensed actors into one place, so you can make client-ready video and images without a camera or crew.",
    link: "https://hexcoded.ai/" },
  { id: "tools", title: "Which tools are there?", keys: ["tools", "features", "url to ad", "talking actors", "creative studio", "custom video", "what can i make", "toolset"],
    answer: "There are four live tools: Creative Studio (direct 30+ models for images and video), Talking actors (pick an actor, type the script, get the video), Make a custom video (describe it and get script, cast and render in one pass) and URL → Ad (paste a store or product link and it becomes an ad with your chosen actor).",
    link: "https://hexcoded.ai/#tools" },
  { id: "pick-tool", title: "Which tool should I use?", keys: ["which tool", "should i use", "best tool", "recommend tool", "where do i start", "start"],
    answer: "If you have a product page, start with URL → Ad. If you want a person speaking your script, use Talking actors. If you'd rather describe the whole video in words, use Make a custom video. For full control over individual shots and models, use Creative Studio. The Director in this prototype suggests a tool for every ad plan it writes.",
    link: "https://hexcoded.ai/#tools" },
  { id: "pricing", title: "How much does it cost?", keys: ["price", "pricing", "cost", "plans", "plan", "how much", "subscription", "monthly", "cheap", "expensive", "rupee", "inr", "usd", "dollar"],
    answer: "Plans start from $10 a month. The plans are Basic, Starter, Pro (most popular), Max, Team and Scale. Annual billing saves about 17% (two months free). Every plan is watermark-free with full commercial rights.",
    link: "https://hexcoded.ai/pricing" },
  { id: "free", title: "Is there a free plan?", keys: ["free", "free plan", "trial", "free trial", "without paying", "card"],
    answer: "There's no free plan. Signing up is free and you can browse the full actor library without a card; you subscribe when you're ready to make something.",
    link: "https://hexcoded.ai/pricing#faq" },
  { id: "credits", title: "How do credits work?", keys: ["credit", "credits", "clip cost", "how many credits", "render cost", "balance", "per video", "per image"],
    answer: "Credits are one balance for everything you make. A ~5-second clip starts at about 60–90 credits at lower resolutions and goes up with model and quality; an image starts at about 12 credits. A polished 15-second 1080p ad is roughly 2,000 credits. You always see the exact cost before you generate.",
    link: "https://hexcoded.ai/pricing" },
  { id: "failed", title: "Am I charged for failed renders?", keys: ["failed", "fail", "error render", "charged", "refund credits", "broken"],
    answer: "No. Failed renders are free; you're only charged for renders that succeed.",
    link: "https://hexcoded.ai/pricing#faq" },
  { id: "rollover", title: "Do credits roll over or expire?", keys: ["roll over", "rollover", "credits expire", "expire", "expiry", "carry over", "carry forward", "reset", "top-up", "top up", "topup", "leftover", "unused"],
    answer: "Plan credits reset at the start of each billing cycle and don't roll over. Top-up credits are separate: they're valid for 12 months and you can use them any time while you're subscribed. You can buy a top-up whenever you need more mid-month.",
    link: "https://hexcoded.ai/pricing#faq" },
  { id: "billing", title: "How does billing work?", keys: ["billing", "renew", "upgrade", "downgrade", "cancel", "cancellation", "unsubscribe", "stop my subscription", "lock-in", "contract", "change plan"],
    answer: "Plans renew automatically monthly, or yearly on annual. Upgrades apply immediately with a fresh month of credits; downgrades and cancellations take effect from your next cycle. There's no lock-in.",
    link: "https://hexcoded.ai/pricing#faq" },
  { id: "refund", title: "What's the refund policy?", keys: ["refund", "money back", "refund policy"],
    answer: "Refund terms are in HexCoded's Refund Policy. You're only ever charged for renders that succeed, and cancellations take effect from your next billing cycle.",
    link: "https://hexcoded.ai/legal/refunds" },
  { id: "languages", title: "Which languages are supported?", keys: ["language", "languages", "hindi", "tamil", "telugu", "bengali", "marathi", "kannada", "arabic", "spanish", "french", "german", "japanese", "korean", "mandarin", "voice", "regional", "multilingual", "dub"],
    answer: "70+ languages, regional and international, on every plan. That includes Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Arabic, Spanish, Portuguese, French, German, Japanese, Korean, Mandarin, Indonesian, Vietnamese, Turkish and Italian. The same actor can be narrated natively.",
    link: "https://hexcoded.ai/pricing#faq" },
  { id: "rights", title: "Can I use videos in paid ads?", keys: ["commercial", "rights", "own", "ownership", "paid ads", "license", "licence", "watermark", "use in ads", "copyright"],
    answer: "Yes. Every video you render is yours with full commercial rights on every plan. Run it as a paid ad, on your site or on social. No watermark, no extra licensing and no per-view fees.",
    link: "https://hexcoded.ai/pricing#faq" },
  { id: "actors", title: "What kinds of actors are there?", keys: ["actor", "actors", "avatar", "ai actor", "real actor", "human actor", "twin", "clone", "face", "presenter", "spokesperson"],
    answer: "Three kinds: AI actors from a growing library (or generate your own), your AI twin (clone yourself or your founder once and reuse it), and real licensed actors who consented and get paid every time they're cast.",
    link: "https://hexcoded.ai/#actorlib" },
  { id: "consent", title: "Are real actors safe to use?", keys: ["consent", "safe", "legal", "clearance", "liveness", "paid actors", "ethical", "disclosure", "labelled", "labeled"],
    answer: "Real actors have signed, liveness-verified consent on record and are paid each time they're cast. You get full rights with no watermark, and AI content is labelled. The Actor Licence and AI-Content Disclosure pages have the details.",
    link: "https://hexcoded.ai/legal/actor-licence" },
  { id: "real-actor-plan", title: "Which plans include real actors and Talking actors?", keys: ["which plan real actors", "talking actors plan", "basic plan", "starter plan", "real human actors"],
    answer: "Talking actors and real human actors aren't on Basic; they start from Starter. URL → Ad, Marketing Studio and Creative Studio are on every plan, and every plan includes the full AI actor library.",
    link: "https://hexcoded.ai/pricing" },
  { id: "resolution", title: "What resolutions and formats can I export?", keys: ["resolution", "4k", "1080p", "480p", "quality", "format", "aspect", "9:16", "16:9", "1:1", "vertical", "square", "export"],
    answer: "Every plan supports 9:16, 1:1 and 16:9. Max resolution is 480p on Basic, 1080p on Starter, and 1080p plus 4K on Pro, Max, Team and Scale.",
    link: "https://hexcoded.ai/pricing" },
  { id: "models", title: "Which AI models are available?", keys: ["model", "models", "veo", "kling", "seedance", "sora", "nano banana", "flux", "gpt image", "seedream", "recraft", "hailuo", "wan", "vidu", "grok", "ltx"],
    answer: "Video: Seedance, Kling, Veo, Grok Imagine, Hailuo, MiniMax, Wan, Vidu, LTX and HappyHorse. Images: Nano Banana, GPT Image, FLUX, Seedream and Recraft. Editing: Kling Omni-Edit, Kling Motion Control and Gemini Omni Flash. Basic has a core set, Starter unlocks most models and Pro unlocks all of them. You can switch models mid-project.",
    link: "https://hexcoded.ai/pricing#faq" },
  { id: "team", title: "Can my team share an account?", keys: ["team", "teammates", "members", "seats", "collaborat", "agency", "shared credits", "pool"],
    answer: "Basic to Max are single-user. Team and Scale have unlimited members and a shared credit pool. Scale adds usage analytics, API access and a dedicated manager with an SLA.",
    link: "https://hexcoded.ai/pricing" },
  { id: "api", title: "Is there an API?", keys: ["api", "developer", "integrate", "integration", "automation"],
    answer: "API access is included on the Scale plan.",
    link: "https://hexcoded.ai/pricing" },
  { id: "fdc", title: "What's a forward-deployed creative?", keys: ["forward-deployed", "forward deployed", "dedicated creative", "done for you", "managed", "agency service"],
    answer: "On Scale, a dedicated HexCoded creative is embedded with your brand. They learn your product, sit with your team and run the studio for you, turning briefs into ready-to-run videos.",
    link: "https://hexcoded.ai/pricing#faq" },
  { id: "parallel", title: "How many videos can I generate at once?", keys: ["parallel", "at once", "simultaneous", "concurrent", "queue", "speed", "how fast"],
    answer: "Parallel generations: 2 on Basic, 4 on Starter, 6 on Pro and Max, pooled on Team and custom on Scale.",
    link: "https://hexcoded.ai/pricing" },
  { id: "support", title: "How do I contact support?", keys: ["support", "contact", "human", "help", "email", "talk to someone", "agent", "customer care", "complaint"],
    answer: "Support is chat on Basic, email and chat on Starter, priority on Pro and Max, and a manager with an SLA on Scale. You can also reach the team through the contact page.",
    link: "https://hexcoded.ai/contact" },
  { id: "actors-earn", title: "Can I become a HexCoded actor?", keys: ["become an actor", "for actors", "earn", "get paid", "model for", "join as actor"],
    answer: "Yes. HexCoded has a separate programme for actors, who consent to be cast and are paid every time they're used.",
    link: "https://actors.hexcoded.ai" }
];

export const SUPPORT_SUGGESTIONS = ["How much does it cost?", "How do credits work?", "Which languages are supported?", "Can I use videos in paid ads?", "Which tool should I use?"];

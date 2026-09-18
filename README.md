Ad Director

Live demo:(https://ad-director.vercel.app/)

A tool I built that plans video ads for you. You describe your product in one sentence, and it works out what kind of ad to make, writes the script, and gives you a ready prompt for every shot.

Then you can change anything just by chatting with it — "make scene 2 funnier", "cut it to 15 seconds", "in Hinglish".

What it does

1. Picks the right ad format You type something like "sunscreen for college students, funny Reels, 20% off". It reads that and figures out the category, your goal, the platform and the tone — then ranks 11 ad formats and explains why each one fits.

2. Plans the whole ad You get 5 hook options, a scene-by-scene script with timings, a prompt for each shot, and which AI model to generate it with. It also checks your ad for common mistakes, like a hook that's too slow or a claim you'd need proof for.

3. Answers questions There's a help chatbot in the corner for pricing and plan questions. It answers instantly and shows where the answer came from.

Why I built it

I was looking at AI video tools like HexCoded, LTX Studio and OpenArt. They're all really good at generating video — but you still have to figure out what ad to make in the first place, which is the part I always found hardest.

So I built the planning step. Every plan ends in prompts you can paste straight into a tool like HexCoded to actually generate the video.

Try it locally
bash
npm start

Then open http://localhost:3000. You need Node 20 or newer. There's nothing to install — no dependencies.

To turn on the AI features, copy .env.example to .env and paste a free key from console.groq.com/keys (no card needed).

The interesting part

The AI isn't allowed to control the app.

This was the main thing I wanted to get right. If you let an AI rewrite your whole data structure, one weird response breaks everything. So instead:

The app calculates all the structure itself — scenes, timings, prompts, checks
The AI only sends small edit instructions like "change scene 2's line to this"
Every instruction gets checked before it's applied, and anything invalid is thrown away

Which means the app works completely fine with no AI key at all. If the key is missing, the API is slow, or I hit a rate limit, it quietly falls back to its own built-in engine and tells you it did.

Also, edits like changing the length or platform don't call the AI at all — they're calculated locally, so they're instant.

How it's built

Plain JavaScript, HTML and CSS, with zero libraries. One small Node.js backend function that keeps the API key secret.

public/js/data.js         all the content — templates, script lines, hooks, FAQ
public/js/recommender.js  reads your brief and ranks the templates
public/js/director.js     builds and edits the ad plan
public/js/support.js      the help bot's search
public/js/app.js          the interface
api/chat.js               the backend endpoint

I used Groq's free tier for the AI, with three models set up as fallbacks in case one is down.

Testing
bash
npm test

The tests generate every possible combination of template, style, length, platform and tone — 5,656 different ad plans — and check that none of them break.

That's how I found most of my bugs. My favourite one: short 15-second ads were accidentally deleting the call-to-action scene, which makes the ad useless. I'd never have caught that by clicking around manually.


Notes
An earlier, much rougher version: AdTemplateAI

Built by Vanshika Bhagat.

# Reframe

A browser-based creative tool for urban sketchers, styled as an Etch-a-Sketch device. Pick a real landmark photo, dial in an architectural style and lighting atmosphere with the two knobs, and Reframe generates a restyled scene to sketch from using OpenAI's image-to-image API.

## How it works

1. Browse Unsplash landmarks or upload your own photo as a reference.
2. Turn the **Style** knob (Gothic, Brutalist, Art Deco, Bauhaus, …) and the **Atmosphere** knob (Golden hour, Blue hour, Winter snow, …).
3. Hit **Generate** — the reference is restyled in place, preserving mass and composition.
4. **Regen** to reroll with randomized secondary details, or **shake to clear** (mobile shake, or `Cmd+Shift+Z` / double-click the frame on desktop).

The whole UI is the device — no page chrome, no nav.

## Tech stack

- Next.js 16 (App Router, Turbopack) + React 19
- Tailwind CSS v4
- OpenAI `gpt-image-2` for image-to-image generation (streamed)
- Unsplash API for reference image search
- Deployed on Vercel

## Getting started

Install dependencies and add your API keys to a `.env.local` file at the project root:

```
OPENAI_API_KEY=...
UNSPLASH_ACCESS_KEY=...
```

Then run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> `.env.local` is gitignored — never commit your API keys.

## Project structure

- `app/page.tsx` — mounts the device
- `components/ReframeDevice.tsx` — device shell, knobs, screen-state machine, generation flow
- `components/screens/` — idle, browse, upload, generating, and result screens
- `app/api/generate/route.ts` — builds the prompt and streams the OpenAI image-to-image generation
- `app/api/unsplash/` — Unsplash search proxy

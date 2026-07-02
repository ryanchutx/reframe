You are helping me build a web application called Reframe.

## What it is
A creative tool for urban sketchers to generate architectural reference images to sketch from. Users pick a real-world reference image, apply an architectural style remix and a lighting/atmosphere setting, and generate a novel scene to sketch from using the OpenAI image generation API (image-to-image).

## Tech stack
- Next.js (React)
- Deployed on Vercel
- OpenAI API for image generation (GPT Image 2, image-to-image)
- Unsplash API for browsing landmark reference images

## Core user flow
1. User sees the Reframe device (idle state)
2. User either browses Unsplash landmark images OR uploads their own photo from device
3. User turns the Style knob to pick an architectural style
4. User turns the Atmosphere knob to pick a lighting/time of day
5. User hits Generate
6. Generated image appears inside the frame
7. User can Regen (same knobs, randomized secondary variables injected into prompt) or shake to clear

## UI — critical, implement exactly as described
The entire app is styled as an Etch-a-Sketch device. There is no page chrome, no nav, no sidebar. The device is the app.

- Outer frame: deep red (#CC2200), darker red border (#991900), large rounded corners
- Inner frame: slightly darker red (#B81F00), inset padding around the screen
- Screen: dark (#141414), where all content and states render
- Two circular knobs sit below the screen inside the frame. Left = Style, Right = Atmosphere
- Each knob has a rotating pip that turns visually when the knob is interacted with
- Current knob selection displays as a small monospace text label beneath each knob
- A small monospace "Reframe" wordmark sits centered above the screen
- Nothing exists outside the device frame

## Knob interactions
- Click to cycle forward through options
- Scroll wheel over the knob to turn forward or backward
- Pip rotates visually on every interaction to feel mechanical

## Screen states
All content renders inside the dark screen. States are:

1. Idle
   - Centered hint text: "pick a reference to begin"
   - Two buttons: "browse landmarks" and "upload photo"
   - Generate button visible but disabled

2. Browse
   - Unsplash search input at top of screen
   - 3-column grid of thumbnail results below
   - Tapping a thumbnail selects it (highlighted border)
   - "use selected →" and "← back" buttons at bottom

3. Upload
   - Drag and drop zone centered in screen
   - Tap to open file picker on mobile
   - "← back" button

4. Result
   - Generated image fills the entire screen
   - Small overlay in bottom-right corner with three actions: "← new ref", "↺ regen", "↓ save"

## Knob options
Style: Art Deco, Gothic, Brutalist, Italian Renaissance, Japanese, Mudejar, Bauhaus, Ottoman, Georgian, Modernist

Atmosphere: Golden hour, Midnight, Rainy dusk, Midday sun, Foggy morning, Blue hour, Stormy, Winter snow

## Image generation prompt
Construct the prompt sent to OpenAI like this:

"[Reference building/landmark], reimagined in [Style] architectural style, [Atmosphere] lighting, highly detailed, sketchable composition, strong lines and shadows[, optional regen secondaries]"

Pass the reference image as the image-to-image input. Target outputs that feel architectural and sketchable — strong composition, clear light source, interesting detail — not photorealistic renders.

## Regen behavior
When regen is tapped, keep knob values identical but silently inject 1-2 randomly selected variables from this list into the generation prompt. These never appear in the UI:
- Weather: light rain, heavy fog, light snow, overcast
- Activity: empty and still, sparse foot traffic, bustling crowd, open air market
- Season: spring blossoms, dry summer, autumn leaves, deep winter
- Condition: pristine, weathered and aged, mossy and overgrown

## Shake to clear
- Mobile: listen for DeviceMotionEvent shake gesture
- Desktop: Cmd+Shift+Z keyboard shortcut, or double-click on the red frame border
- On trigger: play a brief scramble animation on the screen (rapid noise/flicker), then fade to black, then reset to idle state

## Responsive layout
- Desktop: landscape device, 16:10 screen aspect ratio, knobs side by side at bottom
- Mobile: portrait device, 9:14 screen aspect ratio, knobs side by side at bottom, generate portrait-oriented images

## Environment variables
OPENAI_API_KEY
UNSPLASH_ACCESS_KEY

Store in .env.local. Do not hardcode keys anywhere.

## Build order
Start here and do not skip ahead:
1. Scaffold Next.js project
2. Build the Etch-a-Sketch device UI with working knobs, desktop and mobile layouts
3. Wire up Unsplash browse and search inside the screen
4. Build the upload flow
5. Implement OpenAI image-to-image generation
6. Add regen with secondary variable injection
7. Add shake-to-clear gesture and scramble animation
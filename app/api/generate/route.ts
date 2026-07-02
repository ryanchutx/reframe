import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Trimmed to 2–3 iconic surface/material cues per style. Geometry-defining
// elements (flying buttresses, central domes, cantilevers, etc.) were removed
// so the model treats the style as a light material/ornament accent rather than
// a structural rebuild.
const STYLE_DESCRIPTIONS: Record<string, string> = {
  "Gothic":
    "pointed-arch window heads and delicate stone tracery, dark weathered limestone surfaces",
  "Islamic":
    "horseshoe-arch window heads with intricate geometric tilework and carved arabesque plasterwork accents",
  "Ottoman":
    "warm honey limestone surfaces with İznik blue-and-white tile accents around openings",
  "Baroque":
    "ornate carved stonework around windows and doors, gilded metalwork accents, curved pediment details",
  "Art Nouveau":
    "wrought-iron floral motifs around openings, ceramic tile and stained-glass accents, sinuous organic surface ornament",
  "Art Deco":
    "stepped geometric ornament around openings, chevron and sunburst motifs, chrome and gilt metal accents",
  "Bauhaus":
    "smooth white render surfaces, total absence of surface ornament, plain glazed openings",
  "Japanese Traditional":
    "exposed hinoki cypress timber accents, shoji-style paneling in openings, natural stone surfaces",
  "Brutalist":
    "raw board-formed exposed concrete surfaces with visible formwork marks and rough aggregate finish",
  "Futuristic":
    "reflective titanium and dichroic glass cladding on existing surfaces, subtle iridescent material accents",
};

const ATMOSPHERE_DESCRIPTIONS: Record<string, string> = {
  "Golden hour":
    "warm golden raking sidelight at low angle, elongated dramatic shadows, 2700K color temperature, amber and orange tones saturating the sky, specular highlights glinting on glass surfaces, sun just above the horizon",
  "Midnight":
    "deep blue-black sky, warm pools of sodium and LED street light on pavement, high contrast between warmly lit windows and dark facade, still cool air, reflective wet-look ground plane",
  "Rainy dusk":
    "overcast purple-grey twilight sky, rain-slicked highly reflective pavement, rain streaks visible on glass surfaces, diffused cool ambient light with no hard shadows, puddle reflections of building lights below",
  "Midday sun":
    "harsh overhead direct sunlight, short crisp shadows directly beneath sills and overhangs, 5500K neutral daylight, high color saturation, bleached highlights on pale stone surfaces, hard-edged white clouds",
  "Foggy morning":
    "diffused flat shadowless light, cool 6000K color temperature, misty atmosphere softening and dissolving distant elements, low-lying ground fog hugging the base, muted desaturated color palette, soft gradient between sky and structure",
  "Blue hour":
    "saturated deep cobalt blue sky just after sunset, balanced ambient twilight and warm interior window light spillage, 10000K sky color contrasting with 2700K interior glow, no direct sun, long imperceptible soft shadows",
  "Stormy":
    "dark roiling cumulonimbus clouds, dramatic shafts of directional grey light breaking through cloud gaps, cool 7000K color temperature, visible rain streaks, high contrast between lit and shadowed mass, wind-motion blur in surrounding trees",
  "Winter snow":
    "flat overcast white sky, snow accumulation on all horizontal ledges sills and rooftops, diffused shadowless 6500K cool neutral light, bare deciduous trees with snow-laden branches, muted and desaturated color palette throughout",
};

const REGEN_POOLS = {
  weather: ["light rain", "heavy fog", "light snow", "overcast"],
  activity: [
    "empty and still",
    "sparse foot traffic",
    "bustling crowd",
    "open air market",
  ],
  season: ["spring blossoms", "dry summer", "autumn leaves", "deep winter"],
  condition: ["pristine", "weathered and aged", "mossy and overgrown"],
} as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const style = formData.get("style") as string | null;
  const atmosphere = formData.get("atmosphere") as string | null;
  const regen = formData.get("regen") === "true";
  const isPortrait = formData.get("portrait") === "true";
  const imageFile = formData.get("image") as File | null;
  const imageUrl = formData.get("imageUrl") as string | null;

  if (!style || !atmosphere) {
    return NextResponse.json(
      { error: "Missing style or atmosphere" },
      { status: 400 }
    );
  }

  if (!imageFile && !imageUrl) {
    return NextResponse.json(
      { error: "Missing image or imageUrl" },
      { status: 400 }
    );
  }

  // Regen secondaries: pick 1–2 random categories
  const secondaries: string[] = [];
  if (regen) {
    const pools = Object.values(REGEN_POOLS) as readonly (readonly string[])[];
    const shuffled = [...pools].sort(() => Math.random() - 0.5);
    const count = Math.random() > 0.5 ? 2 : 1;
    shuffled.slice(0, count).forEach((pool) => secondaries.push(pick(pool)));
  }

  const styleDesc = STYLE_DESCRIPTIONS[style] ?? `${style} architectural style`;
  const atmosphereDesc = ATMOSPHERE_DESCRIPTIONS[atmosphere] ?? `${atmosphere} lighting`;

  // Style is clearly visible but the source building remains the underlying form:
  // mass and silhouette preserved; ornament, framing, and rooflines can shift.
  const prompt = [
    "architectural restyle of the source building photograph",
    "preserve the overall mass, silhouette, and the placement of major windows and doors from the source",
    "identical camera position, framing, and composition as source",
    `apply a clear stylistic touch of architectural influence: ${styleDesc}`,
    "style applied through materials, ornament, window and door framing, eaves, and rooflines — without rebuilding the structure or significantly changing massing",
    atmosphereDesc,
    "shot on medium format digital camera, 24mm tilt-shift lens, f/8 aperture",
    "Architectural Digest editorial quality",
    "authentic materials with realistic surface texture and natural weathering",
    "photographic grain, not illustrated, not rendered, not stylized",
    ...secondaries,
  ].join(", ");

  let image: File;
  try {
    if (imageFile) {
      image = imageFile;
    } else {
      // Fetch Unsplash image server-side to avoid CORS.
      // Request a 1024px-wide version from the CDN — faster to fetch and
      // sufficient for the model's needs.
      const cdnUrl = new URL(imageUrl!);
      cdnUrl.searchParams.set("w", "1024");
      cdnUrl.searchParams.set("q", "80");
      cdnUrl.searchParams.set("fm", "jpg");
      const imgRes = await fetch(cdnUrl.toString());
      if (!imgRes.ok) throw new Error("Failed to fetch reference image");
      const blob = await imgRes.blob();
      image = new File([blob], "reference.jpg", { type: "image/jpeg" });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to load reference";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const size = isPortrait ? "1024x1536" : "1536x1024";
  const PARTIALS = 3;

  // Stream OpenAI events to the client as SSE. Partial-image events are used
  // purely as progress milestones (we don't render their image data).
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // The SDK's images.edit typing doesn't yet expose stream:true; cast through
        // unknown to access the async iterable returned in streaming mode.
        const openaiStream = (await openai.images.edit({
          model: "gpt-image-2",
          image,
          prompt,
          n: 1,
          size,
          // Least-restrictive moderation: default "auto" throws frequent false-positive
          // safety violations on ordinary architectural reference photos.
          moderation: "low",
          stream: true,
          partial_images: PARTIALS,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)) as unknown as AsyncIterable<{
          type?: string;
          partial_image_index?: number;
          b64_json?: string;
          url?: string;
        }>;

        let finalSent = false;
        for await (const event of openaiStream) {
          if (event?.type === "image_generation.partial_image") {
            send({ type: "progress", index: event.partial_image_index, total: PARTIALS });
          } else if (
            !finalSent &&
            (event?.type === "image_generation.completed" || event?.b64_json || event?.url)
          ) {
            finalSent = true;
            if (event.b64_json) {
              send({ type: "done", image: `data:image/png;base64,${event.b64_json}` });
            } else if (event.url) {
              send({ type: "done", image: event.url });
            }
          }
        }

        if (!finalSent) {
          send({ type: "error", message: "No final image returned" });
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Image generation failed";
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

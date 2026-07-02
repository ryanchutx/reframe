"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// Resize + re-encode to JPEG before upload. Reduces a typical phone photo
// from 8–12 MB to ~200 KB, cutting upload time significantly.
function compressImage(blob: Blob, maxDim = 1024, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Compression failed"))),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Image load failed"));
    img.src = url;
  });
}
import Knob from "./Knob";
import IdleScreen from "./screens/IdleScreen";
import BrowseScreen from "./screens/BrowseScreen";
import UploadScreen from "./screens/UploadScreen";
import GeneratingScreen from "./screens/GeneratingScreen";
import ResultScreen from "./screens/ResultScreen";

const STYLES = [
  "Gothic",
  "Islamic",
  "Ottoman",
  "Baroque",
  "Art Nouveau",
  "Art Deco",
  "Bauhaus",
  "Japanese Traditional",
  "Brutalist",
  "Futuristic",
];

const STYLE_DESCRIPTIONS: Record<string, string> = {
  "Gothic": "Medieval European cathedral architecture — pointed arches, soaring spires, and flying buttresses",
  "Islamic": "Andalusian and North African tradition — geometric tilework, horseshoe arches, and ornate courtyards",
  "Ottoman": "Turkish imperial architecture — grand cascading domes, slender minarets, and İznik tilework",
  "Baroque": "17th–18th century European grandeur — dramatic sculptural facades, ornate carvings, theatrical scale",
  "Art Nouveau": "1890–1910 organic movement — sinuous curves, floral ironwork, and nature-inspired ornament",
  "Art Deco": "1920s–30s glamour — stepped geometric ornament, chrome accents, and monumental symmetry",
  "Bauhaus": "German modernist school (1919–33) — pure function, no ornament, industrial materials",
  "Japanese Traditional": "Edo-period timber architecture — curved overhanging eaves, natural materials, garden integration",
  "Brutalist": "1950s–70s raw concrete — monolithic sculptural forms, exposed structure, deep shadow play",
  "Futuristic": "Contemporary avant-garde — fragmented geometry, warped surfaces, and dynamic non-linear form",
};

const ATMOSPHERES = [
  "Golden hour",
  "Midnight",
  "Rainy dusk",
  "Midday sun",
  "Foggy morning",
  "Blue hour",
  "Stormy",
  "Winter snow",
];

type Screen = "idle" | "browse" | "upload" | "generating" | "result";

interface ReferenceImage {
  displayUrl: string;
  blob?: Blob;
  unsplashUrl?: string;
}

export default function ReframeDevice() {
  const [screen, setScreen] = useState<Screen>("idle");
  const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null);
  const [styleIndex, setStyleIndex] = useState(0);
  const [atmosphereIndex, setAtmosphereIndex] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isFadingIn, setIsFadingIn] = useState(false);
  const [progress, setProgress] = useState(0);
  const shakingRef = useRef(false);

  // ── Smooth progress animation ──────────────────────
  // The image API rarely emits mid-generation events, so we drive the bar with a
  // time-based ease that always creeps forward (asymptotic toward 90%), nudged
  // higher by any real streamed progress, then eased to 100% on completion.
  const progressRaf = useRef<number | null>(null);
  const progressStart = useRef(0);
  const eventTarget = useRef(0);
  const progressDone = useRef(false);

  const stopProgressLoop = useCallback(() => {
    if (progressRaf.current != null) {
      cancelAnimationFrame(progressRaf.current);
      progressRaf.current = null;
    }
  }, []);

  const startProgressLoop = useCallback(() => {
    stopProgressLoop();
    progressStart.current = performance.now();
    eventTarget.current = 0;
    progressDone.current = false;
    setProgress(0);

    const TAU = 18000; // ms — controls how quickly the creep approaches 90%
    const tick = (now: number) => {
      if (progressDone.current) {
        setProgress((prev) => {
          const next = prev + (1 - prev) * 0.2;
          return next > 0.995 ? 1 : next;
        });
      } else {
        const elapsed = now - progressStart.current;
        const timed = 0.9 * (1 - Math.exp(-elapsed / TAU));
        const target = Math.max(timed, eventTarget.current);
        setProgress((prev) => (target > prev ? target : prev));
      }
      progressRaf.current = requestAnimationFrame(tick);
    };
    progressRaf.current = requestAnimationFrame(tick);
  }, [stopProgressLoop]);

  useEffect(() => stopProgressLoop, [stopProgressLoop]);

  // ── Shake / clear ──────────────────────────────────
  const triggerShake = useCallback(() => {
    if (shakingRef.current) return;
    shakingRef.current = true;
    setIsShaking(true);

    // Reset state while screen is dark (at ~650ms into the 750ms shake)
    setTimeout(() => {
      setScreen("idle");
      setReferenceImage(null);
      setGeneratedImage(null);
      setError(null);
    }, 650);

    // End shake + start fade-in of the reset idle screen
    setTimeout(() => {
      setIsShaking(false);
      setIsFadingIn(true);
      shakingRef.current = false;
      setTimeout(() => setIsFadingIn(false), 400);
    }, 800);
  }, []);

  // Keyboard shortcut: Cmd+Shift+Z
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey && e.shiftKey && e.key === "Z") {
        e.preventDefault();
        triggerShake();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [triggerShake]);

  // Mobile shake: DeviceMotionEvent
  useEffect(() => {
    let lastMag = 0;
    let lastTime = Date.now();

    const onMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const now = Date.now();
      if (now - lastTime < 150) return;
      lastTime = now;

      const mag = Math.sqrt(
        Math.pow(acc.x ?? 0, 2) +
          Math.pow(acc.y ?? 0, 2) +
          Math.pow(acc.z ?? 0, 2)
      );
      const delta = Math.abs(mag - lastMag);
      lastMag = mag;

      if (delta > 22) triggerShake();
    };

    // iOS 13+ requires permission
    const attach = () => window.addEventListener("devicemotion", onMotion);

    if (
      typeof DeviceMotionEvent !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      typeof (DeviceMotionEvent as any).requestPermission === "function"
    ) {
      // Will be granted on user gesture elsewhere; try attaching anyway
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (DeviceMotionEvent as any)
        .requestPermission()
        .then((perm: string) => {
          if (perm === "granted") attach();
        })
        .catch(() => {});
    } else {
      attach();
    }

    return () => window.removeEventListener("devicemotion", onMotion);
  }, [triggerShake]);

  // ── Double-click on frame border ───────────────────
  const handleFrameDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement;
      if (
        target.closest("[data-screen]") ||
        target.closest("[data-knobs]") ||
        target.closest("[data-generate]")
      )
        return;
      triggerShake();
    },
    [triggerShake]
  );

  // ── Image generation ───────────────────────────────
  const generate = useCallback(
    async (regen = false) => {
      if (!referenceImage) return;

      setScreen("generating");
      setError(null);
      // Drive the bar with a smooth time-based creep; real streamed events (if any)
      // nudge it forward, and completion eases it to 100%.
      startProgressLoop();

      const style = STYLES[styleIndex];
      const atmosphere = ATMOSPHERES[atmosphereIndex];

      const formData = new FormData();
      formData.append("style", style);
      formData.append("atmosphere", atmosphere);
      formData.append("regen", String(regen));
      formData.append(
        "portrait",
        String(typeof window !== "undefined" && window.innerHeight > window.innerWidth)
      );

      if (referenceImage.blob) {
        const compressed = await compressImage(referenceImage.blob);
        formData.append("image", compressed, "reference.jpg");
      } else if (referenceImage.unsplashUrl) {
        formData.append("imageUrl", referenceImage.unsplashUrl);
      }

      try {
        const res = await fetch("/api/generate", { method: "POST", body: formData });
        if (!res.ok || !res.body) {
          // Non-stream error path — server responded with JSON before opening the stream.
          let message = "Generation failed";
          try {
            const data = await res.json();
            message = data.error ?? message;
          } catch {}
          throw new Error(message);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // SSE events are terminated by \n\n. Keep the last (possibly partial) chunk in the buffer.
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const line = chunk.split("\n").find((l) => l.startsWith("data: "));
            if (!line) continue;
            const data = JSON.parse(line.slice(6));
            if (data.type === "progress") {
              const total = (data.total ?? 3) + 1;
              const idx = (data.index ?? 0) + 1;
              eventTarget.current = Math.max(eventTarget.current, idx / total);
            } else if (data.type === "done") {
              setGeneratedImage(data.image);
              // Let the bar ease to 100% before revealing the result.
              progressDone.current = true;
              setTimeout(() => {
                stopProgressLoop();
                setProgress(1);
                setScreen("result");
              }, 500);
            } else if (data.type === "error") {
              throw new Error(data.message ?? "Generation failed");
            }
          }
        }
      } catch (err) {
        stopProgressLoop();
        setError(err instanceof Error ? err.message : "Something went wrong");
        setScreen("idle");
      }
    },
    [referenceImage, styleIndex, atmosphereIndex, startProgressLoop, stopProgressLoop]
  );

  const screenContentClass = [
    "absolute inset-0 overflow-hidden",
    isFadingIn ? "is-fading-in" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const canGenerate = !!referenceImage && screen !== "generating";

  return (
    <div
      className="flex items-center justify-center w-full h-[100dvh] p-6 overflow-hidden"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      {/* Rotate-to-portrait overlay — visible only on short landscape viewports (phones rotated).
          The desktop-style frame needs fluid chrome (Pass 2) before it can fit at this height. */}
      <div className="rotate-overlay" aria-hidden="true">
        <svg
          className="rotate-overlay-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <line x1="11" y1="19" x2="13" y2="19" />
        </svg>
        <span className="rotate-overlay-text">rotate to portrait</span>
      </div>

      {/* ── Outer device frame ────────────────────────── */}
      <div
        onDoubleClick={handleFrameDoubleClick}
        className={`@container relative flex flex-col select-none
          w-[min(100%,calc((100dvh-372px)*9/16+68px))] rounded-[32px]
          pl-[max(16px,env(safe-area-inset-left))]
          pr-[max(16px,env(safe-area-inset-right))]
          pt-[max(16px,env(safe-area-inset-top))]
          pb-[max(20px,env(safe-area-inset-bottom))]
          md:w-[min(880px,92vw)] md:max-h-[100dvh]
          ${isShaking ? "is-shaking" : ""}`}
        style={{
          background: "#CC2200",
          border: "4px solid #991900",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.8), 0 10px 24px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.1), inset 0 -3px 0 rgba(0,0,0,0.25)",
        }}
      >
        {/* Inner frame */}
        <div
          className="flex flex-col flex-1 overflow-hidden rounded-[24px]"
          style={{
            background: "#B81F00",
            padding: "14px 14px 18px",
            boxShadow: "inset 0 2px 8px rgba(0,0,0,0.35)",
          }}
        >
          {/* Wordmark */}
          <div className="flex justify-center mb-3 shrink-0">
            <span
              className="font-mono text-xs tracking-[0.35em] uppercase"
              style={{
                color: "#FF9980",
                fontFamily: "var(--font-geist-mono)",
                textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                letterSpacing: "0.35em",
              }}
            >
              Reframe
            </span>
          </div>

          {/* Screen — 9:16 on mobile, 16:10 on desktop.
              The outer frame's width formula sizes the device so chrome + a true
              9:16 screen fit within the viewport height (no wrap needed). */}
          <div
            data-screen
            className="relative overflow-hidden rounded-lg md:rounded-xl
              aspect-[9/16] md:aspect-[16/10] w-full"
            style={{
              background: "#141414",
              boxShadow:
                "inset 0 4px 16px rgba(0,0,0,0.85), inset 0 2px 4px rgba(0,0,0,0.6), 0 0 0 2px #0a0a0a",
            }}
          >
            {/* Content — absolutely positioned so it never pushes frame dimensions */}
            <div className={screenContentClass}>
              {screen === "idle" && (
                <IdleScreen
                  referenceImage={referenceImage}
                  onBrowse={() => setScreen("browse")}
                  onUpload={() => setScreen("upload")}
                  onClearRef={() => setReferenceImage(null)}
                />
              )}
              {screen === "browse" && (
                <BrowseScreen
                  onSelect={(ref) => {
                    setReferenceImage(ref);
                    setScreen("idle");
                  }}
                  onBack={() => setScreen("idle")}
                />
              )}
              {screen === "upload" && (
                <UploadScreen
                  onSelect={(ref) => {
                    setReferenceImage(ref);
                    setScreen("idle");
                  }}
                  onBack={() => setScreen("idle")}
                />
              )}
              {screen === "generating" && <GeneratingScreen progress={progress} />}
              {screen === "result" && generatedImage && (
                <ResultScreen
                  imageUrl={generatedImage}
                  onNewRef={() => {
                    setReferenceImage(null);
                    setGeneratedImage(null);
                    setScreen("idle");
                  }}
                  onRegen={() => generate(true)}
                />
              )}
            </div>

            {/* Dark overlay during shake — fades screen to black */}
            {isShaking && <div className="screen-darken-overlay" />}
          </div>

          {/* Error banner — fixed height slot so it never shifts the frame */}
          <div className="h-4 mt-2 shrink-0 flex items-center justify-center overflow-hidden">
            {error && screen === "idle" && (
              <p
                className="font-mono text-2xs text-[#FF6644] text-center"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {error}
              </p>
            )}
          </div>

          {/* Knobs + Generate */}
          <div
            data-knobs
            className="flex items-end justify-between mt-5 px-4 shrink-0"
          >
            <Knob
              options={STYLES}
              currentIndex={styleIndex}
              onChange={setStyleIndex}
              label="Style"
              description={STYLE_DESCRIPTIONS[STYLES[styleIndex]]}
            />

            {/* Generate button (center) */}
            <div data-generate className="flex flex-col items-center gap-1.5 pb-0.5">
              <button
                onClick={() => generate(false)}
                disabled={!canGenerate}
                className="font-mono text-xs px-6 py-2.5 rounded-full transition-all disabled:cursor-not-allowed"
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  background: canGenerate ? "#1a1a1a" : "#111",
                  color: canGenerate ? "#ddd" : "#444",
                  border: canGenerate ? "2px solid #333" : "2px solid #222",
                  boxShadow: canGenerate
                    ? "0 4px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)"
                    : "none",
                }}
              >
                {screen === "generating" ? "..." : "generate"}
              </button>
            </div>

            <Knob
              options={ATMOSPHERES}
              currentIndex={atmosphereIndex}
              onChange={setAtmosphereIndex}
              label="Atmosphere"
            />
          </div>

          {/* Knob labels */}
          <div className="flex justify-between px-4 mt-1 shrink-0">
            <span
              className="font-mono text-2xs text-[#CC6644] w-[88px] md:w-[120px] text-center uppercase tracking-widest"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Style
            </span>
            <span
              className="font-mono text-2xs text-[#CC6644] w-[88px] md:w-[120px] text-center uppercase tracking-widest"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              Atmosphere
            </span>
          </div>

          {/* Erase hint */}
          <div className="flex justify-center mt-3 shrink-0">
            <span
              className="font-mono text-2xs text-[#E08866] tracking-wide text-center"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              <span className="hidden md:inline">double-click frame to erase</span>
              <span className="inline md:hidden">shake to erase</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

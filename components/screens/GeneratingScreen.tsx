"use client";

import { useEffect, useState } from "react";

// Whimsical phase labels — one randomly chosen per phase, refreshed on each gen.
const PHASE_LABELS: string[][] = [
  ["warming up the stylus", "loading reference", "shaking the canvas"],
  ["sketching the silhouette", "etching the outline", "tracing the massing"],
  ["drawing the details", "filling the textures", "adding ornament"],
  ["polishing the finish", "wiping the dust", "final touches"],
];

interface Props {
  progress: number; // 0..1
}

export default function GeneratingScreen({ progress }: Props) {
  const phase = Math.min(Math.max(Math.floor(progress * 4), 0), 3);
  const [label, setLabel] = useState(() => PHASE_LABELS[0][Math.floor(Math.random() * PHASE_LABELS[0].length)]);

  useEffect(() => {
    const options = PHASE_LABELS[phase];
    setLabel(options[Math.floor(Math.random() * options.length)]);
  }, [phase]);

  const percent = Math.round(progress * 100);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
      <div className="w-full max-w-[220px] flex flex-col items-center gap-4">
        {/* Bar track */}
        <div
          className="relative w-full h-2.5 rounded-sm overflow-visible"
          style={{
            background: "#0e0e0e",
            border: "1px solid #2a2a2a",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.6)",
          }}
        >
          {/* Fill */}
          <div
            className="h-full rounded-sm"
            style={{
              width: `${progress * 100}%`,
              background: "linear-gradient(90deg, #B81F00 0%, #CC2200 60%, #FF6644 100%)",
              boxShadow: "0 0 6px rgba(204, 34, 0, 0.6)",
            }}
          />
          {/* Stylus dot — leads the bar like an Etch-a-Sketch stylus tip */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
            style={{
              left: `calc(${progress * 100}% - 6px)`,
              background:
                "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, transparent 55%), conic-gradient(from 0deg, #F2EDE0, #E5DECC, #F2EDE0)",
              border: "1px solid #B8AE96",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
          />
        </div>

        {/* Label + percentage */}
        <div className="flex items-center justify-between w-full">
          <p
            className="font-mono text-2xs text-[#E08866] tracking-widest uppercase"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {label}
          </p>
          <p
            className="font-mono text-2xs text-[#E08866] tabular-nums"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {percent}%
          </p>
        </div>
      </div>
    </div>
  );
}

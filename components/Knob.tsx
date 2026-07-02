"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface KnobProps {
  options: string[];
  currentIndex: number;
  onChange: (index: number) => void;
  label: string;
  description?: string;
}

export default function Knob({ options, currentIndex, onChange, label, description }: KnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const tooltipWrapRef = useRef<HTMLDivElement>(null);
  // Accumulated rotation — never resets to 0, so the pip always turns
  // in the correct direction without snapping back across the wrap point.
  const [rotation, setRotation] = useState(0);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const stepDeg = 360 / options.length;

  // Dismiss tooltip on outside tap/click (needed for touch — hover doesn't fire).
  useEffect(() => {
    if (!tooltipOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!tooltipWrapRef.current?.contains(e.target as Node)) {
        setTooltipOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [tooltipOpen]);

  const advance = useCallback(
    (delta: number) => {
      const next = ((currentIndex + delta) % options.length + options.length) % options.length;
      setRotation((r) => r + delta * stepDeg);
      onChange(next);
    },
    [currentIndex, options.length, onChange, stepDeg]
  );

  const handleClick = useCallback(() => advance(1), [advance]);

  useEffect(() => {
    const el = knobRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      advance(e.deltaY > 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [advance]);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div
        ref={knobRef}
        className="knob-body"
        onClick={handleClick}
        role="slider"
        aria-label={`${label}: ${options[currentIndex]}`}
        aria-valuetext={options[currentIndex]}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") advance(1);
          if (e.key === "ArrowLeft" || e.key === "ArrowUp") advance(-1);
        }}
      >
        <div
          className="knob-pip-ring"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div className="knob-pip" />
        </div>
      </div>

      {/* Label area — name centered, info icon stacked directly below.
          Name span has a fixed 2-line height so the frame never resizes when names wrap.
          Width grows on desktop to fit longer two-word names ("Foggy morning") at the
          larger fluid text-xs. */}
      <div className="flex flex-col items-center gap-1 w-[88px] md:w-[120px]">
        <span
          className="flex items-start justify-center w-full font-mono text-center leading-tight text-xs text-[#CC9988] h-[40px] overflow-hidden"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {options[currentIndex]}
        </span>

        {/* Icon row — always rendered so knobs with/without description share the same label height */}
        <div ref={tooltipWrapRef} className="group relative h-3 flex items-center justify-center">
          {description && (
            <>
              <button
                type="button"
                aria-label={`About ${options[currentIndex]}`}
                aria-expanded={tooltipOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setTooltipOpen((o) => !o);
                }}
                className="relative inline-flex items-center justify-center w-3 h-3 rounded-full border border-[#E08866] text-[#E08866] text-[7px] font-bold leading-none cursor-help transition-colors group-hover:border-[#FFCCAA] group-hover:text-[#FFCCAA] before:absolute before:-inset-3 before:content-['']"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                i
              </button>

              {/* Tooltip — pops downward so it doesn't cover the style name.
                  Visible on hover (mouse) or when toggled open (touch). */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 rounded-md px-3 py-2 text-2xs text-[#999] leading-snug pointer-events-none transition-opacity duration-150 z-50 ${
                  tooltipOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  background: "#111",
                  border: "1px solid #2a2a2a",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
                }}
              >
                {description}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

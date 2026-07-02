"use client";

import { useState, useRef, useCallback, DragEvent, ChangeEvent } from "react";

interface ReferenceImage {
  displayUrl: string;
  blob?: Blob;
  unsplashUrl?: string;
}

interface UploadScreenProps {
  onSelect: (ref: ReferenceImage) => void;
  onBack: () => void;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function UploadScreen({ onSelect, onBack }: UploadScreenProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        setError("Please upload a JPEG, PNG, WebP, or GIF image.");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        setError("Image must be under 20 MB.");
        return;
      }
      setError(null);
      const url = URL.createObjectURL(file);
      onSelect({ displayUrl: url, blob: file });
    },
    [onSelect]
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => inputRef.current?.click()}
          className={`w-full h-full max-h-64 flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-lg cursor-pointer transition-all ${
            isDragging ? "drop-zone-active" : "border-[#333] hover:border-[#444]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            onChange={onInputChange}
            className="hidden"
          />
          <div className="text-3xl opacity-30">⬆</div>
          <p
            className="font-mono text-xs text-[#555] text-center leading-relaxed"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            drag & drop an image
            <br />
            or tap to browse files
          </p>
          {error && (
            <p
              className="font-mono text-2xs text-[#CC2200] text-center"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-[#222]">
        <button
          onClick={onBack}
          className="relative font-mono text-xs text-[#666] hover:text-[#aaa] transition-colors before:absolute before:-inset-3 before:content-['']"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          ← back
        </button>
      </div>
    </div>
  );
}

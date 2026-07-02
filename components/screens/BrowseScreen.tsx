"use client";

import { useState, useCallback, useEffect } from "react";

interface Photo {
  id: string;
  thumb: string;
  regular: string;
  alt: string;
  credit: string;
}

interface ReferenceImage {
  displayUrl: string;
  blob?: Blob;
  unsplashUrl?: string;
}

interface BrowseScreenProps {
  onSelect: (ref: ReferenceImage) => void;
  onBack: () => void;
}

export default function BrowseScreen({ onSelect, onBack }: BrowseScreenProps) {
  const [query, setQuery] = useState("landmarks architecture");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    setSelectedId(null);
    try {
      const res = await fetch(`/api/unsplash?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.photos) setPhotos(data.photos);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(query);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") search(query);
  };

  const selectedPhoto = photos.find((p) => p.id === selectedId);

  const handleUseSelected = async () => {
    if (!selectedPhoto) return;
    setConfirming(true);
    onSelect({
      displayUrl: selectedPhoto.regular,
      unsplashUrl: selectedPhoto.regular,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="flex gap-2 p-3 border-b border-[#222]">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="search landmarks..."
          className="flex-1 bg-[#1a1a1a] text-[#ccc] font-mono text-xs px-3 py-2 rounded border border-[#333] focus:border-[#555] focus:outline-none placeholder:text-[#444]"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        />
        <button
          onClick={() => search(query)}
          className="font-mono text-xs text-[#aaa] hover:text-white bg-[#1a1a1a] hover:bg-[#252525] border border-[#333] hover:border-[#555] px-3 py-2 rounded transition-all"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          go
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span
              className="font-mono text-xs text-[#444]"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              searching...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedId(photo.id)}
                className={`relative aspect-square overflow-hidden rounded transition-all ${
                  selectedId === photo.id
                    ? "ring-2 ring-[#CC2200] ring-offset-1 ring-offset-[#141414]"
                    : "ring-1 ring-transparent hover:ring-[#333]"
                }`}
              >
                <img
                  src={photo.thumb}
                  alt={photo.alt}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-[#222]">
        <button
          onClick={onBack}
          className="relative font-mono text-xs text-[#666] hover:text-[#aaa] transition-colors before:absolute before:-inset-3 before:content-['']"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          ← back
        </button>
        <button
          onClick={handleUseSelected}
          disabled={!selectedId || confirming}
          className="font-mono text-xs px-4 py-1.5 rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white bg-[#CC2200] hover:bg-[#E02400] disabled:bg-[#333] disabled:text-[#666]"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {confirming ? "loading..." : "use selected →"}
        </button>
      </div>
    </div>
  );
}

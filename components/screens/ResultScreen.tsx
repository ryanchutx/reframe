"use client";

interface ResultScreenProps {
  imageUrl: string;
  onNewRef: () => void;
  onRegen: () => void;
}

export default function ResultScreen({
  imageUrl,
  onNewRef,
  onRegen,
}: ResultScreenProps) {
  const handleSave = () => {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `reframe-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="relative w-full h-full">
      <img
        src={imageUrl}
        alt="Generated architectural scene"
        className="w-full h-full object-cover"
      />
      {/* Action overlay */}
      <div className="absolute bottom-3 right-3 flex gap-1.5">
        <button
          onClick={onNewRef}
          title="New reference"
          className="relative font-mono text-2xs text-white/80 hover:text-white bg-black/50 hover:bg-black/75 backdrop-blur-sm px-2.5 py-1.5 rounded transition-all before:absolute before:-inset-y-2 before:-inset-x-1 before:content-['']"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          ← new ref
        </button>
        <button
          onClick={onRegen}
          title="Regenerate"
          className="relative font-mono text-2xs text-white/80 hover:text-white bg-black/50 hover:bg-black/75 backdrop-blur-sm px-2.5 py-1.5 rounded transition-all before:absolute before:-inset-y-2 before:-inset-x-1 before:content-['']"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          ↺ regen
        </button>
        <button
          onClick={handleSave}
          title="Save image"
          className="relative font-mono text-2xs text-white/80 hover:text-white bg-black/50 hover:bg-black/75 backdrop-blur-sm px-2.5 py-1.5 rounded transition-all before:absolute before:-inset-y-2 before:-inset-x-1 before:content-['']"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          ↓ save
        </button>
      </div>
    </div>
  );
}

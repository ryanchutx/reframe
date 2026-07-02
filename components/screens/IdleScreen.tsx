"use client";

interface ReferenceImage {
  displayUrl: string;
  blob?: Blob;
  unsplashUrl?: string;
}

interface IdleScreenProps {
  referenceImage: ReferenceImage | null;
  onBrowse: () => void;
  onUpload: () => void;
  onClearRef: () => void;
}

export default function IdleScreen({
  referenceImage,
  onBrowse,
  onUpload,
  onClearRef,
}: IdleScreenProps) {
  if (referenceImage) {
    return (
      <div className="relative w-full h-full">
        <img
          src={referenceImage.displayUrl}
          alt="Reference"
          className="w-full h-full object-cover"
        />
        <button
          onClick={onClearRef}
          className="absolute top-2 right-2 font-mono text-2xs text-white/60 hover:text-white bg-black/40 hover:bg-black/70 px-2 py-1 rounded transition-all before:absolute before:-inset-3 before:content-['']"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          clear ×
        </button>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-6">
      <p
        className="font-mono text-xs text-[#556] tracking-widest uppercase"
        style={{ fontFamily: "var(--font-geist-mono)" }}
      >
        pick a reference to begin
      </p>
      <div className="flex gap-3">
        <button
          onClick={onBrowse}
          className="font-mono text-xs text-[#aaa] hover:text-white border border-[#333] hover:border-[#555] bg-transparent hover:bg-[#1a1a1a] px-4 py-2 rounded transition-all"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          browse landmarks
        </button>
        <button
          onClick={onUpload}
          className="font-mono text-xs text-[#aaa] hover:text-white border border-[#333] hover:border-[#555] bg-transparent hover:bg-[#1a1a1a] px-4 py-2 rounded transition-all"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          upload photo
        </button>
      </div>
    </div>
  );
}

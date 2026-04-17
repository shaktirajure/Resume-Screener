"use client";

import { useRef, useState } from "react";

export function FileDrop({
  label,
  accept,
  onFile,
  file,
}: {
  label: string;
  accept: string;
  onFile: (f: File | null) => void;
  file: File | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border border-dashed cursor-pointer transition-all p-6 ${
        drag ? "border-accent bg-accent/5" : "border-ink/30 hover:border-ink"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => onFile(e.target.files?.[0] || null)}
        className="hidden"
      />
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted mb-2">
        {label}
      </div>
      {file ? (
        <div className="flex items-center justify-between">
          <div>
            <div className="font-display text-lg truncate max-w-[260px]">
              {file.name}
            </div>
            <div className="font-mono text-xs text-muted mt-1">
              {(file.size / 1024).toFixed(1)} kb
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFile(null);
            }}
            className="font-mono text-xs text-muted hover:text-accent"
          >
            remove
          </button>
        </div>
      ) : (
        <div className="font-display text-lg text-muted">
          drop a file or click to browse
        </div>
      )}
    </div>
  );
}

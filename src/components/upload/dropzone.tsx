'use client';

import { useCallback, useState } from 'react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function Dropzone({ onFilesSelected, disabled }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      );
      if (files.length > 0) onFilesSelected(files);
    },
    [onFilesSelected, disabled]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) onFilesSelected(files);
      e.target.value = '';
    },
    [onFilesSelected]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl p-10 transition-all duration-200 ${
        isDragging
          ? 'bg-[var(--accent-soft)] shadow-[var(--shadow-glow-accent)]'
          : 'bg-[var(--surface-1)] shadow-[var(--shadow-sm)] hover:bg-[var(--surface-2)] hover:shadow-[var(--shadow-md)]'
      } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
    >
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        onChange={handleFileInput}
        className="absolute inset-0 cursor-pointer opacity-0"
        disabled={disabled}
      />

      <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors ${
        isDragging ? 'bg-[var(--accent)]/20' : 'bg-[var(--surface-2)]'
      }`}>
        <svg
          className={`h-6 w-6 transition-colors ${isDragging ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
      </div>

      <p className={`text-base font-medium transition-colors ${isDragging ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
        Drop UI screenshots here, or click to browse
      </p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        PNG, JPG, WebP — 8 to 20 images recommended
      </p>
    </div>
  );
}

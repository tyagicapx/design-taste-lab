'use client';

import Image from 'next/image';

export interface ReferenceItem {
  id: string;
  filename: string;
  path: string;
  annotations?: { tags: string[]; note: string } | null;
}

interface ReferenceGridProps {
  references: ReferenceItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

const TAG_COLORS: Record<string, string> = {
  layout: 'bg-blue-500/15 text-blue-400',
  typography: 'bg-purple-500/15 text-purple-400',
  color: 'bg-amber-500/15 text-amber-400',
  surface: 'bg-emerald-500/15 text-emerald-400',
  overall_vibe: 'bg-rose-500/15 text-rose-400',
};

export function ReferenceGrid({
  references,
  selectedId,
  onSelect,
  onRemove,
}: ReferenceGridProps) {
  if (references.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {references.map((ref) => (
        <div
          key={ref.id}
          onClick={() => onSelect(ref.id)}
          className={`group relative cursor-pointer overflow-hidden rounded-2xl transition-all duration-200 ${
            selectedId === ref.id
              ? 'shadow-[0_0_0_2px_var(--accent),var(--shadow-glow-accent)]'
              : 'bg-[var(--surface-1)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:scale-[1.02]'
          }`}
        >
          <div className="aspect-[4/3] bg-[var(--surface-2)]">
            <Image
              src={ref.path}
              alt={ref.filename}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          </div>
          <div className="p-3">
            <p className="truncate text-xs font-medium text-[var(--text-secondary)]">{ref.filename}</p>
            {ref.annotations && ref.annotations.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {ref.annotations.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${TAG_COLORS[tag] || 'bg-[var(--surface-3)] text-[var(--text-muted)]'}`}
                  >
                    {tag.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(ref.id);
            }}
            className="absolute right-2 top-2 hidden rounded-xl bg-black/70 p-1.5 text-[var(--text-muted)] backdrop-blur-sm transition-colors hover:text-white group-hover:block"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

/**
 * Stand-in for a missing image or video: a light gray patch with a note
 * for Ryker. Same size as the asset it replaces. (Meeples only live in the
 * Village now.)
 */
export function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`Placeholder: ${label}`}
      className={`relative flex bg-grid/50 items-center justify-center overflow-hidden border-y border-grid ${className ?? ""}`}
    >
      <span className="bg-bg px-2 py-1 text-center font-serif text-xs text-muted uppercase">
        TODO(ryker): {label}
      </span>
    </div>
  );
}

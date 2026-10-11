import { Meeple } from "@/components/Meeple";

/**
 * Stand-in for a missing image or video: a light gray patch with a note
 * for Ryker and a meeple keeping it warm. Same size as the asset it replaces.
 */
export function Placeholder({ label, className }: { label: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label={`Placeholder: ${label}`}
      className={`relative flex bg-grid/50 items-center justify-center overflow-hidden border-y border-grid ${className ?? ""}`}
    >
      <span className="bg-bg px-2 py-1 text-center font-pixel text-xs text-muted uppercase">
        TODO(ryker): {label}
      </span>
      {/* The Sleepy One, napping on the job. */}
      <span aria-hidden="true" className="absolute bottom-0 left-[44px] flex items-end gap-1">
        <Meeple color="var(--color-meeple-blue)" />
        <span className="mb-[46px] font-pixel text-[10px] leading-none text-accent">z</span>
      </span>
    </div>
  );
}

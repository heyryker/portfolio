/**
 * The small blue pixel square used as punctuation, bullets, section markers
 * and the home mark. Size it with width/height (em units scale it with type).
 * `light` uses the paler blue the headline's cut-out squares rest in.
 */
export function PixelSquare({ className, light, ...props }: React.ComponentProps<"span"> & { light?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block ${light ? "bg-accent-light" : "bg-accent"} ${className ?? ""}`}
      {...props}
    />
  );
}

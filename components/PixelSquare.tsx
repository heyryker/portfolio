/**
 * The small blue pixel square used as punctuation, bullets, section markers
 * and the home mark. Size it with width/height (em units scale it with type).
 */
export function PixelSquare({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block bg-accent ${className ?? ""}`}
      {...props}
    />
  );
}

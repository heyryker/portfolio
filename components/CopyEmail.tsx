"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

/** Click-to-copy for the email address, with a small witty confirmation (§6). */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2400);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(email).then(() => setCopied(true), () => {});
          trackEvent("Email copy", { from: window.location.pathname });
        }}
        className="cursor-pointer text-sm tracking-[0.08em] text-muted uppercase transition-colors hover:text-accent focus-visible:text-accent"
      >
        [COPY]
      </button>
      {/* TODO(ryker): approve line */}
      <span aria-live="polite" className="font-pixel text-xs text-accent">
        {copied ? "Copied. Your move." : ""}
      </span>
    </span>
  );
}

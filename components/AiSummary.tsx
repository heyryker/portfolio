"use client";

import { useId, useState } from "react";

/**
 * The "AI summary" button at the top of each case study and blog post: a
 * 30-second read for a hiring manager who won't scroll the whole page.
 *
 * The points are written ahead of time (by Claude, from the page's own copy)
 * and stored next to the content: `aiSummary` in a case study's `meta`, or an
 * `aiSummary:` list in a blog post's frontmatter. So there's no live model
 * call, API key or cost, and the text never says something the page doesn't.
 * Edit them like any other copy.
 */
export function AiSummary({ points }: { points: string[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  if (!points.length) return null;

  return (
    <div className="ai-summary">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="landing-button cursor-pointer gap-2 text-accent"
      >
        <Sparkle />
        {open ? "Hide summary" : "AI summary"}
      </button>
      <div id={panelId} hidden={!open} className="ai-summary-panel">
        <ul>
          {points.map((point, i) => (
            <li key={point} style={{ "--i": i } as React.CSSProperties}>
              {point}
            </li>
          ))}
        </ul>
        {/* TODO(ryker): approve line */}
        <p className="mt-3 font-pixel text-xs text-muted">Summarized by AI from this page. The long version is below.</p>
      </div>
    </div>
  );
}

/** A pixel sparkle (a plus) on a 5×5 grid, crisp like the meeples. */
function Sparkle() {
  return (
    <svg aria-hidden="true" viewBox="0 0 5 5" width="1em" height="1em" shapeRendering="crispEdges" fill="currentColor">
      <rect x="2" y="0" width="1" height="5" />
      <rect x="0" y="2" width="5" height="1" />
    </svg>
  );
}

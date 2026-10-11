"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A muted looping video that only downloads once it's about to scroll into
 * view, and pauses while it's off screen. `autoPlay` on a plain <video> makes
 * the browser fetch it on page load whatever `preload` says, which on the
 * Motion page meant ~18 MB of video before anyone scrolled.
 */
export function LazyVideo({
  src,
  poster,
  alt,
  className,
}: {
  src: string;
  poster?: string;
  alt: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // The first time, setting src with autoPlay starts it. After that,
          // resume it. Muted, so browsers allow it; ignore one that doesn't.
          setNear(true);
          if (video.currentSrc) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "50% 0px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={near ? src : undefined}
      poster={poster}
      aria-label={alt}
      autoPlay={near}
      muted
      loop
      playsInline
      preload="none"
      className={className}
    />
  );
}

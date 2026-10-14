"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/Icon";

/** Fired when one video turns its sound on, so any other goes quiet. */
const SOUND_ON = "lazyvideo:sound-on";

/**
 * A looping video that only downloads once it's about to scroll into view,
 * and pauses while it's off screen. `autoPlay` on a plain <video> makes the
 * browser fetch it on page load whatever `preload` says, which on the Motion
 * page meant ~18 MB of video before anyone scrolled.
 *
 * It starts muted, since browsers only autoplay muted video, with a button in
 * the corner to turn the sound on and off. Only one video plays sound at a
 * time: turning one on mutes the rest.
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
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // The first time, setting src with autoPlay starts it. After that,
          // resume it. Ignore a browser that refuses.
          setNear(true);
          if (video.currentSrc) video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "50% 0px" },
    );
    observer.observe(video);

    const onSoundOn = (e: Event) => {
      if (e.target !== video) setMuted(true);
    };
    window.addEventListener(SOUND_ON, onSoundOn, { capture: true });
    return () => {
      // Closing a case study hides it rather than unmounting it, and a
      // hidden video would keep playing its sound.
      video.pause();
      observer.disconnect();
      window.removeEventListener(SOUND_ON, onSoundOn, { capture: true });
    };
  }, []);

  // React doesn't keep the `muted` attribute in sync after the first render,
  // so set the property directly.
  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    const next = !muted;
    setMuted(next);
    if (!next) {
      video.muted = false;
      video.dispatchEvent(new Event(SOUND_ON, { bubbles: true }));
      // Turning the sound on is a request to hear it, so start it if it
      // hasn't loaded or was paused.
      setNear(true);
      video.play().catch(() => {});
    }
  };

  return (
    <div className="relative">
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
      <button
        type="button"
        onClick={toggle}
        aria-pressed={!muted}
        aria-label={muted ? "Turn sound on" : "Turn sound off"}
        className="video-sound"
      >
        <Icon name={muted ? "volume_off" : "volume_up"} className="size-6" />
      </button>
    </div>
  );
}

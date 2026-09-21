"use client";

import { useRef, useState } from "react";
import posthog from "posthog-js";

// Plays muted on arrival (the captions are burned in, so it reads without
// sound). One tap restarts it from the top with sound.
export default function FounderVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  const withSound = () => {
    const video = ref.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = false;
    video.loop = false;
    video.controls = true;
    void video.play();
    setMuted(false);
    posthog.capture("ai_video_unmuted");
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-dark shadow-[0_24px_60px_-24px_rgba(13,13,13,0.45)]">
      <video
        ref={ref}
        className="block aspect-[720/536] w-full object-cover"
        src="/ai-founder.mp4"
        poster="/ai-founder-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      {muted && (
        <button
          type="button"
          onClick={withSound}
          className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/55 via-transparent to-transparent pb-5 md:pb-7"
        >
          <span className="inline-flex items-center gap-2.5 rounded-full bg-white px-5 py-3 font-sans text-[15px] font-semibold text-dark shadow-lg md:text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-coral text-[11px] text-white" aria-hidden="true">
              ▶
            </span>
            Tap to watch with sound
          </span>
        </button>
      )}
    </div>
  );
}

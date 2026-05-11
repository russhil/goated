"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeFirstInteraction } from "@/lib/firstInteraction";

const VIDEO_SRC = "/showreel.mp4";
const VTT_SRC = "/showreel.vtt";
const POSTER_SRC = "/showreel-poster.jpg";
const PLAYBACK_RATE = 1.2;

export default function VideoShowreel() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasLoaded = useRef(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = videoRef.current;
          if (!video) return;

          if (entry.isIntersecting) {
            if (!hasLoaded.current) {
              video.load();
              hasLoaded.current = true;
              const track = video.textTracks?.[0];
              if (track) track.mode = "showing";
            }

            video.playbackRate = PLAYBACK_RATE;

            video
              .play()
              .then(() => {
                setIsPaused(false);
                setIsMuted(video.muted);
              })
              .catch(() => {
                // Autoplay blocked — try again muted.
                video.muted = true;
                setIsMuted(true);
                video
                  .play()
                  .then(() => setIsPaused(false))
                  .catch(() => setIsPaused(true));
              });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  // Safari resets playbackRate when metadata loads — re-apply it.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const apply = () => {
      video.playbackRate = PLAYBACK_RATE;
    };
    video.addEventListener("loadedmetadata", apply);
    video.addEventListener("play", apply);
    return () => {
      video.removeEventListener("loadedmetadata", apply);
      video.removeEventListener("play", apply);
    };
  }, []);

  // Auto-unmute the moment the user has interacted with the page. The shared
  // listeners are registered by VideoShowreelLazy on initial page load (this
  // component doesn't mount until scroll, so it'd miss the first event itself).
  // If interaction already happened before we mounted, subscribeFirstInteraction
  // fires our callback synchronously.
  useEffect(() => {
    return subscribeFirstInteraction(() => {
      const video = videoRef.current;
      if (!video) return;
      if (video.muted) {
        video.muted = false;
        video.volume = 0.5;
        setIsMuted(false);
      }
    });
  }, []);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !video.muted;
    video.muted = next;
    if (!next) video.volume = 0.5;
    setIsMuted(next);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPaused(false)).catch(() => setIsPaused(true));
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  return (
    <section
      ref={sectionRef}
      className="px-6 md:px-12 py-16 md:py-24 max-w-[1400px] mx-auto"
    >
      <div className="section-label">{"// showreel"}</div>
      <h2
        className="font-serif text-dark leading-[1.15] mb-10 md:mb-14"
        style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}
      >
        We&apos;re GOATED. <span className="italic text-coral">See for yourself.</span>
      </h2>

      <div className="relative rounded-2xl overflow-hidden bg-dark shadow-[0_24px_80px_-24px_rgba(13,13,13,0.45)] group">
        <video
          ref={videoRef}
          className="w-full h-auto block"
          playsInline
          autoPlay
          muted
          loop
          preload="none"
          poster={POSTER_SRC}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
          <track
            kind="subtitles"
            src={VTT_SRC}
            srcLang="en"
            label="English"
            default
          />
        </video>

        <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300">
          <button
            onClick={togglePlay}
            aria-label={isPaused ? "Play video" : "Pause video"}
            className="w-9 h-9 md:w-10 md:h-10 inline-flex items-center justify-center rounded-full bg-white/95 backdrop-blur text-dark shadow-lg hover:bg-coral hover:text-white transition-colors duration-200"
          >
            {isPaused ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 4 20 12 6 20 6 4" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            className="w-9 h-9 md:w-10 md:h-10 inline-flex items-center justify-center rounded-full bg-white/95 backdrop-blur text-dark shadow-lg hover:bg-coral hover:text-white transition-colors duration-200"
          >
            {isMuted ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

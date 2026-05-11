// Tracks whether the user has interacted (scroll/click/key/touch) at least once
// in the current page load. Browsers gate "autoplay with sound" on a user
// gesture, so the showreel starts muted and listens for the first gesture to
// flip itself unmuted.
//
// Lives outside React so it survives the lazy-mount gap: the listeners must
// register on initial page load (well before <VideoShowreel /> mounts on
// scroll), or the user's first scroll is missed.

let fired = false;
const callbacks = new Set<() => void>();

export function hasFirstInteractionFired(): boolean {
  return fired;
}

export function subscribeFirstInteraction(cb: () => void): () => void {
  if (fired) {
    cb();
    return () => {};
  }
  callbacks.add(cb);
  return () => {
    callbacks.delete(cb);
  };
}

export function initFirstInteractionListeners(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & { __firstInteractionInit?: boolean };
  if (w.__firstInteractionInit) return;
  w.__firstInteractionInit = true;

  const trigger = () => {
    if (fired) return;
    fired = true;
    callbacks.forEach((cb) => cb());
    callbacks.clear();
  };

  const opts: AddEventListenerOptions = { once: true, passive: true };
  window.addEventListener("scroll", trigger, opts);
  window.addEventListener("pointerdown", trigger, opts);
  window.addEventListener("keydown", trigger, opts);
  window.addEventListener("touchstart", trigger, opts);
}

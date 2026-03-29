import { useEffect, RefObject } from "react";

export function useRevealOnScroll(ref: RefObject<HTMLElement | null>, threshold = 0.1) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reveals = el.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            // Optional: unobserve after revealing if you only want it to happen once
            // observer.unobserve(entry.target); 
          }
        });
      },
      { threshold }
    );
    reveals.forEach((r) => observer.observe(r));
    return () => observer.disconnect();
  }, [ref, threshold]);
}

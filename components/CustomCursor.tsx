"use client";

import { useEffect, useRef } from "react";
import { useBooking } from "./BookingProvider";

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const isHovering = useRef(false);
  const { isOpen } = useBooking();

  useEffect(() => {
    // Hide on mobile
    if (window.matchMedia("(max-width: 768px)").matches) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMouseMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseOver = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (
        el.tagName === "A" ||
        el.tagName === "BUTTON" ||
        el.closest("a") ||
        el.closest("button")
      ) {
        isHovering.current = true;
      }
    };

    const onMouseOut = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (
        el.tagName === "A" ||
        el.tagName === "BUTTON" ||
        el.closest("a") ||
        el.closest("button")
      ) {
        isHovering.current = false;
      }
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);

    let raf: number;
    const animate = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.3;
      pos.current.y += (target.current.y - pos.current.y) * 0.3;

      const size = isHovering.current ? 40 : 20;

      if (cursor) {
        cursor.style.transform = `translate(${pos.current.x - size / 2}px, ${pos.current.y - size / 2}px)`;
        cursor.style.width = `${size}px`;
        cursor.style.height = `${size}px`;
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseover", onMouseOver);
      document.removeEventListener("mouseout", onMouseOut);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Toggle the body class that hides the native cursor. Adding the class
  // makes `* { cursor: none }` apply (see globals.css); removing it restores
  // the native cursor. We pull the class while the booking modal is open so
  // users can read/click Cal.com normally.
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (window.matchMedia("(max-width: 768px)").matches) return;

    if (isOpen) {
      document.body.classList.remove("cursor-hidden");
    } else {
      document.body.classList.add("cursor-hidden");
    }
    return () => {
      document.body.classList.remove("cursor-hidden");
    };
  }, [isOpen]);

  return (
    <div
      ref={cursorRef}
      className={`fixed top-0 left-0 pointer-events-none z-[9999] rounded-full hidden md:block transition-opacity duration-200 ${
        isOpen ? "opacity-0" : "opacity-100"
      }`}
      style={{
        width: 20,
        height: 20,
        background: "rgba(232, 83, 58, 0.5)",
        transition: "width 0.2s ease, height 0.2s ease, opacity 0.2s ease",
      }}
    />
  );
}

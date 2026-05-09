"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import BookingModal from "./BookingModal";

type BookingContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}

export default function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <BookingContext.Provider value={{ open, close, isOpen }}>
      {children}
      <BookingModal isOpen={isOpen} onClose={close} />
    </BookingContext.Provider>
  );
}

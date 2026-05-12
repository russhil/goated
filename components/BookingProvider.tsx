"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import BookingModal from "./BookingModal";
import posthog from "posthog-js";

export type BookingStep = "qualify" | "booking";

export type BookingPrefill = {
  name: string;
  email: string;
  notes: string;
};

type BookingContextValue = {
  open: () => void;
  close: () => void;
  isOpen: boolean;
  step: BookingStep;
  prefill: BookingPrefill | null;
  proceedToBooking: (data: BookingPrefill) => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBooking must be used inside <BookingProvider>");
  return ctx;
}

export default function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<BookingStep>("qualify");
  const [prefill, setPrefill] = useState<BookingPrefill | null>(null);

  const open = useCallback(() => {
    setStep("qualify");
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  const proceedToBooking = useCallback((data: BookingPrefill) => {
    posthog.capture("booking_calendar_reached");
    setPrefill(data);
    setStep("booking");
  }, []);

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
    <BookingContext.Provider
      value={{ open, close, isOpen, step, prefill, proceedToBooking }}
    >
      {children}
      <BookingModal
        isOpen={isOpen}
        onClose={close}
        step={step}
        prefill={prefill}
        onQualified={proceedToBooking}
      />
    </BookingContext.Provider>
  );
}

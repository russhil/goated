"use client";

import { useState } from "react";
import Drawer from "../components/drawer";
import ContentForm from "./content-form";

export default function NewContentDrawer() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-dark text-white rounded-full text-sm font-medium hover:bg-coral transition"
      >
        + New content
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="New content">
        <ContentForm onSaved={() => setOpen(false)} />
      </Drawer>
    </>
  );
}

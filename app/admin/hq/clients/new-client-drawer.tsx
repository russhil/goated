"use client";

import { useState } from "react";
import type { TeamMember } from "@/lib/hq";
import Drawer from "../components/drawer";
import ClientEditor from "./client-editor";

export default function NewClientDrawer({ team }: { team: TeamMember[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium font-sans bg-coral text-white hover:bg-dark transition-colors duration-300 shadow-sm"
      >
        + New client
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="New client">
        <ClientEditor team={team} onSaved={() => setOpen(false)} />
      </Drawer>
    </>
  );
}

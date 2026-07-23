"use client";

import { useState } from "react";
import type { TeamMember } from "@/lib/hq";
import Drawer from "../components/drawer";
import SubprojectRow from "./subproject-row";

export default function SubprojectDrawer({
  clientId,
  team,
  currency,
  kickoffDate,
}: {
  clientId: string;
  team: TeamMember[];
  currency: string;
  kickoffDate: string | null;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium font-sans bg-dark text-white hover:bg-coral transition-colors duration-300"
      >
        + Add sub-project
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Add sub-project">
        <SubprojectRow
          clientId={clientId}
          team={team}
          currency={currency}
          kickoffDate={kickoffDate}
          invoiceByPhase={{}}
          onSaved={() => setOpen(false)}
        />
      </Drawer>
    </>
  );
}

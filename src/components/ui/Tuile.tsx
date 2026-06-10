"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface TuileProps {
  icon: React.ReactNode;
  titre: string;
  sousTitre?: React.ReactNode;
  badge?: number | string;
  variantDemande?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function Tuile({
  icon,
  titre,
  sousTitre,
  badge,
  variantDemande = false,
  defaultOpen = false,
  children,
}: TuileProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`pa-tile${variantDemande ? " pa-tile-demande" : ""}${open ? " open" : ""}`}>
      <button
        type="button"
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="pa-tile-icon shrink-0">{icon}</div>
          <div className="min-w-0">
            <p
              className="text-sm font-bold truncate"
              style={{ color: variantDemande ? "#3B3470" : "var(--pa-ink)" }}
            >
              {titre}
            </p>
            {sousTitre && (
              <div
                className="text-xs mt-0.5"
                style={{ color: variantDemande ? "#7A72A8" : "var(--pa-muted)" }}
              >
                {sousTitre}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {badge !== undefined && (
            <span
              className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full text-white"
              style={{
                background: variantDemande ? "#7C6BE8" : "#6366f1",
                boxShadow: "0 4px 10px -3px rgba(124,107,232,.7)",
              }}
            >
              {badge}
            </span>
          )}
          <span className="pa-tile-chev">
            <ChevronDown size={18} />
          </span>
        </div>
      </button>

      <div className="pa-tile-body">
        <div>
          <div className="px-4 pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

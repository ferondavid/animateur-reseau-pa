"use client";

import { useEffect } from "react";

export default function PersistRole({
  role,
  magasinId,
}: {
  role: string;
  magasinId?: string;
}) {
  useEffect(() => {
    localStorage.setItem("pa_role", role);
    if (magasinId) localStorage.setItem("pa_magasin_id", magasinId);
  }, [role, magasinId]);
  return null;
}

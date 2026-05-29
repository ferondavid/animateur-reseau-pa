"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BoundaryRedirect() {
  const router = useRouter();
  useEffect(() => {
    const role = localStorage.getItem("pa_role");
    const magasinId = localStorage.getItem("pa_magasin_id");
    if (role === "animateur") {
      router.push("/animateur");
    } else if (role === "membre" && magasinId) {
      router.push(`/membre/${magasinId}`);
    }
  }, [router]);
  return null;
}

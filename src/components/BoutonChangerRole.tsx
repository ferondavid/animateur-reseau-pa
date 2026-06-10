import { logout } from "@/app/login/actions";
import { LogOut } from "lucide-react";

export default function BoutonChangerRole() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5"
        style={{
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(120,110,150,0.2)",
          color: "#6F6982",
          boxShadow: "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#534AB7";
          e.currentTarget.style.background = "#fff";
          e.currentTarget.style.boxShadow = "0 8px 18px -8px rgba(80,60,140,.4)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#6F6982";
          e.currentTarget.style.background = "rgba(255,255,255,0.7)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <LogOut size={14} />
        Déconnexion
      </button>
    </form>
  );
}

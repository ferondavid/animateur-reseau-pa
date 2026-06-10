import { logout } from "@/app/login/actions";
import { LogOut } from "lucide-react";

export default function BoutonChangerRole() {
  return (
    <form action={logout}>
      <button type="submit" className="pa-ghost-btn">
        <LogOut size={14} />
        Déconnexion
      </button>
    </form>
  );
}

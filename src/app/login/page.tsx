import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  async function logout() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">
            Animation réseau Piscinistes Associés
          </h1>
          <form action={logout}>
            <button className="text-sm text-slate-600 hover:text-slate-900">
              Déconnexion
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-sm text-slate-500 mb-1">Connecté en tant que</p>
          <p className="font-medium text-slate-900">{user.email}</p>
        </div>
      </div>
    </main>
  );
}
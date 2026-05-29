import { createClient } from "@/lib/supabase/server";

export default async function TestRDV() {
  const supabase = await createClient();

  const [rdvResult, remonteeResult, newsResult] = await Promise.all([
    supabase.from("rendez_vous").select("*").limit(1),
    supabase.from("remontees").select("id, source").limit(1),
    supabase.from("news").select("id, titre").limit(1),
  ]);

  // Test insert rendez_vous
  const insertResult = await supabase.from("rendez_vous").insert({
    magasin_id: "00000000-0000-0000-0000-000000000000",
    type: "tel",
    date_souhaitee: "2099-01-01",
    objet: "[TEST] diagnostic",
    statut: "demande",
    demandeur_type: "magasin",
  }).select("id").single();

  // Nettoyage si l'insert a réussi
  if (insertResult.data?.id) {
    await supabase.from("rendez_vous").delete().eq("id", insertResult.data.id);
  }

  return (
    <main style={{ padding: 24, fontFamily: "monospace", fontSize: 13 }}>
      <h1 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>Diagnostic Supabase</h1>

      <Section title="SELECT rendez_vous" data={rdvResult} />
      <Section title="SELECT remontees (col source)" data={remonteeResult} />
      <Section title="SELECT news" data={newsResult} />
      <Section title="INSERT rendez_vous (test)" data={insertResult} />
    </main>
  );
}

function Section({ title, data }: { title: string; data: { data: unknown; error: unknown } }) {
  const ok = !data.error;
  return (
    <div style={{ marginBottom: 20, padding: 12, borderRadius: 8, background: ok ? "#f0fdf4" : "#fef2f2", border: `1px solid ${ok ? "#86efac" : "#fca5a5"}` }}>
      <div style={{ fontWeight: "bold", marginBottom: 6, color: ok ? "#166534" : "#991b1b" }}>
        {ok ? "✅" : "❌"} {title}
      </div>
      <pre style={{ margin: 0, fontSize: 11, color: "#374151" }}>
        {JSON.stringify({ data: data.data, error: data.error }, null, 2)}
      </pre>
    </div>
  );
}

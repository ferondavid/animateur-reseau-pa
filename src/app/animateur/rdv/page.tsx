import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function RDVDebug() {
  const supabase = await createClient();

  const reqTout = await supabase.from("rendez_vous").select("*");

  const reqAvecJoin = await supabase
    .from("rendez_vous")
    .select("*, magasins(id, nom, enseigne, ville)");

  const reqAvecInvites = await supabase
    .from("rendez_vous")
    .select(
      "*, magasins(id, nom, enseigne, ville), rendez_vous_invites(magasin_id, magasins(nom, enseigne))"
    );

  return (
    <div style={{ padding: 20, fontFamily: "monospace", fontSize: 11 }}>
      <h1>🔬 DEBUG RDV</h1>

      <h2>1. SELECT * (sans filtre)</h2>
      <p>Nb résultats : <strong>{reqTout.data?.length ?? "null"}</strong></p>
      <p>Error : {JSON.stringify(reqTout.error)}</p>
      <pre style={{ background: "#f3f4f6", padding: 10, maxHeight: 300, overflow: "auto" }}>
        {JSON.stringify(reqTout.data, null, 2)}
      </pre>

      <h2>2. Avec JOIN magasins</h2>
      <p>Nb résultats : <strong>{reqAvecJoin.data?.length ?? "null"}</strong></p>
      <p>Error : {JSON.stringify(reqAvecJoin.error)}</p>
      <pre style={{ background: "#f3f4f6", padding: 10, maxHeight: 300, overflow: "auto" }}>
        {JSON.stringify(reqAvecJoin.data, null, 2)}
      </pre>

      <h2>3. Avec JOIN magasins + invites</h2>
      <p>Nb résultats : <strong>{reqAvecInvites.data?.length ?? "null"}</strong></p>
      <p>Error : {JSON.stringify(reqAvecInvites.error)}</p>
      <pre style={{ background: "#f3f4f6", padding: 10, maxHeight: 300, overflow: "auto" }}>
        {JSON.stringify(reqAvecInvites.data, null, 2)}
      </pre>

      <h2>4. Env Supabase</h2>
      <p>NEXT_PUBLIC_SUPABASE_URL : {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ défini" : "❌ manquant"}</p>
      <p>URL (30 premiers chars) : {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30)}...</p>
    </div>
  );
}

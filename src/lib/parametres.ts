import { createClient } from "@/lib/supabase/server";

export async function getParametre(cle: string, defaut: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("parametres")
    .select("valeur")
    .eq("cle", cle)
    .single();
  return data?.valeur ?? defaut;
}

export async function getParametreNumber(cle: string, defaut: number): Promise<number> {
  const v = await getParametre(cle, String(defaut));
  const n = parseInt(v, 10);
  return isNaN(n) ? defaut : n;
}

export async function getParametreFloat(cle: string, defaut: number): Promise<number> {
  const v = await getParametre(cle, String(defaut));
  const n = parseFloat(v);
  return isNaN(n) ? defaut : n;
}

export async function updateParametre(cle: string, valeur: string): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("parametres")
    .upsert({ cle, valeur, updated_at: new Date().toISOString() }, { onConflict: "cle" });
}

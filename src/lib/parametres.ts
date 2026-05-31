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

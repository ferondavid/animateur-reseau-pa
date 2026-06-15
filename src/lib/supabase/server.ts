import { createServerClient } from "@supabase/ssr";

// Clé service_role : jamais exposée côté client (fichier server-only par convention Next.js).
// service_role bypass RLS → permet au serveur de tout lire/écrire sans policy.
export async function createClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => [],   // pas de session Supabase Auth — auth = cookie custom
        setAll:  () => {},
      },
    }
  );
}

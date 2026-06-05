import { type NextRequest } from "next/server";
import { notifierNouveauRDVMagasin } from "@/lib/notifs";

export async function POST(req: NextRequest) {
  const { id } = (await req.json()) as { id: string };
  await notifierNouveauRDVMagasin(id).catch((e) =>
    console.error("[API NOTIF] RDV demandé :", e)
  );
  return new Response("OK");
}

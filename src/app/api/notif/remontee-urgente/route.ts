import { type NextRequest } from "next/server";
import { notifierRemonteeUrgente } from "@/lib/notifs";

export async function POST(req: NextRequest) {
  const { id } = (await req.json()) as { id: string };
  await notifierRemonteeUrgente(id).catch((e) =>
    console.error("[API NOTIF] remontée urgente :", e)
  );
  return new Response("OK");
}

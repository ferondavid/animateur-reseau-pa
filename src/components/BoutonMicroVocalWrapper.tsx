import { getSession } from "@/lib/auth";
import BoutonMicroVocal from "./BoutonMicroVocal";

export default async function BoutonMicroVocalWrapper() {
  const session = await getSession();
  if (session?.role !== "animateur") return null;
  return <BoutonMicroVocal />;
}

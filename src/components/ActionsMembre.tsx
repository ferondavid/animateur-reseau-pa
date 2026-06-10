"use client";

import { useState } from "react";
import ModaleNouvelleRemontee from "./ModaleNouvelleRemontee";
import ModaleNouveauRDV from "./ModaleNouveauRDV";
import ModaleContacterAnimateur from "./ModaleContacterAnimateur";
import ActionRapide from "@/components/ui/ActionRapide";
import { Phone, CalendarPlus, Megaphone, BarChart3 } from "lucide-react";

type Magasin = { id: string; nom: string; enseigne: string | null };
type Modale = "remontee" | "rdv" | "contact" | null;

type Props = {
  magasinId: string;
  animateurTel: string;
  animateurEmail: string;
  magasinNom: string;
  autresMagasins: Magasin[];
};

export default function ActionsMembre({
  magasinId,
  animateurTel,
  animateurEmail,
  magasinNom,
  autresMagasins,
}: Props) {
  const [modale, setModale] = useState<Modale>(null);

  return (
    <>
      <div className="grid grid-cols-4 gap-2.5">
        <ActionRapide
          icon={Phone}
          label="Contacter"
          gradient="teal"
          onClick={() => setModale("contact")}
        />
        <ActionRapide
          icon={CalendarPlus}
          label="RDV"
          gradient="blue"
          onClick={() => setModale("rdv")}
        />
        <ActionRapide
          icon={Megaphone}
          label="Remonter"
          gradient="peach"
          onClick={() => setModale("remontee")}
        />
        <ActionRapide
          icon={BarChart3}
          label="Mes notes"
          gradient="slate"
          onClick={() =>
            document
              .getElementById("indicateurs")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        />
      </div>

      {modale === "contact" && (
        <ModaleContacterAnimateur
          animateurTel={animateurTel}
          animateurEmail={animateurEmail}
          magasinNom={magasinNom}
          onClose={() => setModale(null)}
        />
      )}
      {modale === "remontee" && (
        <ModaleNouvelleRemontee
          magasinId={magasinId}
          onClose={() => setModale(null)}
        />
      )}
      {modale === "rdv" && (
        <ModaleNouveauRDV
          magasinId={magasinId}
          autresMagasins={autresMagasins}
          onClose={() => setModale(null)}
        />
      )}
    </>
  );
}

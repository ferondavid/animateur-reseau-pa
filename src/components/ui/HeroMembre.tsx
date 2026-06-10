import { Star } from "lucide-react";

interface HeroMembreProps {
  nomAffiche: string;
  ville?: string | null;
  region?: string | null;
  meteo?: { temp: number; emoji: string; libelle: string } | null;
  scoreConfiance?: number | null;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonne matinée";
  if (h < 18) return "Bonne journée";
  return "Bonne soirée";
}

export default function HeroMembre({
  nomAffiche,
  ville,
  region,
  meteo,
  scoreConfiance,
}: HeroMembreProps) {
  const greeting = getGreeting();
  const starsCount = scoreConfiance ? Math.round(scoreConfiance) : 0;
  const localisation = [ville, region].filter(Boolean).join(" · ");

  return (
    <div className="pa-hero mb-5">
      <div className="flex items-center gap-3">
        {/* Météo */}
        {meteo ? (
          <div
            className="shrink-0 w-14 h-14 rounded-[18px] flex flex-col items-center justify-center gap-0.5"
            style={{
              background: "rgba(255,255,255,0.22)",
              backdropFilter: "blur(6px)",
              color: "#fff",
            }}
          >
            <span className="text-2xl leading-none">{meteo.emoji}</span>
            <span className="text-[11px] font-bold mt-0.5">{meteo.temp}°</span>
          </div>
        ) : (
          <div
            className="shrink-0 w-14 h-14 rounded-[18px] flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.18)", color: "#fff" }}
          >
            <span className="text-2xl">🏪</span>
          </div>
        )}

        {/* Infos magasin */}
        <div className="flex-1 min-w-0">
          <h1
            className="text-[20px] font-bold leading-tight truncate"
            style={{ color: "#fff", letterSpacing: "-0.3px" }}
          >
            {nomAffiche}
          </h1>
          {localisation && (
            <p className="text-[12.5px] mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.82)" }}>
              {localisation}
            </p>
          )}
          {starsCount > 0 && (
            <div className="flex gap-0.5 mt-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  fill={i < starsCount ? "#FFE08A" : "transparent"}
                  color={i < starsCount ? "#FFE08A" : "rgba(255,255,255,0.4)"}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Greeting */}
      <p className="text-[13px] font-medium mt-3.5" style={{ color: "rgba(255,255,255,0.9)" }}>
        {greeting} ✨
        {meteo ? ` — ${meteo.libelle.toLowerCase()} aujourd'hui` : ""}
      </p>
    </div>
  );
}

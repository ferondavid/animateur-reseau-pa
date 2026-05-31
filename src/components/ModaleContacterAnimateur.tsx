"use client";

type Props = {
  animateurTel: string;
  animateurEmail: string;
  magasinNom: string;
  onClose: () => void;
};

function normalizeTelPlus(tel: string): string {
  const digits = tel.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return "+33" + digits.slice(1);
  return digits;
}

function normalizeTelWA(tel: string): string {
  // WhatsApp veut le numéro international sans + ni espaces
  return normalizeTelPlus(tel).replace(/^\+/, "");
}

export default function ModaleContacterAnimateur({
  animateurTel,
  animateurEmail,
  magasinNom,
  onClose,
}: Props) {
  const telPlus = normalizeTelPlus(animateurTel);
  const telWA = normalizeTelWA(animateurTel);
  const message = `Bonjour, ici ${magasinNom}.`;
  const messageEncoded = encodeURIComponent(message);
  const subject = encodeURIComponent(`Contact depuis ${magasinNom}`);

  const options = [
    {
      label: "WhatsApp",
      sub: "Message instantané",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
        </svg>
      ),
      bg: "bg-[#25D366] hover:bg-[#1DA851]",
      href: `https://wa.me/${telWA}?text=${messageEncoded}`,
      external: true,
    },
    {
      label: "Email",
      sub: animateurEmail,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
        </svg>
      ),
      bg: "bg-blue-500 hover:bg-blue-600",
      href: `mailto:${animateurEmail}?subject=${subject}&body=${messageEncoded}`,
      external: false,
    },
    {
      label: "Appel direct",
      sub: telPlus,
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      ),
      bg: "bg-emerald-500 hover:bg-emerald-600",
      href: `tel:${telPlus}`,
      external: false,
    },
    {
      label: "SMS",
      sub: "Message texte",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      bg: "bg-purple-500 hover:bg-purple-600",
      href: `sms:${telPlus}?body=${messageEncoded}`,
      external: false,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold text-slate-900">Contacter l&apos;animateur</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-2xl leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-5">Choisissez votre canal préféré</p>

        <div className="grid grid-cols-2 gap-3">
          {options.map((o) => (
            <a
              key={o.label}
              href={o.href}
              {...(o.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className={`${o.bg} text-white rounded-2xl p-4 flex flex-col items-start gap-2 transition-colors shadow-sm`}
            >
              {o.icon}
              <div>
                <div className="font-semibold text-sm">{o.label}</div>
                <div className="text-xs opacity-90 mt-0.5 truncate">{o.sub}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

import BoundaryRedirect from "@/components/BoundaryRedirect";
import LandingCards from "@/components/LandingCards";

export default function Landing() {
  return (
    <>
      <BoundaryRedirect />
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 flex flex-col items-center justify-center p-8">
        <div className="flex flex-col items-center gap-10 w-full">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">
              Animateur Réseau PA
            </h1>
            <p className="text-lg text-slate-500">Choisissez votre profil</p>
          </div>
          <LandingCards />
        </div>
      </main>
    </>
  );
}

/* Landing page style "Open" (Cruip-like) — Mediasens */
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import UploadPage from "./pages/UploadPage";
import Chatbot from "./components/chatbot/Chatbot";
import MediaDetail from "./pages/MediaDetail"

const Container = ({ children }) => (
  <div className="max-w-6xl mx-auto px-6 md:px-8">{children}</div>
);

// Fix: Convert Nav to a proper React component with profile dropdown
const Nav = () => {
  const [hasAccess, setHasAccess] = React.useState(() => !!localStorage.getItem("access"));
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  
  React.useEffect(() => {
    const handleStorage = () => setHasAccess(!!localStorage.getItem("access"));
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setHasAccess(false);
    setIsProfileOpen(false);
    window.location.href = "/";
  };

  const handleProfile = () => {
    setIsProfileOpen(false);

    alert("Page profil ");
  };

  return (
    <header className="w-full fixed top-0 left-0 z-40 bg-black/30 backdrop-blur-md border-b border-white/10">
      <Container>
        <nav className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-500 via-indigo-500 to-blue-500"></span>
            <span className="text-white font-bold text-lg tracking-wide">Mediasens</span>
          </div>
          
          <ul className="hidden md:flex items-center gap-8 text-sm text-white/80">
            <li><a href="#features" className="hover:text-white">Fonctionnalités</a></li>

            {!hasAccess && (
              <>
                <li><a href="/register" className="hover:text-white">S'inscrire</a></li>
                <li><a href="/login" className="hover:text-white">Connexion</a></li>
              </>
            )}
            {hasAccess && (
              <>
              <li><a href="/upload" className="hover:text-white">Upload</a></li>
              
              </>
            )}
            
            <li><a href="#how" className="hover:text-white">Comment ça marche</a></li>
            <li><a href="#cta" className="hover:text-white">Commencer</a></li>
          </ul>

          <div className="flex items-center gap-4">
            {hasAccess ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm font-bold">
                    U
                  </div>
                  <span className="text-white text-sm hidden md:block">Profil</span>
                  <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-12 w-48 bg-[#0b1020] border border-white/10 rounded-lg shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-white/10">
                      <p className="text-white text-sm font-medium">Utilisateur</p>
                      <p className="text-white/60 text-xs">user@example.com</p>
                    </div>
                    
                    <button
                      onClick={handleProfile}
                      className="w-full text-left px-4 py-2 text-white/80 hover:bg-white/10 transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Mon profil
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-red-400 hover:bg-white/10 transition flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <a
                href="#cta"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-90 transition"
              >
                Essayer maintenant
              </a>
            )}
          </div>
        </nav>
      </Container>
    </header>
  );
};

const Hero = () => (
  <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-gradient-to-b from-[#0b1020] via-[#0a0f1c] to-black pt-20">
    {/* Glow / Orbs */}
    <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-purple-600/30 blur-3xl"></div>
    <div className="pointer-events-none absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-indigo-600/25 blur-3xl"></div>

    <Container>
      <div className="text-center">
        <span className="inline-block mb-5 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-white/80">
          Plateforme de gestion de projets multimédias
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
          Accélérez vos créations avec{" "}
          <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Mediasens
          </span>
        </h1>
        <p className="mt-6 text-base md:text-lg text-white/70 max-w-3xl mx-auto">
          Organisez, collaborez et publiez vos projets vidéo, audio et design
          sur une interface moderne et rapide. Un flux simple, clair et efficace.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="#cta"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-800/30 hover:opacity-90 transition"
          >
            Commencer gratuitement
          </a>
          <a
            href="#features"
            className="px-6 py-3 rounded-xl border border-white/15 text-white/90 hover:bg-white/5 transition"
          >
            Voir les fonctionnalités
          </a>
        </div>
        {/* Mock "browser frame" */}
        <div className="mt-14 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 h-10 bg-white/5 border-b border-white/10">
            <span className="h-3 w-3 rounded-full bg-red-400/70" />
            <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
            <span className="h-3 w-3 rounded-full bg-green-400/70" />
            <span className="ml-4 text-xs text-white/60">app.mediasens.local</span>
          </div>
          <div className="aspect-[16/9] bg-gradient-to-br from-[#0e1428] via-[#101735] to-[#0a0f1f] grid place-items-center">
            <div className="rounded-xl border border-white/10 p-6 text-center">
              <h3 className="text-white/90 font-semibold">Aperçu du tableau de bord</h3>
              <p className="text-white/60 text-sm mt-2">Intégration du CRUD à venir</p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  </section>
);

const Features = () => (
  <section id="features" className="py-24 bg-[#070b16]">
    <Container>
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">Fonctionnalités clés</h2>
        <p className="mt-3 text-white/70 max-w-2xl mx-auto">
          Tout ce dont vous avez besoin pour gérer vos projets multimédias, du concept à la livraison.
        </p>
      </div>

      <div className="mt-12 grid md:grid-cols-3 gap-6">
        {[
          {
            title: "Gestion des projets",
            desc: "Créez, modifiez et organisez vos projets vidéo, audio et design en un clic.",
            icon: "🎬",
          },
          {
            title: "Collaboration",
            desc: "Partagez avec votre équipe et travaillez en temps réel sur les mêmes éléments.",
            icon: "🤝",
          },
          {
            title: "Médias centralisés",
            desc: "Importez vos fichiers, prévisualisez, commentez et archivez au même endroit.",
            icon: "🗂️",
          },
        ].map((f, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/[0.08] transition"
          >
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="text-lg font-semibold text-white">{f.title}</h3>
            <p className="text-sm text-white/70 mt-2">{f.desc}</p>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

const How = () => (
  <section id="how" className="py-24 bg-gradient-to-b from-[#070b16] to-black">
    <Container>
      <div className="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Comment ça marche ?</h2>
          <p className="mt-4 text-white/70">
            1) Vous créez un projet • 2) Vous ajoutez vos médias • 3) Vous collaborez • 4) Vous publiez.
          </p>
          <ul className="mt-6 space-y-3 text-white/80">
            <li>• Interface rapide et claire</li>
            <li>• API Django sécurisée (CRUD utilisateurs & projets)</li>
            <li>• Front React moderne (Tailwind)</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-2xl">⚙️</div>
              <p className="text-xs text-white/70 mt-2">Setup</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-2xl">📁</div>
              <p className="text-xs text-white/70 mt-2">Projets</p>
            </div>
            <div className="rounded-xl bg-white/5 p-4">
              <div className="text-2xl">🚀</div>
              <p className="text-xs text-white/70 mt-2">Publish</p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  </section>
);

const CTA = () => (
  <section id="cta" className="py-20 bg-black">
    <Container>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-purple-700/40 via-indigo-700/40 to-blue-700/40 p-10 text-center">
        <h3 className="text-2xl md:text-3xl font-extrabold text-white">
          Prêt à démarrer avec Mediasens ?
        </h3>
        <p className="text-white/80 mt-2">
          Créez votre premier projet en quelques secondes.
        </p>
        <a
          href="#"
          className="inline-block mt-6 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition"
        >
          Créer un projet
        </a>
      </div>
    </Container>
  </section>
);

const Footer = () => (
  <footer className="py-10 bg-black border-t border-white/10">
    <Container>
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 rounded-md bg-gradient-to-tr from-purple-500 via-indigo-500 to-blue-500"></span>
          <span className="text-white/80 text-sm">© {new Date().getFullYear()} Mediasens</span>
        </div>
        <ul className="flex items-center gap-6 text-sm text-white/70">
          <li><a href="#" className="hover:text-white">Confidentialité</a></li>
          <li><a href="#" className="hover:text-white">Conditions</a></li>
          <li><a href="#" className="hover:text-white">Contact</a></li>
        </ul>
      </div>
    </Container>
  </footer>
);

export default function App() {
  return (
      <Routes>
        {/* --- Landing Page --- */}
        <Route
          path="/"
          element={
            <div className="bg-black text-white">
              <Nav />
              <Hero />
              <Features />
              <How />
              <CTA />
              <Footer />
              {/* ✅ Chatbot présent ici */}
              <Chatbot />
            </div>
          }
        />

        {/* --- Register --- */}
        <Route path="/register" element={<Register />} />

        {/* --- Login --- */}
        <Route path="/login" element={<Login />} />

        {/* --- Upload --- */}
        <Route
          path="/upload"
          element={
            <>
              <UploadPage />
              {/* ✅ Chatbot aussi ici */}
              <Chatbot />
            </>
          }
        />
        <Route path="/media/:id" element={<MediaDetail />} />
      </Routes>
  );
}
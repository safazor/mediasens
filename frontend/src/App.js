import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import UploadPage from "./pages/UploadPage";
import Chatbot from "./components/Chatbot";
import ImageEditor from "./components/ImageEditor";
import VideoProcessor from "./components/VideoProcessor";

const Container = ({ children }) => (
  <div className="max-w-6xl mx-auto px-6 md:px-8">{children}</div>
);

const Nav = () => (
  <header className="w-full fixed top-0 left-0 z-40 bg-black/30 backdrop-blur-md border-b border-white/10">
    <Container>
      <nav className="h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-500 via-indigo-500 to-blue-500"></span>
          <span className="text-white font-bold text-lg tracking-wide">MediaMind</span>
        </div>
        <ul className="hidden md:flex items-center gap-6 text-sm text-white/80">
          <li><a href="#features" className="hover:text-white">Modules IA</a></li>
          <li><a href="#how" className="hover:text-white">Fonctionnement</a></li>
          <li><a href="#technology" className="hover:text-white">Technologie</a></li>
          <li><a href="/register" className="hover:text-white">S'inscrire</a></li>
          <li><a href="/login" className="hover:text-white">Connexion</a></li>
        </ul>
        <div className="hidden md:block">
          <a
            href="#demo"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-90 transition"
          >
            Essayer la démo
          </a>
        </div>
      </nav>
    </Container>
  </header>
);

const Hero = () => (
  <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-gradient-to-b from-[#0b1020] via-[#0a0f1c] to-black pt-20">
    {/* Glow / Orbs */}
    <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-purple-600/30 blur-3xl"></div>
    <div className="pointer-events-none absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-indigo-600/25 blur-3xl"></div>

    <Container>
      <div className="text-center">
        <span className="inline-block mb-5 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-white/80">
          Plateforme IA Tout-en-Un pour Créateurs
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
          L'Intelligence Artificielle au service de votre{" "}
          <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
            Créativité
          </span>
        </h1>
        <p className="mt-6 text-base md:text-lg text-white/70 max-w-3xl mx-auto">
          MediaMind révolutionne votre workflow créatif avec 5 modules IA spécialisés : 
          gestion intelligente, analyse avancée, édition assistée, collaboration intelligente et génération multimédia.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <a
            href="#demo"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold shadow-lg shadow-purple-800/30 hover:opacity-90 transition"
          >
            Découvrir les Modules IA
          </a>
          <a
            href="#features"
            className="px-6 py-3 rounded-xl border border-white/15 text-white/90 hover:bg-white/5 transition"
          >
            Voir la Technologie
          </a>
        </div>
        
        {/* Stats */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
          {[
            { number: "5", label: "Modules IA Spécialisés" },
            { number: "99%", label: "Précision de Détection" },
            { number: "50%", label: "Temps Économisé" },
            { number: "24/7", label: "Analyse Automatique" }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-white">{stat.number}</div>
              <div className="text-xs text-white/60 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Container>
  </section>
);

const Features = () => (
  <section id="features" className="py-24 bg-[#070b16]">
    <Container>
      <div className="text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">Nos 5 Modules IA Spécialisés</h2>
        <p className="mt-3 text-white/70 max-w-2xl mx-auto">
          Une architecture modulaire conçue pour couvrir l'ensemble de votre workflow créatif
        </p>
      </div>

      <div className="mt-16 space-y-8">
        {[
          {
            number: "01",
            title: "Gestion Intelligente des Médias",
            desc: "Classification automatique et organisation intelligente de votre bibliothèque multimédia",
            features: ["Upload intelligent", "Classification CNN", "Détection de qualité", "Auto-tagging"],
            icon: "📁",
            gradient: "from-blue-500 to-cyan-500",
            path: "/upload"
          },
          {
            number: "02",
            title: "Analyse et Détection Automatique",
            desc: "Extraction d'informations sémantiques avancées de vos contenus visuels et audio",
            features: ["Détection objets/visages", "Reconnaissance d'émotions", "Analyse de scènes", "Extraction audio"],
            icon: "🔍",
            gradient: "from-green-500 to-emerald-500",
            path: "/upload"
          },
          {
            number: "03",
            title: "Édition et Enrichissement IA",
            desc: "Transformations créatives assistées par l'IA pour images et vidéos",
            features: ["Filtres intelligents", "Style transfer", "Super-résolution", "Découpage automatique"],
            icon: "🎨",
            gradient: "from-purple-500 to-pink-500",
            path: "/image-editor"
          },
          {
            number: "04",
            title: "Collaboration Intelligente",
            desc: "Travail d'équipe optimisé par l'IA avec suggestions contextuelles",
            features: ["Édition collaborative", "Commentaires intelligents", "Suggestions IA", "Résumé automatique"],
            icon: "🤝",
            gradient: "from-orange-500 to-red-500",
            path: "/upload"
          },
          {
            number: "05",
            title: "Génération Créative",
            desc: "Création et enrichissement de médias par IA générative",
            features: ["Text-to-Image", "Génération vidéo", "Sous-titres automatiques", "Enrichissement contextuel"],
            icon: "✨",
            gradient: "from-yellow-500 to-amber-500",
            path: "/video-processor"
          }
        ].map((module, index) => (
          <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-8 hover:bg-white/[0.08] transition group">
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${module.gradient} flex items-center justify-center text-2xl`}>
                  {module.icon}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm font-mono text-white/40">{module.number}</span>
                  <h3 className="text-xl font-bold text-white">{module.title}</h3>
                </div>
                <p className="text-white/70 mb-4">{module.desc}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {module.features.map((feature, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-white/5 text-white/80 text-sm border border-white/10">
                      {feature}
                    </span>
                  ))}
                </div>
                <a 
                  href={module.path}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/90 hover:bg-white/20 transition text-sm"
                >
                  Tester ce module →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

const Technology = () => (
  <section id="technology" className="py-24 bg-gradient-to-b from-[#070b16] to-black">
    <Container>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">Stack Technologique Avancée</h2>
        <p className="mt-3 text-white/70 max-w-2xl mx-auto">
          Des technologies de pointe pour une performance et une précision optimales
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { category: "Backend & API", tech: ["Django", "Django REST", "PostgreSQL", "Redis"] },
          { category: "IA & Machine Learning", tech: ["PyTorch", "TensorFlow", "OpenCV", "HuggingFace"] },
          { category: "Modèles IA Principaux", tech: ["CNN / YOLOv8", "GAN / U-Net", "Transformers", "Stable Diffusion"] },
          { category: "Frontend & Déploiement", tech: ["React.js", "WebSocket", "AWS S3", "Docker"] }
        ].map((stack, index) => (
          <div key={index} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="font-semibold text-white mb-4">{stack.category}</h3>
            <div className="space-y-2">
              {stack.tech.map((tech, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-white/70">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                  {tech}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Container>
  </section>
);

const Demo = () => (
  <section id="demo" className="py-24 bg-[#070b16]">
    <Container>
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white">Essayez nos Modules IA</h2>
        <p className="mt-3 text-white/70 max-w-2xl mx-auto">
          Découvrez la puissance de l'IA sur vos propres médias
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: "Gestion des Médias",
            desc: "Importez et classez automatiquement",
            icon: "📁",
            path: "/upload",
            color: "border-blue-500/30"
          },
          {
            title: "Édition d'Images IA",
            desc: "Transformez vos images avec l'IA",
            icon: "🎨",
            path: "/image-editor",
            color: "border-purple-500/30"
          },
          {
            title: "Traitement Vidéo IA",
            desc: "Effets et analyse vidéo intelligents",
            icon: "🎥",
            path: "/video-processor",
            color: "border-green-500/30"
          }
        ].map((demo, index) => (
          <a
            key={index}
            href={demo.path}
            className={`rounded-2xl border-2 ${demo.color} bg-white/5 p-8 hover:bg-white/10 transition group text-center`}
          >
            <div className="text-4xl mb-4">{demo.icon}</div>
            <h3 className="text-lg font-semibold text-white mb-2">{demo.title}</h3>
            <p className="text-white/70 text-sm mb-4">{demo.desc}</p>
            <span className="inline-flex items-center gap-2 text-white/80 group-hover:text-white transition text-sm">
              Accéder au module →
            </span>
          </a>
        ))}
      </div>
    </Container>
  </section>
);

const CTA = () => (
  <section className="py-20 bg-black">
    <Container>
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-purple-700/40 via-indigo-700/40 to-blue-700/40 p-10 text-center">
        <h3 className="text-2xl md:text-3xl font-extrabold text-white">
          Prêt à révolutionner votre workflow créatif ?
        </h3>
        <p className="text-white/80 mt-2 max-w-2xl mx-auto">
          Rejoignez MediaMind et bénéficiez de la puissance de 5 modules IA spécialisés 
          pour accélérer et embellir vos créations multimédias.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            className="px-8 py-4 rounded-xl bg-white text-black font-semibold hover:opacity-90 transition"
          >
            Créer un compte gratuit
          </a>
          <a
            href="#demo"
            className="px-8 py-4 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 transition"
          >
            Voir les démos
          </a>
        </div>
      </div>
    </Container>
  </section>
);

const Footer = () => (
  <footer className="py-12 bg-black border-t border-white/10">
    <Container>
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 rounded-md bg-gradient-to-tr from-purple-500 via-indigo-500 to-blue-500"></span>
          <div>
            <span className="text-white font-bold text-lg">MediaMind</span>
            <p className="text-white/60 text-sm">Plateforme IA Tout-en-Un</p>
          </div>
        </div>
        
        <div className="flex items-center gap-8 text-sm">
          <div className="text-white/70">
            <div className="font-semibold">Modules IA</div>
            <div className="text-xs text-white/50 mt-1">5 technologies spécialisées</div>
          </div>
          <ul className="flex items-center gap-6 text-white/70">
            <li><a href="#" className="hover:text-white text-xs">Confidentialité</a></li>
            <li><a href="#" className="hover:text-white text-xs">Conditions</a></li>
            <li><a href="#" className="hover:text-white text-xs">Support</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-white/10 text-center">
        <span className="text-white/50 text-sm">© {new Date().getFullYear()} MediaMind. Tous droits réservés.</span>
      </div>
    </Container>
  </footer>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="bg-black text-white">
              <Nav />
              <Hero />
              <Features />
              <Technology />
              <Demo />
              <CTA />
              <Footer />
              <Chatbot />
            </div>
          }
        />

        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/upload" element={<><UploadPage /><Chatbot /></>} />
        <Route path="/image-editor" element={<><ImageEditor /><Chatbot /></>} />
        <Route path="/video-processor" element={<><VideoProcessor /><Chatbot /></>} />
      </Routes>
    </Router>
  );
}
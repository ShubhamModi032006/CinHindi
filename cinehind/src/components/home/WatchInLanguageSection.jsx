import { useState, useEffect } from "react";
import { fetchTmdb } from "../../hooks/useTmdb";
import { IMG_BASE } from "../../config/tmdb";
import { useApp } from "../../context/AppContext";

// Language definitions — code, display name, accent gradient, and bg
const LANGUAGES = [
  {
    code: "hi",
    label: "Watch in Hindi",
    gradient: "linear-gradient(135deg, #1a237e 0%, #283593 60%, #3949ab 100%)",
    glow: "#3f51b5",
  },
  {
    code: "en",
    label: "Watch in English",
    gradient: "linear-gradient(135deg, #0d47a1 0%, #1565c0 60%, #1976d2 100%)",
    glow: "#1976d2",
  },
  {
    code: "te",
    label: "Watch in Telugu",
    gradient: "linear-gradient(135deg, #1b5e20 0%, #2e7d32 60%, #388e3c 100%)",
    glow: "#43a047",
  },
  {
    code: "ta",
    label: "Watch in Tamil",
    gradient: "linear-gradient(135deg, #880e4f 0%, #ad1457 60%, #c2185b 100%)",
    glow: "#e91e63",
  },
  {
    code: "ml",
    label: "Watch in Malayalam",
    gradient: "linear-gradient(135deg, #4a148c 0%, #6a1b9a 60%, #7b1fa2 100%)",
    glow: "#9c27b0",
  },
  {
    code: "kn",
    label: "Watch in Kannada",
    gradient: "linear-gradient(135deg, #bf360c 0%, #d84315 60%, #e64a19 100%)",
    glow: "#ff5722",
  },
];

function LanguageCard({ lang, navigate }) {
  const handleClick = () => {
    if (navigate) navigate(`lang-${lang.code}`);
  };

  return (
    <button
      onClick={handleClick}
      className="language-card"
      style={{ background: lang.gradient, boxShadow: `0 8px 24px ${lang.glow}33` }}
      title={lang.label}
    >
      <div className="language-card-label">
        {lang.label}
      </div>
    </button>
  );
}

export default function WatchInLanguageSection() {
  const { navigate, mode } = useApp();

  // Show all languages or subset based on mode
  const visible =
    mode === "hollywood"
      ? LANGUAGES.filter((l) => l.code === "en")
      : mode === "mixed"
      ? LANGUAGES.filter((l) => ["hi", "en", "te", "ta"].includes(l.code))
      : LANGUAGES; // indian — show all

  return (
    <section className="mb-10">
      {/* Header */}
      <div className="row-header">
        <h2 className="row-title">Watch in Your Language</h2>
      </div>

      {/* Cards row */}
      <div className="scroll-row flex gap-4 px-4 md:px-6 pb-4">
        {visible.map((lang) => (
          <LanguageCard key={lang.code} lang={lang} navigate={navigate} />
        ))}
      </div>
    </section>
  );
}

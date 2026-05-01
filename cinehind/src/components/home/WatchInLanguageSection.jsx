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
  const [posters, setPosters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchTmdb("/discover/movie", {
      with_original_language: lang.code,
      sort_by: "popularity.desc",
      "vote_count.gte": 50,
      watch_region: "IN",
      page: 1,
    })
      .then((d) => {
        const imgs = (d.results || [])
          .filter((m) => m.poster_path)
          .slice(0, 4)
          .map((m) => `${IMG_BASE}${m.poster_path}`);
        setPosters(imgs);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [lang.code]);

  const handleClick = () => {
    if (navigate) navigate(`lang-${lang.code}`);
  };

  return (
    <button
      onClick={handleClick}
      className="lang-card"
      style={{ "--glow": lang.glow, "--grad": lang.gradient }}
      title={lang.label}
    >
      {/* Background gradient */}
      <div className="lang-card__bg" />

      {/* Poster stack */}
      <div className="lang-card__posters">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="lang-card__poster skeleton" style={{ "--i": i }} />
            ))
          : posters.slice(0, 3).map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="lang-card__poster"
                style={{ "--i": i }}
                loading="lazy"
              />
            ))}
      </div>

      {/* Bottom label */}
      <div className="lang-card__label">
        <span>{lang.label}</span>
      </div>

      {/* Shine effect */}
      <div className="lang-card__shine" />
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
    <section className="wil-section">
      {/* Header */}
      <div className="wil-header">
        <h2 className="wil-title">🌐 Watch in Your Language</h2>
      </div>

      {/* Cards row */}
      <div className="wil-row scroll-row">
        {visible.map((lang) => (
          <LanguageCard key={lang.code} lang={lang} navigate={navigate} />
        ))}
      </div>
    </section>
  );
}

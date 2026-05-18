import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../../context/AppContext";
import { fetchTmdb } from "../../hooks/useTmdb";
import { backdropUrl, posterUrl } from "../../config/tmdb";
import { MODE_LANGUAGES } from "../../config/tmdb";
import { GENRE_MAP } from "../../config/constants";
import { HeroSkeleton } from "../ui/Skeletons";

export default function HeroSection() {
  const { mode, navigate, accent, activeProvider } = useApp();
  const [items, setItems] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fade, setFade] = useState(true);
  const timerRef = useRef(null);

  const accentColor = activeProvider?.color || (accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914");
  const langs = MODE_LANGUAGES[mode];

  // Build hero fetch params based on active provider or content mode
  const buildHeroParams = () => {
    const today = new Date().toISOString().split("T")[0];
    if (activeProvider?.watchId) {
      return {
        sort_by: "primary_release_date.desc",
        "primary_release_date.lte": today,
        "vote_count.gte": 15, // Lowered slightly so brand new releases show up
        watch_region: "IN",
        with_watch_providers: activeProvider.watchId,
        with_watch_monetization_types: "flatrate",
      };
    }
    return {
      with_original_language: langs,
      sort_by: "primary_release_date.desc",
      "primary_release_date.lte": today,
      "vote_count.gte": 20,
      watch_region: "IN",
      with_watch_monetization_types: "flatrate|free|rent|buy",
    };
  };

  useEffect(() => {
    setLoading(true);
    setItems([]);
    fetchTmdb("/discover/movie", { ...buildHeroParams(), page: 1 })
      .then((d) => {
        const filtered = (d.results || []).filter((m) => m.backdrop_path && m.overview);
        setItems(filtered.slice(0, 8));
        setCurrent(0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [langs, activeProvider?.id]);

  // Auto-rotate every 6 seconds
  useEffect(() => {
    if (items.length === 0) return;
    timerRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setCurrent((c) => (c + 1) % items.length);
        setFade(true);
      }, 300);
    }, 6000);
    return () => clearInterval(timerRef.current);
  }, [items]);

  const goTo = useCallback((idx) => {
    setFade(false);
    setTimeout(() => { setCurrent(idx); setFade(true); }, 300);
    clearInterval(timerRef.current);
  }, []);

  if (loading) return <HeroSkeleton />;
  if (items.length === 0) return null;

  const item = items[current];
  const backdrop = backdropUrl(item.backdrop_path);
  const title = item.title || item.name;
  const year = (item.release_date || "").slice(0, 4);
  const rating = item.vote_average?.toFixed(1);
  const genres = (item.genre_ids || []).slice(0, 3).map((id) => GENRE_MAP[id]).filter(Boolean);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "100vh", minHeight: 500 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-600"
        style={{ opacity: fade ? 1 : 0, transition: "opacity 0.6s ease" }}
      >
        <img
          src={backdrop}
          alt={title}
          className="w-full h-full object-cover"
          style={{ objectPosition: "center top" }}
        />
      </div>

      {/* Gradients */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(105deg, rgba(8,8,8,1) 0%, rgba(8,8,8,0.85) 30%, rgba(8,8,8,0.3) 60%, transparent 100%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to top, rgba(8,8,8,1) 0%, rgba(8,8,8,0.5) 25%, transparent 60%)" }} />
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, rgba(8,8,8,0.4) 0%, transparent 30%)" }} />

      {/* Content */}
      <div
        className="absolute bottom-0 left-0 px-6 md:px-12 pb-28 md:pb-32"
        style={{
          maxWidth: "min(600px, 90vw)",
          opacity: fade ? 1 : 0,
          transform: fade ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {/* Genres */}
        <div className="flex flex-wrap gap-2 mb-3">
          {genres.map((g) => (
            <span
              key={g}
              className="genre-badge"
            >
              {g}
            </span>
          ))}
        </div>

        <h1 className="hero-title mb-2">
          {title}
        </h1>

        <div className="hero-meta mb-3">
          {rating && <span className="hero-rating">⭐ {rating}</span>}
          {year && <span>{year}</span>}
        </div>

        <p className="hero-overview mb-6">
          {item.overview}
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => navigate("watch", { id: item.id, type: "movie", title, poster: posterUrl(item.poster_path), season: 1, episode: 1 })}
            className="btn-play"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Play Now
          </button>
          <button
            onClick={() => navigate("detail", { id: item.id, type: "movie" })}
            className="btn-info"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            More Info
          </button>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`hero-dot ${i === current ? "active" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

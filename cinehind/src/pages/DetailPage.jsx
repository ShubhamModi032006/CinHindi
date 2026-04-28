import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { fetchTmdb } from "../hooks/useTmdb";
import { backdropUrl, posterUrl, ytEmbedUrl } from "../config/tmdb";
import { GENRE_MAP } from "../config/constants";
import MediaCard from "../components/ui/MediaCard";

function CastCircle({ person }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="flex flex-col items-center gap-1 flex-shrink-0" style={{ width: 64 }}>
      <div className="rounded-full overflow-hidden" style={{ width: 48, height: 48, background: "var(--surface)" }}>
        {person.profile_path && !imgErr ? (
          <img
            src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
            alt={person.name}
            className="w-full h-full object-cover"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
        )}
      </div>
      <p className="text-center text-xs font-medium leading-tight" style={{ color: "var(--text-primary)", maxWidth: 60 }}>
        {person.name}
      </p>
    </div>
  );
}

export default function DetailPage() {
  const { page: appPage, navigate, toggleWatchLater, isInWatchLater, accent } = useApp();
  const { id, type } = appPage.params || {};
  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";

  const [info, setInfo] = useState(null);
  const [trailerKey, setTrailerKey] = useState(null);
  const [cast, setCast] = useState([]);
  const [director, setDirector] = useState(null);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoPaused, setVideoPaused] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!id || !type) return;
    setLoading(true);
    setTrailerKey(null);
    setCast([]);
    setDirector(null);
    setRecs([]);
    setEpisodes([]);

    const infoPath = type === "movie" ? `/movie/${id}` : `/tv/${id}`;
    const videosPath = type === "movie" ? `/movie/${id}/videos` : `/tv/${id}/videos`;
    const creditsPath = type === "movie" ? `/movie/${id}/credits` : `/tv/${id}/credits`;
    const recsPath = type === "movie" ? `/movie/${id}/recommendations` : `/tv/${id}/recommendations`;

    Promise.allSettled([
      fetchTmdb(infoPath),
      fetchTmdb(videosPath),
      fetchTmdb(creditsPath),
      fetchTmdb(recsPath),
    ]).then(([infoR, vidR, credR, recsR]) => {
      if (infoR.status === "fulfilled") setInfo(infoR.value);
      if (vidR.status === "fulfilled") {
        const trailer = (vidR.value.results || []).find((v) => v.type === "Trailer" && v.site === "YouTube");
        if (trailer) setTrailerKey(trailer.key);
      }
      if (credR.status === "fulfilled") {
        const crew = credR.value.crew || [];
        const dir = crew.find((c) => c.job === "Director");
        setDirector(dir);
        setCast((credR.value.cast || []).slice(0, 4));
      }
      if (recsR.status === "fulfilled") setRecs((recsR.value.results || []).slice(0, 12));
      setLoading(false);
    });
  }, [id, type]);

  // Fetch episodes when season changes
  useEffect(() => {
    if (type !== "tv" || !id || !selectedSeason) return;
    fetchTmdb(`/tv/${id}/season/${selectedSeason}`)
      .then((d) => setEpisodes(d.episodes || []))
      .catch(() => setEpisodes([]));
  }, [id, type, selectedSeason]);

  if (loading || !info) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="skeleton rounded-lg" style={{ width: 200, height: 24 }} />
      </div>
    );
  }

  const title = info.title || info.name || "Unknown";
  const year = (info.release_date || info.first_air_date || "").slice(0, 4);
  const runtime = info.runtime ? `${info.runtime}m` : info.number_of_seasons ? `${info.number_of_seasons} Seasons` : "";
  const rating = info.vote_average?.toFixed(1);
  const voteCount = info.vote_count?.toLocaleString();
  const overview = info.overview || "";
  const genres = info.genres || [];
  const backdrop = backdropUrl(info.backdrop_path);
  const poster = posterUrl(info.poster_path);
  const seasons = info.seasons?.filter((s) => s.season_number > 0) || [];
  const saved = isInWatchLater(id, type);

  return (
    <div className="relative" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* ── HERO / TRAILER SECTION ─────────────────────────── */}
      <div className="relative overflow-hidden" style={{ height: "100vh", minHeight: 500 }}>
        {/* Background: trailer or backdrop */}
        {trailerKey ? (
          <div className="absolute inset-0">
            <iframe
              ref={iframeRef}
              className="trailer-container"
              src={ytEmbedUrl(trailerKey)}
              title="Trailer"
              allow="autoplay; fullscreen"
              frameBorder="0"
            />
          </div>
        ) : backdrop ? (
          <div className="absolute inset-0">
            <img src={backdrop} alt={title} className="w-full h-full object-cover zoom-slow" />
          </div>
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a1a1a, #000)" }} />
        )}

        {/* Overlay gradients */}
        <div className="absolute inset-0 grad-left" />
        <div className="absolute inset-0 grad-bottom" />
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />

        {/* Back button */}
        <button
          onClick={() => navigate("home")}
          className="absolute top-20 left-6 z-10 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-all hover:scale-105"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>

        {/* Click to pause/resume overlay */}
        {trailerKey && (
          <button
            className="absolute inset-0 z-[1] cursor-pointer"
            onClick={() => setVideoPaused((v) => !v)}
            title={videoPaused ? "Resume" : "Pause"}
          />
        )}

        {/* Info overlay — bottom left */}
        <div className="absolute bottom-0 left-0 px-6 md:px-12 pb-10 md:pb-12 z-10" style={{ width: "100%", maxWidth: "min(calc(100vw - 190px), 620px)" }}>
          {/* Type badge */}
          <span
            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-3"
            style={{ background: `${accentColor}33`, color: accentColor, border: `1px solid ${accentColor}55` }}
          >
            {type === "movie" ? "Movie" : "TV Series"}
          </span>

          <h1
            className="font-black text-white mb-2"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3.2rem)", lineHeight: 1.1, textShadow: "0 2px 20px rgba(0,0,0,0.9)" }}
          >
            {title}
          </h1>

          {/* Meta row */}
          <div className="flex items-center flex-wrap gap-3 mb-3 text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
            {rating && <span className="font-bold" style={{ color: "#ffd700" }}>⭐ {rating}</span>}
            {voteCount && <span style={{ color: "rgba(255,255,255,0.5)" }}>({voteCount})</span>}
            {year && <span>{year}</span>}
            {runtime && <span>{runtime}</span>}
          </div>

          {/* Genre tags */}
          <div className="flex flex-wrap gap-2 mb-3">
            {genres.map((g) => (
              <button
                key={g.id}
                onClick={() => navigate("genre", { genreId: g.id, genreName: g.name })}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                style={{ background: "rgba(255,255,255,0.15)", color: "white", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.25)" }}
              >
                {g.name}
              </button>
            ))}
          </div>

          {/* Overview */}
          <p
            className="text-sm leading-relaxed mb-3"
            style={{
              color: "rgba(255,255,255,0.8)",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {overview}
          </p>

        </div>

        {/* Play button — bottom right */}
        <div className="absolute bottom-8 right-6 z-10 flex flex-col items-end gap-3">
          {/* Bookmark */}
          <button
            onClick={() => toggleWatchLater({ id, type, title, poster })}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${saved ? accentColor : "rgba(255,255,255,0.3)"}`,
              color: saved ? accentColor : "white",
            }}
          >
            {saved ? "✓ Saved" : "+ Watch Later"}
          </button>

          {/* TV Season selector */}
          {type === "tv" && seasons.length > 0 && (
            <select
              value={selectedSeason}
              onChange={(e) => { setSelectedSeason(Number(e.target.value)); setShowEpisodes(true); }}
              className="px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                background: "rgba(0,0,0,0.7)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "white",
              }}
            >
              {seasons.map((s) => (
                <option key={s.id} value={s.season_number} style={{ background: "#000" }}>
                  Season {s.season_number}
                </option>
              ))}
            </select>
          )}

          {/* Play button */}
          <button
            onClick={() => navigate("watch", { id, type, title, poster, season: selectedSeason, episode: 1 })}
            className="flex items-center gap-2 px-8 py-4 rounded-full font-black text-white text-base transition-all hover:scale-105"
            style={{
              background: accentColor,
              boxShadow: `0 4px 30px ${accentColor}88`,
              fontSize: "1rem",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Play Now
          </button>
        </div>
      </div>

      {/* ── DIRECTOR & CAST SECTION ──────────────────────── */}
      {(director || cast.length > 0) && (
        <div className="px-6 md:px-12 py-6" style={{ background: "var(--bg)" }}>
          {director && (
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              Director: <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{director.name}</span>
            </p>
          )}
          {cast.length > 0 && (
            <div className="flex gap-4 overflow-x-auto scroll-row pb-2">
              {cast.map((p) => <CastCircle key={p.id} person={p} />)}
            </div>
          )}
        </div>
      )}

      {/* ── EPISODE LIST (TV only) ───────────────────────── */}
      {type === "tv" && showEpisodes && episodes.length > 0 && (
        <div className="px-6 md:px-12 py-6" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)" }}>
          <h2 className="text-base font-bold mb-3" style={{ color: "var(--text-primary)" }}>
            Season {selectedSeason} Episodes
          </h2>
          <div className="grid gap-3">
            {episodes.map((ep) => (
              <button
                key={ep.id}
                onClick={() => navigate("watch", { id, type, title, poster, season: selectedSeason, episode: ep.episode_number })}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.01]"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                {ep.still_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${ep.still_path}`}
                    alt={ep.name}
                    className="rounded-lg flex-shrink-0"
                    style={{ width: 80, height: 48, objectFit: "cover" }}
                  />
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    E{ep.episode_number}: {ep.name}
                  </p>
                  <p className="text-xs line-clamp-1" style={{ color: "var(--text-secondary)" }}>{ep.overview}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── RECOMMENDATIONS ──────────────────────────────── */}
      {recs.length > 0 && (
        <div className="px-4 md:px-6 py-8" style={{ background: "var(--bg)" }}>
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>More Like This</h2>
          <div className="flex gap-3 overflow-x-auto scroll-row pb-2">
            {recs.map((item, i) => (
              <div key={item.id} className="card-anim" style={{ animationDelay: `${i * 40}ms` }}>
                <MediaCard item={item} index={i} type={type} width={160} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 40 }} />
    </div>
  );
}

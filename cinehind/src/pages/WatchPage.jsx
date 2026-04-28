import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fetchTmdb } from "../hooks/useTmdb";
import MediaCard from "../components/ui/MediaCard";

// Player sources in priority order
function getPlayerSources(id, type, season, episode) {
  if (type === "movie") {
    return [
      `https://player.videasy.net/movie/${id}`,
      `https://embed.screenscape.me/embed?tmdb=${id}&type=movie`,
      `https://vidsrc.xyz/embed/movie/${id}`,
      `https://vidlink.pro/movie/${id}`,
    ];
  }
  return [
    `https://player.videasy.net/tv/${id}/${season}/${episode}`,
    `https://embed.screenscape.me/embed?tmdb=${id}&type=tv&s=${season}&e=${episode}`,
    `https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}`,
    `https://vidlink.pro/tv/${id}/${season}/${episode}`,
  ];
}

const SOURCE_LABELS = ["Videasy", "Screenscape", "Vidsrc", "Vidlink"];

export default function WatchPage() {
  const { navigate, saveContinueWatching, addToHistory, autoplay, accent } = useApp();
  const { id, type } = useParams();
  const [searchParams] = useSearchParams();
  const title = searchParams.get("title") || "Unknown";
  const poster = searchParams.get("poster") || "";
  const initSeason = searchParams.get("season") || 1;
  const initEpisode = searchParams.get("episode") || 1;

  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";

  const [season, setSeason]   = useState(Number(initSeason) || 1);
  const [episode, setEpisode] = useState(Number(initEpisode) || 1);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [recs, setRecs]       = useState([]);
  const [info, setInfo]       = useState(null);
  const [sourceIdx, setSourceIdx] = useState(0);     // which player source
  const [playerLoading, setPlayerLoading] = useState(true);
  const [nextCountdown, setNextCountdown] = useState(null);
  const countdownRef = useRef(null);
  const loadTimerRef = useRef(null);

  const sources = getPlayerSources(id, type, season, episode);
  const embedUrl = sources[sourceIdx];

  // Save to continue watching & history
  useEffect(() => {
    if (!id || !type) return;
    saveContinueWatching({ id, type, title, poster, season, episode });
    addToHistory({ id, type, title, poster });
  }, [id, type, season, episode]);

  // Fetch show info + recs
  useEffect(() => {
    if (!id || !type) return;
    const path = type === "movie" ? `/movie/${id}` : `/tv/${id}`;
    const recsPath = type === "movie" ? `/movie/${id}/recommendations` : `/tv/${id}/recommendations`;
    Promise.allSettled([fetchTmdb(path), fetchTmdb(recsPath)]).then(([infoR, recsR]) => {
      if (infoR.status === "fulfilled") {
        setInfo(infoR.value);
        if (type === "tv") {
          const s = (infoR.value.seasons || []).filter((s) => s.season_number > 0);
          setSeasons(s);
        }
      }
      if (recsR.status === "fulfilled") setRecs((recsR.value.results || []).slice(0, 12));
    });
  }, [id, type]);

  // Fetch episodes for selected season
  useEffect(() => {
    if (type !== "tv" || !id) return;
    fetchTmdb(`/tv/${id}/season/${season}`)
      .then((d) => setEpisodes(d.episodes || []))
      .catch(() => setEpisodes([]));
  }, [id, type, season]);

  // Reset loading when source or episode changes
  useEffect(() => {
    setPlayerLoading(true);
    clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => {
      setPlayerLoading(false);
    }, 5000); // Reduced to 5s so users aren't stuck waiting for a dead server
    return () => clearTimeout(loadTimerRef.current);
  }, [embedUrl]);

  const handlePlayerLoad = () => {
    clearTimeout(loadTimerRef.current);
    setPlayerLoading(false);
  };

  const tryNextSource = () => {
    if (sourceIdx < sources.length - 1) {
      setSourceIdx(sourceIdx + 1);
    }
  };

  // Autoplay next episode countdown
  const startNextEpisodeCountdown = () => {
    if (!autoplay || type !== "tv") return;
    setNextCountdown(10);
    countdownRef.current = setInterval(() => {
      setNextCountdown((n) => {
        if (n <= 1) {
          clearInterval(countdownRef.current);
          const nextEp = episode + 1;
          setEpisode(nextEp);
          setSourceIdx(0);
          saveContinueWatching({ id, type, title, poster, season, episode: nextEp });
          setNextCountdown(null);
          return null;
        }
        return n - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    clearInterval(countdownRef.current);
    setNextCountdown(null);
  };

  return (
    <div style={{ background: "#000000", minHeight: "100vh", color: "#fff" }}>
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "#1f1f1f" }}>
        <button
          onClick={() => navigate("home")}
          className="flex items-center gap-1.5 text-sm transition-all hover:scale-105"
          style={{ color: "#888" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back
        </button>
        <span className="font-bold text-sm text-white truncate flex-1">{title}</span>
        {info?.vote_average && (
          <span className="text-xs font-bold" style={{ color: "#ffd700" }}>⭐ {info.vote_average.toFixed(1)}</span>
        )}
      </div>

      {/* Main layout */}
      <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6">
        {/* Player ~70% */}
        <div className="flex-1">

          {/* Season/Episode selector */}
          {type === "tv" && seasons.length > 0 && (
            <div className="flex gap-3 mb-3 flex-wrap">
              <select
                value={season}
                onChange={(e) => { setSeason(Number(e.target.value)); setEpisode(1); setSourceIdx(0); }}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: "#111", border: "1px solid #333", color: "#fff" }}
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.season_number} style={{ background: "#111" }}>
                    Season {s.season_number}
                  </option>
                ))}
              </select>
              <select
                value={episode}
                onChange={(e) => {
                  const ep = Number(e.target.value);
                  setEpisode(ep);
                  setSourceIdx(0);
                  saveContinueWatching({ id, type, title, poster, season, episode: ep });
                }}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: "#111", border: "1px solid #333", color: "#fff" }}
              >
                {episodes.map((ep) => (
                  <option key={ep.id} value={ep.episode_number} style={{ background: "#111" }}>
                    E{ep.episode_number}: {ep.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Player source switcher */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {SOURCE_LABELS.map((label, i) => (
              <button
                key={i}
                onClick={() => setSourceIdx(i)}
                className="px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105"
                style={{
                  background: sourceIdx === i ? accentColor : "#1a1a1a",
                  color: sourceIdx === i ? "white" : "#888",
                  border: `1px solid ${sourceIdx === i ? accentColor : "#333"}`,
                }}
              >
                {sourceIdx === i ? "▶ " : ""}{label}
              </button>
            ))}
            <span className="text-xs self-center" style={{ color: "#555" }}>
              If player is black, try another source →
            </span>
          </div>

          {/* Player wrapper */}
          <div
            className="relative w-full"
            style={{ aspectRatio: "16/9", background: "#0d0d0d", borderRadius: 12, overflow: "hidden" }}
          >
            {/* Loading spinner */}
            {playerLoading && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "#0d0d0d", zIndex: 2 }}>
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full border-2 animate-spin"
                    style={{ borderColor: `${accentColor} transparent transparent transparent` }}
                  />
                  <p className="text-sm" style={{ color: "#888" }}>Loading {SOURCE_LABELS[sourceIdx]}...</p>
                </div>
              </div>
            )}

            {/* Iframe — note: no allowFullScreen prop, fullscreen is in allow= */}
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={`${title} Player`}
              className="w-full h-full"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={handlePlayerLoad}
              style={{ border: "none", borderRadius: 12 }}
            />

            {/* Next episode countdown overlay */}
            {nextCountdown !== null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: "rgba(0,0,0,0.8)", zIndex: 3 }}>
                <p className="text-lg font-bold text-white mb-2">Next episode in {nextCountdown}...</p>
                <button
                  onClick={cancelCountdown}
                  className="px-5 py-2 rounded-full text-sm font-semibold"
                  style={{ background: "#333", color: "#fff" }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Source error hint */}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs" style={{ color: "#555" }}>
              {SOURCE_LABELS[sourceIdx]} · {type === "tv" ? `S${season} E${episode}` : "Movie"}
            </p>
            {sourceIdx < sources.length - 1 && (
              <button
                onClick={tryNextSource}
                className="text-xs font-semibold transition-all hover:scale-105"
                style={{ color: accentColor }}
              >
                Player not working? Try {SOURCE_LABELS[sourceIdx + 1]} →
              </button>
            )}
          </div>

          {/* Info below player */}
          {info && (
            <div className="mt-4">
              <h2 className="text-xl font-black text-white mb-1">{title}</h2>
              {type === "tv" && (
                <p className="text-sm mb-2" style={{ color: accentColor }}>Season {season} · Episode {episode}</p>
              )}
              {info.overview && (
                <p className="text-sm leading-relaxed mb-3" style={{ color: "#aaa" }}>{info.overview}</p>
              )}
              {info.genres && (
                <div className="flex flex-wrap gap-2">
                  {info.genres.map((g) => (
                    <span key={g.id} className="px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ background: "#1a1a1a", color: "#888", border: "1px solid #2a2a2a" }}>
                      {g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar — sticky, scrolls independently */}
        {recs.length > 0 && (
          <div
            className="lg:w-72 xl:w-80 flex-shrink-0 no-scrollbar"
            style={{
              position: "sticky",
              top: 72,
              alignSelf: "flex-start",
              maxHeight: "calc(100vh - 88px)",
              overflowY: "auto",
              scrollbarWidth: "none",   /* Firefox */
              msOverflowStyle: "none",  /* IE/Edge */
            }}
          >
            <h3 className="text-sm font-bold mb-3 px-1" style={{ color: "#888" }}>More Like This</h3>
            <div className="flex flex-col gap-3">
              {recs.map((item, i) => (
                <div key={item.id}>
                  <MediaCard item={item} index={i} type={type} width="100%" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

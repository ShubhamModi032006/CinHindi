import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fetchTmdb } from "../hooks/useTmdb";
import MediaCard from "../components/ui/MediaCard";
import PlayerOverlay from "../components/player/PlayerOverlay";
import { EMBED_SERVERS } from "../config/servers";

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
  
  const [activeServer, setActiveServer] = useState(() => {
    const saved = localStorage.getItem("cinhindi_last_server");
    if (saved) {
      const server = EMBED_SERVERS.find(s => s.id === saved);
      if (server) return server;
    }
    return EMBED_SERVERS[0];
  });
  
  const [playerLoading, setPlayerLoading] = useState(true);
  const [nextCountdown, setNextCountdown] = useState(null);
  const countdownRef = useRef(null);
  const loadTimerRef = useRef(null);

  const embedUrl = type === "movie" 
    ? activeServer.getMovieUrl(id) 
    : activeServer.getTvUrl(id, season, episode);

  const handleServerChange = (server) => {
    setActiveServer(server);
    localStorage.setItem("cinhindi_last_server", server.id);
  };

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
    cancelCountdown();
    clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => {
      setPlayerLoading(false);
    }, 5000); 
    return () => clearTimeout(loadTimerRef.current);
  }, [embedUrl]);

  const handlePlayerLoad = () => {
    clearTimeout(loadTimerRef.current);
    setPlayerLoading(false);
  };

  const handleCycleServer = () => {
    const idx = EMBED_SERVERS.findIndex((s) => s.id === activeServer.id);
    const nextIdx = (idx + 1) % EMBED_SERVERS.length;
    handleServerChange(EMBED_SERVERS[nextIdx]);
  };

  const handleNextEpisode = () => {
    if (type !== "tv") return;
    const currentSeasonMeta = seasons.find(s => s.season_number === season);
    const maxEps = currentSeasonMeta ? currentSeasonMeta.episode_count : episodes.length;

    let nextEp = episode;
    let nextSeason = season;

    if (episode >= maxEps) {
      nextSeason = season + 1;
      nextEp = 1;
    } else {
      nextEp = episode + 1;
    }

    const maxSeasons = Math.max(...seasons.map(s => s.season_number), 1);
    if (nextSeason > maxSeasons) return; // last ep of last season

    handleSelectEpisode(nextSeason, nextEp);
  };

  const handlePrevEpisode = () => {
    if (type !== "tv") return;
    let prevEp = episode;
    let prevSeason = season;

    if (episode <= 1) {
      if (season <= 1) return;
      prevSeason = season - 1;
      const prevSeasonMeta = seasons.find(s => s.season_number === prevSeason);
      prevEp = prevSeasonMeta ? prevSeasonMeta.episode_count : 1;
    } else {
      prevEp = episode - 1;
    }

    handleSelectEpisode(prevSeason, prevEp);
  };

  const handleSelectEpisode = (selectedSeason, selectedEpisode) => {
    setSeason(selectedSeason);
    setEpisode(selectedEpisode);
    saveContinueWatching({ id, type, title, poster, season: selectedSeason, episode: selectedEpisode });
    navigate("watch", { type, id, season: selectedSeason, episode: selectedEpisode, title, poster });
  };

  // Autoplay next episode countdown
  const startNextEpisodeCountdown = () => {
    if (!autoplay || type !== "tv") return;
    setNextCountdown(10);
    countdownRef.current = setInterval(() => {
      setNextCountdown((n) => {
        if (n <= 1) {
          clearInterval(countdownRef.current);
          handleNextEpisode();
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
        <div className="flex-1 min-w-0">

          {/* Player header area */}
          <div className="flex justify-end mb-3">
             <div className="flex items-center gap-2">
               <span className="text-sm font-bold text-white/50">Server:</span>
               <select
                 value={activeServer.id}
                 onChange={(e) => {
                   const server = EMBED_SERVERS.find(s => s.id === e.target.value);
                   if (server) handleServerChange(server);
                 }}
                 className="bg-[#111] border border-[#333] text-white text-sm rounded px-3 py-1.5 outline-none cursor-pointer hover:bg-[#222]"
               >
                 {EMBED_SERVERS.map(s => (
                   <option key={s.id} value={s.id}>{s.name}</option>
                 ))}
               </select>
             </div>
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
                  <p className="text-sm" style={{ color: "#888" }}>Loading {activeServer.name}...</p>
                </div>
              </div>
            )}

            <PlayerOverlay
              type={type}
              runtime={info?.runtime || (info?.episode_run_time ? info.episode_run_time[0] : null)}
              season={season}
              episode={episode}
              totalEpisodes={seasons.find(s => s.season_number === season)?.episode_count || 0}
              totalSeasons={Math.max(...seasons.map(s => s.season_number), 1)}
              onNextEpisode={startNextEpisodeCountdown}
              onPrevEpisode={handlePrevEpisode}
              onCycleServer={handleCycleServer}
              accentColor={accentColor}
            >
              <iframe
                key={embedUrl}
                src={embedUrl}
                title={`${title} Player`}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                referrerPolicy="no-referrer"
                onLoad={handlePlayerLoad}
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </PlayerOverlay>

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

          {/* Source error hint & Next Eps Button */}
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs" style={{ color: "#555" }}>
              {activeServer.name} · {type === "tv" ? `S${season} E${episode}` : "Movie"}
            </p>
            {type === "tv" && (
              <button
                onClick={handleNextEpisode}
                className="text-xs font-bold px-3 py-1.5 rounded bg-[#111] border border-[#333] hover:bg-[#222] transition-colors text-white"
              >
                Next Eps ⏭
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

              {/* Horizontal Episodes List */}
              {type === "tv" && episodes.length > 0 && (
                <div className="mt-6 mb-2">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-bold text-white">Episodes</h3>
                    <select
                      value={season}
                      onChange={(e) => { setSeason(Number(e.target.value)); setEpisode(1); }}
                      className="px-3 py-1.5 rounded-md text-sm font-semibold bg-[#1a1a1a] border border-[#333] text-white outline-none cursor-pointer hover:bg-[#222]"
                    >
                      {seasons.map((s) => (
                        <option key={s.id} value={s.season_number}>Season {s.season_number}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar">
                    {episodes.map((ep) => {
                      const isActive = episode === ep.episode_number;
                      return (
                        <div
                          key={ep.id}
                          onClick={() => handleSelectEpisode(season, ep.episode_number)}
                          className="flex flex-col gap-2 shrink-0 cursor-pointer group w-44"
                        >
                          <div className={`relative aspect-video rounded-lg overflow-hidden bg-[#111] border-2 transition-all duration-300 ${isActive ? "border-white" : "border-transparent group-hover:border-white/30 group-hover:scale-[1.02]"}`}>
                            {ep.still_path ? (
                              <img src={`https://image.tmdb.org/t/p/w300${ep.still_path}`} alt={ep.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-white/20">No Image</div>
                            )}
                            {isActive && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="bg-white/20 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider border border-white/20">
                                  Playing
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className={`text-sm font-bold truncate ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`}>
                              {ep.episode_number}. {ep.name}
                            </p>
                            <p className="text-xs text-white/40">{ep.runtime || 45}m</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {info.genres && (
                <div className="flex flex-wrap gap-2 mt-4">
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

import React, { useState, useEffect, useRef } from "react";
import { fetchTmdb } from "../../hooks/useTmdb";
import { BACKDROP_BASE } from "../../config/tmdb";

export default function EpisodePanel({
  tmdbId,
  currentSeason,
  currentEpisode,
  totalSeasons,
  onSelectEpisode,
  onClose,
  accentColor,
}) {
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);
  const [search, setSearch] = useState("");
  const [autoplay, setAutoplay] = useState(() => localStorage.getItem("cinhindi_autoplay") !== "false");
  const activeRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("cinhindi_autoplay", autoplay);
  }, [autoplay]);

  useEffect(() => {
    let active = true;
    fetchTmdb(`/tv/${tmdbId}/season/${selectedSeason}`).then((res) => {
      if (active && res.episodes) {
        setEpisodes(res.episodes);
      }
    });
    return () => { active = false; };
  }, [tmdbId, selectedSeason]);

  // Auto-scroll to active episode when panel opens
  useEffect(() => {
    if (selectedSeason === currentSeason) {
      const timer = setTimeout(() => {
        if (activeRef.current) {
          activeRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [episodes, selectedSeason, currentSeason]);

  const filteredEpisodes = episodes.filter((ep) =>
    ep.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="absolute top-0 right-0 h-[calc(100%-48px)] w-[340px] z-10 flex flex-col"
      style={{
        background: "rgba(15, 15, 15, 0.96)",
        backdropFilter: "blur(12px)",
        transform: "translateX(0)", // Assuming conditional rendering handles slide-in
        transition: "transform 0.3s ease",
        borderLeft: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-white/10 shrink-0">
        <input
          type="text"
          placeholder="Search episodes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 w-0 bg-white/10 text-white text-sm rounded-full px-3 py-1.5 outline-none placeholder:text-white/40 focus:bg-white/20 transition-colors"
        />
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(Number(e.target.value))}
          className="bg-white/10 text-white text-sm font-semibold rounded-full px-2 py-1.5 outline-none border-none cursor-pointer"
        >
          {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
            <option key={s} value={s} className="bg-[#111] text-white">
              S{s}
            </option>
          ))}
        </select>
        <div className="flex flex-col items-center cursor-pointer" onClick={() => setAutoplay(!autoplay)}>
          <span className="text-[9px] text-white/60 font-bold uppercase tracking-wider mb-0.5 select-none">Autoplay</span>
          <div className={`w-7 h-4 rounded-full p-0.5 transition-colors ${autoplay ? "bg-white" : "bg-white/30"}`}>
            <div className={`w-3 h-3 rounded-full transition-transform ${autoplay ? "translate-x-3" : "translate-x-0"}`} style={{ background: autoplay ? accentColor : "white" }} />
          </div>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition-colors outline-none">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Episode List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 flex flex-col gap-3 custom-scroll">
        {filteredEpisodes.length === 0 ? (
          <div className="text-center text-white/40 text-sm mt-10">No episodes found</div>
        ) : (
          filteredEpisodes.map((ep) => {
            const isActive = selectedSeason === currentSeason && ep.episode_number === currentEpisode;
            const thumbUrl = ep.still_path ? `${BACKDROP_BASE}${ep.still_path}` : null;
            
            if (isActive) {
              return (
                <div
                  key={ep.id}
                  ref={activeRef}
                  className="rounded-xl overflow-hidden shrink-0"
                  style={{ border: "2px solid white", background: "#222" }}
                >
                  <div className="relative w-full aspect-video bg-[#111]">
                    {thumbUrl ? (
                      <img src={thumbUrl} alt={ep.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-xs">No Image</div>
                    )}
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/20 backdrop-blur">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-white font-bold text-sm mb-1">{ep.episode_number}. {ep.name}</h4>
                    <p className="text-xs text-white/60 font-semibold mb-2">{ep.runtime || 45}m · Season {selectedSeason}</p>
                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">{ep.overview || "No description available."}</p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={ep.id}
                onClick={() => onSelectEpisode(selectedSeason, ep.episode_number)}
                className="flex gap-3 items-center p-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors shrink-0"
              >
                <div className="w-20 aspect-video rounded-md overflow-hidden bg-[#111] shrink-0">
                  {thumbUrl ? (
                    <img src={thumbUrl} alt={ep.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10 text-[10px]">No Img</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-white/80 font-bold text-sm truncate">{ep.episode_number}. {ep.name}</h5>
                  <p className="text-xs text-white/40 mt-1">{ep.runtime || 45}m left</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
      `}</style>
    </div>
  );
}

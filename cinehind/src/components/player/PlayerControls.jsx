import React, { useState, useEffect, useRef } from "react";

export default function PlayerControls({
  type,
  runtime,
  currentSeason,
  currentEpisode,
  totalSeasons,
  servers,
  activeServer,
  onServerChange,
  onNextEpisode,
  onToggleEpisodes,
  episodePanelOpen,
  accentColor,
}) {
  const [paused, setPaused] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(2); // 0=mute, 1=low, 2=high
  const [elapsed, setElapsed] = useState(0);
  const [showServerMenu, setShowServerMenu] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef(null);

  // Auto-hide controls
  useEffect(() => {
    const resetTimer = () => {
      setShowControls(true);
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false);
        setShowServerMenu(false);
      }, 3000);
    };

    const playerContainer = document.querySelector(".player-container");
    if (playerContainer) {
      playerContainer.addEventListener("mousemove", resetTimer);
      playerContainer.addEventListener("mouseleave", () => {
        setShowControls(false);
        setShowServerMenu(false);
      });
    }
    resetTimer();

    return () => {
      if (playerContainer) {
        playerContainer.removeEventListener("mousemove", resetTimer);
        playerContainer.removeEventListener("mouseleave", () => setShowControls(false));
      }
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Simulated progress timer
  useEffect(() => {
    let timer;
    if (!paused) {
      timer = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [paused]);

  // Reset elapsed when episode changes
  useEffect(() => {
    setElapsed(0);
  }, [currentSeason, currentEpisode]);

  const totalSeconds = runtime ? runtime * 60 : 45 * 60;

  // Auto-play next episode when timer finishes
  useEffect(() => {
    if (elapsed > 0 && elapsed >= totalSeconds && type === "tv") {
      const isAutoPlay = localStorage.getItem("cinhindi_autoplay") !== "false";
      if (isAutoPlay) {
        onNextEpisode();
        setElapsed(0);
      }
    }
  }, [elapsed, totalSeconds, type, onNextEpisode]);

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const toggleVolume = () => {
    setVolumeLevel((prev) => (prev + 1) % 3);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setElapsed(Math.max(0, Math.min(totalSeconds, pos * totalSeconds)));
  };

  const toggleFullscreen = () => {
    const container = document.querySelector(".player-container");
    if (!document.fullscreenElement) {
      container?.requestFullscreen?.().catch(console.error);
    } else {
      document.exitFullscreen?.().catch(console.error);
    }
  };

  const VolumeIcon = () => {
    if (volumeLevel === 0) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>;
    if (volumeLevel === 1) return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
    return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>;
  };

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls || episodePanelOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      style={{
        height: 80,
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
        zIndex: 20,
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div className="w-full flex items-center px-4 h-12 gap-4">
        {/* Left group */}
        <div className="flex items-center gap-4 text-white/60">
          <button onClick={() => setPaused(!paused)} className="hover:text-white transition-colors outline-none">
            {paused ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            )}
          </button>
          <button onClick={() => setElapsed((p) => Math.max(0, p - 10))} className="hover:text-white transition-colors outline-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><text x="12" y="16" fontSize="10" textAnchor="middle" fill="currentColor" stroke="none">10</text></svg>
          </button>
          <button onClick={() => setElapsed((p) => Math.min(totalSeconds, p + 10))} className="hover:text-white transition-colors outline-none">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><text x="12" y="16" fontSize="10" textAnchor="middle" fill="currentColor" stroke="none">10</text></svg>
          </button>
          <button onClick={toggleVolume} className="hover:text-white transition-colors outline-none">
            <VolumeIcon />
          </button>
        </div>

        {/* Center group: Progress & Time */}
        <div className="flex-1 flex items-center gap-3">
          <div
            className="flex-1 h-1 bg-white/20 rounded cursor-pointer relative group"
            onClick={handleSeek}
          >
            <div
              className="absolute left-0 top-0 bottom-0 rounded"
              style={{ width: `${(elapsed / totalSeconds) * 100}%`, background: accentColor }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -mt-1.5 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${(elapsed / totalSeconds) * 100}% - 6px)`, background: accentColor }}
            />
          </div>
          <span className="text-xs font-semibold text-white/80 tabular-nums select-none shrink-0">
            {formatTime(elapsed)} / {formatTime(totalSeconds)}
          </span>
        </div>

        {/* Right group */}
        <div className="flex items-center gap-4 text-white/60 relative">
          {type === "tv" && (
            <>
              <button onClick={onNextEpisode} className="hover:text-white transition-colors outline-none" title="Next Episode">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/></svg>
              </button>
              <button
                onClick={onToggleEpisodes}
                className={`flex items-center gap-1.5 text-sm font-semibold transition-colors outline-none ${episodePanelOpen ? "text-white" : "hover:text-white"}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="10" x2="8" y2="22"/></svg>
                Episodes
              </button>
            </>
          )}

          <button onClick={() => setShowServerMenu(!showServerMenu)} className="hover:text-white transition-colors outline-none" title="Servers">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>

          {/* Server Menu Dropdown */}
          {showServerMenu && (
            <div className="absolute bottom-12 right-6 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl overflow-hidden w-40 z-30 flex flex-col py-1">
              {servers.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onServerChange(s); setShowServerMenu(false); }}
                  className="px-4 py-2 text-sm text-left font-semibold transition-colors hover:bg-white/10 flex items-center gap-2 outline-none"
                  style={{ color: activeServer.id === s.id ? accentColor : "white" }}
                >
                  {activeServer.id === s.id ? "▶" : <span className="w-3" />}
                  {s.name}
                </button>
              ))}
            </div>
          )}

          <button onClick={toggleFullscreen} className="hover:text-white transition-colors outline-none" title="Fullscreen">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

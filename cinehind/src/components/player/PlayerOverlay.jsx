import { useState, useEffect } from "react";

export default function PlayerOverlay({
  type,
  runtime,
  season,
  episode,
  totalEpisodes,
  totalSeasons,
  onNextEpisode,
  onPrevEpisode,
  onCycleServer,
  accentColor,
  children
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName.toLowerCase() === "input" || e.target.tagName.toLowerCase() === "textarea") return;
      const key = e.key.toLowerCase();
      if (key === "n" && type === "tv" && onNextEpisode) {
        onNextEpisode();
      } else if (key === "p" && type === "tv" && onPrevEpisode) {
        onPrevEpisode();
      } else if (key === "s" && onCycleServer) {
        onCycleServer();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [type, onNextEpisode, onPrevEpisode, onCycleServer]);

  const handleSkipIntro = () => {
    // True auto-skip requires same-origin video access. This is a manual skip button overlay.
    setElapsed(151);
  };

  const showSkipIntro = elapsed >= 30 && elapsed <= 150;

  let showNext = false;
  if (type === "movie") {
    if (runtime) {
      showNext = elapsed >= (runtime - 5) * 60;
    }
  } else if (type === "tv") {
    const isLast = season === totalSeasons && episode === totalEpisodes;
    if (!isLast) {
      const triggerTime = runtime ? (runtime - 3) * 60 : 40 * 60;
      showNext = elapsed >= triggerTime;
    }
  }

  const isFirstEpisode = season === 1 && episode === 1;
  const isLastEpisode = season === totalSeasons && episode === totalEpisodes;

  return (
    <div className="relative w-full h-full" style={{ borderRadius: 12, overflow: "hidden" }}>
      {children}
      
      {/* Skip Intro Button */}
      {showSkipIntro && (
        <div className="absolute bottom-16 right-4 z-10 pointer-events-auto">
          <button
            onClick={handleSkipIntro}
            className="px-4 py-1.5 rounded-full text-sm font-bold bg-black bg-opacity-50 border-2 border-white text-white hover:bg-white hover:text-black transition-colors"
          >
            ⏭ Skip Intro
          </button>
        </div>
      )}

      {/* Play Next / Next Episode Button */}
      {showNext && (
        <div className="absolute bottom-16 right-4 z-10 pointer-events-auto">
          <button
            onClick={type === "tv" ? onNextEpisode : () => {}}
            className="px-4 py-1.5 rounded-full text-sm font-bold bg-black bg-opacity-50 border-2 border-white text-white hover:bg-white hover:text-black transition-colors"
          >
            {type === "tv" ? "▶ Next Episode" : "▶ Play Next"}
          </button>
        </div>
      )}

    </div>
  );
}

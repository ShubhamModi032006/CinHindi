import { useCallback } from "react";
import { useApp } from "../../context/AppContext";
import { posterUrl } from "../../config/tmdb";

export default function ContinueWatchingRow() {
  const { continueWatching, removeContinueWatching, navigate, accent } = useApp();
  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";

  if (continueWatching.length === 0) return null;

  return (
    <div className="mb-10 px-4 md:px-6 animate-[slideLeft_0.4s_ease]">
      <h2 className="text-base md:text-lg font-bold mb-4" style={{ color: "var(--text-primary)" }}>
        Continue Watching
      </h2>
      <div className="flex gap-3 overflow-x-auto scroll-row pb-2">
        {continueWatching.map((item, i) => {
          const poster = posterUrl(item.poster);

          return (
            <div
              key={`${item.id}-${item.type}`}
              className="flex-shrink-0 relative rounded-lg overflow-hidden cursor-pointer group"
              style={{ width: 180, animationDelay: `${i * 50}ms` }}
              onClick={() =>
                navigate("watch", {
                  id: item.id,
                  type: item.type,
                  title: item.title,
                  poster: item.poster,
                  season: item.season || 1,
                  episode: item.episode || 1,
                })
              }
            >
              {/* Poster */}
              <div className="relative rounded-lg overflow-hidden" style={{ height: 100 }}>
                {poster ? (
                  <img src={poster} alt={item.title} className="w-full h-full object-cover" style={{ objectPosition: "center 20%" }} />
                ) : (
                  <div className="w-full h-full" style={{ background: "var(--surface)" }} />
                )}
                {/* Dark overlay on hover */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(0,0,0,0.5)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="h-full rounded-full" style={{ width: "40%", background: accentColor }} />
                </div>
                {/* Remove X */}
                <button
                  onClick={(e) => { e.stopPropagation(); removeContinueWatching(item.id, item.type); }}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(0,0,0,0.7)" }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              {/* Info */}
              <div className="mt-1.5 px-0.5">
                <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                {item.type === "tv" && (item.season || item.episode) && (
                  <p className="text-xs" style={{ color: accentColor }}>S{item.season} E{item.episode}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

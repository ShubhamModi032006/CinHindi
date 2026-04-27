import { useState, useRef, useCallback } from "react";
import { posterUrl } from "../../config/tmdb";
import { useApp } from "../../context/AppContext";

// Film icon placeholder
function FilmPlaceholder() {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: "var(--surface)", borderRadius: 8 }}
    >
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="17" y1="7" x2="22" y2="7" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="2" y1="17" x2="7" y2="17" />
      </svg>
    </div>
  );
}

export default function MediaCard({ item, index = 0, type = "movie", width = 160 }) {
  const { navigate, toggleWatchLater, isInWatchLater, accent } = useApp();
  const [hovered, setHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [bookmarkClicked, setBookmarkClicked] = useState(false);
  const bmRef = useRef(null);

  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";

  const itemType = item.media_type || type;
  const id = item.id;
  const title = item.title || item.name || "Unknown";
  const poster = posterUrl(item.poster_path);
  const rating = item.vote_average?.toFixed(1);
  const year = (item.release_date || item.first_air_date || "")?.slice(0, 4);
  const saved = isInWatchLater(id, itemType);

  const handleBookmark = useCallback((e) => {
    e.stopPropagation();
    toggleWatchLater({ id, type: itemType, title, poster });
    setBookmarkClicked(true);
    if (bmRef.current) {
      bmRef.current.classList.add("bookmark-beat");
      setTimeout(() => {
        bmRef.current?.classList.remove("bookmark-beat");
        setBookmarkClicked(false);
      }, 400);
    }
  }, [id, itemType, title, poster, toggleWatchLater]);

  const handlePlay = useCallback((e) => {
    e.stopPropagation();
    navigate("watch", { id, type: itemType, title, poster, season: 1, episode: 1 });
  }, [id, itemType, title, poster, navigate]);

  const handleInfo = useCallback((e) => {
    e.stopPropagation();
    navigate("detail", { id, type: itemType });
  }, [id, itemType, navigate]);

  // When width is a % string (grid mode), use CSS aspect-ratio instead of fixed px height
  const isPercentWidth = typeof width === "string";
  const cardHeight = isPercentWidth ? undefined : Math.round(Number(width) * 1.5);

  return (
    <div
      className="card-hover flex-shrink-0 relative rounded-lg overflow-hidden cursor-pointer"
      style={{
        width,
        animationDelay: `${index * 50}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate("detail", { id, type: itemType })}
    >
      {/* Poster */}
      <div style={{
        width: isPercentWidth ? "100%" : width,
        height: isPercentWidth ? undefined : cardHeight,
        aspectRatio: isPercentWidth ? "2/3" : undefined,
        position: "relative",
        background: "var(--surface)",
        borderRadius: 8,
        overflow: "hidden",
      }}>
        {poster && !imgError ? (
          <img
            src={poster}
            alt={title}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }}
          />
        ) : (
          <FilmPlaceholder />
        )}

        {/* Bookmark top-left */}
        <button
          ref={bmRef}
          onClick={handleBookmark}
          className="absolute top-2 left-2 z-10 w-7 h-7 flex items-center justify-center rounded-full"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          title={saved ? "Remove from Watch Later" : "Add to Watch Later"}
        >
          {saved ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill={accentColor}>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          )}
        </button>

        {/* Rating badge top-right */}
        {rating && (
          <div
            className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-xs font-bold"
            style={{ background: "rgba(0,0,0,0.75)", color: accentColor }}
          >
            ⭐ {rating}
          </div>
        )}

        {/* Hover overlay */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-end pb-3 gap-2 transition-opacity duration-200"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
            opacity: hovered ? 1 : 0,
            borderRadius: 8,
          }}
        >
          <p className="text-white text-xs font-semibold text-center px-2 leading-tight" style={{ maxWidth: "90%" }}>
            {title}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePlay}
              className="flex items-center gap-1 text-xs font-bold text-white rounded-full px-3 py-1.5 transition-transform hover:scale-105"
              style={{ background: accentColor }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Play
            </button>
            <button
              onClick={handleInfo}
              className="flex items-center gap-1 text-xs font-bold text-white rounded-full px-3 py-1.5 transition-transform hover:scale-105"
              style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.3)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Info
            </button>
          </div>
        </div>
      </div>

      {/* Below poster */}
      <div className="mt-2 px-0.5">
        <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{title}</p>
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
          {year}{year && itemType === "tv" && item.number_of_seasons ? " • " : ""}
          {itemType === "tv" && item.number_of_seasons ? `${item.number_of_seasons}S` : ""}
        </p>
      </div>
    </div>
  );
}

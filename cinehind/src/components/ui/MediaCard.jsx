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

export default function MediaCard({ item, index = 0, type = "movie", width = 160, onDismiss }) {
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

  const handleDismiss = useCallback((e) => {
    e.stopPropagation();
    try {
      const dismissed = JSON.parse(localStorage.getItem("cinhindi_dismissed")) || [];
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem("cinhindi_dismissed", JSON.stringify(dismissed));
      }
    } catch { /* skip */ }
    if (onDismiss) onDismiss(id);
  }, [id, onDismiss]);

  // When width is a % string (grid mode), use CSS aspect-ratio instead of fixed px height
  const isPercentWidth = typeof width === "string";
  const cardHeight = isPercentWidth ? undefined : Math.round(Number(width) * 1.5);

  return (
    <div
      className="media-card"
      style={{ width }}
      onClick={() => navigate("detail", { id, type: itemType })}
    >
      {poster && !imgError ? (
        <img
          src={poster}
          alt={title}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <FilmPlaceholder />
      )}

      {/* Bookmark top-left */}
      <button
        ref={bmRef}
        onClick={handleBookmark}
        className="absolute z-10 w-7 h-7 flex items-center justify-center rounded-full"
        style={{
          top: "8px",
          left: onDismiss ? "40px" : "8px",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)"
        }}
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
        <div className="media-card-rating">
          ⭐ {rating}
        </div>
      )}

      {/* Hover overlay */}
      <div className="media-card-overlay">
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="media-card-dismiss"
            title="Not Interested"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        <button onClick={handlePlay} className="media-card-play">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </button>
        <p className="media-card-title">{title}</p>
        <p className="media-card-year">
          {year}{year && itemType === "tv" && item.number_of_seasons ? " • " : ""}
          {itemType === "tv" && item.number_of_seasons ? `${item.number_of_seasons}S` : ""}
        </p>
      </div>
    </div>
  );
}

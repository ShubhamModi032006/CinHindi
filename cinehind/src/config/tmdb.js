// ============================================================
// TMDB API Configuration
// Replace TMDB_KEY with your actual TMDB API key from
// https://www.themoviedb.org/settings/api
// ============================================================
export const TMDB_KEY = import.meta.env.VITE_TMDB_KEY || "063b2e760a0cde0e6dcd2e3838192421";
// Replace with your TMDB API key
// Used in every single API call throughout the site

export const TMDB_BASE = "https://api.themoviedb.org/3";
export const IMG_BASE = "https://image.tmdb.org/t/p/w500";
export const BACKDROP_BASE = "https://image.tmdb.org/t/p/original";
export const YT_EMBED = "https://www.youtube.com/embed";

// Language mappings for content modes
// TMDB discover uses pipe "|" for OR logic in with_original_language
export const MODE_LANGUAGES = {
  indian: "hi|ta|te|ml|kn",
  mixed:  "hi|ta|te|en",
  hollywood: "en",
};

// Build TMDB API URL with common params always appended
export function tmdbUrl(path, params = {}) {
  // Build base URL with fixed params
  const base = `${TMDB_BASE}${path}?api_key=${TMDB_KEY}&include_adult=false`;
  const parts = [];
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      // Keep pipe (|) raw — TMDB OR logic requires unencoded pipe
      const valStr = String(v);
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(valStr).replace(/%7C/gi, "|")}`);
    }
  }
  return parts.length ? `${base}&${parts.join("&")}` : base;
}

// Poster image URL with fallback
export function posterUrl(path) {
  if (!path) return null;
  return `${IMG_BASE}${path}`;
}

// Backdrop image URL with fallback
export function backdropUrl(path) {
  if (!path) return null;
  return `${BACKDROP_BASE}${path}`;
}

// YouTube embed URL for trailers
export function ytEmbedUrl(key) {
  return `${YT_EMBED}/${key}?autoplay=1&mute=1&controls=0&showinfo=0&modestbranding=1&loop=1&playlist=${key}&disablekb=1&rel=0&iv_load_policy=3`;
}

// Screenscape embed URL
export function screenskapeUrl(id, type, season, episode) {
  if (type === "movie") {
    return `https://embed.screenscape.me/embed?tmdb=${id}&type=movie`;
  }
  return `https://embed.screenscape.me/embed?tmdb=${id}&type=tv&s=${season}&e=${episode}`;
}

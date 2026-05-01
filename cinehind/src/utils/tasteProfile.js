// ============================================================
// tasteProfile.js — CinHindi Recommendation Engine
// Builds a rich user taste profile from watch history and
// scores TMDB discover results against it.
// ============================================================

const DETAIL_CACHE_KEY  = "cinhindi_detail_cache";
const PROFILE_CACHE_KEY = "cinhindi_taste_profile";
const DISMISSED_KEY     = "cinhindi_dismissed";

// ── Helper: derive decade string from a date string ──────────
function getDecade(dateStr) {
  if (!dateStr) return null;
  const year = parseInt(dateStr.slice(0, 4), 10);
  if (isNaN(year)) return null;
  return `${Math.floor(year / 10) * 10}s`; // "2020s", "2010s" …
}

// ── Helper: top key from a counter object ─────────────────────
function topKey(counter) {
  let best = null;
  let bestVal = -Infinity;
  for (const [k, v] of Object.entries(counter)) {
    if (v > bestVal) { best = k; bestVal = v; }
  }
  return best;
}

// ── Helper: top-N keys from a counter object ──────────────────
function topNKeys(counter, n) {
  return Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => Number(k));     // genre IDs are numbers
}

// ─────────────────────────────────────────────────────────────
// buildTasteProfile(watchHistory, fetchTmdb)
//
// Analyses the full watch history, fetches TMDB details (with
// caching), extracts taste signals, and returns a profile object.
// ─────────────────────────────────────────────────────────────
export async function buildTasteProfile(watchHistory, fetchTmdb) {
  // ── Step 1: Load detail cache from localStorage ────────────
  let cache = {};
  try {
    cache = JSON.parse(localStorage.getItem(DETAIL_CACHE_KEY)) || {};
  } catch {
    cache = {};
  }

  // ── Fetch missing details (with cache) ──────────────────────
  const detailsMap = {}; // id → full TMDB detail object

  await Promise.all(
    watchHistory.map(async (item) => {
      const key = String(item.id);
      if (cache[key]) {
        detailsMap[key] = cache[key];
        return;
      }
      try {
        const path = item.type === "movie" ? `/movie/${item.id}` : `/tv/${item.id}`;
        const data = await fetchTmdb(path);
        detailsMap[key] = data;
        cache[key] = data;
      } catch {
        detailsMap[key] = null;
      }
    })
  );

  // Persist updated cache
  try {
    localStorage.setItem(DETAIL_CACHE_KEY, JSON.stringify(cache));
  } catch { /* quota exceeded — skip */ }

  // ── Step 2 & 3: Extract signals and build counters ──────────
  const languages   = {};
  const genres      = {};
  const decades     = {};
  const contentType = {};
  let   ratingSum   = 0;
  let   ratingCount = 0;

  for (const item of watchHistory) {
    const details = detailsMap[String(item.id)];
    if (!details) continue;

    // Language
    const lang = details.original_language;
    if (lang) languages[lang] = (languages[lang] || 0) + 1;

    // Genres
    for (const g of details.genres || []) {
      genres[g.id] = (genres[g.id] || 0) + 1;
    }

    // Decade (use release_date for movies, first_air_date for TV)
    const dateStr = details.release_date || details.first_air_date;
    const decade  = getDecade(dateStr);
    if (decade) decades[decade] = (decades[decade] || 0) + 1;

    // Rating
    if (details.vote_average && details.vote_average > 0) {
      ratingSum   += details.vote_average;
      ratingCount += 1;
    }

    // Content type
    const t = item.type || "movie";
    contentType[t] = (contentType[t] || 0) + 1;
  }

  // ── Step 4: Derive preferences ────────────────────────────
  const avgRating    = ratingCount > 0
    ? Math.round((ratingSum / ratingCount) * 10) / 10
    : 6.5;
  const minRating    = Math.max(5.0, avgRating - 1.0);

  const topLanguage  = topKey(languages)  || "hi";
  const topGenres    = topNKeys(genres, 3);            // [id, id, id]
  const preferredEra = topKey(decades)    || "2020s";
  const preferredType= topKey(contentType)|| "movie";
  const watchedIds   = new Set(watchHistory.map((i) => i.id));

  // recentSeed — most recently watched item + its full details
  const recentItem   = watchHistory[0] || null;
  const recentSeed   = recentItem
    ? {
        ...recentItem,
        details: detailsMap[String(recentItem.id)] || null,
        // Convenience shortcuts used in HomePage
        original_language: detailsMap[String(recentItem.id)]?.original_language || "hi",
        genres: detailsMap[String(recentItem.id)]?.genres || [],
        title: recentItem.title || detailsMap[String(recentItem.id)]?.title
             || detailsMap[String(recentItem.id)]?.name || "Unknown",
      }
    : null;

  // ── Step 5: Confidence ────────────────────────────────────
  const n = watchHistory.length;
  const confidence = n === 0 ? "none"
    : n <= 3                 ? "low"
    : n <= 9                 ? "medium"
    :                          "high";

  // ── Step 6: Build & persist profile ─────────────────────
  const profile = {
    topLanguage,
    topGenres,
    preferredEra,
    preferredType,
    avgRating,
    minRating,
    watchedIds,
    recentSeed,
    confidence,
    builtAt: Date.now(),
  };

  try {
    // watchedIds is a Set — serialize as array
    localStorage.setItem(
      PROFILE_CACHE_KEY,
      JSON.stringify({ ...profile, watchedIds: [...watchedIds] })
    );
  } catch { /* skip */ }

  return profile;
}

// ─────────────────────────────────────────────────────────────
// scoreResults(results, profile)
//
// Scores each TMDB result object against the taste profile and
// returns a filtered, sorted array (highest score first).
// ─────────────────────────────────────────────────────────────
export function scoreResults(results, profile) {
  // Read dismissed IDs from localStorage
  let dismissed = [];
  try {
    dismissed = JSON.parse(localStorage.getItem(DISMISSED_KEY)) || [];
  } catch {
    dismissed = [];
  }
  const dismissedSet = new Set(dismissed.map(Number));

  return results
    .map((result) => {
      let score = 0;

      const resultGenreIds = (result.genre_ids || []).map(Number);
      const releaseStr     = result.release_date || result.first_air_date || "";
      const resultDecade   = getDecade(releaseStr);

      // Language match
      if (result.original_language === profile.topLanguage) score += 3;

      // Genre matches
      if (profile.topGenres[0] != null && resultGenreIds.includes(profile.topGenres[0])) score += 2;
      if (profile.topGenres[1] != null && resultGenreIds.includes(profile.topGenres[1])) score += 1;
      if (profile.topGenres[2] != null && resultGenreIds.includes(profile.topGenres[2])) score += 1;

      // Rating quality
      if (result.vote_average >= profile.avgRating) score += 2;

      // Era match
      if (resultDecade && resultDecade === profile.preferredEra) score += 1;

      // Penalise already-watched
      if (profile.watchedIds.has(result.id)) score -= 99;

      // Penalise dismissed
      if (dismissedSet.has(result.id)) score -= 99;

      return { ...result, _score: score };
    })
    .filter((r) => r._score > -10)
    .sort((a, b) => b._score - a._score);
}

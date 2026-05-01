import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { fetchTmdb } from "../hooks/useTmdb";
import { MODE_LANGUAGES } from "../config/tmdb";
import HeroSection from "../components/home/HeroSection";
import ContinueWatchingRow from "../components/home/ContinueWatchingRow";
import MediaRow from "../components/layout/MediaRow";
import ProviderSection from "../components/home/ProviderSection";
import WatchInLanguageSection from "../components/home/WatchInLanguageSection";
import { buildTasteProfile, scoreResults } from "../utils/tasteProfile";

// ── Genre ID → display name ───────────────────────────────────
const GENRE_NAME_MAP = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller",
  10752: "War", 37: "Western", 10759: "Action & Adventure",
  10762: "Kids", 10763: "News", 10764: "Reality", 10765: "Sci-Fi & Fantasy",
  10766: "Soap", 10767: "Talk", 10768: "War & Politics",
};

// ── Language code → display name ─────────────────────────────
const LANGUAGE_NAME_MAP = {
  hi: "Hindi", ta: "Tamil", te: "Telugu", ml: "Malayalam",
  kn: "Kannada", en: "English", ja: "Japanese", ko: "Korean",
};

// ── Deduplicate an array of TMDB results by id ────────────────
function dedupe(arr) {
  const seen = new Set();
  return arr.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function HomePage() {
  const { mode, navigate, activeProvider, watchHistory } = useApp();
  const langs = MODE_LANGUAGES[mode];

  // ── Standard content rows ────────────────────────────────────
  const [trending,    setTrending]    = useState({ data: [], loading: true });
  const [movies,      setMovies]      = useState({ data: [], loading: true });
  const [series,      setSeries]      = useState({ data: [], loading: true });

  // ── New This Week row ─────────────────────────────────────────
  const [newThisWeek, setNewThisWeek] = useState({ data: [], loading: true });

  // ── Recommendation rows ──────────────────────────────────────
  const [tasteProfile,    setTasteProfile]    = useState(null);
  const [recRowSeed,      setRecRowSeed]      = useState({ data: [], loading: true, basedOn: "" });
  const [recRowGenre,     setRecRowGenre]     = useState({ data: [], loading: true, genreName: "" });
  const [recRowLanguage,  setRecRowLanguage]  = useState({ data: [], loading: true, language: "" });

  // ─────────────────────────────────────────────────────────────
  // Param builders (unchanged from original)
  // ─────────────────────────────────────────────────────────────
  const movieParams = (extra = {}) => {
    const p = { watch_region: "IN", "vote_count.gte": 20, ...extra };
    if (activeProvider?.watchId) {
      p.with_watch_providers = activeProvider.watchId;
    } else {
      p.with_original_language = langs;
      p.with_watch_monetization_types = "flatrate|free|rent|buy";
    }
    return p;
  };

  const tvParams = (extra = {}) => {
    const p = { "vote_count.gte": 10, ...extra };
    if (activeProvider?.watchId) {
      p.watch_region = "IN";
      p.with_watch_providers = activeProvider.watchId;
    } else if (activeProvider?.networkId) {
      p.with_networks = activeProvider.networkId;
    } else {
      p.with_original_language = langs;
      p.with_networks = "213|1024|3919|3430|2117|2552";
    }
    return p;
  };

  // ─────────────────────────────────────────────────────────────
  // Standard content rows: Trending, Movies, Series
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const trendingDate = threeMonthsAgo.toISOString().split("T")[0];

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const hitsDate = twoYearsAgo.toISOString().split("T")[0];

    setTrending({ data: [], loading: true });
    fetchTmdb("/discover/movie", movieParams({ sort_by: "popularity.desc", "primary_release_date.gte": trendingDate, page: 1 }))
      .then((d) => setTrending({ data: d.results || [], loading: false }))
      .catch(() => setTrending({ data: [], loading: false }));

    setMovies({ data: [], loading: true });
    fetchTmdb("/discover/movie", movieParams({ sort_by: "popularity.desc", "primary_release_date.gte": hitsDate, "vote_count.gte": 50, page: 1 }))
      .then((d) => setMovies({ data: d.results || [], loading: false }))
      .catch(() => setMovies({ data: [], loading: false }));

    setSeries({ data: [], loading: true });
    fetchTmdb("/discover/tv", tvParams({ sort_by: "popularity.desc", page: 1 }))
      .then((d) => setSeries({ data: d.results || [], loading: false }))
      .catch(() => setSeries({ data: [], loading: false }));
  }, [langs, mode, activeProvider?.id]);

  // ─────────────────────────────────────────────────────────────
  // New This Week row (movies + TV blended, last 14 days)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const today    = new Date();
    const dateTo   = today.toISOString().split("T")[0];
    const fromDate = new Date(today);
    fromDate.setDate(fromDate.getDate() - 14);
    const dateFrom = fromDate.toISOString().split("T")[0];

    setNewThisWeek({ data: [], loading: true });

    // Movie params
    const newMovieParams = {
      watch_region: "IN",
      sort_by: "popularity.desc",
      "primary_release_date.gte": dateFrom,
      "primary_release_date.lte": dateTo,
      "vote_count.gte": 10,
      with_original_language: langs,
    };
    if (activeProvider?.watchId) {
      newMovieParams.with_watch_providers = activeProvider.watchId;
      delete newMovieParams.with_original_language;
    }

    // TV params
    const newTvParams = {
      watch_region: "IN",
      sort_by: "popularity.desc",
      "first_air_date.gte": dateFrom,
      "first_air_date.lte": dateTo,
      "vote_count.gte": 5,
      with_original_language: langs,
    };
    if (activeProvider?.networkId) {
      newTvParams.with_networks = activeProvider.networkId;
      delete newTvParams.with_original_language;
    }

    Promise.all([
      fetchTmdb("/discover/movie", newMovieParams).catch(() => ({ results: [] })),
      fetchTmdb("/discover/tv",    newTvParams).catch(()    => ({ results: [] })),
    ]).then(([movRes, tvRes]) => {
      const merged = dedupe([
        ...(movRes.results || []).map((r) => ({ ...r, media_type: "movie" })),
        ...(tvRes.results  || []).map((r) => ({ ...r, media_type: "tv"    })),
      ]);
      const sorted = merged
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 20);

      setNewThisWeek({ data: sorted, loading: false });
    });
  }, [langs, mode, activeProvider?.id]);

  // ─────────────────────────────────────────────────────────────
  // Recommendation rows — powered by taste profile
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (watchHistory.length === 0) {
      setRecRowSeed(     { data: [], loading: false, basedOn: "" });
      setRecRowGenre(    { data: [], loading: false, genreName: "" });
      setRecRowLanguage( { data: [], loading: false, language: "" });
      return;
    }

    const run = async () => {
      // ── Build taste profile ──────────────────────────────────
      let profile;
      try {
        profile = await buildTasteProfile(watchHistory, fetchTmdb);
      } catch {
        setRecRowSeed(    { data: [], loading: false, basedOn: "" });
        setRecRowGenre(   { data: [], loading: false, genreName: "" });
        setRecRowLanguage({ data: [], loading: false, language: "" });
        return;
      }
      setTasteProfile(profile);

      const { recentSeed, confidence, minRating, avgRating, topLanguage, topGenres } = profile;

      // ── Row 1: "Because you watched X" ─────────────────────
      if (confidence !== "none" && recentSeed) {
        setRecRowSeed({ data: [], loading: true, basedOn: recentSeed.title });
        try {
          const seedType     = recentSeed.type || "movie";
          const discoverPath = seedType === "movie" ? "/discover/movie" : "/discover/tv";
          const baseParams   = seedType === "movie" ? movieParams({ page: 1 }) : tvParams({ page: 1 });

          // Inject seed signals (override language + genres)
          baseParams.with_original_language = recentSeed.original_language || "hi";
          const genreIds = (recentSeed.genres || []).slice(0, 2).map((g) => g.id).join(",");
          if (genreIds) baseParams.with_genres = genreIds;
          baseParams["vote_average.gte"] = minRating;

          const [p1, p2] = await Promise.all([
            fetchTmdb(discoverPath, { ...baseParams, page: 1 }).catch(() => ({ results: [] })),
            fetchTmdb(discoverPath, { ...baseParams, page: 2 }).catch(() => ({ results: [] })),
          ]);

          const merged = dedupe([...(p1.results || []), ...(p2.results || [])]);
          const scored = scoreResults(merged, profile).slice(0, 15);
          setRecRowSeed({ data: scored, loading: false, basedOn: recentSeed.title });
        } catch {
          setRecRowSeed({ data: [], loading: false, basedOn: recentSeed.title });
        }
      } else {
        setRecRowSeed({ data: [], loading: false, basedOn: "" });
      }

      // ── Row 2: "More [Genre] You'll Love" ──────────────────
      if (confidence === "medium" || confidence === "high") {
        const primaryGenre = topGenres[0];
        if (primaryGenre != null) {
          setRecRowGenre({ data: [], loading: true, genreName: GENRE_NAME_MAP[primaryGenre] || "Picks" });
          try {
            const genreParams = movieParams({ page: 1 });
            genreParams.with_genres             = primaryGenre;
            genreParams.with_original_language  = topLanguage;
            genreParams["vote_average.gte"]     = minRating;

            const [p1, p2] = await Promise.all([
              fetchTmdb("/discover/movie", { ...genreParams, page: 1 }).catch(() => ({ results: [] })),
              fetchTmdb("/discover/movie", { ...genreParams, page: 2 }).catch(() => ({ results: [] })),
            ]);

            const merged = dedupe([...(p1.results || []), ...(p2.results || [])]);
            const scored = scoreResults(merged, profile).slice(0, 15);
            setRecRowGenre({
              data: scored,
              loading: false,
              genreName: GENRE_NAME_MAP[primaryGenre] || "Picks",
            });
          } catch {
            setRecRowGenre({ data: [], loading: false, genreName: "" });
          }
        } else {
          setRecRowGenre({ data: [], loading: false, genreName: "" });
        }
      } else {
        setRecRowGenre({ data: [], loading: false, genreName: "" });
      }

      // ── Row 3: "Top Rated in [Language]" ───────────────────
      if (confidence === "high") {
        setRecRowLanguage({ data: [], loading: true, language: LANGUAGE_NAME_MAP[topLanguage] || topLanguage });
        try {
          const langParams = {
            watch_region: "IN",
            sort_by: "vote_average.desc",
            with_original_language: topLanguage,
            "vote_average.gte": avgRating,
            "vote_count.gte": 100,
          };
          if (activeProvider?.watchId) langParams.with_watch_providers = activeProvider.watchId;

          const [p1, p2] = await Promise.all([
            fetchTmdb("/discover/movie", { ...langParams, page: 1 }).catch(() => ({ results: [] })),
            fetchTmdb("/discover/movie", { ...langParams, page: 2 }).catch(() => ({ results: [] })),
          ]);

          const merged = dedupe([...(p1.results || []), ...(p2.results || [])]);
          const scored = scoreResults(merged, profile).slice(0, 15);
          setRecRowLanguage({
            data: scored,
            loading: false,
            language: LANGUAGE_NAME_MAP[topLanguage] || topLanguage,
          });
        } catch {
          setRecRowLanguage({ data: [], loading: false, language: "" });
        }
      } else {
        setRecRowLanguage({ data: [], loading: false, language: "" });
      }
    };

    run();
  }, [watchHistory, activeProvider?.id, mode]);

  // ─────────────────────────────────────────────────────────────
  // Dynamic row labels
  // ─────────────────────────────────────────────────────────────
  const providerLabel = activeProvider?.label;

  const moviesLabel = activeProvider
    ? `🎬 ${providerLabel} Movies`
    : mode === "hollywood" ? "🎬 Hollywood Hits" : mode === "mixed" ? "🎯 Top Picks" : "🎬 Bollywood Hits";

  const seriesLabel = activeProvider
    ? `📺 ${providerLabel} Series`
    : "📺 Top OTT Series";

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="page-enter" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Hero */}
      <HeroSection />

      <div className="pt-4">
        {/* 1 — Continue Watching */}
        <ContinueWatchingRow />

        {/* 2 — Streaming Providers */}
        <ProviderSection />

        {/* 3 — Trending */}
        <MediaRow title={`🔥 ${providerLabel ? providerLabel + " " : ""}Trending`} items={trending.data} loading={trending.loading} type="movie" />

        {/* 4 — Watch in Your Language */}
        <WatchInLanguageSection />

        {/* ── Recommendation Row 1: Seed-based ── */}
        {recRowSeed.data.length > 0 && (
          <MediaRow
            title={`✨ Because you watched ${recRowSeed.basedOn}`}
            items={recRowSeed.data}
            loading={recRowSeed.loading}
            type={watchHistory?.[0]?.type || "movie"}
            dismissable
          />
        )}

        {/* ── Recommendation Row 2: Genre-based (medium/high) ── */}
        {recRowGenre.data.length > 0 && (
          <MediaRow
            title={`🎭 More ${recRowGenre.genreName} You'll Love`}
            items={recRowGenre.data}
            loading={recRowGenre.loading}
            type="movie"
            dismissable
          />
        )}

        {/* ── Recommendation Row 3: Top-rated in language (high only) ── */}
        {recRowLanguage.data.length > 0 && (
          <MediaRow
            title={`⭐ Top Rated in ${recRowLanguage.language}`}
            items={recRowLanguage.data}
            loading={recRowLanguage.loading}
            type="movie"
            dismissable
          />
        )}

        {/* 🆕 New This Week */}
        {newThisWeek.data.length > 0 && (
          <MediaRow
            title="🆕 New This Week"
            items={newThisWeek.data}
            loading={newThisWeek.loading}
            type="movie"
          />
        )}

        {/* Movies & Series rows */}
        <MediaRow title={moviesLabel} items={movies.data} loading={movies.loading} type="movie" />
        <MediaRow title={seriesLabel} items={series.data} loading={series.loading} type="tv" />
      </div>

      <div style={{ height: 60 }} />
    </div>
  );
}

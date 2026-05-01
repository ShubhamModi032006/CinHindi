import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { fetchTmdb } from "../hooks/useTmdb";
import { MODE_LANGUAGES } from "../config/tmdb";
import HeroSection from "../components/home/HeroSection";
import ContinueWatchingRow from "../components/home/ContinueWatchingRow";
import MediaRow from "../components/layout/MediaRow";
import ProviderSection from "../components/home/ProviderSection";
import WatchInLanguageSection from "../components/home/WatchInLanguageSection";

export default function HomePage() {
  const { mode, navigate, activeProvider, watchHistory } = useApp();
  const langs = MODE_LANGUAGES[mode];

  const [trending, setTrending]       = useState({ data: [], loading: true });
  const [movies, setMovies]           = useState({ data: [], loading: true });
  const [series, setSeries]           = useState({ data: [], loading: true });

  const [suggestions, setSuggestions] = useState({ data: [], loading: true, basedOn: "" });

  // Build provider-aware base params
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

  useEffect(() => {
    // Get date 3 months ago for trending
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const trendingDate = threeMonthsAgo.toISOString().split("T")[0];

    // Get date 2 years ago for Hits
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const hitsDate = twoYearsAgo.toISOString().split("T")[0];

    // Trending movies (Recent 3 months)
    setTrending({ data: [], loading: true });
    fetchTmdb("/discover/movie", movieParams({ sort_by: "popularity.desc", "primary_release_date.gte": trendingDate, page: 1 }))
      .then((d) => setTrending({ data: d.results || [], loading: false }))
      .catch(() => setTrending({ data: [], loading: false }));

    // Top movies (Hits from last 2 years, not old classics)
    setMovies({ data: [], loading: true });
    fetchTmdb("/discover/movie", movieParams({ sort_by: "popularity.desc", "primary_release_date.gte": hitsDate, "vote_count.gte": 50, page: 1 }))
      .then((d) => setMovies({ data: d.results || [], loading: false }))
      .catch(() => setMovies({ data: [], loading: false }));

    // Top OTT series
    setSeries({ data: [], loading: true });
    fetchTmdb("/discover/tv", tvParams({ sort_by: "popularity.desc", page: 1 }))
      .then((d) => setSeries({ data: d.results || [], loading: false }))
      .catch(() => setSeries({ data: [], loading: false }));
  }, [langs, mode, activeProvider?.id]);



  // Suggestions based on watch history
  useEffect(() => {
    if (watchHistory?.length > 0) {
      const recent = watchHistory[0];
      setSuggestions({ data: [], loading: true, basedOn: recent.title });
      
      const fetchSuggestions = async () => {
        try {
          const detailsPath = recent.type === "movie" ? `/movie/${recent.id}` : `/tv/${recent.id}`;
          const details = await fetchTmdb(detailsPath);
          const lang = details.original_language || "hi";
          const topGenres = (details.genres || []).slice(0, 2).map(g => g.id).join(",");

          const discoverPath = recent.type === "movie" ? "/discover/movie" : "/discover/tv";
          const params = recent.type === "movie" ? movieParams({ page: 1 }) : tvParams({ page: 1 });
          
          params.with_original_language = lang;
          if (topGenres) params.with_genres = topGenres;
          
          const d = await fetchTmdb(discoverPath, params);
          setSuggestions({ data: (d.results || []).slice(0, 15), loading: false, basedOn: recent.title });
        } catch (err) {
          setSuggestions({ data: [], loading: false, basedOn: recent.title });
        }
      };
      
      fetchSuggestions();
    } else {
      setSuggestions({ data: [], loading: false, basedOn: "" });
    }
  }, [watchHistory, activeProvider?.id, mode]);

  const providerLabel = activeProvider?.label;

  const moviesLabel = activeProvider
    ? `🎬 ${providerLabel} Movies`
    : mode === "hollywood" ? "🎬 Hollywood Hits" : mode === "mixed" ? "🎯 Top Picks" : "🎬 Bollywood Hits";

  const seriesLabel = activeProvider
    ? `📺 ${providerLabel} Series`
    : "📺 Top OTT Series";

  return (
    <div className="page-enter" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Hero */}
      <HeroSection />

      <div className="pt-4">
        <ContinueWatchingRow />

        {/* Provider section */}
        <ProviderSection />

        {/* Watch in Your Language */}
        <WatchInLanguageSection />

        {/* Personalized Suggestions based on history */}
        {suggestions.data.length > 0 && (
          <MediaRow
            title={`✨ Because you watched ${suggestions.basedOn}`}
            items={suggestions.data}
            loading={suggestions.loading}
            type={watchHistory?.[0]?.type || "movie"}
          />
        )}

        {/* Content rows */}
        <MediaRow title={`🔥 ${providerLabel ? providerLabel + " " : ""}Trending`} items={trending.data} loading={trending.loading} type="movie" />
        <MediaRow title={moviesLabel} items={movies.data} loading={movies.loading} type="movie" />
        <MediaRow title={seriesLabel} items={series.data} loading={series.loading} type="tv" />


      </div>

      <div style={{ height: 60 }} />
    </div>
  );
}

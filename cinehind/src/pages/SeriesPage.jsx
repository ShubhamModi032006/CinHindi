import { useState, useEffect, useCallback } from "react";
import { useApp } from "../context/AppContext";
import { fetchTmdb } from "../hooks/useTmdb";
import { MODE_LANGUAGES } from "../config/tmdb";
import MediaCard from "../components/ui/MediaCard";
import { GridSkeleton } from "../components/ui/Skeletons";

const ALL_OTT = "213|1024|3919|3430|2117|2552|453|283";

const SORT_OPTS = [
  { label: "Suggested", value: "suggested" },
  { label: "Popular",   value: "popularity.desc" },
  { label: "Top Rated", value: "vote_average.desc" },
  { label: "Newest",    value: "first_air_date.desc" },
];

export default function SeriesPage() {
  const { mode, accent, activeProvider, watchHistory } = useApp();
  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";
  const defaultLang = MODE_LANGUAGES[mode];

  const [sort, setSort]           = useState("popularity.desc");
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [suggestions, setSuggestions] = useState({ data: [], loading: true, basedOn: "" });

  const buildParams = (pg) => {
    const p = {
      sort_by: sort === "suggested" ? "popularity.desc" : sort,
      page: pg,
      "vote_count.gte": 10,
    };
    
    // Always enforce language unless mode is hollywood or mixed
    if (mode === "indian") {
      p.with_original_language = "hi|ta|te|ml|kn|bn|pa";
    }

    if (activeProvider?.watchId) {
      p.watch_region = "IN";
      p.with_watch_providers = activeProvider.watchId;
    } else if (activeProvider?.networkId) {
      p.with_networks = activeProvider.networkId;
    } else {
      p.with_networks = ALL_OTT;
      if (mode !== "indian") {
        p.with_original_language = defaultLang;
      }
    }
    return p;
  };

  const fetchSeries = useCallback(async (pg = 1, reset = true) => {
    if (reset) { setLoading(true); setItems([]); }
    else setLoadingMore(true);
    try {
      let d;
      if (sort === "suggested") {
        const recentItem = watchHistory?.[0];
        if (recentItem) {
          const detailsPath = recentItem.type === "movie" ? `/movie/${recentItem.id}` : `/tv/${recentItem.id}`;
          const details = await fetchTmdb(detailsPath);
          const lang = details.original_language || "hi";
          
          let mappedGenres = [];
          if (recentItem.type === "movie") {
            const movieToTv = { 28: 10759, 12: 10759, 16: 16, 35: 35, 80: 80, 99: 99, 18: 18, 10751: 10751, 14: 10765, 36: 18, 27: 9648, 10402: 18, 9648: 9648, 10749: 18, 878: 10765, 10770: 10768, 53: 10759, 10752: 10768, 37: 37 };
            (details.genres || []).forEach(g => { if(movieToTv[g.id]) mappedGenres.push(movieToTv[g.id]); });
          } else {
            mappedGenres = (details.genres || []).map(g => g.id);
          }
          const topGenres = mappedGenres.slice(0, 2).join(",");
          
          const params = buildParams(pg);
          params.with_original_language = lang;
          if (topGenres) params.with_genres = topGenres;
          
          d = await fetchTmdb("/discover/tv", params);
          if (!d.results || d.results.length === 0) {
            delete params.with_genres;
            d = await fetchTmdb("/discover/tv", params);
          }
        } else {
          d = { results: [] };
        }
      } else {
        d = await fetchTmdb("/discover/tv", buildParams(pg));
      }
      const results = d.results || [];
      if (reset) setItems(results);
      else setItems((prev) => [...prev, ...results]);
      setHasMore(pg < (d.total_pages || 1));
    } catch {
      if (reset) setItems([]);
    }
    if (reset) setLoading(false);
    else setLoadingMore(false);
  }, [sort, defaultLang, activeProvider?.id, watchHistory, mode]);

  useEffect(() => { setPage(1); fetchSeries(1, true); }, [sort, mode, activeProvider?.id]);



  const loadMore = () => { const next = page + 1; setPage(next); fetchSeries(next, false); };

  const title = activeProvider ? `${activeProvider.label} Series` : "📺 Series";
  const sub   = activeProvider ? activeProvider.brand : "OTT Only";

  return (
    <div className="page-enter pt-20 px-4 md:px-6" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-black" style={{ color: activeProvider ? activeProvider.color : "var(--text-primary)" }}>
            {title}
            <span className="inline-block ml-3" style={{ width: 50, height: 3, background: activeProvider?.color || accentColor, verticalAlign: "middle", borderRadius: 2 }} />
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>{sub}</p>
        </div>
        <div className="flex gap-2">
          {SORT_OPTS.map((o) => (
            <button
              key={o.value}
              onClick={() => setSort(o.value)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
              style={{
                background: sort === o.value ? (activeProvider?.color || accentColor) : "var(--surface)",
                color: sort === o.value ? "white" : "var(--text-secondary)",
                border: `1px solid ${sort === o.value ? (activeProvider?.color || accentColor) : "var(--border)"}`,
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>



      {loading ? (
        <GridSkeleton count={15} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-4">
          <div style={{ fontSize: 64 }}>📺</div>
          <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>No series found</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {items.map((item, i) => (
              <div key={`${item.id}-${i}`} className="card-anim" style={{ animationDelay: `${Math.min(i * 25, 600)}ms` }}>
                <MediaCard item={item} index={i} type="tv" width="100%" />
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8 mb-12">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-full font-bold text-white text-sm transition-all hover:scale-105 disabled:opacity-60"
                style={{ background: activeProvider?.color || accentColor }}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

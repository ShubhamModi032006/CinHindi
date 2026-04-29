import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fetchTmdb } from "../hooks/useTmdb";
import MediaCard from "../components/ui/MediaCard";
import { GridSkeleton } from "../components/ui/Skeletons";

export default function SearchPage() {
  const { navigate, accent } = useApp();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";

  const [results, setResults] = useState({ movies: [], tv: [], anime: [] });
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState([]);
  const [relatedItems, setRelatedItems] = useState({ title: "", items: [] });

  // Fetch trending for empty state
  useEffect(() => {
    fetchTmdb("/trending/all/week", { page: 1 })
      .then((d) => setTrending(d.results?.slice(0, 15) || []))
      .catch(() => {});
  }, []);

  // Fetch related items for empty state
  useEffect(() => {
    if (!query.trim()) {
      const stored = sessionStorage.getItem("last_search_top_item");
      if (stored) {
        try {
          const topItem = JSON.parse(stored);
          fetchTmdb(`/${topItem.type}/${topItem.id}/recommendations`, { page: 1 })
            .then(d => {
              const recs = d.results || [];
              const hindi = recs.filter(r => r.original_language === "hi" || (r.origin_country && r.origin_country.includes("IN")));
              const others = recs.filter(r => r.original_language !== "hi" && !(r.origin_country && r.origin_country.includes("IN")));
              const finalRecs = [...hindi, ...others].slice(0, 5);
              if (finalRecs.length > 0) {
                setRelatedItems({ title: topItem.title, items: finalRecs });
              }
            }).catch(() => {});
        } catch {}
      }
    }
  }, [query]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ movies: [], tv: [], anime: [] });
      return;
    }
    setLoading(true);
    fetchTmdb("/search/multi", { query, page: 1 })
      .then((d) => {
        const all = d.results || [];
        const movies = all.filter((r) => r.media_type === "movie");
        const tv = all.filter((r) => r.media_type === "tv" && !r.genre_ids?.includes(16));
        const anime = all.filter((r) => r.media_type === "tv" && r.genre_ids?.includes(16));
        
        setResults({ movies, tv, anime });
        
        const topItem = all[0];
        if (topItem) {
          const type = topItem.media_type || (topItem.title ? "movie" : "tv");
          sessionStorage.setItem("last_search_top_item", JSON.stringify({ 
            id: topItem.id, 
            type, 
            title: topItem.title || topItem.name 
          }));
        }
        
        setLoading(false);
      })
      .catch(() => {
        setResults({ movies: [], tv: [], anime: [] });
        setLoading(false);
      });
  }, [query]);

  const total = results.movies.length + results.tv.length + results.anime.length;

  return (
    <div className="page-enter pt-24 px-4 md:px-6" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>
          {query ? `Results for "${query}"` : "🔍 Search"}
        </h1>
      </div>

      {loading && <GridSkeleton count={12} />}

      {!loading && query && total === 0 && (
        <div className="flex flex-col items-center py-24 gap-4">
          <div style={{ fontSize: 64 }}>🔍</div>
          <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>No results for "{query}"</p>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Try different keywords or check spelling</p>
        </div>
      )}

      {!loading && !query && (
        <div className="flex flex-col gap-8">
          {relatedItems.items.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-secondary)" }}>
                ✨ Because you searched for "{relatedItems.title}"
              </h2>
              <div className="flex gap-4 scroll-row snap-x pb-2" style={{ scrollSnapType: "x mandatory" }}>
                {relatedItems.items.map((item, i) => (
                  <div key={item.id} className="snap-start shrink-0 card-anim" style={{ width: 150, animationDelay: `${i * 40}ms` }}>
                    <MediaCard item={item} index={i} type={item.media_type || (item.title ? "movie" : "tv")} width="100%" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-bold mb-4" style={{ color: "var(--text-secondary)" }}>🔥 Trending Right Now</h2>
            <div className="flex gap-4 scroll-row snap-x pb-2" style={{ scrollSnapType: "x mandatory" }}>
              {trending.map((item, i) => (
                <div key={item.id} className="snap-start shrink-0 card-anim" style={{ width: 150, animationDelay: `${i * 40}ms` }}>
                  <MediaCard item={item} index={i} type={item.media_type || "movie"} width="100%" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!loading && results.movies.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            🎬 Movies
            <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>({results.movies.length})</span>
          </h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {results.movies.map((item, i) => (
              <div key={item.id} className="card-anim" style={{ animationDelay: `${i * 30}ms` }}>
                <MediaCard item={item} index={i} type="movie" width="100%" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.tv.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            📺 TV Shows
            <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>({results.tv.length})</span>
          </h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {results.tv.map((item, i) => (
              <div key={item.id} className="card-anim" style={{ animationDelay: `${i * 30}ms` }}>
                <MediaCard item={item} index={i} type="tv" width="100%" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.anime.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            🎌 Anime
            <span className="ml-2 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>({results.anime.length})</span>
          </h2>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {results.anime.map((item, i) => (
              <div key={item.id} className="card-anim" style={{ animationDelay: `${i * 30}ms` }}>
                <MediaCard item={item} index={i} type="tv" width="100%" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ height: 60 }} />
    </div>
  );
}

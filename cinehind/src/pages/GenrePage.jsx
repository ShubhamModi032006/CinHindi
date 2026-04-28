import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { fetchTmdb } from "../hooks/useTmdb";
import { MODE_LANGUAGES } from "../config/tmdb";
import MediaCard from "../components/ui/MediaCard";
import { GridSkeleton } from "../components/ui/Skeletons";

const SORT_OPTS = [
  { label: "Popular", value: "popularity.desc" },
  { label: "Top Rated", value: "vote_average.desc" },
  { label: "Newest", value: "primary_release_date.desc" },
];

export default function GenrePage() {
  const { navigate, mode, accent } = useApp();
  const { genreId } = useParams();
  const [searchParams] = useSearchParams();
  const genreName = searchParams.get("name") || "Genre";
  const accentColor = accent === "orange" ? "#f5a623" : accent === "blue" ? "#2563eb" : accent === "purple" ? "#7c3aed" : "#e50914";
  const defaultLang = MODE_LANGUAGES[mode];

  const [mediaTab, setMediaTab] = useState("movie");
  const [sort, setSort] = useState("popularity.desc");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!genreId) return;
    setLoading(true);
    setItems([]);
    setPage(1);
    const endpoint = mediaTab === "movie" ? "/discover/movie" : "/discover/tv";
    const sortParam = mediaTab === "tv" && sort === "primary_release_date.desc" ? "first_air_date.desc" : sort;
    fetchTmdb(endpoint, {
      with_genres: genreId,
      sort_by: sortParam,
      with_original_language: defaultLang,
      page: 1,
    })
      .then((d) => { setItems(d.results || []); setHasMore(1 < (d.total_pages || 1)); setLoading(false); })
      .catch(() => setLoading(false));
  }, [genreId, mediaTab, sort, mode]);

  const loadMore = async () => {
    const next = page + 1;
    const endpoint = mediaTab === "movie" ? "/discover/movie" : "/discover/tv";
    try {
      const d = await fetchTmdb(endpoint, { with_genres: genreId, sort_by: sort, with_original_language: defaultLang, page: next });
      setItems((prev) => [...prev, ...(d.results || [])]);
      setHasMore(next < (d.total_pages || 1));
      setPage(next);
    } catch {}
  };

  return (
    <div className="page-enter pt-24 px-4 md:px-6" style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Back */}
      <button
        onClick={() => navigate("home")}
        className="flex items-center gap-2 mb-4 text-sm transition-all hover:scale-105"
        style={{ color: "var(--text-secondary)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Back
      </button>

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
          {genreName || "Genre"} Movies & Shows
          <span className="inline-block ml-3" style={{ width: 60, height: 3, background: accentColor, verticalAlign: "middle", borderRadius: 2 }} />
        </h1>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-3 mb-6">
        {["movie", "tv"].map((t) => (
          <button
            key={t}
            onClick={() => setMediaTab(t)}
            className="px-5 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
            style={{
              background: mediaTab === t ? accentColor : "var(--surface)",
              color: mediaTab === t ? "white" : "var(--text-secondary)",
              border: `1px solid ${mediaTab === t ? accentColor : "var(--border)"}`,
            }}
          >
            {t === "movie" ? "🎬 Movies" : "📺 TV Shows"}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-xs font-semibold self-center" style={{ color: "var(--text-secondary)" }}>Sort:</span>
        {SORT_OPTS.map((o) => (
          <button
            key={o.value}
            onClick={() => setSort(o.value)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
            style={{
              background: sort === o.value ? accentColor : "var(--surface)",
              color: sort === o.value ? "white" : "var(--text-secondary)",
              border: `1px solid ${sort === o.value ? accentColor : "var(--border)"}`,
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {loading ? (
        <GridSkeleton count={15} />
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-4">
          <div style={{ fontSize: 64 }}>🎭</div>
          <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>No results for this genre</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {items.map((item, i) => (
              <div key={`${item.id}-${i}`} className="card-anim" style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}>
                <MediaCard item={item} index={i} type={mediaTab} width="100%" />
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8 mb-12">
              <button
                onClick={loadMore}
                className="px-8 py-3 rounded-full font-bold text-white text-sm transition-all hover:scale-105"
                style={{ background: accentColor }}
              >
                Load More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

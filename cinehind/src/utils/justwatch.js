// ─── JustWatch GraphQL integration with TMDB fallback ─────────

// Maps our PROVIDERS config IDs to JustWatch internal package names
export const JW_PROVIDER_MAP = {
  netflix:     "nfx",
  prime:       "amp",
  hotstar:     "hst",
  apple:       "atp",
  crunchyroll: "cru",
  sony:        "sly",
  zee:         "z5p",
};

// ─── GraphQL Queries ──────────────────────────────────────────

const POPULAR_TITLES_QUERY = `
  query GetPopularTitles(
    $country: Country!
    $language: Language!
    $first: Int!
    $filter: TitleFilter
  ) {
    popularTitles(
      country: $country
      language: $language
      first: $first
      filter: $filter
    ) {
      edges {
        node {
          id
          objectType
          objectId
          content(country: $country, language: $language) {
            title
            originalTitle
            posterUrl
            releaseYear
            externalIds {
              imdbId
            }
            scoring {
              imdbScore
            }
          }
          offers(country: $country, platform: WEB) {
            monetizationType
            package {
              packageId
              clearName
            }
          }
        }
      }
    }
  }
`;

const NEW_TITLES_QUERY = `
  query GetNewTitles(
    $country: Country!
    $language: Language!
    $first: Int!
    $filter: TitleFilter
  ) {
    newTitles(
      country: $country
      language: $language
      first: $first
      filter: $filter
    ) {
      edges {
        node {
          id
          objectType
          objectId
          content(country: $country, language: $language) {
            title
            originalTitle
            posterUrl
            releaseYear
            externalIds {
              imdbId
            }
          }
          offers(country: $country, platform: WEB) {
            monetizationType
            package {
              packageId
              clearName
            }
          }
        }
      }
    }
  }
`;

// ─── Core proxy caller ───────────────────────────────────────

const callJustWatch = async (query, variables) => {
  const response = await fetch("/.netlify/functions/justwatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  // Guard against non-JSON responses (e.g. Netlify 404 HTML page)
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("JustWatch proxy returned non-JSON response");
  }

  if (!response.ok) {
    throw new Error(`JustWatch proxy returned ${response.status}`);
  }

  const data = await response.json();
  if (data.fallback || data.error) throw new Error(data.error || "JustWatch unavailable");
  return data;
};

// ─── TMDB ID Resolver ────────────────────────────────────────
// Takes an array of imdbIds, returns a map of { imdbId: tmdbResult }

export const resolveImdbToTmdb = async (imdbIds, fetchTmdb) => {
  const resolvedMap = {};
  await Promise.all(
    imdbIds.map(async (imdbId) => {
      if (!imdbId) return;
      try {
        const result = await fetchTmdb(`/find/${imdbId}`, {
          external_source: "imdb_id",
        });
        const item =
          result.movie_results?.[0] || result.tv_results?.[0] || null;
        if (item) resolvedMap[imdbId] = item;
      } catch {
        // Skip unresolvable IDs silently
      }
    })
  );
  return resolvedMap;
};

// ─── Main exported fetchers ──────────────────────────────────

export const fetchJwTop10 = async (fetchTmdb, providerJwId = null) => {
  const filter = {
    objectTypes: ["MOVIE", "SHOW"],
  };

  // If a provider is specified, add package filter
  if (providerJwId) {
    filter.packages = [providerJwId];
  }

  const variables = {
    country: "IN",
    language: "hi",
    first: 20,
    filter,
  };

  const data = await callJustWatch(POPULAR_TITLES_QUERY, variables);
  const edges = data?.data?.popularTitles?.edges || [];

  // Extract IMDb IDs
  const imdbIds = edges
    .map((e) => e.node?.content?.externalIds?.imdbId)
    .filter(Boolean);

  // Resolve to TMDB IDs
  const tmdbMap = await resolveImdbToTmdb(imdbIds, fetchTmdb);

  // Build final array in JustWatch ranking order
  const results = [];
  for (const edge of edges) {
    const imdbId = edge.node?.content?.externalIds?.imdbId;
    const tmdbItem = tmdbMap[imdbId];
    if (tmdbItem) {
      results.push({
        ...tmdbItem,
        jwRank: results.length + 1, // 1-based ranking from JustWatch
      });
    }
    if (results.length >= 10) break; // Top 10 only
  }

  return results;
};

export const fetchJwRecentlyAdded = async (fetchTmdb, providerJwId = null) => {
  const filter = { objectTypes: ["MOVIE", "SHOW"] };
  if (providerJwId) filter.packages = [providerJwId];

  const variables = { country: "IN", language: "hi", first: 30, filter };

  const data = await callJustWatch(NEW_TITLES_QUERY, variables);
  const edges = data?.data?.newTitles?.edges || [];

  const imdbIds = edges
    .map((e) => e.node?.content?.externalIds?.imdbId)
    .filter(Boolean);

  const tmdbMap = await resolveImdbToTmdb(imdbIds, fetchTmdb);

  const results = [];
  for (const edge of edges) {
    const imdbId = edge.node?.content?.externalIds?.imdbId;
    const tmdbItem = tmdbMap[imdbId];
    if (tmdbItem) results.push(tmdbItem);
    if (results.length >= 20) break;
  }

  return results;
};

// ─── Wrappers with silent TMDB fallback ──────────────────────

export const getTop10WithFallback = async (fetchTmdb, providerJwId = null) => {
  try {
    const jwResults = await fetchJwTop10(fetchTmdb, providerJwId);
    if (jwResults.length >= 3) return { data: jwResults, source: "justwatch" };
    throw new Error("Too few JustWatch results");
  } catch {
    // Silent fallback to TMDB trending
    try {
      const params = { region: "IN", watch_region: "IN" };
      const tmdbData = await fetchTmdb("/trending/all/day", params);
      return {
        data: (tmdbData.results || []).slice(0, 10),
        source: "tmdb",
      };
    } catch {
      // Both sources failed — return empty gracefully
      return { data: [], source: "none" };
    }
  }
};

export const getRecentlyAddedWithFallback = async (
  fetchTmdb,
  providerJwId = null
) => {
  try {
    const jwResults = await fetchJwRecentlyAdded(fetchTmdb, providerJwId);
    if (jwResults.length >= 3) return { data: jwResults, source: "justwatch" };
    throw new Error("Too few JustWatch results");
  } catch {
    // Silent fallback to TMDB new releases
    try {
      const today = new Date();
      const twoWeeksAgo = new Date(today - 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      const params = {
        watch_region: "IN",
        sort_by: "popularity.desc",
        "primary_release_date.gte": twoWeeksAgo,
        "vote_count.gte": 10,
      };
      const tmdbData = await fetchTmdb("/discover/movie", params);
      return {
        data: (tmdbData.results || []).slice(0, 20),
        source: "tmdb",
      };
    } catch {
      // Both sources failed — return empty gracefully
      return { data: [], source: "none" };
    }
  }
};

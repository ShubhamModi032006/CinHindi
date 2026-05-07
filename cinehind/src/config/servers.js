export const EMBED_SERVERS = [
  {
    id: "vidlink",
    name: "Vidlink",
    getMovieUrl: (tmdbId) =>
      `https://vidlink.pro/movie/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) =>
      `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "videasy",
    name: "Videasy",
    getMovieUrl: (tmdbId) =>
      `https://player.videasy.net/movie/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) =>
      `https://player.videasy.net/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "vidsrc",
    name: "VidSrc",
    getMovieUrl: (tmdbId) =>
      `https://vidsrcme.su/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) =>
      `https://vidsrcme.su/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "embedsu",
    name: "EmbedSU",
    getMovieUrl: (tmdbId) =>
      `https://embed.su/embed/movie/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) =>
      `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: "multiembed",
    name: "MultiEmbed",
    getMovieUrl: (tmdbId) =>
      `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
    getTvUrl: (tmdbId, season, episode) =>
      `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`,
  },
  {
    id: "autoembed",
    name: "AutoEmbed",
    getMovieUrl: (tmdbId) =>
      `https://autoembed.co/movie/tmdb/${tmdbId}`,
    getTvUrl: (tmdbId, season, episode) =>
      `https://autoembed.co/tv/tmdb/${tmdbId}/${season}/${episode}`,
  },
];

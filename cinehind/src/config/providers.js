// Major streaming providers with TMDB IDs and "Cine" branding
// networkId  → used with with_networks for TV shows
// watchId    → used with with_watch_providers for movies (watch_region=IN)

export const PROVIDERS = [
  {
    id: "netflix",
    networkId: "213",
    watchId: "8",
    label: "CineNet",
    brand: "Netflix",
    color: "#E50914",
    bg: "linear-gradient(135deg, #8B0000, #E50914)",
    emoji: "N",
  },
  {
    id: "prime",
    networkId: "1024",
    watchId: "119",
    label: "CinePrime",
    brand: "Prime Video",
    color: "#00A8E1",
    bg: "linear-gradient(135deg, #003B5C, #00A8E1)",
    emoji: "P",
  },
  {
    id: "hotstar",
    networkId: "3919",
    watchId: "122",
    label: "CineHot",
    brand: "Hotstar",
    color: "#1565C0",
    bg: "linear-gradient(135deg, #000B2E, #1565C0)",
    emoji: "H",
  },
  {
    id: "apple",
    networkId: "2552",
    watchId: "350",
    label: "CineApple",
    brand: "Apple TV+",
    color: "#CCCCCC",
    bg: "linear-gradient(135deg, #1D1D1F, #555555)",
    emoji: "A",
  },

  {
    id: "crunchyroll",
    networkId: "283",
    watchId: "283",
    label: "CineRoll",
    brand: "Crunchyroll",
    color: "#F47521",
    bg: "linear-gradient(135deg, #1A0A00, #F47521)",
    emoji: "CR",
  },
  {
    id: "sony",
    networkId: "3430",
    watchId: "237",
    label: "CineSony",
    brand: "SonyLIV",
    color: "#0078D7",
    bg: "linear-gradient(135deg, #000A18, #0050A0)",
    emoji: "S",
  },
  {
    id: "zee",
    networkId: "2117",
    watchId: "232",
    label: "CineZee",
    brand: "Zee5",
    color: "#D32F5E",
    bg: "linear-gradient(135deg, #1A0010, #8B1B30)",
    emoji: "Z5",
  },

];

export const PROVIDER_MAP = Object.fromEntries(PROVIDERS.map((p) => [p.id, p]));

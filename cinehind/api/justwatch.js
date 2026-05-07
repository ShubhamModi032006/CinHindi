export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    return res.status(200).end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    // Vercel parses JSON bodies automatically
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const { query, variables } = body;

    const response = await fetch("https://apis.justwatch.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Origin: "https://www.justwatch.com",
        Referer: "https://www.justwatch.com/",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`JustWatch returned ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    // Return a specific error code so frontend knows to fall back to TMDB
    return res.status(500).json({ error: error.message, fallback: true });
  }
}

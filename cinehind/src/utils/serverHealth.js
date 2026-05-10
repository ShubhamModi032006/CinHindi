export const healthCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

export const checkServerHealth = (server) => {
  return new Promise((resolve) => {
    const cached = healthCache.get(server.id);
    if (cached && Date.now() - cached.checkedAt < CACHE_TTL) {
      resolve(cached.healthy);
      return;
    }

    const testUrl = new URL(server.getMovieUrl("1")).origin + "/favicon.ico";

    const img = new Image();
    const timeout = setTimeout(() => {
      img.src = "";
      healthCache.set(server.id, { healthy: false, checkedAt: Date.now() });
      resolve(false);
    }, 5000);

    img.onload = () => {
      clearTimeout(timeout);
      healthCache.set(server.id, { healthy: true, checkedAt: Date.now() });
      resolve(true);
    };

    img.onerror = () => {
      clearTimeout(timeout);
      healthCache.set(server.id, { healthy: true, checkedAt: Date.now() });
      resolve(true);
    };

    img.src = testUrl;
  });
};

export const findHealthyServer = async (servers, preferredServerId = null) => {
  const preferred = servers.find(s => s.id === preferredServerId);
  const rest = servers.filter(s => s.id !== preferredServerId);
  const checkOrder = preferred ? [preferred, ...rest] : servers;

  for (const server of checkOrder) {
    const healthy = await checkServerHealth(server);
    if (healthy) return { server, healthy: true };
  }

  return { server: null, healthy: false };
};

export const checkAllServersParallel = async (servers) => {
  const results = await Promise.all(
    servers.map(async (server) => {
      const healthy = await checkServerHealth(server);
      return { ...server, healthy };
    })
  );
  return results;
};

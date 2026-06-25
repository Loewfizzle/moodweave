const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API = "https://api.spotify.com/v1";

// Cached app-level (Client Credentials) token. There's no user — this belongs
// to the app itself and powers read-only search. No login required.
let cachedToken: { value: string; expiresAt: number } | null = null;

export async function getAppToken(): Promise<string | null> {
  // Reuse a still-valid token (30s safety margin before expiry).
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  try {
    const res = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({ grant_type: "client_credentials" }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[spotify] app token failed ${res.status}`);
      return null;
    }
    const data = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };
    cachedToken = {
      value: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };
    return cachedToken.value;
  } catch (err) {
    console.error("[spotify] app token error", err);
    return null;
  }
}

export type Track = {
  id: string;
  name: string;
  artist: string;
  image: string | null; // album art (smallest available)
  url: string; // open.spotify.com link
};

// Search tracks for one query. Returns whether the request succeeded (so the
// caller can tell a failed search from a genuinely empty one) plus the tracks.
export async function searchTracks(
  token: string,
  query: string,
  market: string | null,
  limit = 10,
): Promise<{ ok: boolean; tracks: Track[] }> {
  try {
    // Spotify's restricted tier caps the limit low (≥ ~20 returns 400). Clamp.
    const safeLimit = Math.min(50, Math.max(1, Math.round(limit) || 10));
    const params = new URLSearchParams({
      q: query,
      type: "track",
      limit: String(safeLimit),
    });
    if (market) params.set("market", market);

    const res = await fetch(`${SPOTIFY_API}/search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[spotify] search failed ${res.status} for "${query}" (limit=${safeLimit}) ${detail}`,
      );
      return { ok: false, tracks: [] };
    }

    const data = (await res.json()) as {
      tracks?: {
        items?: Array<{
          id: string;
          name: string;
          artists?: { name: string }[];
          album?: { images?: { url: string }[] };
          external_urls?: { spotify: string };
        }>;
      };
    };

    const tracks: Track[] = (data.tracks?.items ?? []).map((t) => {
      const imgs = t.album?.images ?? [];
      return {
        id: t.id,
        name: t.name,
        artist: (t.artists ?? []).map((a) => a.name).join(", "),
        image: imgs.length ? imgs[imgs.length - 1].url : null, // smallest
        url: t.external_urls?.spotify ?? "",
      };
    });

    return { ok: true, tracks };
  } catch (err) {
    console.error(`[spotify] search error for "${query}"`, err);
    return { ok: false, tracks: [] };
  }
}

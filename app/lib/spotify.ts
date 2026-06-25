import { cookies } from "next/headers";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API = "https://api.spotify.com/v1";

// Returns a usable access token, refreshing it if the current one has expired.
// MUST be called from a Route Handler or Server Action — it may set cookies,
// which isn't allowed during Server Component rendering. Returns null if the
// user isn't logged in or the refresh fails.
export async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();

  const existing = cookieStore.get("sp_access_token")?.value;
  if (existing) return existing;

  const refreshToken = cookieStore.get("sp_refresh_token")?.value;
  if (!refreshToken) return null;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  let data: {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
  try {
    const res = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${basic}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    });
    if (!res.ok) return null;
    data = await res.json();
  } catch {
    return null;
  }

  const secure = process.env.NODE_ENV === "production";

  cookieStore.set("sp_access_token", data.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: data.expires_in,
  });

  if (data.refresh_token) {
    cookieStore.set("sp_refresh_token", data.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return data.access_token;
}

// Current user's id, country (used as the search market so results are
// playable for them), and display name (shown in the UI).
export async function getCurrentUser(token: string): Promise<{
  id: string;
  country: string | null;
  displayName: string | null;
} | null> {
  try {
    const res = await fetch(`${SPOTIFY_API}/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      id: string;
      country?: string;
      display_name?: string | null;
    };
    return {
      id: data.id,
      country: data.country ?? null,
      displayName: data.display_name ?? null,
    };
  } catch {
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

import { cookies } from "next/headers";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API = "https://api.spotify.com/v1";

// Returns a usable access token, refreshing it if the current one has expired.
// MUST be called from a Route Handler or Server Action — it may set cookies,
// which isn't allowed during Server Component rendering. Returns null if the
// user isn't logged in or the refresh fails.
export async function getValidAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();

  // If the access-token cookie still exists, it's valid (its lifetime matches
  // the token's), so use it directly.
  const existing = cookieStore.get("sp_access_token")?.value;
  if (existing) return existing;

  // Otherwise try to refresh.
  const refreshToken = cookieStore.get("sp_refresh_token")?.value;
  if (!refreshToken) return null;

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  let data: {
    access_token: string;
    expires_in: number;
    refresh_token?: string; // Spotify may rotate it
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

// --- Spotify Web API helpers (each takes a valid access token) ---
// Each catches network errors and returns a safe fallback so one failing call
// can't crash the whole pipeline.

// Current user's id (to create a playlist), country (search market), and
// display name (shown in the UI).
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

// Search tracks for one query. Returns whether the request *succeeded* (so the
// caller can distinguish a failed search from a genuinely empty one) plus the
// matching track URIs. Logs the real status on failure for debugging.
export async function searchTracks(
  token: string,
  query: string,
  market: string | null,
  limit = 20,
): Promise<{ ok: boolean; uris: string[] }> {
  try {
    // Spotify requires an integer limit in [1, 50]. Clamp defensively so a bad
    // caller value can never produce a 400 "Invalid limit".
    const safeLimit = Math.min(50, Math.max(1, Math.round(limit) || 20));
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
      return { ok: false, uris: [] };
    }

    const data = (await res.json()) as {
      tracks?: { items?: Array<{ uri: string }> };
    };
    return { ok: true, uris: (data.tracks?.items ?? []).map((t) => t.uri) };
  } catch (err) {
    console.error(`[spotify] search error for "${query}"`, err);
    return { ok: false, uris: [] };
  }
}

// Create an empty playlist on the user's account.
export async function createPlaylist(
  token: string,
  userId: string,
  name: string,
  description: string,
  isPublic: boolean,
): Promise<{ id: string; url: string } | null> {
  try {
    const res = await fetch(`${SPOTIFY_API}/users/${userId}/playlists`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, description, public: isPublic }),
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      id: string;
      external_urls: { spotify: string };
    };
    return { id: data.id, url: data.external_urls.spotify };
  } catch {
    return null;
  }
}

// Add tracks (by URI) to a playlist. Up to 100 per request.
export async function addTracks(
  token: string,
  playlistId: string,
  uris: string[],
): Promise<boolean> {
  try {
    const res = await fetch(`${SPOTIFY_API}/playlists/${playlistId}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris }),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

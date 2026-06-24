import { cookies } from "next/headers";

const SPOTIFY_ME_URL = "https://api.spotify.com/v1/me";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API = "https://api.spotify.com/v1";

export type SpotifyProfile = {
  id: string;
  displayName: string | null;
};

// Reads the access token from the httpOnly cookie and fetches the user's
// Spotify profile. Returns null if not logged in — or if the token has
// expired (automatic refresh is handled later, in the request that actually
// creates a playlist, since a Server Component can't set new cookies).
export async function getSpotifyProfile(): Promise<SpotifyProfile | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sp_access_token")?.value;
  if (!accessToken) return null;

  const res = await fetch(SPOTIFY_ME_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    id: string;
    display_name: string | null;
  };

  return { id: data.id, displayName: data.display_name };
}

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

  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string; // Spotify may rotate it
  };

  const secure = process.env.NODE_ENV === "production";

  cookieStore.set("sp_access_token", data.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: data.expires_in,
  });

  // Persist the rotated refresh token if Spotify sent a new one.
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

// Current user's id (needed to create a playlist) and country (used as the
// search market so results are playable for them).
export async function getCurrentUser(
  token: string,
): Promise<{ id: string; country: string | null } | null> {
  const res = await fetch(`${SPOTIFY_API}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { id: string; country?: string };
  return { id: data.id, country: data.country ?? null };
}

// Search tracks for one query; returns their Spotify URIs.
export async function searchTracks(
  token: string,
  query: string,
  market: string | null,
  limit = 20,
): Promise<string[]> {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: String(limit),
  });
  if (market) params.set("market", market);

  const res = await fetch(`${SPOTIFY_API}/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];

  const data = (await res.json()) as {
    tracks?: { items?: Array<{ uri: string }> };
  };
  return (data.tracks?.items ?? []).map((t) => t.uri);
}

// Create an empty playlist on the user's account.
export async function createPlaylist(
  token: string,
  userId: string,
  name: string,
  description: string,
  isPublic: boolean,
): Promise<{ id: string; url: string } | null> {
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
}

// Add tracks (by URI) to a playlist. Up to 100 per request.
export async function addTracks(
  token: string,
  playlistId: string,
  uris: string[],
): Promise<boolean> {
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
}

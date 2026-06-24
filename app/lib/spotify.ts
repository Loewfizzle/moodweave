import { cookies } from "next/headers";

const SPOTIFY_ME_URL = "https://api.spotify.com/v1/me";

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

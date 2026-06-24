import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

// This route is never static — it generates a fresh random state each call.
export const dynamic = "force-dynamic";

const SPOTIFY_AUTHORIZE_URL = "https://accounts.spotify.com/authorize";

// Only the permissions v1 actually needs:
//  - playlist-modify-public/private: create & save playlists
//  - user-read-private: read the profile to get the user's Spotify ID
const SCOPES = [
  "playlist-modify-public",
  "playlist-modify-private",
  "user-read-private",
].join(" ");

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing Spotify environment variables." },
      { status: 500 },
    );
  }

  // CSRF guard: a random value we'll verify is echoed back in the callback.
  const state = randomUUID();

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES,
    state,
    // Force the consent screen so the full, current scope set is granted
    // (Spotify otherwise silently reuses a previously cached grant).
    show_dialog: "true",
  });

  const response = NextResponse.redirect(
    `${SPOTIFY_AUTHORIZE_URL}?${params.toString()}`,
  );

  // Short-lived, httpOnly cookie holding the state for the callback to check.
  response.cookies.set("spotify_auth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}

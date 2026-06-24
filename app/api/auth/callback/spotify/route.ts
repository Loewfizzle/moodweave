import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  // Send the user back to the SAME host as the redirect URI, so the browser
  // stays on the host where the cookies were actually set. (In dev this avoids
  // the localhost vs 127.0.0.1 cookie-jar split.)
  const appOrigin = redirectUri
    ? new URL(redirectUri).origin
    : new URL(request.url).origin;
  const home = (query: string) => new URL(`/${query}`, appOrigin);

  // 1. User denied consent, or Spotify reported an error.
  if (error) {
    return NextResponse.redirect(home("?spotify=denied"));
  }

  // 2. We must have both a code and a state.
  if (!code || !state) {
    return NextResponse.redirect(home("?spotify=error"));
  }

  // 3. CSRF check: state must match the cookie set during login.
  const storedState = request.cookies.get("spotify_auth_state")?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(home("?spotify=state_mismatch"));
  }

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(home("?spotify=config_error"));
  }

  // 4. Exchange the authorization code for access + refresh tokens.
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenRes = await fetch(SPOTIFY_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(home("?spotify=token_error"));
  }

  const token = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  // 5. Success: store tokens in httpOnly cookies, clear the state cookie.
  const response = NextResponse.redirect(home("?spotify=connected"));
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set("sp_access_token", token.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: token.expires_in, // ~1 hour
  });

  response.cookies.set("sp_refresh_token", token.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  response.cookies.delete("spotify_auth_state");

  return response;
}

import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// Clears the Spotify session cookies and returns home. Redirects to the
// redirect-URI host so we stay on the host that holds the cookies.
export async function GET(request: NextRequest) {
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;
  const appOrigin = redirectUri
    ? new URL(redirectUri).origin
    : new URL(request.url).origin;

  const response = NextResponse.redirect(new URL("/", appOrigin));
  response.cookies.delete("sp_access_token");
  response.cookies.delete("sp_refresh_token");
  return response;
}

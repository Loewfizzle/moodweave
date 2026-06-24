import { NextResponse } from "next/server";
import { getValidAccessToken, getCurrentUser } from "@/app/lib/spotify";

export const dynamic = "force-dynamic";

// Connection status for the client. Runs in a Route Handler, so it can refresh
// an expired access token (unlike a Server Component) — keeping the UI honest.
export async function GET() {
  const token = await getValidAccessToken();
  if (!token) {
    return NextResponse.json({ connected: false, displayName: null });
  }

  const user = await getCurrentUser(token);
  if (!user) {
    return NextResponse.json({ connected: false, displayName: null });
  }

  return NextResponse.json({ connected: true, displayName: user.displayName });
}

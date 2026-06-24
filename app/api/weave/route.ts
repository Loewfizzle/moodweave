import { NextResponse, type NextRequest } from "next/server";
import {
  getValidAccessToken,
  getCurrentUser,
  searchTracks,
  createPlaylist,
  addTracks,
} from "@/app/lib/spotify";
import { moodToQueries, type MoodValues } from "@/app/lib/mood";

export const dynamic = "force-dynamic";

const TARGET_TRACKS = 25;
// Spotify's restricted/development access tier caps search results low — a
// limit above ~10 returns 400 "Invalid limit". 10 per query is safe and, with
// several queries deduped, still fills a ~25-track playlist.
const PER_QUERY_LIMIT = 10;

// Guard the incoming body: must be four numeric sliders in range 1–5.
function isValidMood(value: unknown): value is MoodValues {
  if (!value || typeof value !== "object") return false;
  const m = value as Record<string, unknown>;
  return (["energy", "mood", "focus", "edge"] as const).every((key) => {
    const v = m[key];
    return typeof v === "number" && v >= 1 && v <= 5;
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(request: NextRequest) {
  // 1. Parse + validate the mood.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!isValidMood(body)) {
    return NextResponse.json({ error: "invalid_mood" }, { status: 400 });
  }
  const mood = body;

  // Optional client-supplied label (local date/time) for the playlist name.
  const rawLabel = (body as { label?: unknown }).label;
  const label =
    typeof rawLabel === "string"
      ? rawLabel.replace(/[\r\n]+/g, " ").trim().slice(0, 60)
      : "";

  try {
    // 2. Auth (refreshes the access token if it expired).
    const token = await getValidAccessToken();
    if (!token) {
      return NextResponse.json({ error: "not_connected" }, { status: 401 });
    }

    // 3. Who are we building for?
    const user = await getCurrentUser(token);
    if (!user) {
      return NextResponse.json({ error: "profile_failed" }, { status: 502 });
    }

    // 4. Mood → queries → search (in parallel) → pooled, deduped, shuffled.
    const queries = moodToQueries(mood);
    const results = await Promise.all(
      queries.map((q) => searchTracks(token, q, user.country, PER_QUERY_LIMIT)),
    );
    const anySearchOk = results.some((r) => r.ok);
    const pool = new Set<string>();
    for (const r of results) for (const uri of r.uris) pool.add(uri);
    const uris = shuffle([...pool]).slice(0, TARGET_TRACKS);

    console.log(
      `[weave] queries=${JSON.stringify(queries)} market=${user.country} ` +
        `pool=${pool.size} anySearchOk=${anySearchOk}`,
    );

    if (uris.length === 0) {
      // Every search request failed → a real problem, not a genuine no-match.
      if (!anySearchOk) {
        return NextResponse.json({ error: "search_failed" }, { status: 502 });
      }
      // Valid request, searches worked, but nothing matched this mood.
      // Return 200 so a true "no matches" isn't treated as an error.
      return NextResponse.json({ matched: false, trackCount: 0 });
    }

    // 5. Create the playlist and fill it.
    const fallbackDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const name = `MoodWeave · ${label || fallbackDate}`;
    const description = "Woven to match your mood with MoodWeave.";

    const playlist = await createPlaylist(
      token,
      user.id,
      name,
      description,
      false,
    );
    if (!playlist) {
      return NextResponse.json({ error: "create_failed" }, { status: 502 });
    }

    const added = await addTracks(token, playlist.id, uris);
    if (!added) {
      return NextResponse.json({ error: "add_failed" }, { status: 502 });
    }

    // 6. Done — hand the playlist back to the UI.
    return NextResponse.json({
      url: playlist.url,
      name,
      trackCount: uris.length,
    });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

import { NextResponse, type NextRequest } from "next/server";
import {
  getValidAccessToken,
  getCurrentUser,
  searchTracks,
  type Track,
} from "@/app/lib/spotify";
import { moodToQueries, type MoodValues } from "@/app/lib/mood";

export const dynamic = "force-dynamic";

const TARGET_TRACKS = 25;
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

  try {
    // 2. Auth (refreshes the access token if it expired).
    const token = await getValidAccessToken();
    if (!token) {
      return NextResponse.json({ error: "not_connected" }, { status: 401 });
    }

    // 3. The user's market makes results playable for them (best-effort).
    const user = await getCurrentUser(token);
    const market = user?.country ?? null;

    // 4. Mood → queries → search (in parallel) → deduped + shuffled tracks.
    const queries = moodToQueries(mood);
    const results = await Promise.all(
      queries.map((q) => searchTracks(token, q, market, PER_QUERY_LIMIT)),
    );
    const anySearchOk = results.some((r) => r.ok);

    const byId = new Map<string, Track>();
    for (const r of results) {
      for (const t of r.tracks) if (!byId.has(t.id)) byId.set(t.id, t);
    }
    const tracks = shuffle([...byId.values()]).slice(0, TARGET_TRACKS);

    console.log(
      `[weave] queries=${JSON.stringify(queries)} market=${market} ` +
        `unique=${byId.size} anySearchOk=${anySearchOk}`,
    );

    // Every search failed → a real problem, not a genuine no-match.
    if (tracks.length === 0 && !anySearchOk) {
      return NextResponse.json({ error: "search_failed" }, { status: 502 });
    }

    // 200 with the tracks (possibly empty → UI shows a "no matches" note).
    return NextResponse.json({ tracks });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

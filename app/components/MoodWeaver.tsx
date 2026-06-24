"use client";

import { useEffect, useState } from "react";
import MoodSlider from "@/app/components/MoodSlider";
import type { MoodValues } from "@/app/lib/mood";

type WeaveResult = { url: string; name: string; trackCount: number };
type Connection = { connected: boolean; displayName: string | null };

export default function MoodWeaver() {
  const [values, setValues] = useState<MoodValues>({
    energy: 3,
    mood: 3,
    focus: 3,
    edge: 3,
  });

  const [connection, setConnection] = useState<Connection | null>(null); // null = checking
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeaveResult | null>(null);
  const [error, setError] = useState<string | null>(null); // error code

  // Check connection on mount via /api/me (which can refresh an expired token).
  useEffect(() => {
    let active = true;
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (active) {
          setConnection({
            connected: !!d.connected,
            displayName: d.displayName ?? null,
          });
        }
      })
      .catch(() => {
        if (active) setConnection({ connected: false, displayName: null });
      });
    return () => {
      active = false;
    };
  }, []);

  const checking = connection === null;
  const connected = connection?.connected ?? false;

  // Functional, immutable update. Also clears any stale result/error since the
  // mood has changed.
  const update = (key: keyof MoodValues) => (value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setResult(null);
    setError(null);
  };

  const handleWeave = async () => {
    if (!connected || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      // A local, timezone-correct label so each playlist name is distinct.
      const label = new Date().toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      const res = await fetch("/api/weave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, label }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const code = typeof data?.error === "string" ? data.error : "unknown";
        setError(code);
        if (code === "not_connected") {
          setConnection({ connected: false, displayName: null });
        }
      } else {
        setResult(data as WeaveResult);
      }
    } catch {
      setError("unknown");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 w-full">
      {/* Connection status */}
      <div className="mb-6 text-center text-sm" aria-live="polite">
        {checking ? (
          <span className="text-zinc-500">Checking connection…</span>
        ) : connected ? (
          <span className="text-accent-teal">
            Connected as {connection?.displayName ?? "your Spotify account"}
            {" · "}
            <a
              href="/api/auth/logout"
              className="text-zinc-500 underline transition hover:text-zinc-300"
            >
              Disconnect
            </a>
          </span>
        ) : (
          <a
            href="/api/auth/login"
            className="inline-block rounded-full border border-accent-teal/40 px-5 py-2 font-medium text-accent-teal transition hover:bg-accent-teal/10"
          >
            Connect Spotify
          </a>
        )}
      </div>

      <section className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-left sm:p-8">
        <div className="flex flex-col gap-6">
          <MoodSlider
            label="Energy"
            leftLabel="Calm"
            rightLabel="Energetic"
            value={values.energy}
            onChange={update("energy")}
          />
          <MoodSlider
            label="Mood"
            leftLabel="Dark"
            rightLabel="Light"
            value={values.mood}
            onChange={update("mood")}
          />
          <MoodSlider
            label="Focus"
            leftLabel="Background"
            rightLabel="Main Character"
            value={values.focus}
            onChange={update("focus")}
          />
          <MoodSlider
            label="Edge"
            leftLabel="Safe"
            rightLabel="Weird"
            value={values.edge}
            onChange={update("edge")}
          />
        </div>
      </section>

      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={handleWeave}
          disabled={loading || checking || !connected}
          className="mt-6 w-full rounded-full bg-accent-violet px-8 py-3 text-base font-medium text-white transition hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Weaving…" : "Weave Playlist"}
        </button>
        {!checking && !connected && (
          <p className="mt-2 text-center text-xs text-zinc-500">
            Connect Spotify to weave a playlist.
          </p>
        )}
      </div>

      <div aria-live="polite">
        {result && (
          <div className="mt-6 w-full rounded-xl border border-accent-teal/30 bg-accent-teal/5 p-4 text-left">
            <p className="font-medium text-accent-teal">Playlist ready</p>
            <p className="mt-1 text-sm text-zinc-300">
              {result.name} · {result.trackCount} tracks
            </p>
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block rounded-full bg-accent-teal px-5 py-2 text-sm font-medium text-zinc-950 transition hover:brightness-110"
            >
              Open in Spotify →
            </a>
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-400">
            {error === "not_connected" ? (
              <>
                Your Spotify session expired.{" "}
                <a href="/api/auth/login" className="underline">
                  Reconnect
                </a>
                .
              </>
            ) : error === "no_tracks" ? (
              "No tracks matched that mood — try adjusting your sliders."
            ) : (
              "Couldn't weave a playlist. Please try again."
            )}
          </p>
        )}
      </div>
    </div>
  );
}

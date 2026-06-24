"use client";

import { useState } from "react";
import MoodSlider from "@/app/components/MoodSlider";
import type { MoodValues } from "@/app/lib/mood";

type WeaveResult = { url: string; name: string; trackCount: number };

export default function MoodWeaver() {
  const [values, setValues] = useState<MoodValues>({
    energy: 3,
    mood: 3,
    focus: 3,
    edge: 3,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WeaveResult | null>(null);
  const [error, setError] = useState<string | null>(null); // error code

  // Returns an onChange handler for a single dimension. We use a *functional*
  // update and spread the previous object so state is never mutated directly —
  // we always hand React a brand-new object.
  const update = (key: keyof MoodValues) => (value: number) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleWeave = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/weave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "unknown");
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

      <button
        type="button"
        onClick={handleWeave}
        disabled={loading}
        className="mt-6 w-full rounded-full bg-accent-violet px-8 py-3 text-base font-medium text-white transition hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Weaving…" : "Weave Playlist"}
      </button>

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
  );
}

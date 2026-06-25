"use client";

import { useState } from "react";
import Image from "next/image";
import MoodSlider from "@/app/components/MoodSlider";
import type { MoodValues } from "@/app/lib/mood";
import type { Track } from "@/app/lib/spotify";

export default function MoodWeaver() {
  const [values, setValues] = useState<MoodValues>({
    energy: 3,
    mood: 3,
    focus: 3,
    edge: 3,
  });

  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [error, setError] = useState<string | null>(null); // error code

  const update = (key: keyof MoodValues) => (value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTracks(null);
    setError(null);
  };

  const handleWeave = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    setTracks(null);
    try {
      const res = await fetch("/api/weave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "unknown");
      } else if (Array.isArray(data.tracks) && data.tracks.length > 0) {
        setTracks(data.tracks as Track[]);
      } else {
        setError("no_tracks");
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

      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={handleWeave}
          disabled={loading}
          className="mt-6 w-full rounded-full bg-accent-violet px-8 py-3 text-base font-medium text-white transition hover:brightness-110 active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? "Weaving…" : "Weave My Mix"}
        </button>
      </div>

      <div aria-live="polite">
        {tracks && tracks.length > 0 && (
          <div className="mt-6 w-full rounded-xl border border-accent-teal/30 bg-accent-teal/5 p-4 text-left">
            <p className="font-medium text-accent-teal">
              {tracks.length} tracks for your mood
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Tap a track to open it in Spotify.
            </p>
            <ul className="mt-3 flex max-h-80 flex-col gap-1 overflow-y-auto">
              {tracks.map((t) => (
                <li key={t.id}>
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-white/5"
                  >
                    {t.image ? (
                      <Image
                        src={t.image}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="h-10 w-10 flex-none rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 flex-none rounded bg-white/10" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-zinc-100">
                        {t.name}
                      </span>
                      <span className="block truncate text-xs text-zinc-400">
                        {t.artist}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Genuine "no matches" is a neutral note, not an error. */}
        {error === "no_tracks" && (
          <p className="mt-4 text-sm text-zinc-400">
            No tracks matched that mood — try adjusting your sliders.
          </p>
        )}

        {error && error !== "no_tracks" && (
          <p className="mt-4 text-sm text-red-400">
            {error === "search_failed"
              ? "Spotify search isn't responding right now. Please try again."
              : "Couldn't fetch tracks. Please try again."}
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import MoodSlider from "@/app/components/MoodSlider";

// One typed shape describing the whole mood.
type MoodValues = {
  energy: number;
  mood: number;
  focus: number;
  edge: number;
};

export default function MoodWeaver() {
  const [values, setValues] = useState<MoodValues>({
    energy: 50,
    mood: 50,
    focus: 50,
    edge: 50,
  });

  // A snapshot of the mood captured when "Weave Playlist" is clicked.
  // Temporary: this is where Spotify generation will hook in later.
  const [woven, setWoven] = useState<MoodValues | null>(null);

  // Returns an onChange handler for a single dimension. We use a *functional*
  // update and spread the previous object so state is never mutated directly —
  // we always hand React a brand-new object.
  const update = (key: keyof MoodValues) => (value: number) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const handleWeave = () => setWoven(values);

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
        className="mt-6 w-full rounded-full bg-accent-violet px-8 py-3 text-base font-medium text-white transition hover:brightness-110 active:brightness-95 sm:w-auto"
      >
        Weave Playlist
      </button>

      {woven && (
        <div className="mt-6 w-full rounded-xl border border-accent-teal/30 bg-accent-teal/5 p-4 text-left text-sm">
          <p className="mb-3 font-medium text-accent-teal">Your woven mood</p>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-zinc-300">
            <li className="flex justify-between">
              <span>Energy</span>
              <span className="tabular-nums text-zinc-500">{woven.energy}</span>
            </li>
            <li className="flex justify-between">
              <span>Mood</span>
              <span className="tabular-nums text-zinc-500">{woven.mood}</span>
            </li>
            <li className="flex justify-between">
              <span>Focus</span>
              <span className="tabular-nums text-zinc-500">{woven.focus}</span>
            </li>
            <li className="flex justify-between">
              <span>Edge</span>
              <span className="tabular-nums text-zinc-500">{woven.edge}</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

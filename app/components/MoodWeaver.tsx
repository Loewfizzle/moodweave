"use client";

import { useState } from "react";
import MoodSlider from "@/app/components/MoodSlider";

// One typed shape describing the whole mood. Phase 2's reactive background
// will read from this same object (especially `energy` and `edge`).
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

  // Returns an onChange handler for a single dimension. We use a *functional*
  // update and spread the previous object so state is never mutated directly —
  // we always hand React a brand-new object.
  const update = (key: keyof MoodValues) => (value: number) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
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
  );
}

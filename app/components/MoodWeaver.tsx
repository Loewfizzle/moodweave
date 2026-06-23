"use client";

import { useState } from "react";
import MoodSlider from "@/app/components/MoodSlider";

// Owns the mood state. For now just Energy as our test case; Step 4 will
// add the other three sliders here, and Phase 2 will read these values to
// drive the reactive background + glow.
export default function MoodWeaver() {
  const [energy, setEnergy] = useState(50);

  return (
    <div className="flex flex-col gap-6">
      <MoodSlider
        label="Energy"
        leftLabel="Calm"
        rightLabel="Energetic"
        value={energy}
        onChange={setEnergy}
      />
    </div>
  );
}

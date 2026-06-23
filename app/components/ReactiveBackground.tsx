import type { CSSProperties } from "react";

type ReactiveBackgroundProps = {
  intensity: number; // 0–1, derived from Energy + Edge
};

// A fixed, full-viewport layer behind all content. Two stacked effects, both
// driven by the same eased `tone`: a broad deep-purple wash, and a softer,
// pulsing orb. Both stay invisible (calm charcoal) until intensity ~0.65.
// Decorative only.
export default function ReactiveBackground({
  intensity,
}: ReactiveBackgroundProps) {
  // Remap intensity so nothing happens below 0.65, reaching full by 1.0.
  const ramp = Math.min(1, Math.max(0, (intensity - 0.65) / 0.35));
  // Smoothstep easing for a soft, premium onset instead of a hard linear ramp.
  const tone = ramp * ramp * (3 - 2 * ramp);

  // The pulse subtly quickens as the mood wakes up (calm ~6s → awake ~3.8s).
  const pulseDuration = 6 - tone * 2.2;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Broad deep-purple wash */}
      <div
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{
          opacity: tone,
          background:
            "radial-gradient(125% 125% at 50% 0%, rgba(76, 29, 149, 0.6) 0%, rgba(24, 16, 46, 0.4) 35%, rgba(9, 9, 11, 0) 70%)",
        }}
      />

      {/* Soft pulsing orb (centered horizontally, sitting high on the screen) */}
      <div
        className="absolute inset-0 flex justify-center transition-opacity duration-500 ease-out"
        style={{ opacity: tone }}
      >
        <div
          className="orb mt-[8vh] h-[55vmin] w-[55vmin] rounded-full blur-2xl"
          style={
            {
              background:
                "radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(45, 212, 191, 0.14) 45%, rgba(9, 9, 11, 0) 70%)",
              "--orb-duration": `${pulseDuration}s`,
            } as CSSProperties
          }
        />
      </div>
    </div>
  );
}

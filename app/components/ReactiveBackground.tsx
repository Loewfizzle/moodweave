type ReactiveBackgroundProps = {
  intensity: number; // 0–1, derived from Energy + Edge
};

// A fixed, full-viewport layer that sits behind all content. It stays fully
// transparent (calm charcoal base showing through) until intensity passes
// ~0.65, then eases in a deep-purple wash. Decorative only.
export default function ReactiveBackground({
  intensity,
}: ReactiveBackgroundProps) {
  // Remap intensity so nothing happens below 0.65, reaching full by 1.0.
  const ramp = Math.min(1, Math.max(0, (intensity - 0.65) / 0.35));
  // Smoothstep easing for a soft, premium onset instead of a hard linear ramp.
  const tone = ramp * ramp * (3 - 2 * ramp);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-300 ease-out"
      style={{
        opacity: tone,
        background:
          "radial-gradient(125% 125% at 50% 0%, rgba(76, 29, 149, 0.6) 0%, rgba(24, 16, 46, 0.4) 35%, rgba(9, 9, 11, 0) 70%)",
      }}
    />
  );
}

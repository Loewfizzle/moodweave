type MoodSliderProps = {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number; // 0–100
  onChange: (value: number) => void;
};

// Controlled, presentational slider: it holds no state of its own.
// The parent owns `value` and reacts to `onChange` — this is what lets
// the parent read every slider at once to drive the reactive UI later.
export default function MoodSlider({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
}: MoodSliderProps) {
  const sliderId = `mood-${label.toLowerCase()}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <label htmlFor={sliderId} className="text-sm font-medium text-zinc-200">
          {label}
        </label>
        <span className="text-xs tabular-nums text-zinc-500">{value}</span>
      </div>

      <input
        id={sliderId}
        type="range"
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label}: ${leftLabel} to ${rightLabel}`}
        className="mood-slider w-full"
        style={{
          // Filled track: violet up to the thumb, faint white after.
          background: `linear-gradient(to right, var(--accent-violet) ${value}%, rgba(255,255,255,0.1) ${value}%)`,
        }}
      />

      <div className="flex justify-between text-xs text-zinc-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

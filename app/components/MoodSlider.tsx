type MoodSliderProps = {
  label: string;
  leftLabel: string;
  rightLabel: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

// Controlled, presentational slider: it holds no state of its own.
// Defaults to a 1–5 snapping scale. We don't show a raw number — the thumb
// position and end captions convey the feeling — but screen readers still get
// the value via aria-valuetext.
export default function MoodSlider({
  label,
  leftLabel,
  rightLabel,
  value,
  onChange,
  min = 1,
  max = 5,
  step = 1,
}: MoodSliderProps) {
  const sliderId = `mood-${label.toLowerCase()}`;
  // Convert the value to a 0–100% position for the filled track.
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={sliderId} className="text-sm font-medium text-zinc-200">
        {label}
      </label>

      <input
        id={sliderId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label}: ${leftLabel} to ${rightLabel}`}
        aria-valuetext={`${value} of ${max}`}
        className="mood-slider w-full"
        style={{
          // Filled track: violet up to the thumb, faint white after.
          background: `linear-gradient(to right, var(--accent-violet) ${percent}%, rgba(255,255,255,0.1) ${percent}%)`,
        }}
      />

      <div className="flex justify-between text-xs text-zinc-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

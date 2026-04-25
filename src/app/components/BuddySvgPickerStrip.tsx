export type BuddySvgPickerOption = {
  key: string;
  /** Spoken label for accessibility */
  label: string;
  /** Omit for “none” / empty choice */
  src?: string;
};

export default function BuddySvgPickerStrip({
  options,
  selectedKey,
  onSelect,
  groupLabel,
  chipVariant = "default",
  gridColumns,
  groupClassName = "",
}: {
  options: readonly BuddySvgPickerOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
  groupLabel: string;
  chipVariant?: "default" | "backdrop";
  /** Fixed column count so rows stay full — no single orphan chip. */
  gridColumns?: 5 | 7 | 8;
  /** Extra class on outer group (e.g. headwear centering) */
  groupClassName?: string;
}) {
  const chipMod = chipVariant === "backdrop" ? " tb-svg-picker-chip--backdrop" : "";
  const stripClass = [
    "tb-svg-picker-strip",
    gridColumns === 7 ? "tb-svg-picker-strip--grid tb-svg-picker-strip--c7" : "",
    gridColumns === 8 ? "tb-svg-picker-strip--grid tb-svg-picker-strip--c8" : "",
    gridColumns === 5 ? "tb-svg-picker-strip--grid tb-svg-picker-strip--c5" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={["tb-svg-picker-group", groupClassName].filter(Boolean).join(" ")} role="group" aria-label={groupLabel}>
      <div className={stripClass}>
        {options.map((opt) => {
          const selected = opt.key === selectedKey;
          return (
            <button
              key={opt.key}
              type="button"
              className={`tb-svg-picker-chip${chipMod}${selected ? " tb-svg-picker-chip--selected" : ""}${opt.src ? "" : " tb-svg-picker-chip--empty"}`}
              aria-pressed={selected}
              aria-label={opt.label}
              onClick={() => onSelect(opt.key)}
            >
              {opt.src ? (
                <span className="tb-svg-picker-chip-img-wrap">
                  <img src={opt.src} alt="" draggable={false} />
                </span>
              ) : (
                <span aria-hidden>—</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BuddyCustomizerRow<T extends string>({
  label,
  valueLabel,
  onPrev,
  onNext,
}: {
  label: string;
  valueLabel: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="tb-customizer-row">
      <span className="tb-customizer-label share-tech-bold">{label}</span>
      <div className="tb-customizer-control">
        <button type="button" className="tb-customizer-arrow" aria-label={`Previous ${label.toLowerCase()}`} onClick={onPrev}>
          ‹
        </button>
        <span className="tb-customizer-value share-tech-regular">{valueLabel}</span>
        <button type="button" className="tb-customizer-arrow" aria-label={`Next ${label.toLowerCase()}`} onClick={onNext}>
          ›
        </button>
      </div>
    </div>
  );
}

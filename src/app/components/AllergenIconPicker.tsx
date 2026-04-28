import { ALLERGEN_CATALOG, type AllergenTagId } from "../allergyTagConfig";

type Props = {
  mode: "profile" | "accommodates";
  selected: AllergenTagId[];
  onChange: (next: AllergenTagId[]) => void;
  groupLabel: string;
};

export function AllergenIconPicker({ mode, selected, onChange, groupLabel }: Props) {
  const set = new Set(selected);
  const toggle = (id: AllergenTagId) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  return (
    <div className="tb-allergen-picker" role="group" aria-label={groupLabel}>
      <p className="tb-field-label-bold share-tech-bold">{groupLabel}</p>
      <p className="tb-allergen-picker-hint share-tech-regular">
        {mode === "profile"
          ? "Tap an icon for each allergen you avoid."
          : "Tap each “no” icon if this recipe is made without that ingredient."}
      </p>
      <div className="tb-allergen-picker-grid">
        {ALLERGEN_CATALOG.map((item) => {
          const isOn = set.has(item.id);
          const src = mode === "profile" ? item.profileIcon : item.accommodatesIcon;
          const pressedLabel =
            mode === "profile"
              ? `${item.label} allergy${isOn ? ", selected" : ", not selected"}`
              : `Free from ${item.label}${isOn ? ", selected" : ", not selected"}`;
          return (
            <button
              key={item.id}
              type="button"
              className={`tb-allergen-chip${isOn ? " tb-allergen-chip--selected" : ""}`}
              onClick={() => toggle(item.id)}
              aria-pressed={isOn}
              aria-label={pressedLabel}
            >
              <img alt="" src={src} className="tb-allergen-chip-img" draggable={false} />
              <span className="tb-allergen-label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

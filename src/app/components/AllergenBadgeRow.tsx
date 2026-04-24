import { catalogEntry, type AllergenTagId } from "../allergyTagConfig";

type Props = {
  mode: "profile" | "accommodates";
  ids: AllergenTagId[];
  /** Visually hidden list label for screen readers */
  ariaLabel: string;
};

export function AllergenBadgeRow({ mode, ids, ariaLabel }: Props) {
  if (!ids.length) return null;
  return (
    <ul className="tb-allergen-badge-row" aria-label={ariaLabel}>
      {ids.map((id) => {
        const c = catalogEntry(id);
        const src = mode === "profile" ? c.profileIcon : c.accommodatesIcon;
        return (
          <li key={id} className="tb-allergen-badge-item">
            <span className="tb-allergen-badge-circle">
              <img src={src} alt="" className="tb-allergen-badge-img" draggable={false} />
            </span>
            <span className="tb-allergen-label">{c.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

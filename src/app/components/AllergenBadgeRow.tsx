import { catalogEntry, type AllergenTagId } from "../allergyTagConfig";

type Props = {
  mode: "profile" | "accommodates";
  ids: AllergenTagId[];
  /** Visually hidden list label for screen readers */
  ariaLabel: string;
  /** e.g. `tb-allergen-badge-row--viewer-profile` for orange emphasis on public profile */
  className?: string;
};

export function AllergenBadgeRow({ mode, ids, ariaLabel, className }: Props) {
  if (!ids.length) return null;
  return (
    <ul className={`tb-allergen-badge-row${className ? ` ${className}` : ""}`} aria-label={ariaLabel}>
      {ids.map((id) => {
        const c = catalogEntry(id);
        const src = mode === "profile" ? c.profileIcon : c.accommodatesIcon;
        return (
          <li key={id} className="tb-allergen-badge-item">
            <img src={src} alt="" className="tb-allergen-badge-img" draggable={false} />
            <span className="tb-allergen-label">{c.label}</span>
          </li>
        );
      })}
    </ul>
  );
}

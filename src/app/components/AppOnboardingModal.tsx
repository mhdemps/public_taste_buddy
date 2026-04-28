import { useEffect } from "react";

type Props = {
  open: boolean;
  onDismiss: () => void;
};

/**
 * One-time overview of main nav areas (formerly duplicated under the ? Help control).
 * Sections follow nav bar tab order: Profile → Recipes → Buddies → Make.
 */
export function AppOnboardingModal({ open, onDismiss }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onDismiss]);

  if (!open) return null;

  return (
    <div className="tb-app-onboarding-backdrop" role="presentation" onClick={onDismiss}>
      <div
        className="tb-app-onboarding-modal share-tech-regular"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tb-app-onboarding-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="tb-app-onboarding-title" className="tb-app-onboarding-title share-tech-bold tb-text-coral">
          Welcome to Taste Buddy
        </h2>
        <p className="tb-app-onboarding-lead">
          Here’s a quick map of the nav bar — what each tab is for when you’re browsing Taste Buddy.
        </p>

        <ul className="tb-app-onboarding-sections">
          <li>
            <span className="tb-app-onboarding-label share-tech-bold">Profile</span>
            <span>
              Edit how you appear on the Buddy Board: name, taste notes, allergens, and your buddy. Recipes you create live
              under <strong className="share-tech-bold">Recipes</strong> first — then you can post one to the Buddy Board from
              Profile.
            </span>
          </li>
          <li>
            <span className="tb-app-onboarding-label share-tech-bold">Recipes</span>
            <span>Create and manage your own recipes here (open one to edit, or use + to add).</span>
          </li>
          <li>
            <span className="tb-app-onboarding-label share-tech-bold">Buddies</span>
            <span>
              The Buddy Board: tap a buddy tile for their public profile. Under “Fresh on the Buddy Board,” open a recipe to
              read it — use the check on a card to save it into <strong className="share-tech-bold">Make</strong>, where you can
              expand details, cook along, or flag it for later.
            </span>
          </li>
          <li>
            <span className="tb-app-onboarding-label share-tech-bold">Make</span>
            <span>
              Your kitchen hub: recipes you wrote live under “Your recipes”; Buddy Board saves appear under “From the Buddy
              Board.” Cook step-by-step with ingredients and directions. “I made this!” counts the cook and clears the list.
              The ribbon on cards flags recipes you want to make later.
            </span>
          </li>
        </ul>

        <div className="tb-app-onboarding-actions">
          <button type="button" className="tb-app-onboarding-btn share-tech-bold" onClick={onDismiss}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

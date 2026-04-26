/** Fired after profile display name is saved so the header can update without a full refetch. */
export const PROFILE_DISPLAY_SAVED_EVENT = "tasteBuddyProfileDisplaySaved";

export type ProfileDisplaySavedDetail = { displayName: string };

export function dispatchProfileDisplaySaved(displayName: string) {
  const trimmed = displayName.trim() || "Taste buddy";
  window.dispatchEvent(
    new CustomEvent<ProfileDisplaySavedDetail>(PROFILE_DISPLAY_SAVED_EVENT, {
      detail: { displayName: trimmed },
    })
  );
}

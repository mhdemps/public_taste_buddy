/** Device-local: show one-time app tour after creating a new profile. */

const NEED_PREFIX = "tasteBuddyNeedsAppOnboarding:";
const DONE_PREFIX = "tasteBuddyAppOnboardingDone:";

function norm(id: string): string {
  return id.trim().toLowerCase();
}

/** Call when a brand-new profile row is created (Who’s Cooking → create). */
export function markProfileNeedsAppOnboarding(profileId: string): void {
  const n = norm(profileId);
  if (!n) return;
  try {
    localStorage.setItem(NEED_PREFIX + n, "1");
  } catch {
    /* quota / private mode */
  }
}

export function shouldShowAppOnboarding(profileId: string): boolean {
  const n = norm(profileId);
  if (!n) return false;
  try {
    if (localStorage.getItem(DONE_PREFIX + n) === "1") return false;
    return localStorage.getItem(NEED_PREFIX + n) === "1";
  } catch {
    return false;
  }
}

export function completeAppOnboarding(profileId: string): void {
  const n = norm(profileId);
  if (!n) return;
  try {
    localStorage.removeItem(NEED_PREFIX + n);
    localStorage.setItem(DONE_PREFIX + n, "1");
  } catch {
    /* ignore */
  }
}

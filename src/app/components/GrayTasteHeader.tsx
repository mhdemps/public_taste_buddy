import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import imgTasteBuddyLogo from "@project-assets/trans-orange.png";
import { fetchProfileByUserId } from "../../lib/communityApi";
import { useAuth } from "../context/AuthContext";
import {
  PROFILE_DISPLAY_SAVED_EVENT,
  type ProfileDisplaySavedDetail,
} from "../profileDisplayEvents";

/** Same size/position everywhere — centered above page content */
export default function GrayTasteHeader({ showSignOut = true }: { showSignOut?: boolean }) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setProfileName(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await fetchProfileByUserId(user.id);
      if (cancelled) return;
      if (data?.display_name?.trim()) {
        setProfileName(data.display_name.trim());
      } else if (!error) {
        setProfileName("Taste buddy");
      } else {
        setProfileName(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, location.pathname]);

  useEffect(() => {
    const onSaved = (e: Event) => {
      const detail = (e as CustomEvent<ProfileDisplaySavedDetail>).detail;
      if (detail?.displayName) setProfileName(detail.displayName);
    };
    window.addEventListener(PROFILE_DISPLAY_SAVED_EVENT, onSaved);
    return () => window.removeEventListener(PROFILE_DISPLAY_SAVED_EVENT, onSaved);
  }, []);

  const signOutTitle = profileName
    ? `Sign out — you’re signed in as ${profileName}. Return to Who is cooking?`
    : "Sign out — return to Who is cooking?";

  return (
    <header className={`tb-header${showSignOut && user ? " tb-header--signed-in" : ""}`}>
      {showSignOut && user ? (
        <button
          type="button"
          className="tb-header-sign-out share-tech-regular"
          onClick={() => void signOut()}
          title={signOutTitle}
        >
          Sign out
        </button>
      ) : null}
      <div className="tb-header-brand-block">
        <img
          src={imgTasteBuddyLogo}
          alt="Taste Buddy — share and explore public taste profiles"
          className="tb-header-logo"
          draggable={false}
        />
        {showSignOut && user && profileName ? (
          <p className="tb-header-welcome share-tech-regular tb-text-coral" aria-live="polite">
            Welcome back,{" "}
            <span className="tb-header-welcome-name share-tech-bold">{profileName}</span>
          </p>
        ) : null}
      </div>
    </header>
  );
}
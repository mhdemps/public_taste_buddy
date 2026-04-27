import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router";
import imgLineLogo from "@project-assets/Line Logo.svg";
import imgTasteBuddyLogo from "@project-assets/trans-orange.png";
import { fetchProfileByUserId } from "../../lib/communityApi";
import { useAuth } from "../context/AuthContext";
import {
  PROFILE_DISPLAY_SAVED_EVENT,
  type ProfileDisplaySavedDetail,
} from "../profileDisplayEvents";
import { HeaderPageHelp } from "./HeaderPageHelp";

/** Same size/position everywhere — centered above page content */
export default function GrayTasteHeader({
  showSignOut = true,
  helpContent,
}: {
  showSignOut?: boolean;
  /** Shown in a ? popover (top-left, opposite Sign out). */
  helpContent?: ReactNode;
}) {
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

  const signedIn = Boolean(showSignOut && user);

  const signOutTitle = profileName
    ? `Sign out — you’re signed in as ${profileName}. Return to Who’s Cooking`
    : "Sign out — return to Who’s Cooking";

  const headerLogoSrc = signedIn ? imgLineLogo : imgTasteBuddyLogo;

  return (
    <header
      className={`tb-header${signedIn ? " tb-header--signed-in" : ""}${helpContent != null ? " tb-header--has-help" : ""}`}
    >
      {signedIn ? (
        <>
          <div className="tb-header-slot tb-header-slot--start tb-header-slot--actions">
            {helpContent != null ? <HeaderPageHelp>{helpContent}</HeaderPageHelp> : null}
          </div>
          <div className="tb-header-slot tb-header-slot--end tb-header-slot--actions">
            <button
              type="button"
              className="tb-header-sign-out share-tech-regular"
              onClick={() => void signOut()}
              title={signOutTitle}
            >
              Sign out
            </button>
          </div>
          <div className="tb-header-line-bleed">
            <div className="tb-header-line-track">
              <img
                src={headerLogoSrc}
                alt="Taste Buddy — share and explore public taste profiles"
                className="tb-header-logo tb-header-logo--line"
                draggable={false}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="tb-header-slot tb-header-slot--start">
            {helpContent != null ? <HeaderPageHelp>{helpContent}</HeaderPageHelp> : null}
          </div>
          <div className="tb-header-slot tb-header-slot--center">
            <div className="tb-header-brand-block">
              <img
                src={headerLogoSrc}
                alt="Taste Buddy — share and explore public taste profiles"
                className="tb-header-logo"
                draggable={false}
              />
            </div>
          </div>
          <div className="tb-header-slot tb-header-slot--end" />
        </>
      )}
    </header>
  );
}

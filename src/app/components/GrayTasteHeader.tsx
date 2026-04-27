import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
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

/** sessionStorage: which user id has already had the one-time greeting fade this login */
const HEADER_GREET_FADE_SESSION_KEY = "tb-header-greet-faded-user";

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
  const fadeDecisionRef = useRef<"fade" | "nofade" | null>(null);

  useLayoutEffect(() => {
    fadeDecisionRef.current = null;
  }, [user?.id]);

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
    if (user?.id) return;
    try {
      sessionStorage.removeItem(HEADER_GREET_FADE_SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, [user?.id]);

  useEffect(() => {
    const onSaved = (e: Event) => {
      const detail = (e as CustomEvent<ProfileDisplaySavedDetail>).detail;
      if (detail?.displayName) setProfileName(detail.displayName);
    };
    window.addEventListener(PROFILE_DISPLAY_SAVED_EVENT, onSaved);
    return () => window.removeEventListener(PROFILE_DISPLAY_SAVED_EVENT, onSaved);
  }, []);

  const signedIn = Boolean(showSignOut && user);
  let greetingFadeIn = false;
  if (signedIn && profileName && user?.id && typeof window !== "undefined") {
    if (fadeDecisionRef.current === null) {
      try {
        const already = sessionStorage.getItem(HEADER_GREET_FADE_SESSION_KEY) === user.id;
        fadeDecisionRef.current = already ? "nofade" : "fade";
      } catch {
        fadeDecisionRef.current = "nofade";
      }
    }
    greetingFadeIn = fadeDecisionRef.current === "fade";
  }

  useLayoutEffect(() => {
    if (!signedIn || !profileName || !user?.id) return;
    if (fadeDecisionRef.current !== "fade") return;
    try {
      sessionStorage.setItem(HEADER_GREET_FADE_SESSION_KEY, user.id);
    } catch {
      /* ignore */
    }
  }, [signedIn, profileName, user?.id]);

  const signOutTitle = profileName
    ? `Sign out — you’re signed in as ${profileName}. Return to Who’s Cooking`
    : "Sign out — return to Who’s Cooking";

  const headerLogoSrc = signedIn ? imgLineLogo : imgTasteBuddyLogo;
  const headerLogoClass = signedIn ? "tb-header-logo tb-header-logo--line" : "tb-header-logo";

  return (
    <header
      className={`tb-header${signedIn ? " tb-header--signed-in" : ""}${helpContent != null ? " tb-header--has-help" : ""}`}
    >
      {helpContent != null ? <HeaderPageHelp>{helpContent}</HeaderPageHelp> : null}
      {signedIn ? (
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
          src={headerLogoSrc}
          alt="Taste Buddy — share and explore public taste profiles"
          className={headerLogoClass}
          draggable={false}
        />
        {signedIn && profileName ? (
          <p
            className={`tb-header-welcome share-tech-regular tb-text-coral${greetingFadeIn ? " tb-header-welcome--fade-in" : ""}`}
            aria-live="polite"
          >
            Hey there,{" "}
            <span className="tb-header-welcome-name share-tech-bold">{profileName}</span>
          </p>
        ) : null}
      </div>
    </header>
  );
}

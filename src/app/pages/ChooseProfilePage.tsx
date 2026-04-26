import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import GrayTasteHeader from "../components/GrayTasteHeader";
import BuddyAvatar from "../components/BuddyAvatar";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { PAGE_SHELL_SCROLL } from "../brand";
import {
  BUDDY_CIRCLE_COUNT,
  coerceBuddySvgSelection,
  type BuddyEyeKey,
  type BuddySvgSelection,
} from "../buddyAppearance";
import { createProfile, fetchCommunityProfiles, type TasteProfileRow } from "../../lib/communityApi";
import { SIGN_IN_INTRO_SESSION_STORAGE_KEY } from "../userStorage";

function readIntroSkippedThisSession(): boolean {
  try {
    return sessionStorage.getItem(SIGN_IN_INTRO_SESSION_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markIntroSeenThisSession() {
  try {
    sessionStorage.setItem(SIGN_IN_INTRO_SESSION_STORAGE_KEY, "1");
  } catch {
    /* ignore */
  }
}

const INTRO_BACKDROP_INDEX = 5; /* light orange — matches orange buddy */

function introBuddySelection(eyeKey: BuddyEyeKey): BuddySvgSelection {
  return {
    bodyKey: "orange",
    eyeKey,
    hatKey: "chef",
    smileKey: "smile",
  };
}

function displayFromProfile(p: TasteProfileRow): string {
  return (p.display_name?.trim() || "Taste buddy").slice(0, 80);
}

export default function ChooseProfilePage() {
  const { user, loading, selectProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [introPhase, setIntroPhase] = useState<"intro" | "main">(() =>
    readIntroSkippedThisSession() ? "main" : "intro"
  );
  const [introEyeKey, setIntroEyeKey] = useState<BuddyEyeKey>("open");

  const [profiles, setProfiles] = useState<TasteProfileRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    setLoadError(null);
    const { data, error } = await fetchCommunityProfiles();
    if (error) {
      setLoadError(error.message);
      return;
    }
    setProfiles(data);
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (loading || user) return;
    if (introPhase !== "intro") return;
    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      markIntroSeenThisSession();
      setIntroPhase("main");
      return;
    }
    const ids: number[] = [];
    ids.push(window.setTimeout(() => setIntroEyeKey("wink"), 520));
    ids.push(window.setTimeout(() => setIntroEyeKey("open"), 880));
    ids.push(window.setTimeout(() => setIntroEyeKey("wink"), 1240));
    ids.push(window.setTimeout(() => setIntroEyeKey("open"), 1620));
    ids.push(
      window.setTimeout(() => {
        markIntroSeenThisSession();
        setIntroPhase("main");
      }, 2280)
    );
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [loading, user, introPhase]);

  if (loading) {
    return (
      <div className={PAGE_SHELL_SCROLL}>
        <GrayTasteHeader showSignOut={false} />
        <p className="share-tech-regular tb-text-coral" style={{ textAlign: "center", marginTop: "2rem" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (user) {
    return <Navigate to={from === "/sign-in" ? "/" : from} replace />;
  }

  const goToWall = (id: string) => {
    selectProfile(id);
    navigate("/", { replace: true });
  };

  const handleAddProfile = async () => {
    setCreating(true);
    setLoadError(null);
    try {
      const { data, error } = await createProfile();
      if (error) {
        setLoadError(error.message);
        return;
      }
      if (data) {
        setProfiles((prev) => [data, ...prev.filter((p) => p.id !== data.id)]);
        setExpandedId(data.id);
      }
    } finally {
      setCreating(false);
    }
  };

  const showIntro = introPhase === "intro";

  return (
    <div className={`${PAGE_SHELL_SCROLL} tb-sign-in-page`} data-name="Choose profile">
      <GrayTasteHeader showSignOut={false} />

      <div className="tb-sign-in-page-body">
        <AnimatePresence>
          {showIntro ? (
            <motion.section
              key="sign-in-intro"
              className="tb-sign-in-intro"
              aria-label="Taste Buddy winks hello"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="tb-sign-in-intro-inner">
                <motion.div
                  initial={{ scale: 0.78, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.06 }}
                >
                  <BuddyAvatar
                    selection={introBuddySelection(introEyeKey)}
                    circleBackgroundIndex={INTRO_BACKDROP_INDEX}
                    className="tb-buddy-avatar-shell tb-sign-in-intro-buddy tb-buddy-profile-circle--page-hero"
                    innerClassName="tb-buddy-face-inner"
                    imgClassName="tb-buddy-face-img"
                    alt=""
                  />
                </motion.div>
                <motion.p
                  className="tb-sign-in-intro-caption share-tech-bold tb-text-coral"
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.35 }}
                >
                  Hey, chef…
                </motion.p>
              </div>
            </motion.section>
          ) : null}
        </AnimatePresence>

        <motion.div
          className="tb-main-column"
          initial={false}
          animate={{
            opacity: showIntro ? 0 : 1,
            y: showIntro ? 16 : 0,
          }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ pointerEvents: showIntro ? "none" : "auto" }}
          aria-hidden={showIntro}
        >
        <motion.h1
          className="tb-page-title share-tech-bold tb-text-coral"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          Who is cooking?
        </motion.h1>
        <motion.p
          className="tb-intro-blurb share-tech-regular"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          Pick a saved taste profile (same buddy and name as on your profile page). You can add more or rename them
          under profile after you enter.
        </motion.p>

        {loadError ? (
          <InfoBoxFrame variant={0}>
            <p className="share-tech-regular" style={{ fontSize: "16pt", lineHeight: 1.4, color: "#2d2d2d" }}>
              Could not load profiles: {loadError}
            </p>
            <p className="share-tech-regular" style={{ fontSize: "14pt", lineHeight: 1.4, color: "#2d2d2d", marginTop: "0.5rem" }}>
              This app needs the JSON API. On your computer run <code className="share-tech-regular">npm run dev</code> (Vite + API). On
              Vercel: push this repo, set the project Root Directory to the folder that contains <code className="share-tech-regular">api/[...slug].js</code>, then redeploy. Open <code className="share-tech-regular">/api/health</code> — it should return JSON, not HTML.
              then trigger a new deployment.
            </p>
          </InfoBoxFrame>
        ) : null}

        <div className="tb-profile-picker-stack">
          {profiles.length === 0 && !loadError ? (
            <p className="tb-intro-blurb share-tech-regular" style={{ marginTop: "0.5rem" }}>
              No profiles yet — create one to get a taste tile on the wall.
            </p>
          ) : null}

          {profiles.map((p) => {
            const name = displayFromProfile(p);
            const selection = coerceBuddySvgSelection(p);
            const circle = Math.max(0, Math.min(BUDDY_CIRCLE_COUNT - 1, Math.floor(p.buddy_color_index ?? 0)));
            const open = expandedId === p.id;
            return (
              <InfoBoxFrame key={p.id} variant={0}>
                <div className="tb-profile-picker-row">
                  <button
                    type="button"
                    className="tb-profile-picker-header"
                    onClick={() => setExpandedId(open ? null : p.id)}
                    aria-expanded={open}
                  >
                    <BuddyAvatar
                      selection={selection}
                      circleBackgroundIndex={circle}
                      className="tb-buddy-avatar-shell tb-profile-picker-avatar--sm"
                      innerClassName="tb-buddy-face-inner"
                      imgClassName="tb-buddy-face-img"
                    />
                    <span className="tb-profile-picker-name share-tech-bold">{name}</span>
                    <span className="tb-profile-picker-chevron share-tech-regular" aria-hidden>
                      {open ? "▾" : "▸"}
                    </span>
                  </button>
                </div>
                {open ? (
                  <motion.div
                    className="tb-profile-picker-expand"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25 }}
                  >
                    <BuddyAvatar
                      selection={selection}
                      circleBackgroundIndex={circle}
                      className="tb-buddy-avatar-shell tb-profile-page-buddy-hero-avatar tb-buddy-profile-circle--page-hero"
                      innerClassName="tb-buddy-face-inner"
                      imgClassName="tb-buddy-face-img"
                      alt={name}
                    />
                    <motion.button
                      type="button"
                      className="tb-submit-wrap"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => goToWall(p.id)}
                    >
                      <ChalkPillFrame variant={0} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--md">
                        <span className="tb-pill-text-white share-tech-regular">Go to taste wall</span>
                      </ChalkPillFrame>
                    </motion.button>
                  </motion.div>
                ) : null}
              </InfoBoxFrame>
            );
          })}
        </div>

        <div style={{ marginTop: "1.5rem" }}>
          <motion.button
            type="button"
            className="tb-submit-wrap"
            whileTap={{ scale: creating ? 1 : 0.97 }}
            onClick={() => void handleAddProfile()}
            disabled={creating}
          >
            <ChalkPillFrame variant={2} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--md">
              <span className="tb-pill-text-white share-tech-regular">
                {creating ? "Creating…" : "Add new profile"}
              </span>
            </ChalkPillFrame>
          </motion.button>
        </div>
        </motion.div>
      </div>
    </div>
  );
}

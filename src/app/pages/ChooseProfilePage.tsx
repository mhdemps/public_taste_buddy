import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import GrayTasteHeader from "../components/GrayTasteHeader";
import BuddyAvatar from "../components/BuddyAvatar";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { PAGE_INTRO_BLURB_TEXT, PAGE_SHELL_SCROLL } from "../brand";
import {
  BUDDY_CIRCLE_COUNT,
  coerceBuddySvgSelection,
  type BuddyEyeKey,
  type BuddySvgSelection,
} from "../buddyAppearance";
import { createProfile, deleteMyProfile, fetchCommunityProfiles, type TasteProfileRow } from "../../lib/communityApi";
import imgTrashDelete from "@project-assets/Trash.svg";
import { purgeProfileFromThisDevice, SIGN_IN_INTRO_SESSION_STORAGE_KEY } from "../userStorage";

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
  const [newProfileName, setNewProfileName] = useState("");
  const [createProfileError, setCreateProfileError] = useState<string | null>(null);
  const [pickerDeletingId, setPickerDeletingId] = useState<string | null>(null);

  /** Ignore stale responses when refresh() runs twice (e.g. React Strict Mode) or location.key flaps. */
  const profilesLoadGen = useRef(0);

  const refresh = useCallback(async () => {
    const gen = ++profilesLoadGen.current;
    setLoadError(null);
    const { data, error } = await fetchCommunityProfiles();
    if (gen !== profilesLoadGen.current) return;
    if (error) {
      setLoadError(error.message);
      return;
    }
    setLoadError(null);
    setProfiles(data);
  }, []);

  useEffect(() => {
    void refresh();
  }, [location.key, refresh]);

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
    ids.push(window.setTimeout(() => setIntroEyeKey("wink"), 480));
    ids.push(
      window.setTimeout(() => {
        markIntroSeenThisSession();
        setIntroPhase("main");
      }, 2200)
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

  const handleAddProfile = async (nameFromForm: string) => {
    const trimmed = nameFromForm.trim();
    setCreating(true);
    setCreateProfileError(null);
    try {
      const { data, error } = await createProfile({
        display_name: trimmed,
      });
      if (error) {
        setCreateProfileError(error.message);
        return;
      }
      if (!data) return;

      /** POST already persists `display_name`; a follow-up PUT was redundant and could fail routing while the row existed. */
      const merged: TasteProfileRow = trimmed ? { ...data, display_name: trimmed } : data;
      setProfiles((prev) => [merged, ...prev.filter((p) => p.id !== merged.id)]);
      void refresh();
      setExpandedId(merged.id);
      setNewProfileName("");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProfileFromPicker = async (row: TasteProfileRow) => {
    const id = row.id.trim();
    if (!id || pickerDeletingId) return;
    setPickerDeletingId(id);
    try {
      purgeProfileFromThisDevice(id);
      await deleteMyProfile(id);
      await refresh();
      setExpandedId((cur) => (cur && cur.trim().toLowerCase() === id.toLowerCase() ? null : cur));
    } finally {
      setPickerDeletingId(null);
    }
  };

  const showIntro = introPhase === "intro";

  const whosCookingHelp =
    "Pick a taste profile and expand the row to sign in as them, or create a new profile for a tile on the Buddy Board.";

  return (
    <div className={`${PAGE_SHELL_SCROLL} tb-sign-in-page`} data-name="Choose profile">
      <GrayTasteHeader showSignOut={false} helpContent={whosCookingHelp} />

      <div className="tb-sign-in-page-body">
        <AnimatePresence>
          {showIntro ? (
            <motion.section
              key="sign-in-intro"
              className="tb-sign-in-intro"
              aria-label="Taste Buddy winks"
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
                    hideBackdrop
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
                  Who&apos;s Cooking
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
          Who&apos;s Cooking
        </motion.h1>

        {loadError && profiles.length === 0 ? (
          <InfoBoxFrame variant={0}>
            <p className="share-tech-regular" style={{ fontSize: "16pt", lineHeight: 1.4, color: "#2d2d2d" }}>
              Could not load profiles: {loadError}
            </p>
            <p className="share-tech-regular" style={{ fontSize: "14pt", lineHeight: 1.4, color: "#2d2d2d", marginTop: "0.5rem" }}>
              This app needs the JSON API. On your computer run <code className="share-tech-regular">npm run dev</code> (Vite + API). On
              Vercel: push this repo, set the project Root Directory to the repo root (the folder that contains <code className="share-tech-regular">api/</code> and <code className="share-tech-regular">vercel.json</code>), then redeploy. Open <code className="share-tech-regular">/api/health</code> — it should return JSON, not HTML.
              then trigger a new deployment.
            </p>
          </InfoBoxFrame>
        ) : null}

        <div className="tb-profile-picker-stack">
          {profiles.length === 0 && !loadError ? (
            <p className="tb-intro-blurb share-tech-regular" style={{ marginTop: "0.5rem" }}>
              No profiles yet — create one to get a taste tile on the Buddy Board.
            </p>
          ) : null}

          {profiles.map((p) => {
            const name = displayFromProfile(p);
            const selection = coerceBuddySvgSelection(p);
            const circle = Math.max(0, Math.min(BUDDY_CIRCLE_COUNT - 1, Math.floor(p.buddy_color_index ?? 0)));
            const open = expandedId === p.id;
            const rowDeleting = pickerDeletingId === p.id;
            return (
              <InfoBoxFrame key={p.id} variant={0} className="tb-profile-picker-card">
                <div className="tb-profile-picker-row">
                  <button
                    type="button"
                    className="tb-profile-picker-header"
                    onClick={() => {
                      setCreateProfileError(null);
                      setExpandedId(open ? null : p.id);
                    }}
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
                    <div className="tb-profile-picker-expand-row">
                      <BuddyAvatar
                        selection={selection}
                        circleBackgroundIndex={circle}
                        className="tb-buddy-avatar-shell tb-profile-picker-expand-avatar"
                        innerClassName="tb-buddy-face-inner"
                        imgClassName="tb-buddy-face-img"
                        alt={name}
                      />
                      <div className="tb-profile-picker-expand-cta">
                        <motion.button
                          type="button"
                          className="tb-submit-wrap tb-profile-picker-signin-btn"
                          aria-label={`Sign in as ${name}`}
                          whileTap={{ scale: rowDeleting || pickerDeletingId ? 1 : 0.97 }}
                          disabled={Boolean(pickerDeletingId)}
                          onClick={() => goToWall(p.id)}
                        >
                          <ChalkPillFrame variant={0} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--md">
                            <span className="tb-pill-text-white share-tech-regular">Sign in</span>
                          </ChalkPillFrame>
                        </motion.button>
                        <motion.button
                          type="button"
                          className="tb-link-text share-tech-regular tb-profile-picker-delete-btn"
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                          whileTap={{ scale: rowDeleting ? 1 : 0.98 }}
                          disabled={Boolean(pickerDeletingId)}
                          onClick={() => void handleDeleteProfileFromPicker(p)}
                        >
                          <img alt="" src={imgTrashDelete} draggable={false} className="tb-recipe-x-icon" aria-hidden />
                          {rowDeleting ? "Deleting…" : "Delete profile"}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </InfoBoxFrame>
            );
          })}
        </div>

        <form
          className="tb-choose-profile-add-block"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = String(fd.get("display_name") ?? "");
            void handleAddProfile(name);
          }}
        >
          <InfoBoxFrame variant={2} className="tb-choose-profile-add-fields tb-choose-profile-add-card">
            <label htmlFor="choose-profile-new-name" className="tb-field-label-bold share-tech-bold">
              Display name
            </label>
            <input
              id="choose-profile-new-name"
              name="display_name"
              type="text"
              className="tb-input-plain share-tech-regular"
              placeholder="e.g. Chef Jamie"
              maxLength={80}
              value={newProfileName}
              onChange={(e) => {
                setCreateProfileError(null);
                setNewProfileName(e.target.value);
              }}
              disabled={creating}
              autoComplete="name"
            />
            <p className="share-tech-regular tb-choose-profile-add-hint" style={{ color: PAGE_INTRO_BLURB_TEXT }}>
              Shows on the Buddy Board. You can change it later on your profile page.
            </p>
          </InfoBoxFrame>
          {createProfileError ? (
            <p className="share-tech-regular tb-text-coral tb-choose-profile-add-error" role="alert">
              {createProfileError}
            </p>
          ) : null}
          <motion.div className="tb-choose-profile-add-submit-wrap" whileTap={{ scale: creating ? 1 : 0.97 }}>
            <button type="submit" className="tb-submit-wrap" disabled={creating}>
              <ChalkPillFrame variant={2} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--md">
                <span className="tb-pill-text-white share-tech-regular">{creating ? "Creating…" : "Add new profile"}</span>
              </ChalkPillFrame>
            </button>
          </motion.div>
        </form>

        </motion.div>
      </div>
    </div>
  );
}

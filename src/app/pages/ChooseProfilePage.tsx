import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import GrayTasteHeader from "../components/GrayTasteHeader";
import BuddyAvatar from "../components/BuddyAvatar";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { PAGE_SHELL_SCROLL } from "../brand";
import { BUDDY_CIRCLE_COUNT, coerceBuddySvgSelection } from "../buddyAppearance";
import { createProfile, fetchCommunityProfiles, type TasteProfileRow } from "../../lib/communityApi";

function displayFromProfile(p: TasteProfileRow): string {
  return (p.display_name?.trim() || "Taste buddy").slice(0, 80);
}

export default function ChooseProfilePage() {
  const { user, loading, selectProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

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

  return (
    <div className={PAGE_SHELL_SCROLL} data-name="Choose profile">
      <GrayTasteHeader showSignOut={false} />

      <motion.div
        className="tb-main-column"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
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
              This app needs the JSON API for profiles. Locally run <code className="share-tech-regular">npm run dev</code> (Vite + API).
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
  );
}

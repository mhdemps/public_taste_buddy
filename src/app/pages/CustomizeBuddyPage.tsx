import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import GrayTasteHeader from "../components/GrayTasteHeader";
import BuddyAvatar from "../components/BuddyAvatar";
import BuddyCustomizerRow from "../components/BuddyCustomizerRow";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { PAGE_SHELL_SCROLL } from "../brand";
import { BUDDY_PROFILE_CIRCLE_MAX } from "../buddyLayout";
import {
  buddyBodyOptions,
  buddyHatOptions,
  buddySmileOptions,
  coerceBuddyBodyKey,
  coerceBuddyHatKey,
  coerceBuddySmileKey,
  cycleBuddyOption,
  getBuddyBodyLabel,
  getBuddyCircleBackgroundLabel,
  getBuddyHatLabel,
  getBuddySmileLabel,
  BUDDY_CIRCLE_COUNT,
  type BuddyBodyKey,
  type BuddyHatKey,
  type BuddySmileKey,
} from "../buddyAppearance";
import { fetchProfileByUserId, upsertMyProfile, type TasteProfileUpsert } from "../../lib/communityApi";

function defaultDisplayName(): string {
  return "Taste buddy";
}

function cycleInDirection<T extends string>(setValue: (value: T) => void, options: readonly { key: T }[], current: T, direction: -1 | 1) {
  setValue(cycleBuddyOption(options, current, direction));
}

export default function CustomizeBuddyPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user!.id;

  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [buddyBodyKey, setBuddyBodyKey] = useState<BuddyBodyKey>("purple");
  const [buddyCircleIndex, setBuddyCircleIndex] = useState(2);
  const [buddyHatKey, setBuddyHatKey] = useState<BuddyHatKey>("none");
  const [buddySmileKey, setBuddySmileKey] = useState<BuddySmileKey>("smile");
  const [favoriteFood, setFavoriteFood] = useState("");
  const [personality, setPersonality] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [allergies, setAllergies] = useState("");
  const [partiesAttended, setPartiesAttended] = useState("");
  const [recipesGiven, setRecipesGiven] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await fetchProfileByUserId(userId);
      if (cancelled) return;
      if (error) {
        setSaveError(error.message);
        setLoading(false);
        return;
      }
      if (data) {
        setDisplayName(data.display_name?.trim() || defaultDisplayName());
        const circleIdx = Math.max(0, Math.min(BUDDY_CIRCLE_COUNT - 1, Math.floor(data.buddy_color_index ?? 0)));
        setBuddyBodyKey(coerceBuddyBodyKey(data.buddy_body_key, data.buddy_body_key ? 0 : circleIdx));
        setBuddyCircleIndex(circleIdx);
        setBuddyHatKey(coerceBuddyHatKey(data.buddy_hat_key));
        setBuddySmileKey(coerceBuddySmileKey(data.buddy_smile_key));
        setFavoriteFood(data.favorite_food ?? "");
        setPersonality(data.personality ?? "");
        setSpecialty(data.specialty ?? "");
        setAllergies(data.allergies ?? "");
        setPartiesAttended(data.parties_attended != null ? String(data.parties_attended) : "");
        setRecipesGiven(data.recipes_given ?? "");
      } else {
        setDisplayName(defaultDisplayName());
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const selection = {
    bodyKey: buddyBodyKey,
    hatKey: buddyHatKey,
    smileKey: buddySmileKey,
  };

  const buildPayload = useCallback((): TasteProfileUpsert => {
    const partiesRaw = partiesAttended.trim();
    let partiesNum: number | null = null;
    if (partiesRaw !== "") {
      const n = Number.parseInt(partiesRaw, 10);
      partiesNum = Number.isNaN(n) ? null : n;
    }
    return {
      id: userId,
      display_name: displayName.trim() || defaultDisplayName(),
      buddy_color_index: buddyCircleIndex,
      buddy_body_key: buddyBodyKey,
      buddy_hat_key: buddyHatKey,
      buddy_smile_key: buddySmileKey,
      favorite_food: favoriteFood.trim() || null,
      personality: personality.trim() || null,
      specialty: specialty.trim() || null,
      allergies: allergies.trim() || null,
      parties_attended: partiesNum,
      recipes_given: recipesGiven.trim() || null,
    };
  }, [
    userId,
    displayName,
    buddyCircleIndex,
    buddyBodyKey,
    buddyHatKey,
    buddySmileKey,
    favoriteFood,
    personality,
    specialty,
    allergies,
    partiesAttended,
    recipesGiven,
  ]);

  const handleSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const { error } = await upsertMyProfile(buildPayload());
      if (error) {
        setSaveError(error.message);
        return;
      }
      navigate("/profile", {
        state: {
          saveMessage: "Saved — your taste wall tile and public profile now use this buddy. Recipe posts are separate and unchanged.",
        },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={PAGE_SHELL_SCROLL} data-name="Customize buddy">
      <GrayTasteHeader />
      <Navigation />

      <div className="tb-main-column">
        <div className="tb-buddy-profile-back-row">
          <Link to="/profile" className="tb-submit-wrap">
            <motion.span initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35 }}>
              <ChalkPillFrame variant={1} fillClassName="tb-pill-fill-back" innerClassName="tb-pill-inner tb-pill-inner--back">
                <span className="tb-back-chevron share-tech-bold" aria-hidden>
                  ‹
                </span>
                <span className="share-tech-bold tb-text-coral" style={{ fontSize: "20pt" }}>
                  Profile
                </span>
              </ChalkPillFrame>
            </motion.span>
          </Link>
        </div>

        {loading ? (
          <p className="share-tech-regular tb-text-coral">Loading…</p>
        ) : (
          <div className="tb-customize-buddy-page">
            <motion.h1
              className="tb-page-title share-tech-bold tb-text-coral"
              style={{ textAlign: "center", marginBottom: "0.5rem" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              Customize buddy
            </motion.h1>
            <p className="tb-buddy-customize-page-hint share-tech-regular">
              Save stores this look in your profile for your public page and taste wall tile. Other profile fields are unchanged unless you edit them on Profile.
            </p>

            <motion.div
              className="tb-profile-page-buddy-hero"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
            >
              <div className="tb-profile-page-buddy-hero-avatar">
                <BuddyAvatar
                  selection={selection}
                  circleBackgroundIndex={buddyCircleIndex}
                  className={`${BUDDY_PROFILE_CIRCLE_MAX} tb-buddy-profile-circle--hero tb-buddy-profile-circle--page-hero`}
                  innerClassName="tb-buddy-face-inner"
                  imgClassName="tb-buddy-face-img"
                />
              </div>
            </motion.div>

            <div className="tb-buddy-customize-controls">
              <BuddyCustomizerRow
                label="Circle backdrop"
                valueLabel={getBuddyCircleBackgroundLabel(buddyCircleIndex)}
                onPrev={() => setBuddyCircleIndex((i) => (i - 1 + BUDDY_CIRCLE_COUNT) % BUDDY_CIRCLE_COUNT)}
                onNext={() => setBuddyCircleIndex((i) => (i + 1) % BUDDY_CIRCLE_COUNT)}
              />
              <BuddyCustomizerRow
                label="Buddy color"
                valueLabel={getBuddyBodyLabel(buddyBodyKey)}
                onPrev={() => cycleInDirection(setBuddyBodyKey, buddyBodyOptions, buddyBodyKey, -1)}
                onNext={() => cycleInDirection(setBuddyBodyKey, buddyBodyOptions, buddyBodyKey, 1)}
              />
              <BuddyCustomizerRow
                label="Headwear"
                valueLabel={getBuddyHatLabel(buddyHatKey)}
                onPrev={() => cycleInDirection(setBuddyHatKey, buddyHatOptions, buddyHatKey, -1)}
                onNext={() => cycleInDirection(setBuddyHatKey, buddyHatOptions, buddyHatKey, 1)}
              />
              <BuddyCustomizerRow
                label="Expression"
                valueLabel={getBuddySmileLabel(buddySmileKey)}
                onPrev={() => cycleInDirection(setBuddySmileKey, buddySmileOptions, buddySmileKey, -1)}
                onNext={() => cycleInDirection(setBuddySmileKey, buddySmileOptions, buddySmileKey, 1)}
              />
              <p className="tb-customizer-summary share-tech-regular">
                {getBuddyCircleBackgroundLabel(buddyCircleIndex)} backdrop · {getBuddyBodyLabel(buddyBodyKey)} buddy · {getBuddyHatLabel(buddyHatKey)} ·{" "}
                {getBuddySmileLabel(buddySmileKey)}.
              </p>
            </div>

            {saveError ? (
              <p className="tb-intro-blurb share-tech-regular" style={{ marginTop: "1rem" }}>
                {saveError}
              </p>
            ) : null}

            <div className="tb-buddy-customize-page-actions">
              <motion.button
                type="button"
                className="tb-submit-wrap"
                disabled={saving}
                whileTap={{ scale: saving ? 1 : 0.97 }}
                onClick={() => void handleSave()}
              >
                <ChalkPillFrame variant={0} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--lg">
                  <span className="tb-pill-text-white share-tech-regular">{saving ? "Saving…" : "Save changes"}</span>
                </ChalkPillFrame>
              </motion.button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

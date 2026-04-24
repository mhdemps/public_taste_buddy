import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import GrayTasteHeader from "../components/GrayTasteHeader";
import BuddyAvatar from "../components/BuddyAvatar";
import BuddySvgPickerStrip from "../components/BuddySvgPickerStrip";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { PAGE_SHELL_SCROLL } from "../brand";
import { BUDDY_PROFILE_CIRCLE_MAX } from "../buddyLayout";
import {
  buddyBodyOptions,
  buddyHatOptions,
  buddySmileOptions,
  BUDDY_BACKDROP_COUNT,
  BUDDY_BACKDROP_LIGHT_INDICES,
  BUDDY_BACKDROP_COLOR_INDICES,
  BUDDY_BACKDROP_DARK_INDICES,
  coerceBuddyBodyKey,
  coerceBuddyHatKey,
  coerceBuddySmileKey,
  getBuddyBackdropAtIndex,
  getBuddyBackdropLabel,
  type BuddyBodyKey,
  type BuddyHatKey,
  type BuddySmileKey,
} from "../buddyAppearance";
import { fetchProfileByUserId, upsertMyProfile, type TasteProfileUpsert } from "../../lib/communityApi";

function defaultDisplayName(): string {
  return "Taste buddy";
}

function backdropOptionsForIndices(indices: readonly number[]) {
  return indices.map((i) => ({
    key: String(i),
    label: getBuddyBackdropLabel(i),
    src: getBuddyBackdropAtIndex(i),
  }));
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
        const circleIdx = Math.max(0, Math.min(BUDDY_BACKDROP_COUNT - 1, Math.floor(data.buddy_color_index ?? 0)));
        const legacyBodyHint = circleIdx >= 0 && circleIdx <= 5 ? circleIdx : 0;
        setBuddyBodyKey(coerceBuddyBodyKey(data.buddy_body_key, data.buddy_body_key ? 0 : legacyBodyHint));
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

  const allBackdropOptions = useMemo(
    () => [
      ...backdropOptionsForIndices(BUDDY_BACKDROP_LIGHT_INDICES),
      ...backdropOptionsForIndices(BUDDY_BACKDROP_COLOR_INDICES),
      ...backdropOptionsForIndices(BUDDY_BACKDROP_DARK_INDICES),
    ],
    []
  );

  const bodyPickerOptions = useMemo(
    () =>
      buddyBodyOptions.map((o) => ({
        key: o.key,
        label: o.label,
        src: o.pickerSrc ?? o.asset!,
      })),
    []
  );

  const hatPickerOptions = useMemo(
    () =>
      buddyHatOptions.map((o) => ({
        key: o.key,
        label: o.label,
        src: o.pickerSrc ?? o.asset!,
      })),
    []
  );

  const smilePickerOptions = useMemo(
    () =>
      buddySmileOptions.map((o) => ({
        key: o.key,
        label: o.label,
        src: o.pickerSrc ?? o.asset!,
      })),
    []
  );

  const setBackdrop = useCallback((k: string) => {
    setBuddyCircleIndex(Math.max(0, Math.min(BUDDY_BACKDROP_COUNT - 1, Number.parseInt(k, 10) || 0)));
  }, []);

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
            <div className="tb-customize-preview-block">
              <h1 className="tb-page-title share-tech-bold tb-text-coral tb-customize-page-title">Customize buddy</h1>

              <motion.div
                className="tb-profile-page-buddy-hero tb-customize-buddy-hero"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
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
            </div>

            <div className="tb-customize-pickers-block">
              <div className="tb-buddy-customize-controls tb-buddy-customize-controls--svg-only">
                <BuddySvgPickerStrip
                  chipVariant="backdrop"
                  gridColumns={7}
                  groupLabel="Backdrop color — light, medium, and dark rows of seven"
                  options={allBackdropOptions}
                  selectedKey={String(buddyCircleIndex)}
                  onSelect={setBackdrop}
                />
                <BuddySvgPickerStrip
                  gridColumns={7}
                  groupLabel="Buddy body color"
                  options={bodyPickerOptions}
                  selectedKey={buddyBodyKey}
                  onSelect={(k) => setBuddyBodyKey(k as BuddyBodyKey)}
                />
                <BuddySvgPickerStrip
                  gridColumns={7}
                  groupLabel="Headwear"
                  options={hatPickerOptions}
                  selectedKey={buddyHatKey}
                  onSelect={(k) => setBuddyHatKey(k as BuddyHatKey)}
                />
                <BuddySvgPickerStrip
                  gridColumns={5}
                  groupLabel="Expression"
                  options={smilePickerOptions}
                  selectedKey={buddySmileKey}
                  onSelect={(k) => setBuddySmileKey(k as BuddySmileKey)}
                />
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
          </div>
        )}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import StickyTopChrome from "../components/StickyTopChrome";
import BuddyAvatar from "../components/BuddyAvatar";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { MY_RECIPES_STORAGE_BASE, purgeProfileFromThisDevice, scopedStorageKey } from "../userStorage";
import { PAGE_SHELL_SCROLL, PAGE_INTRO_BLURB_TEXT } from "../brand";
import { BUDDY_PROFILE_CIRCLE_MAX } from "../buddyLayout";
import {
  coerceBuddyBodyKey,
  coerceBuddyEyeKey,
  coerceBuddyHatKey,
  coerceBuddySmileKey,
  BUDDY_BACKDROP_COUNT,
  type BuddyBodyKey,
  type BuddyEyeKey,
  type BuddyHatKey,
  type BuddySmileKey,
} from "../buddyAppearance";
import type { MyRecipeEntry } from "./MyRecipesPage";
import { isRecipeDisplayId, recipeCoverImageSrc, resolveRecipeCoverDataUrl } from "../recipeDisplayAssets";
import { decodeProfileAllergiesField, encodeProfileAllergiesField, type AllergenTagId } from "../allergyTagConfig";
import { AllergenIconPicker } from "../components/AllergenIconPicker";
import {
  deleteMyProfile,
  deletePublicRecipe,
  fetchProfileByUserId,
  fetchPublicRecipesForUser,
  findPublicRecipeBySourceId,
  insertPublicRecipe,
  updatePublicRecipePhoto,
  upsertMyProfile,
  type PublicRecipeRow,
  type TasteProfileRow,
  type TasteProfileUpsert,
} from "../../lib/communityApi";
import imgTrashDelete from "@project-assets/Trash.svg";
import { dispatchProfileDisplaySaved } from "../profileDisplayEvents";

const LEGACY_MY_RECIPES_KEY = "tasteBuddyMyRecipes";

function loadMyRecipesFromDisk(storageKey: string): MyRecipeEntry[] {
  try {
    let raw = localStorage.getItem(storageKey);
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_MY_RECIPES_KEY);
      if (legacy) {
        localStorage.setItem(storageKey, legacy);
        raw = legacy;
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is MyRecipeEntry =>
          !!row && typeof row === "object" && typeof (row as MyRecipeEntry).id === "string"
      )
      .map((row) => {
        const m = row as MyRecipeEntry & { recipe_photo?: unknown; recipe_display_id?: unknown };
        const recipe_photo =
          typeof m.recipe_photo === "string" && m.recipe_photo.startsWith("data:image/") ? m.recipe_photo : undefined;
        const recipe_display_id =
          typeof m.recipe_display_id === "string" && isRecipeDisplayId(m.recipe_display_id)
            ? m.recipe_display_id
            : undefined;
        const { recipe_photo: _drop, recipe_display_id: _dd, ...rest } = m;
        return {
          ...rest,
          allergies: typeof row.allergies === "string" ? row.allergies : "",
          accommodates: typeof row.accommodates === "string" ? row.accommodates : "",
          ...(recipe_photo ? { recipe_photo } : {}),
          ...(recipe_display_id ? { recipe_display_id } : {}),
        };
      });
  } catch {
    return [];
  }
}

function defaultDisplayName(): string {
  return "Taste buddy";
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = user!.id;
  const storageKey = scopedStorageKey(userId, MY_RECIPES_STORAGE_BASE);

  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState(defaultDisplayName);
  const [buddyBodyKey, setBuddyBodyKey] = useState<BuddyBodyKey>("purple");
  const [buddyCircleIndex, setBuddyCircleIndex] = useState(2);
  const [buddyEyeKey, setBuddyEyeKey] = useState<BuddyEyeKey>("open");
  const [buddyHatKey, setBuddyHatKey] = useState<BuddyHatKey>("none");
  const [buddySmileKey, setBuddySmileKey] = useState<BuddySmileKey>("smile");
  const [favoriteFood, setFavoriteFood] = useState("");
  const [personality, setPersonality] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [allergyTagIds, setAllergyTagIds] = useState<AllergenTagId[]>([]);
  const [allergyExtraNotes, setAllergyExtraNotes] = useState("");
  const [recipesGiven, setRecipesGiven] = useState("");

  const [myRecipes, setMyRecipes] = useState<MyRecipeEntry[]>([]);
  const [resolvedRecipeCovers, setResolvedRecipeCovers] = useState<Record<string, string | null>>({});
  const [sharedIds, setSharedIds] = useState<Set<string>>(new Set());
  const [wallRecipes, setWallRecipes] = useState<PublicRecipeRow[]>([]);
  const [recipeAction, setRecipeAction] = useState<string | null>(null);
  const [deleteProfileWorking, setDeleteProfileWorking] = useState(false);

  const refreshLocalRecipes = useCallback(() => {
    setMyRecipes(loadMyRecipesFromDisk(storageKey));
  }, [storageKey]);

  const refreshWallRecipes = useCallback(async () => {
    const { data, error } = await fetchPublicRecipesForUser(userId);
    if (error) {
      setRecipeAction(error.message);
      return;
    }
    setWallRecipes(data);
    const next = new Set<string>();
    for (const r of data) {
      if (r.source_local_id) next.add(r.source_local_id);
    }
    setSharedIds(next);
  }, [userId]);

  /** Only overwrite optional fields when the API row actually includes that key (avoids wiping on `undefined`). */
  const applyServerProfileToForm = useCallback((data: TasteProfileRow) => {
    setDisplayName(data.display_name?.trim() || defaultDisplayName());
    const circleIdx = Math.max(0, Math.min(BUDDY_BACKDROP_COUNT - 1, Math.floor(data.buddy_color_index ?? 0)));
    const legacyBodyHint = circleIdx >= 0 && circleIdx <= 5 ? circleIdx : 0;
    setBuddyBodyKey(coerceBuddyBodyKey(data.buddy_body_key, data.buddy_body_key ? 0 : legacyBodyHint));
    setBuddyCircleIndex(circleIdx);
    setBuddyEyeKey(coerceBuddyEyeKey(data.buddy_eye_key));
    setBuddyHatKey(coerceBuddyHatKey(data.buddy_hat_key));
    setBuddySmileKey(coerceBuddySmileKey(data.buddy_smile_key));
    if ("favorite_food" in data) setFavoriteFood(data.favorite_food ?? "");
    if ("personality" in data) setPersonality(data.personality ?? "");
    if ("specialty" in data) setSpecialty(data.specialty ?? "");
    if ("recipes_given" in data || "taste_mood" in (data as Record<string, unknown>)) {
      const row = data as TasteProfileRow & { taste_mood?: string | null };
      const fromRecipes = row.recipes_given ?? "";
      const fromLegacyMood = row.taste_mood ?? "";
      setRecipesGiven(String(fromRecipes.trim() ? fromRecipes : fromLegacyMood));
    }
    if ("allergies" in data) {
      const dec = decodeProfileAllergiesField(data.allergies ?? "");
      setAllergyTagIds(dec.tagIds);
      setAllergyExtraNotes(dec.extraNotes);
    }
  }, []);

  useEffect(() => {
    refreshLocalRecipes();
  }, [refreshLocalRecipes]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const pairs = await Promise.all(
        myRecipes.map(async (r) => [r.id, await resolveRecipeCoverDataUrl(r)] as const)
      );
      if (cancelled) return;
      setResolvedRecipeCovers(Object.fromEntries(pairs));
    })();
    return () => {
      cancelled = true;
    };
  }, [myRecipes]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await fetchProfileByUserId(userId);
      if (cancelled) return;
      if (error) {
        setSaveMessage(error.message);
        setLoading(false);
        return;
      }
      if (data) {
        applyServerProfileToForm(data);
      } else {
        setDisplayName(defaultDisplayName());
      }
      await refreshWallRecipes();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, refreshWallRecipes, applyServerProfileToForm]);

  useEffect(() => {
    const msg = (location.state as { saveMessage?: string } | null)?.saveMessage;
    if (msg) {
      setSaveMessage(msg);
    }
  }, [location.state]);

  const selection = {
    bodyKey: buddyBodyKey,
    eyeKey: buddyEyeKey,
    hatKey: buddyHatKey,
    smileKey: buddySmileKey,
  };

  const buildProfileUpsertPayload = useCallback((): TasteProfileUpsert => {
    return {
      id: userId,
      display_name: displayName.trim() || defaultDisplayName(),
      buddy_color_index: buddyCircleIndex,
      buddy_body_key: buddyBodyKey,
      buddy_eye_key: coerceBuddyEyeKey(buddyEyeKey),
      buddy_hat_key: buddyHatKey,
      buddy_smile_key: buddySmileKey,
      favorite_food: favoriteFood.trim() || null,
      personality: personality.trim() || null,
      specialty: specialty.trim() || null,
      allergies: encodeProfileAllergiesField(allergyTagIds, allergyExtraNotes).trim() || null,
      recipes_given: recipesGiven.trim().slice(0, 500) || null,
    };
  }, [
    userId,
    displayName,
    buddyCircleIndex,
    buddyBodyKey,
    buddyEyeKey,
    buddyHatKey,
    buddySmileKey,
    favoriteFood,
    personality,
    specialty,
    allergyTagIds,
    allergyExtraNotes,
    recipesGiven,
  ]);

  const persistProfile = useCallback(async (): Promise<string | null> => {
    const { error } = await upsertMyProfile(buildProfileUpsertPayload());
    return error ? error.message : null;
  }, [buildProfileUpsertPayload]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveMessage(null);
    const errorMessage = await persistProfile();
    if (!errorMessage) {
      dispatchProfileDisplaySaved(displayName.trim() || defaultDisplayName());
      const { data: fresh, error: fetchErr } = await fetchProfileByUserId(userId);
      if (fresh && !fetchErr) {
        applyServerProfileToForm(fresh);
      }
    }
    setSaveMessage(errorMessage ?? "Saved — you appear on the Buddy Board.");
  };

  const postRecipe = async (r: MyRecipeEntry) => {
    setRecipeAction(null);
    const { data: existing } = await findPublicRecipeBySourceId(userId, r.id);
    if (existing) {
      setRecipeAction("Already on the Buddy Board.");
      return;
    }
    const photo_data_url = (await resolveRecipeCoverDataUrl(r)) ?? "";
    const { error } = await insertPublicRecipe({
      user_id: userId,
      source_local_id: r.id,
      recipe_name: r.recipeName,
      allergies: r.allergies,
      accommodates: r.accommodates ?? "",
      ingredients: r.ingredients,
      directions: r.directions,
      notes: r.notes,
      photo_data_url,
    });
    if (error) {
      setRecipeAction(error.message);
      return;
    }
    await refreshWallRecipes();
  };

  const syncWallPhoto = async (wallRow: PublicRecipeRow, photoUrl: string) => {
    setRecipeAction(null);
    const { error } = await updatePublicRecipePhoto(wallRow.id, userId, photoUrl);
    if (error) {
      setRecipeAction(error.message);
      return;
    }
    await refreshWallRecipes();
  };

  const removeFromWall = async (recipeId: string, recipeName: string) => {
    if (!confirm(`Are you sure you want to remove "${recipeName}" from your Buddy Board?`)) return;
    setRecipeAction(null);
    const { error } = await deletePublicRecipe(recipeId, userId);
    if (error) {
      setRecipeAction(error.message);
      return;
    }
    await refreshWallRecipes();
  };

  const handleDeleteProfile = async () => {
    if (deleteProfileWorking) return;
    setDeleteProfileWorking(true);
    const id = userId.trim();
    try {
      // Always wipe device data first so a failed / unreachable API still removes local content.
      purgeProfileFromThisDevice(id);
      await deleteMyProfile(id);
      flushSync(() => {
        signOut();
      });
      navigate("/sign-in", { replace: true });
    } finally {
      setDeleteProfileWorking(false);
    }
  };

  return (
    <div className={PAGE_SHELL_SCROLL} data-name="Profile">
      <StickyTopChrome />

      <div className="tb-main-column tb-profile-page">
        {loading ? (
          <p className="share-tech-regular tb-text-coral">Loading profile…</p>
        ) : (
          <form className="tb-form-edit-stack tb-form-edit-stack--profile" onSubmit={handleSaveProfile}>
            <motion.h1
              key={location.key}
              className="tb-buddies-title tb-profile-page-title share-tech-bold"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.72,
                ease: [0.22, 1, 0.36, 1],
                delay: 1.05,
              }}
            >
              Hey there, {displayName.trim() || defaultDisplayName()}
            </motion.h1>
            <motion.div
              className="tb-profile-page-buddy-hero tb-profile-page-buddy-hero--main"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.06 }}
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
              <Link to="/profile/customize-buddy" className="tb-submit-wrap tb-profile-page-edit-buddy-btn">
                <motion.span whileTap={{ scale: 0.97 }}>
                  <ChalkPillFrame variant={3} fillClassName="tb-pill-fill-coral--tight" innerClassName="tb-pill-inner tb-pill-inner--md">
                    <span className="tb-pill-text-white share-tech-regular">Edit buddy</span>
                  </ChalkPillFrame>
                </motion.span>
              </Link>
            </motion.div>

            <div className="tb-profile-bento">
              <div className="tb-profile-bento-grid">
                <div className="tb-bento-card">
                  <InfoBoxFrame variant={0}>
                    <label htmlFor="profile-name" className="tb-field-label--tight share-tech-regular">
                      Name on the Buddy Board
                    </label>
                    <input
                      id="profile-name"
                      className="tb-input-plain share-tech-regular"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </InfoBoxFrame>
                </div>

                <div className="tb-bento-card">
                  <InfoBoxFrame variant={1}>
                    <label htmlFor="profile-food" className="tb-field-label--tight share-tech-regular">
                      Favorite dish
                    </label>
                    <input
                      id="profile-food"
                      className="tb-input-plain share-tech-regular"
                      value={favoriteFood}
                      onChange={(e) => setFavoriteFood(e.target.value)}
                      placeholder="Optional"
                    />
                  </InfoBoxFrame>
                </div>

                <div className="tb-bento-card">
                  <InfoBoxFrame variant={2}>
                    <label htmlFor="profile-personality" className="tb-field-label--tight share-tech-regular">
                      Personality
                    </label>
                    <input
                      id="profile-personality"
                      className="tb-input-plain share-tech-regular"
                      value={personality}
                      onChange={(e) => setPersonality(e.target.value)}
                      placeholder="Optional"
                    />
                  </InfoBoxFrame>
                </div>

                <div className="tb-bento-card">
                  <InfoBoxFrame variant={3}>
                    <label htmlFor="profile-specialty" className="tb-field-label--tight share-tech-regular">
                      Specialties
                    </label>
                    <input
                      id="profile-specialty"
                      className="tb-input-plain share-tech-regular"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Optional"
                    />
                  </InfoBoxFrame>
                </div>

                <div className="tb-bento-card tb-bento-card--wide">
                  <InfoBoxFrame variant={2}>
                    <label htmlFor="profile-taste-mood" className="tb-field-label--tight share-tech-regular">
                      Taste mood
                    </label>
                    <p className="share-tech-regular tb-muted-hint tb-profile-bento-hint">
                      A one-liner for your public profile — what you’re into right now.
                    </p>
                    <input
                      id="profile-taste-mood"
                      className="tb-input-plain share-tech-regular"
                      value={recipesGiven}
                      onChange={(e) => setRecipesGiven(e.target.value.slice(0, 500))}
                      placeholder='e.g. “Soup season forever” · dessert first · spice level: brave'
                      maxLength={500}
                    />
                  </InfoBoxFrame>
                </div>

                <div className="tb-bento-card tb-bento-card--wide">
                  <InfoBoxFrame variant={1}>
                    <AllergenIconPicker
                      mode="profile"
                      selected={allergyTagIds}
                      onChange={setAllergyTagIds}
                      groupLabel="Allergies you avoid"
                    />
                    <label htmlFor="profile-allergies-notes" className="tb-field-label--tight share-tech-regular">
                      Extra dietary notes (optional)
                    </label>
                    <textarea
                      id="profile-allergies-notes"
                      className="tb-textarea-plain share-tech-regular"
                      value={allergyExtraNotes}
                      onChange={(e) => setAllergyExtraNotes(e.target.value)}
                      placeholder="Anything else others should know"
                      rows={3}
                    />
                  </InfoBoxFrame>
                </div>
              </div>
            </div>

            {saveMessage ? (
              <p className="tb-intro-blurb share-tech-regular" style={{ margin: 0 }}>
                {saveMessage}
              </p>
            ) : null}

            <motion.button type="submit" className="tb-submit-wrap" whileTap={{ scale: 0.97 }}>
              <ChalkPillFrame variant={0} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--lg">
                <span className="tb-pill-text-white share-tech-regular">Save profile to Buddy Board</span>
              </ChalkPillFrame>
            </motion.button>
          </form>
        )}

        <h2 className="tb-section-heading share-tech-bold" style={{ marginTop: "2rem" }}>
          Post recipes from your kitchen
        </h2>

        {recipeAction ? (
          <p className="share-tech-regular tb-text-coral" style={{ fontSize: "20pt" }}>
            {recipeAction}
          </p>
        ) : null}

        <div className="tb-detail-stack">
          {myRecipes.length === 0 ? (
            <InfoBoxFrame variant={0}>
              <p className="share-tech-regular" style={{ color: PAGE_INTRO_BLURB_TEXT, fontSize: "20pt" }}>
                No recipes yet. Add some under Recipes, then come back here to share.
              </p>
            </InfoBoxFrame>
          ) : (
            myRecipes.map((r) => {
              const wallRow = wallRecipes.find((w) => w.source_local_id === r.id);
              const wallPh =
                wallRow?.photo_data_url?.startsWith("data:image/") ? wallRow.photo_data_url : null;
              const localResolved = resolvedRecipeCovers[r.id] ?? null;
              const showSyncCoverToWall =
                sharedIds.has(r.id) && Boolean(wallRow && localResolved && localResolved !== wallPh);
              const coverSrc = recipeCoverImageSrc(r);
              return (
                <InfoBoxFrame key={r.id} variant={0}>
                  {coverSrc ? (
                    <img
                      src={coverSrc}
                      alt=""
                      className="tb-wall-recipe-photo tb-wall-recipe-photo--in-card"
                      draggable={false}
                    />
                  ) : null}
                  <p className="share-tech-bold tb-text-coral" style={{ fontSize: "20pt" }}>
                    {r.recipeName || "Untitled"}
                  </p>
                  {sharedIds.has(r.id) ? (
                    <>
                      <p className="share-tech-regular" style={{ fontSize: "20pt", marginTop: "0.5rem" }}>
                        On the Buddy Board
                      </p>
                      {showSyncCoverToWall && wallRow && localResolved ? (
                        <>
                          <p
                            className="share-tech-regular tb-muted-hint"
                            style={{ fontSize: "17pt", marginTop: "0.35rem" }}
                          >
                            {wallPh
                              ? "Your saved cover is different from the wall. Sync to update the Buddy Board."
                              : "Cover is saved in Recipes on this device. Sync it so the Buddy Board shows it too."}
                          </p>
                          <motion.button
                            type="button"
                            className="tb-submit-wrap"
                            style={{ marginTop: "0.5rem" }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => void syncWallPhoto(wallRow, localResolved)}
                          >
                            <ChalkPillFrame
                              variant={2}
                              fillClassName="tb-pill-fill-coral--tight"
                              innerClassName="tb-pill-inner tb-pill-inner--sm"
                            >
                              <span className="tb-pill-text-white share-tech-regular">Sync cover to Buddy Board</span>
                            </ChalkPillFrame>
                          </motion.button>
                        </>
                      ) : null}
                    </>
                  ) : (
                    <motion.button
                      type="button"
                      className="tb-submit-wrap"
                      style={{ marginTop: "0.6rem" }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => void postRecipe(r)}
                    >
                      <ChalkPillFrame variant={3} fillClassName="tb-pill-fill-coral--tight" innerClassName="tb-pill-inner tb-pill-inner--sm">
                        <span className="tb-pill-text-white share-tech-regular">Post to Buddy Board</span>
                      </ChalkPillFrame>
                    </motion.button>
                  )}
                </InfoBoxFrame>
              );
            })
          )}
        </div>

        {wallRecipes.length > 0 && (
          <>
            <h2 className="tb-section-heading share-tech-bold" style={{ marginTop: "2rem" }}>
              On your Buddy Board now
            </h2>
            <div className="tb-detail-stack">
              {wallRecipes.map((r) => {
                const localMatch = myRecipes.find((m) => m.id === (r.source_local_id ?? ""));
                const localResolved = localMatch ? resolvedRecipeCovers[localMatch.id] ?? null : null;
                const wallPhoto =
                  r.photo_data_url && r.photo_data_url.startsWith("data:image/") ? r.photo_data_url : null;
                const coverSrc = wallPhoto ?? (localMatch ? recipeCoverImageSrc(localMatch) : undefined);
                const needsPhotoSync = Boolean(localResolved && localResolved !== wallPhoto);
                return (
                  <InfoBoxFrame key={r.id} variant={1}>
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt=""
                        className="tb-wall-recipe-photo tb-wall-recipe-photo--in-card"
                        draggable={false}
                      />
                    ) : null}
                    <p className="share-tech-bold tb-text-coral" style={{ fontSize: "20pt" }}>
                      {r.recipe_name}
                    </p>
                    {needsPhotoSync ? (
                      <>
                        <p className="share-tech-regular tb-muted-hint" style={{ fontSize: "17pt", marginTop: "0.35rem" }}>
                          {wallPhoto
                            ? "Your saved cover is different from the wall. Sync to update the Buddy Board."
                            : "Cover is saved in Recipes on this device. Sync it so the Buddy Board shows it too."}
                        </p>
                        <motion.button
                          type="button"
                          className="tb-submit-wrap"
                          style={{ marginTop: "0.5rem" }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => localResolved && void syncWallPhoto(r, localResolved)}
                        >
                          <ChalkPillFrame
                            variant={2}
                            fillClassName="tb-pill-fill-coral--tight"
                            innerClassName="tb-pill-inner tb-pill-inner--sm"
                          >
                            <span className="tb-pill-text-white share-tech-regular">Sync cover to Buddy Board</span>
                          </ChalkPillFrame>
                        </motion.button>
                      </>
                    ) : null}
                    <motion.button
                      type="button"
                      className="tb-link-text share-tech-regular"
                      style={{ marginTop: "0.5rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => void removeFromWall(r.id, r.recipe_name?.trim() || "Untitled")}
                    >
                      <img alt="" src={imgTrashDelete} draggable={false} className="tb-recipe-x-icon" aria-hidden />
                      Remove from Buddy Board
                    </motion.button>
                  </InfoBoxFrame>
                );
              })}
            </div>
          </>
        )}

        <section className="tb-profile-delete-section" aria-label="Delete profile">
          <motion.button
            type="button"
            className="tb-submit-wrap"
            style={{ marginTop: "3rem" }}
            whileTap={{ scale: deleteProfileWorking ? 1 : 0.97 }}
            disabled={deleteProfileWorking}
            onClick={() => void handleDeleteProfile()}
          >
            <ChalkPillFrame variant={2} fillClassName="tb-pill-fill-coral--tight" innerClassName="tb-pill-inner tb-pill-inner--md">
              <span className="tb-pill-text-white share-tech-regular">
                {deleteProfileWorking ? "Deleting…" : "Delete profile"}
              </span>
            </ChalkPillFrame>
          </motion.button>
        </section>
      </div>
    </div>
  );
}

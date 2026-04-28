import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import StickyTopChrome from "../components/StickyTopChrome";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { PAGE_SHELL, PAGE_SHELL_SCROLL } from "../brand";
import { BUDDY_PROFILE_CIRCLE_MAX } from "../buddyLayout";
import BuddyAvatar from "../components/BuddyAvatar";
import { coerceBuddySvgSelection } from "../buddyAppearance";
import { fetchProfileByUserId, fetchPublicRecipesForUser, type PublicRecipeRow, type TasteProfileRow } from "../../lib/communityApi";
import { decodeProfileAllergiesField, parseAllergenCsv } from "../allergyTagConfig";
import { AllergenBadgeRow } from "../components/AllergenBadgeRow";

function displayFromProfile(p: TasteProfileRow): string {
  return (p.display_name?.trim() || "Taste buddy").slice(0, 80);
}

export default function MemberProfilePage() {
  const { userId: memberId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOwn = Boolean(memberId && user?.id === memberId);

  const [profile, setProfile] = useState<TasteProfileRow | null>(null);
  const [recipes, setRecipes] = useState<PublicRecipeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!memberId) {
        setLoading(false);
        setError("Missing member");
        return;
      }
      setError(null);
      const [pRes, rRes] = await Promise.all([
        fetchProfileByUserId(memberId),
        fetchPublicRecipesForUser(memberId),
      ]);
      if (cancelled) return;
      if (pRes.error) setError(pRes.error.message);
      setProfile(pRes.data);
      if (rRes.error) setError(rRes.error.message);
      setRecipes(rRes.data);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  if (!memberId) {
    return null;
  }

  if (!loading && !profile && !error) {
    return (
      <div className={PAGE_SHELL}>
        <StickyTopChrome />
        <div className="tb-not-found-stack">
          <p className="share-tech-bold tb-text-coral">Profile not found</p>
          <motion.button type="button" onClick={() => navigate("/")} className="tb-submit-wrap" whileTap={{ scale: 0.98 }}>
            <ChalkPillFrame variant={0} fillClassName="tb-pill-fill-light" innerClassName="tb-pill-inner tb-pill-inner--md">
              <span className="share-tech-bold tb-text-coral" style={{ fontSize: "20pt" }}>
                Buddy Board
              </span>
            </ChalkPillFrame>
          </motion.button>
        </div>
      </div>
    );
  }

  const selection = profile ? coerceBuddySvgSelection(profile) : null;
  const name = profile ? displayFromProfile(profile) : "…";
  const profileAllergyDecode = profile?.allergies ? decodeProfileAllergiesField(profile.allergies) : { tagIds: [], extraNotes: "" };
  const hasFavorite = Boolean(profile?.favorite_food?.trim());
  const hasPersonality = Boolean(profile?.personality?.trim());
  const hasSpecialty = Boolean(profile?.specialty?.trim());
  /** On a 2-col grid, avoid a half-empty row when specialty is alone (3rd of 3) or the only detail card. */
  const specialtyBentoWide =
    hasSpecialty && ((hasFavorite && hasPersonality) || (!hasFavorite && !hasPersonality));

  return (
    <div className={PAGE_SHELL_SCROLL} data-name="Member profile">
      <StickyTopChrome />

      <div className="tb-main-column">
        <div className="tb-buddy-profile-back-row">
          <motion.button
            type="button"
            onClick={() => navigate("/")}
            className="tb-submit-wrap"
            aria-label="Back to Buddy Board"
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChalkPillFrame variant={1} fillClassName="tb-pill-fill-back" innerClassName="tb-pill-inner tb-pill-inner--back">
              <span className="tb-back-chevron share-tech-bold" aria-hidden>
                ‹
              </span>
              <span className="share-tech-bold tb-text-coral" style={{ fontSize: "20pt" }}>
                Buddy Board
              </span>
            </ChalkPillFrame>
          </motion.button>
        </div>

        {loading || !selection ? (
          <p className="share-tech-regular tb-text-coral" style={{ marginTop: "1rem" }}>
            {error ? error : "Loading…"}
          </p>
        ) : (
          <>
            <motion.section
              className="tb-profile-hero"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="tb-profile-avatar-hero">
                <BuddyAvatar
                  selection={selection}
                  circleBackgroundIndex={profile.buddy_color_index ?? 0}
                  className={`${BUDDY_PROFILE_CIRCLE_MAX} tb-buddy-profile-circle--hero`}
                  innerClassName="tb-buddy-face-inner"
                  imgClassName="tb-buddy-face-img"
                />
              </div>
            </motion.section>

            <motion.h1
              className="tb-buddy-profile-name share-tech-bold"
              initial={{ y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.45, delay: 0.08 }}
            >
              {name}
            </motion.h1>

            {profile.recipes_given?.trim() ? (
              <motion.figure
                className="tb-taste-mood-quote"
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.12 }}
                aria-label="Taste mood"
              >
                <figcaption className="tb-taste-mood-quote__label share-tech-bold">Taste mood</figcaption>
                <blockquote className="tb-taste-mood-quote__body share-tech-regular">
                  <span className="tb-taste-mood-quote__mark tb-taste-mood-quote__mark--open" aria-hidden>
                    “
                  </span>
                  <span className="tb-taste-mood-quote__text">{profile.recipes_given.trim()}</span>
                  <span className="tb-taste-mood-quote__mark tb-taste-mood-quote__mark--close" aria-hidden>
                    ”
                  </span>
                </blockquote>
              </motion.figure>
            ) : null}

            {isOwn && (
              <motion.div className="tb-detail-actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
                <Link to="/profile" className="tb-submit-wrap">
                  <ChalkPillFrame variant={0} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--lg">
                    <span className="tb-pill-text-white share-tech-regular">Edit my profile</span>
                  </ChalkPillFrame>
                </Link>
              </motion.div>
            )}

            <motion.div className="tb-profile-bento-grid tb-profile-bento-grid--viewer" initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.18 }}>
              {profile?.favorite_food && (
                <InfoBoxFrame variant={0} className="tb-bento-card">
                  <h3 className="tb-detail-h3 share-tech-bold">Favorite dish</h3>
                  <p className="tb-detail-p share-tech-regular">{profile.favorite_food}</p>
                </InfoBoxFrame>
              )}
              {profile?.personality && (
                <InfoBoxFrame variant={1} className="tb-bento-card">
                  <h3 className="tb-detail-h3 share-tech-bold">Personality</h3>
                  <p className="tb-detail-p share-tech-regular">{profile.personality}</p>
                </InfoBoxFrame>
              )}
              {profile?.specialty && (
                <InfoBoxFrame
                  variant={2}
                  className={`tb-bento-card${specialtyBentoWide ? " tb-bento-card--wide" : ""}`.trim()}
                >
                  <h3 className="tb-detail-h3 share-tech-bold">Specialties</h3>
                  <p className="tb-detail-p share-tech-regular">{profile.specialty}</p>
                </InfoBoxFrame>
              )}
              {(profileAllergyDecode.tagIds.length > 0 || profileAllergyDecode.extraNotes) && (
                <InfoBoxFrame variant={1} className="tb-bento-card tb-bento-card--wide">
                  <h3 className="tb-detail-h3 share-tech-bold">Allergies &amp; dietary notes</h3>
                  {profileAllergyDecode.tagIds.length > 0 ? (
                    <AllergenBadgeRow
                      mode="profile"
                      ids={profileAllergyDecode.tagIds}
                      ariaLabel="Allergens this profile avoids"
                      className="tb-allergen-badge-row--viewer-profile"
                    />
                  ) : null}
                  {profileAllergyDecode.extraNotes ? (
                    <p
                      className="tb-pre-wrap share-tech-regular tb-text-coral"
                      style={{ marginTop: profileAllergyDecode.tagIds.length ? "0.75rem" : 0 }}
                    >
                      {profileAllergyDecode.extraNotes}
                    </p>
                  ) : null}
                </InfoBoxFrame>
              )}
            </motion.div>

            {recipes.length > 0 && (
              <>
                <h2 className="tb-section-heading share-tech-bold" style={{ marginTop: "2rem" }}>
                  On the Buddy Board
                </h2>
                <div className="tb-detail-stack">
                  {recipes.map((r) => {
                    const accIds = parseAllergenCsv(r.accommodates ?? "");
                    return (
                    <InfoBoxFrame key={r.id} variant={0}>
                      {r.photo_data_url && r.photo_data_url.startsWith("data:image/") ? (
                        <img
                          src={r.photo_data_url}
                          alt=""
                          className="tb-wall-recipe-photo"
                          draggable={false}
                          style={{ marginBottom: "0.5rem" }}
                        />
                      ) : null}
                      <p className="share-tech-bold tb-text-coral" style={{ fontSize: "20pt", marginBottom: "0.35rem" }}>
                        {r.recipe_name}
                      </p>
                      {accIds.length > 0 ? (
                        <div style={{ marginBottom: "0.5rem" }}>
                          <p className="tb-panel-heading share-tech-bold" style={{ marginBottom: "0.25rem" }}>
                            Free from
                          </p>
                          <AllergenBadgeRow mode="accommodates" ids={accIds} ariaLabel="Recipe is free from" />
                        </div>
                      ) : null}
                      {r.allergies.trim() ? (
                        <p className="share-tech-regular tb-pre-wrap" style={{ fontSize: "20pt", marginBottom: "0.35rem" }}>
                          <span className="share-tech-bold">Contains / notes:</span> {r.allergies}
                        </p>
                      ) : null}
                      {r.ingredients.trim() ? (
                        <p className="share-tech-regular tb-pre-wrap" style={{ fontSize: "20pt", marginBottom: "0.35rem" }}>
                          <span className="share-tech-bold">Ingredients:</span> {r.ingredients}
                        </p>
                      ) : null}
                      {r.directions.trim() ? (
                        <p className="share-tech-regular tb-pre-wrap" style={{ fontSize: "20pt", marginBottom: "0.35rem" }}>
                          <span className="share-tech-bold">Directions:</span> {r.directions}
                        </p>
                      ) : null}
                      {r.notes.trim() ? (
                        <p className="share-tech-regular tb-pre-wrap" style={{ fontSize: "20pt" }}>
                          <span className="share-tech-bold">Notes:</span> {r.notes}
                        </p>
                      ) : null}
                    </InfoBoxFrame>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

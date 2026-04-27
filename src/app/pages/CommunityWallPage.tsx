import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import Navigation from "../components/Navigation";
import GrayTasteHeader from "../components/GrayTasteHeader";
import WallBuddyCard from "../components/WallBuddyCard";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { coerceBuddySvgSelection } from "../buddyAppearance";
import { PAGE_SHELL_SCROLL } from "../brand";
import { parseAllergenCsv } from "../allergyTagConfig";
import { AllergenBadgeRow } from "../components/AllergenBadgeRow";
import {
  fetchCommunityProfiles,
  fetchWallRecipes,
  type TasteProfileRow,
  type PublicRecipeRow,
} from "../../lib/communityApi";
import imgRecipeClose from "@project-assets/X.svg";

function displayFromProfile(p: TasteProfileRow): string {
  return (p.display_name?.trim() || "Taste buddy").slice(0, 80);
}

export default function CommunityWallPage() {
  const location = useLocation();
  const [profiles, setProfiles] = useState<TasteProfileRow[]>([]);
  const [recipes, setRecipes] = useState<PublicRecipeRow[]>([]);
  const [profilesLoadError, setProfilesLoadError] = useState<string | null>(null);
  const [recipesLoadError, setRecipesLoadError] = useState<string | null>(null);
  const [expandedWallRecipeId, setExpandedWallRecipeId] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProfilesLoadError(null);
      setRecipesLoadError(null);
      const [pRes, rRes] = await Promise.all([fetchCommunityProfiles(), fetchWallRecipes(40)]);
      if (cancelled) return;
      if (pRes.error) setProfilesLoadError(pRes.error.message);
      else setProfilesLoadError(null);
      if (rRes.error) setRecipesLoadError(rRes.error.message);
      else setRecipesLoadError(null);
      setProfiles(pRes.data ?? []);
      setRecipes(rRes.data ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [location.key]);

  useEffect(() => {
    setExpandedWallRecipeId(null);
  }, [location.key]);

  const nameByUserId = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of profiles) {
      m.set(p.id, displayFromProfile(p));
    }
    return m;
  }, [profiles]);

  const buddyBoardHelp =
    "Tap a buddy tile to open their public profile. Under Fresh on the Buddy Board, tap a recipe card to read the full recipe.";

  return (
    <div className={PAGE_SHELL_SCROLL} data-name="Buddy board">
      <GrayTasteHeader helpContent={buddyBoardHelp} />
      <Navigation />

      <motion.div
        className="tb-main-column tb-buddy-board-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45 }}
      >
        <motion.h1
          className="tb-buddies-title share-tech-bold"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.04 }}
        >
          Buddy Board
        </motion.h1>

        {profilesLoadError && profiles.length === 0 ? (
          <p className="tb-intro-blurb share-tech-regular" style={{ marginBottom: "1rem" }}>
            Could not load profiles: {profilesLoadError}. For local dev run <code className="share-tech-regular">npm run dev</code>. On Vercel, check <code className="share-tech-regular">/api/health</code> returns JSON.
          </p>
        ) : null}

        <div className="tb-buddies-grid-wrap">
          <motion.div
            className="tb-buddies-grid tb-buddies-grid--buddy-board"
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            {profiles.map((p, index) => (
              <WallBuddyCard
                key={p.id}
                navigateTo={`/member/${p.id}`}
                displayName={displayFromProfile(p)}
                paletteIndex={p.buddy_color_index ?? 0}
                gridIndex={index}
                svgSelection={coerceBuddySvgSelection(p)}
              />
            ))}
          </motion.div>
        </div>

        {profiles.length === 0 && !profilesLoadError && (
          <p className="tb-intro-blurb share-tech-regular" style={{ marginTop: "0.5rem" }}>
            No profiles yet. Be the first — open{" "}
            <Link to="/profile" className="tb-link-wide">
              your profile
            </Link>{" "}
            and save.
          </p>
        )}

        {recipesLoadError && profiles.length > 0 ? (
          <p className="tb-intro-blurb share-tech-regular tb-muted-hint" style={{ marginTop: "1rem" }}>
            Recipes could not load ({recipesLoadError}). Buddy tiles above are fine — try refreshing.
          </p>
        ) : null}

        {recipes.length > 0 && (
          <>
            <h2 className="tb-section-heading share-tech-bold" style={{ marginTop: "2rem" }}>
              Fresh on the Buddy Board
            </h2>
            <div className="tb-wall-recipe-stack">
              {recipes.map((r) => {
                const wallAcc = parseAllergenCsv(r.accommodates ?? "");
                const isExpanded = expandedWallRecipeId === r.id;
                const hasPhoto = Boolean(r.photo_data_url && r.photo_data_url.startsWith("data:image/"));
                const author = nameByUserId.get(r.user_id) ?? "Community member";

                return (
                    <InfoBoxFrame
                      key={r.id}
                      variant={0}
                      className={`tb-wall-recipe-card${isExpanded ? " tb-wall-recipe-card--expanded" : ""}`}
                    >
                      {isExpanded ? (
                        <>
                          <div className="tb-wall-recipe-expanded-top">
                            <div className="tb-wall-recipe-close-row">
                              <motion.button
                                type="button"
                                onClick={() => setExpandedWallRecipeId(null)}
                                className="tb-chevron-btn tb-wall-recipe-close-inline"
                                aria-label="Close recipe"
                                whileHover={{ opacity: 0.75 }}
                                whileTap={{ scale: 0.94 }}
                              >
                                <img alt="" src={imgRecipeClose} draggable={false} className="tb-recipe-x-icon" aria-hidden />
                              </motion.button>
                            </div>
                            <div className="tb-wall-recipe-media-wrap tb-wall-recipe-media-wrap--expanded">
                              {hasPhoto ? (
                                <img
                                  src={r.photo_data_url!}
                                  alt=""
                                  className="tb-wall-recipe-photo--hero"
                                  draggable={false}
                                />
                              ) : (
                                <div className="tb-wall-recipe-placeholder" aria-hidden>
                                  <span className="tb-wall-recipe-placeholder-letter share-tech-bold">
                                    {r.recipe_name.trim().charAt(0).toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="share-tech-bold tb-text-coral tb-wall-recipe-title tb-wall-recipe-title--below-media">
                            {r.recipe_name}
                          </p>
                          <p className="share-tech-regular tb-muted-hint tb-wall-recipe-author">{author}</p>
                          {wallAcc.length > 0 ? (
                            <div className="tb-wall-recipe-section">
                              <p className="share-tech-bold tb-wall-recipe-label">Free from</p>
                              <AllergenBadgeRow mode="accommodates" ids={wallAcc} ariaLabel="Recipe is free from" />
                            </div>
                          ) : null}
                          {r.allergies.trim() ? (
                            <div className="tb-wall-recipe-section">
                              <p className="share-tech-bold tb-wall-recipe-label">Contains / notes</p>
                              <p className="share-tech-regular tb-pre-wrap tb-wall-recipe-copy">{r.allergies}</p>
                            </div>
                          ) : null}
                          {r.ingredients.trim() ? (
                            <div className="tb-wall-recipe-section">
                              <p className="share-tech-bold tb-wall-recipe-label">Ingredients</p>
                              <p className="share-tech-regular tb-pre-wrap tb-wall-recipe-copy">{r.ingredients}</p>
                            </div>
                          ) : null}
                          {r.directions.trim() ? (
                            <div className="tb-wall-recipe-section">
                              <p className="share-tech-bold tb-wall-recipe-label">Directions</p>
                              <p className="share-tech-regular tb-pre-wrap tb-wall-recipe-copy">{r.directions}</p>
                            </div>
                          ) : null}
                          {r.notes.trim() ? (
                            <div className="tb-wall-recipe-section">
                              <p className="share-tech-bold tb-wall-recipe-label">Notes</p>
                              <p className="share-tech-regular tb-pre-wrap tb-wall-recipe-copy">{r.notes}</p>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <motion.button
                          type="button"
                          className="tb-wall-recipe-collapsed"
                          aria-expanded={false}
                          onClick={() => setExpandedWallRecipeId(r.id)}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="tb-wall-recipe-media-wrap">
                            {hasPhoto ? (
                              <img
                                src={r.photo_data_url!}
                                alt=""
                                className="tb-wall-recipe-photo--hero"
                                draggable={false}
                              />
                            ) : (
                              <div className="tb-wall-recipe-placeholder" aria-hidden>
                                <span className="tb-wall-recipe-placeholder-letter share-tech-bold">
                                  {r.recipe_name.trim().charAt(0).toUpperCase() || "?"}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="share-tech-bold tb-text-coral tb-wall-recipe-title tb-wall-recipe-title--below-media">
                            {r.recipe_name}
                          </p>
                          <p className="share-tech-regular tb-muted-hint tb-wall-recipe-author tb-wall-recipe-author--collapsed">
                            {author}
                          </p>
                          <p className="share-tech-regular tb-wall-recipe-expand-hint">Tap to open recipe →</p>
                        </motion.button>
                      )}
                    </InfoBoxFrame>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

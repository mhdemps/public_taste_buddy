import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import Navigation from "../components/Navigation";
import GrayTasteHeader from "../components/GrayTasteHeader";
import WallBuddyCard from "../components/WallBuddyCard";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { coerceBuddySvgSelection } from "../buddyAppearance";
import { PAGE_SHELL_SCROLL } from "../brand";
import { useAuth } from "../context/AuthContext";
import { appendWallRecipeToSaved, savedWallRecipeIdsForUser } from "../savedCommunityRecipes";
import { parseAllergenCsv } from "../allergyTagConfig";
import { AllergenBadgeRow } from "../components/AllergenBadgeRow";
import {
  fetchCommunityProfiles,
  fetchWallRecipes,
  type TasteProfileRow,
  type PublicRecipeRow,
} from "../../lib/communityApi";

function displayFromProfile(p: TasteProfileRow): string {
  return (p.display_name?.trim() || "Taste buddy").slice(0, 80);
}

export default function CommunityWallPage() {
  const location = useLocation();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<TasteProfileRow[]>([]);
  const [recipes, setRecipes] = useState<PublicRecipeRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savedWallIds, setSavedWallIds] = useState<Set<string>>(() => new Set());
  const [saveHint, setSaveHint] = useState<{ recipeId: string; message: string } | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadError(null);
      const [pRes, rRes] = await Promise.all([fetchCommunityProfiles(), fetchWallRecipes(40)]);
      if (cancelled) return;
      if (pRes.error) setLoadError(pRes.error.message);
      else if (rRes.error) setLoadError(rRes.error.message);
      setProfiles(pRes.data);
      setRecipes(rRes.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [location.key]);

  useEffect(() => {
    if (!user) return;
    setSavedWallIds(savedWallRecipeIdsForUser(user.id));
  }, [user, location.key]);

  const nameByUserId = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of profiles) {
      m.set(p.id, displayFromProfile(p));
    }
    return m;
  }, [profiles]);

  const handleSaveWallRecipe = useCallback(
    (r: PublicRecipeRow) => {
      if (!user) return;
      const author = nameByUserId.get(r.user_id) ?? "Community member";
      const result = appendWallRecipeToSaved(user.id, r, author);
      if (result === "saved") {
        setSavedWallIds((prev) => new Set(prev).add(r.id));
      }
      setSaveHint({
        recipeId: r.id,
        message:
          result === "duplicate"
            ? "Already in your saved list."
            : "Saved — open Saved recipes in the bar below.",
      });
      window.setTimeout(() => {
        setSaveHint((h) => (h?.recipeId === r.id ? null : h));
      }, 4500);
    },
    [user, nameByUserId]
  );

  return (
    <div className={PAGE_SHELL_SCROLL} data-name="Community wall">
      <GrayTasteHeader />
      <Navigation />

      <motion.div
        className="tb-main-column"
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
          Taste wall
        </motion.h1>

        {loadError && (
          <p className="tb-intro-blurb share-tech-regular" style={{ marginBottom: "1rem" }}>
            Could not load the wall: {loadError}. Make sure the local JSON API is running with <code className="share-tech-regular">npm run dev</code>.
          </p>
        )}

        <div className="tb-buddies-grid-wrap">
          <motion.div
            className="tb-buddies-grid"
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

        {profiles.length === 0 && !loadError && (
          <p className="tb-intro-blurb share-tech-regular" style={{ marginTop: "0.5rem" }}>
            No profiles yet. Be the first — open{" "}
            <Link to="/profile" className="tb-link-wide">
              your profile
            </Link>{" "}
            and save.
          </p>
        )}

        {recipes.length > 0 && (
          <>
            <h2 className="tb-section-heading share-tech-bold" style={{ marginTop: "2rem" }}>
              Fresh on the wall
            </h2>
            <p className="tb-intro-blurb share-tech-regular" style={{ marginTop: "0.35rem", marginBottom: "0.25rem" }}>
              Tap <span className="share-tech-bold">Save to my list</span> to copy a recipe to your saved recipes (bottom bar).
            </p>
            <div className="tb-wall-recipe-stack">
              {recipes.map((r) => {
                const wallAcc = parseAllergenCsv(r.accommodates ?? "");
                return (
                <InfoBoxFrame key={r.id} variant={0} className="tb-wall-recipe-card">
                  <p className="share-tech-bold tb-text-coral tb-wall-recipe-title">
                    {r.recipe_name}
                  </p>
                  <p className="share-tech-regular tb-muted-hint tb-wall-recipe-author">
                    {nameByUserId.get(r.user_id) ?? "Community member"}
                  </p>
                  <div className="tb-wall-recipe-actions">
                    {savedWallIds.has(r.id) ? (
                      <p className="share-tech-regular tb-muted-hint" style={{ margin: 0 }}>
                        In your saved list
                      </p>
                    ) : (
                      <motion.button
                        type="button"
                        className="tb-submit-wrap"
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSaveWallRecipe(r)}
                      >
                        <ChalkPillFrame
                          variant={2}
                          fillClassName="tb-pill-fill-coral--tight"
                          innerClassName="tb-pill-inner tb-pill-inner--sm"
                        >
                          <span className="tb-pill-text-white share-tech-regular">Save to my list</span>
                        </ChalkPillFrame>
                      </motion.button>
                    )}
                    {saveHint?.recipeId === r.id ? (
                      <p className="share-tech-regular tb-wall-recipe-save-hint" role="status">
                        {saveHint.message}
                      </p>
                    ) : null}
                  </div>
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

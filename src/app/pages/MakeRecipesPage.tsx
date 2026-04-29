import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { motion } from "motion/react";
import confetti from "canvas-confetti";
import { useAuth } from "../context/AuthContext";
import { FRIEND_RECIPES_STORAGE_BASE, MY_RECIPES_STORAGE_BASE, scopedStorageKey } from "../userStorage";
import {
  loadRecipeMakeProgress,
  parseDirectionSteps,
  parseIngredientLines,
  recipeCookProgressKey,
  recipeCookProgressStorageKey,
  updateRecipeMakeProgress,
  type RecipeCookSource,
  type RecipeMakeProgressRow,
} from "../recipeMakeProgress";
import {
  loadSavedCommunityRecipes,
  sortSavedCommunityRecipesNewestFirst,
} from "../savedCommunityRecipes";
import { loadWhiskMakeLater, toggleWhiskMakeLater } from "../whiskMakeLater";
import { loadWhiskFavorites, toggleWhiskFavorite } from "../whiskFavorites";
import { loadMyRecipeEntries, sortMyRecipesNewestFirst, type MyRecipeEntry } from "./MyRecipesPage";
import StickyTopChrome from "../components/StickyTopChrome";
import SavedFromBoardRecipeCards from "../components/SavedFromBoardRecipeCards";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { PAGE_INTRO_BLURB_TEXT, PAGE_SHELL_SCROLL } from "../brand";
import iconWhisk from "@project-assets/whisk.svg";
import iconSaveHover from "@project-assets/save hover.svg";
import iconHeart from "@project-assets/heart.svg";
import iconHeartClicked from "@project-assets/clicked heart.svg";

type CookListItem =
  | (Pick<MyRecipeEntry, "id" | "recipeName" | "ingredients" | "directions" | "notes"> & {
      source: "my";
    })
  | {
      source: "friend";
      id: string;
      recipeName: string;
      ingredients: string;
      directions: string;
      notes: string;
      friendName: string;
    };

function isCookSource(s: string | undefined): s is RecipeCookSource {
  return s === "my" || s === "friend";
}

function sanitizeChecked(checked: number[], count: number): number[] {
  if (count <= 0) return [];
  return [...new Set(checked.filter((i) => i >= 0 && i < count))].sort((a, b) => a - b);
}

const emptyProgress = (): RecipeMakeProgressRow => ({
  timesMade: 0,
  checkedIngredients: [],
  checkedSteps: [],
});

export default function MakeRecipesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { source: sourceParam, recipeId } = useParams<{ source?: string; recipeId?: string }>();
  const { user } = useAuth();
  const userId = user!.id;
  const myKey = scopedStorageKey(userId, MY_RECIPES_STORAGE_BASE);
  const friendKey = scopedStorageKey(userId, FRIEND_RECIPES_STORAGE_BASE);
  const progressKeyFull = recipeCookProgressStorageKey(userId);

  const [progressMap, setProgressMap] = useState<Record<string, RecipeMakeProgressRow>>(() =>
    loadRecipeMakeProgress(progressKeyFull)
  );
  const [makeLaterSet, setMakeLaterSet] = useState(() => loadWhiskMakeLater(userId));
  const [favoritesSet, setFavoritesSet] = useState(() => loadWhiskFavorites(userId));
  const [boardRefreshTick, setBoardRefreshTick] = useState(0);

  const refreshProgress = useCallback(() => {
    setProgressMap(loadRecipeMakeProgress(progressKeyFull));
  }, [progressKeyFull]);

  const refreshMakeLater = useCallback(() => {
    setMakeLaterSet(loadWhiskMakeLater(userId));
  }, [userId]);

  const refreshFavorites = useCallback(() => {
    setFavoritesSet(loadWhiskFavorites(userId));
  }, [userId]);

  const myRecipes = useMemo(() => sortMyRecipesNewestFirst(loadMyRecipeEntries(myKey)), [myKey]);
  const friendRecipes = useMemo(
    () => sortSavedCommunityRecipesNewestFirst(loadSavedCommunityRecipes(friendKey)),
    [friendKey, location.pathname, boardRefreshTick]
  );

  const myCookItems: CookListItem[] = useMemo(
    () =>
      myRecipes.map((r) => ({
        source: "my" as const,
        id: r.id,
        recipeName: r.recipeName,
        ingredients: r.ingredients,
        directions: r.directions,
        notes: r.notes,
      })),
    [myRecipes]
  );

  const listItems: CookListItem[] = useMemo(() => {
    const mine: CookListItem[] = myRecipes.map((r) => ({
      source: "my" as const,
      id: r.id,
      recipeName: r.recipeName,
      ingredients: r.ingredients,
      directions: r.directions,
      notes: r.notes,
    }));
    const wall: CookListItem[] = friendRecipes.map((r) => ({
      source: "friend" as const,
      id: r.id,
      recipeName: r.recipeName,
      ingredients: r.ingredients,
      directions: r.directions,
      notes: r.notes,
      friendName: r.friendName,
    }));
    return [...mine, ...wall];
  }, [myRecipes, friendRecipes]);

  const myListItemsForHub = useMemo(() => {
    return [...myCookItems]
      .map((r, idx) => ({ r, idx, pk: recipeCookProgressKey(r.source, r.id) }))
      .sort((a, b) => {
        const aLater = makeLaterSet.has(a.pk);
        const bLater = makeLaterSet.has(b.pk);
        if (aLater !== bLater) return aLater ? -1 : 1;
        return a.idx - b.idx;
      })
      .map((x) => x.r);
  }, [myCookItems, makeLaterSet]);

  const cookSource = isCookSource(sourceParam) ? sourceParam : null;
  const isCookView = Boolean(cookSource && recipeId);

  const activeRecipe = useMemo(() => {
    if (!isCookView || !cookSource || !recipeId) return null;
    return listItems.find((r) => r.source === cookSource && r.id === recipeId) ?? null;
  }, [isCookView, cookSource, recipeId, listItems]);

  useEffect(() => {
    if (!isCookView) return;
    if (!activeRecipe) {
      navigate("/whisk", { replace: true });
    }
  }, [isCookView, activeRecipe, navigate]);

  useEffect(() => {
    setProgressMap(loadRecipeMakeProgress(progressKeyFull));
  }, [location.pathname, progressKeyFull]);

  useEffect(() => {
    refreshMakeLater();
  }, [location.pathname, refreshMakeLater]);

  useEffect(() => {
    refreshFavorites();
  }, [location.pathname, refreshFavorites]);

  const pKey = cookSource && recipeId ? recipeCookProgressKey(cookSource, recipeId) : "";
  const row = pKey ? (progressMap[pKey] ?? emptyProgress()) : emptyProgress();
  const ingredientItems = activeRecipe ? parseIngredientLines(activeRecipe.ingredients) : [];
  const steps = activeRecipe ? parseDirectionSteps(activeRecipe.directions) : [];

  const ingChecked = new Set(sanitizeChecked(row.checkedIngredients, ingredientItems.length));
  const stepChecked = new Set(sanitizeChecked(row.checkedSteps, steps.length));
  const ingDone = ingChecked.size;
  const stepDone = stepChecked.size;
  const ingPct = ingredientItems.length ? Math.round((ingDone / ingredientItems.length) * 100) : 0;
  const stepPct = steps.length ? Math.round((stepDone / steps.length) * 100) : 0;
  const anyChecks = ingDone > 0 || stepDone > 0;

  const setIngredientChecked = (index: number, on: boolean) => {
    if (!pKey) return;
    updateRecipeMakeProgress(progressKeyFull, pKey, (prev) => {
      const n = ingredientItems.length;
      let next = sanitizeChecked(prev.checkedIngredients, n);
      const s = new Set(next);
      if (on) s.add(index);
      else s.delete(index);
      next = [...s].sort((a, b) => a - b);
      return { ...prev, checkedIngredients: next };
    });
    refreshProgress();
  };

  const setStepChecked = (index: number, on: boolean) => {
    if (!pKey) return;
    updateRecipeMakeProgress(progressKeyFull, pKey, (prev) => {
      const n = steps.length;
      let next = sanitizeChecked(prev.checkedSteps, n);
      const s = new Set(next);
      if (on) s.add(index);
      else s.delete(index);
      next = [...s].sort((a, b) => a - b);
      return { ...prev, checkedSteps: next };
    });
    refreshProgress();
  };

  const handleClearChecks = () => {
    if (!pKey) return;
    updateRecipeMakeProgress(progressKeyFull, pKey, (prev) => ({
      ...prev,
      checkedIngredients: [],
      checkedSteps: [],
    }));
    refreshProgress();
  };

  const handleMadeIt = () => {
    if (!pKey) return;
    updateRecipeMakeProgress(progressKeyFull, pKey, (prev) => ({
      timesMade: prev.timesMade + 1,
      checkedIngredients: [],
      checkedSteps: [],
    }));
    refreshProgress();
    void confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.72 },
      colors: ["#ff3a00", "#ffb38a", "#fff5e6", "#ff8a5c"],
    });
  };

  const handleClearTimesMade = () => {
    if (!pKey) return;
    updateRecipeMakeProgress(progressKeyFull, pKey, (prev) => ({
      ...prev,
      timesMade: 0,
    }));
    refreshProgress();
  };

  if (isCookView && activeRecipe && cookSource && recipeId) {
    return (
      <div className={PAGE_SHELL_SCROLL}>
        <StickyTopChrome />
        <motion.div
          className="tb-main-column tb-buddy-board-page tb-whisk-recipes-column"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
        >
          <div className="tb-make-cook-header">
            {pKey ? (
              <div className="tb-make-cook-header-heart" aria-label="Favorite recipe">
                <motion.button
                  type="button"
                  className="tb-make-fav-toggle tb-make-fav-toggle--header"
                  aria-pressed={favoritesSet.has(pKey)}
                  aria-label={favoritesSet.has(pKey) ? "Remove favorite from this recipe" : "Favorite this recipe"}
                  title={favoritesSet.has(pKey) ? "Unfavorite" : "Favorite"}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setFavoritesSet(toggleWhiskFavorite(userId, pKey))}
                >
                  <img
                    src={favoritesSet.has(pKey) ? iconHeartClicked : iconHeart}
                    alt=""
                    className="tb-make-fav-icon"
                    draggable={false}
                  />
                </motion.button>
              </div>
            ) : (
              <div />
            )}

            <motion.button
              type="button"
              onClick={() => navigate("/whisk")}
              className="tb-submit-wrap tb-make-back-btn"
              aria-label="Back to Make"
              whileTap={{ scale: 0.98 }}
            >
              <ChalkPillFrame variant={1} fillClassName="tb-pill-fill-back" innerClassName="tb-pill-inner tb-pill-inner--back">
                <span className="tb-back-chevron share-tech-bold" aria-hidden>
                  ‹
                </span>
                <span className="share-tech-bold tb-text-coral" style={{ fontSize: "20pt" }}>
                  Make
                </span>
              </ChalkPillFrame>
            </motion.button>

            <div className="tb-make-cook-header-actions" aria-label="Recipe actions">
              {pKey ? (
                <motion.button
                  type="button"
                  className="tb-make-later-toggle tb-make-later-toggle--header"
                  aria-pressed={makeLaterSet.has(pKey)}
                  aria-label={
                    makeLaterSet.has(pKey)
                      ? "Remove make-later tag from this recipe"
                      : "Mark as a recipe you want to make later"
                  }
                  title={makeLaterSet.has(pKey) ? "Remove from make later" : "A recipe you want to make later — tap to tag"}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setMakeLaterSet(toggleWhiskMakeLater(userId, pKey))}
                >
                  <img src={iconSaveHover} alt="" className="tb-make-later-icon" draggable={false} />
                </motion.button>
              ) : null}
            </div>
          </div>

          <h1 className="tb-page-title share-tech-bold tb-text-coral tb-make-cook-title">{activeRecipe.recipeName}</h1>
          <p className="tb-intro-blurb share-tech-regular tb-make-cook-sub">
            {activeRecipe.source === "friend"
              ? `From ${activeRecipe.friendName} · made ${row.timesMade} time${row.timesMade === 1 ? "" : "s"}`
              : `Your recipe · made ${row.timesMade} time${row.timesMade === 1 ? "" : "s"}`}
          </p>

          {pKey && makeLaterSet.has(pKey) ? (
            <div
              className="tb-make-later-tag tb-make-later-tag--cook"
              title="A recipe you want to make later"
            >
              <img src={iconSaveHover} alt="" className="tb-make-later-tag-icon" draggable={false} />
              <span className="share-tech-bold">Make later</span>
            </div>
          ) : null}

          {ingredientItems.length > 0 || steps.length > 0 ? (
            <div className="tb-make-progress-stack">
              {ingredientItems.length > 0 ? (
                <div className="tb-make-progress-wrap">
                  <p className="tb-make-progress-heading share-tech-bold tb-text-coral">Gather ingredients</p>
                  <div className="tb-make-progress-track">
                    <div className="tb-make-progress-fill tb-make-progress-fill--soft" style={{ width: `${ingPct}%` }} />
                  </div>
                  <p className="tb-make-progress-label share-tech-regular">
                    {ingDone} / {ingredientItems.length} ready
                  </p>
                </div>
              ) : null}
              {steps.length > 0 ? (
                <div className="tb-make-progress-wrap">
                  <p className="tb-make-progress-heading share-tech-bold tb-text-coral">Cooking steps</p>
                  <div className="tb-make-progress-track">
                    <div className="tb-make-progress-fill" style={{ width: `${stepPct}%` }} />
                  </div>
                  <p className="tb-make-progress-label share-tech-regular">
                    Step {stepDone} / {steps.length}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <section className="tb-section-narrow tb-make-cook-sections">
            <InfoBoxFrame variant={0}>
              <h2 className="tb-section-heading share-tech-bold tb-text-coral tb-make-section-h2">1 · Gather ingredients</h2>
              {ingredientItems.length === 0 ? (
                <p className="share-tech-regular" style={{ fontSize: "18pt", lineHeight: 1.4, color: PAGE_INTRO_BLURB_TEXT }}>
                  No ingredient lines yet — add them (one per line) in{" "}
                  <button
                    type="button"
                    className="tb-link-cancel share-tech-bold tb-text-coral"
                    style={{ display: "inline", padding: 0, margin: 0, background: "none", border: 0, cursor: "pointer" }}
                    onClick={() =>
                      navigate(activeRecipe.source === "my" ? `/my-recipes/edit/${recipeId}` : `/friend-recipe/edit/${recipeId}`)
                    }
                  >
                    edit recipe
                  </button>
                  .
                </p>
              ) : (
                <ul className="tb-make-step-list">
                  {ingredientItems.map((text, i) => {
                    const done = ingChecked.has(i);
                    return (
                      <li key={`ing-${i}`} className="tb-make-step-li">
                        <label className={`tb-make-step-label ${done ? "tb-make-step-label--done" : ""}`}>
                          <input
                            type="checkbox"
                            className="tb-make-step-check"
                            checked={done}
                            onChange={(e) => setIngredientChecked(i, e.target.checked)}
                          />
                          <span className="tb-make-step-text share-tech-regular">{text}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </InfoBoxFrame>

            <InfoBoxFrame variant={1}>
              <h2 className="tb-section-heading share-tech-bold tb-text-coral tb-make-section-h2">2 · Directions</h2>
              {steps.length === 0 ? (
                <p className="share-tech-regular" style={{ fontSize: "18pt", lineHeight: 1.4, color: PAGE_INTRO_BLURB_TEXT }}>
                  No steps yet — add numbered steps in{" "}
                  <button
                    type="button"
                    className="tb-link-cancel share-tech-bold tb-text-coral"
                    style={{ display: "inline", padding: 0, margin: 0, background: "none", border: 0, cursor: "pointer" }}
                    onClick={() =>
                      navigate(activeRecipe.source === "my" ? `/my-recipes/edit/${recipeId}` : `/friend-recipe/edit/${recipeId}`)
                    }
                  >
                    edit recipe
                  </button>
                  .
                </p>
              ) : (
                <ul className="tb-make-step-list">
                  {steps.map((text, i) => {
                    const done = stepChecked.has(i);
                    return (
                      <li key={`step-${i}`} className="tb-make-step-li">
                        <label className={`tb-make-step-label ${done ? "tb-make-step-label--done" : ""}`}>
                          <input
                            type="checkbox"
                            className="tb-make-step-check"
                            checked={done}
                            onChange={(e) => setStepChecked(i, e.target.checked)}
                          />
                          <span className="tb-make-step-num share-tech-bold">{i + 1}.</span>
                          <span className="tb-make-step-text share-tech-regular">{text}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </InfoBoxFrame>

            {activeRecipe.notes.trim() ? (
              <InfoBoxFrame variant={2}>
                <h2 className="tb-section-heading share-tech-bold tb-text-coral tb-make-section-h2">Notes</h2>
                <p className="tb-pre-wrap share-tech-regular">{activeRecipe.notes}</p>
              </InfoBoxFrame>
            ) : null}
          </section>

          <div className="tb-make-cook-actions">
            <motion.button type="button" className="tb-submit-wrap" onClick={handleMadeIt} whileTap={{ scale: 0.97 }}>
              <ChalkPillFrame variant={0} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--lg">
                <span className="tb-pill-text-white--sm share-tech-regular">I made this! +1</span>
              </ChalkPillFrame>
            </motion.button>
            <motion.button
              type="button"
              className="tb-link-text share-tech-regular tb-make-clear-times-btn"
              onClick={handleClearTimesMade}
              whileTap={{ scale: 0.98 }}
              disabled={!row.timesMade}
              aria-label="Clear times made"
            >
              Clear times made
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={PAGE_SHELL_SCROLL}>
      <StickyTopChrome />
      <motion.div
        className="tb-main-column tb-buddy-board-page tb-whisk-recipes-column"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="tb-make-hub-intro">
          <motion.img
            alt=""
            src={iconWhisk}
            draggable={false}
            className="tb-hero-decor-whisk tb-make-hub-whisk"
            style={{ transformOrigin: "50% 80%" }}
            whileHover={{ rotate: [0, -12, 6, -4, 0] }}
            transition={{ duration: 0.55 }}
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          />
          <motion.h1
            className="tb-page-title tb-make-hub-title share-tech-bold tb-text-coral"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.04 }}
          >
            Whip it up
          </motion.h1>
        </div>

        {listItems.length === 0 ? (
          <motion.section
            className="tb-section-narrow tb-make-hub-section"
            aria-labelledby="make-empty-heading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
          >
            <h2 id="make-empty-heading" className="tb-section-heading share-tech-bold tb-text-coral">
              Start cooking
            </h2>
            <InfoBoxFrame variant={1}>
              <p className="share-tech-regular" style={{ fontSize: "20pt", lineHeight: 1.375 }}>
                No recipes yet — add your own under the Recipes tab, or save a Buddy Board recipe with the checkmark on a card.
                Everything lands here so you can cook along step-by-step.
              </p>
            </InfoBoxFrame>
          </motion.section>
        ) : (
          <>
            <motion.section
              className="tb-section-narrow tb-make-hub-section"
              aria-labelledby="whisk-my-recipes-heading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12 }}
            >
              <h2 id="whisk-my-recipes-heading" className="tb-section-heading share-tech-bold tb-text-coral">
                Your recipes
              </h2>
              {myCookItems.length === 0 ? (
                <InfoBoxFrame variant={1}>
                  <p className="share-tech-regular" style={{ fontSize: "20pt", lineHeight: 1.375 }}>
                    No recipes written yet — open the Recipes tab to create one. Saved Buddy Board recipes appear below.
                  </p>
                </InfoBoxFrame>
              ) : (
                <ul className="tb-saved-list">
                  {myListItemsForHub.map((r, i) => {
                    const pk = recipeCookProgressKey(r.source, r.id);
                    const pr = progressMap[pk] ?? emptyProgress();
                    const subtitle = "Yours";
                    const isLater = makeLaterSet.has(pk);
                    const isFavorite = favoritesSet.has(pk);
                    return (
                      <li key={`${r.source}-${r.id}`} className="tb-li-relative">
                        <div className="tb-card-relative">
                          <InfoBoxFrame variant={i % 4}>
                            <div className="tb-make-card-shell">
                              <div className="tb-make-card-header-row">
                                <button
                                  type="button"
                                  className="tb-expand-hit tb-make-card-hit"
                                  onClick={() => navigate(`/whisk/cook/${r.source}/${r.id}`)}
                                >
                                  <div className="tb-make-card-top">
                                    <h3 className="tb-recipe-h3 share-tech-bold">{r.recipeName}</h3>
                                    <span className="tb-make-badge share-tech-bold">{pr.timesMade}× made</span>
                                  </div>
                                  <p className="share-tech-regular tb-make-card-sub">{subtitle}</p>
                                  <p className="share-tech-regular tb-recipe-card-hint">Tap to cook along →</p>
                                </button>
                                <motion.button
                                  type="button"
                                  className="tb-make-fav-toggle"
                                  aria-pressed={isFavorite}
                                  aria-label={isFavorite ? "Remove favorite from this recipe" : "Favorite this recipe"}
                                  title={isFavorite ? "Unfavorite" : "Favorite"}
                                  whileTap={{ scale: 0.94 }}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setFavoritesSet(toggleWhiskFavorite(userId, pk));
                                  }}
                                >
                                  <img
                                    src={isFavorite ? iconHeartClicked : iconHeart}
                                    alt=""
                                    className="tb-make-fav-icon"
                                    draggable={false}
                                  />
                                </motion.button>
                                <motion.button
                                  type="button"
                                  className="tb-make-later-toggle"
                                  aria-pressed={isLater}
                                  aria-label={
                                    isLater
                                      ? "Remove make-later tag from this recipe"
                                      : "Mark as a recipe you want to make later"
                                  }
                                  title={
                                    isLater
                                      ? "Remove from make later"
                                      : "A recipe you want to make later — tap to tag"
                                  }
                                  whileTap={{ scale: 0.94 }}
                                  onClick={() => {
                                    setMakeLaterSet(toggleWhiskMakeLater(userId, pk));
                                  }}
                                >
                                  <img src={iconSaveHover} alt="" className="tb-make-later-icon" draggable={false} />
                                </motion.button>
                              </div>
                              {isLater ? (
                                <div className="tb-make-later-tag" title="A recipe you want to make later">
                                  <img src={iconSaveHover} alt="" className="tb-make-later-tag-icon" draggable={false} />
                                  <span className="share-tech-bold">Make later</span>
                                </div>
                              ) : null}
                            </div>
                          </InfoBoxFrame>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.section>

            <motion.section
              className="tb-section-narrow tb-make-hub-section"
              aria-labelledby="whisk-board-saved-heading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.18 }}
            >
              <h2 id="whisk-board-saved-heading" className="tb-section-heading share-tech-bold tb-text-coral">
                From the Buddy Board
              </h2>
              {friendRecipes.length === 0 ? (
                <InfoBoxFrame variant={2}>
                  <p className="share-tech-regular" style={{ fontSize: "20pt", lineHeight: 1.375 }}>
                    Nothing saved from the board yet — open Buddies, choose a recipe card, and tap the check to add it here for
                    cooking and details.
                  </p>
                </InfoBoxFrame>
              ) : (
                <SavedFromBoardRecipeCards
                  storageKey={friendKey}
                  entries={friendRecipes}
                  userId={userId}
                  makeLaterSet={makeLaterSet}
                  setMakeLaterSet={setMakeLaterSet}
                  favoritesSet={favoritesSet}
                  setFavoritesSet={setFavoritesSet}
                  onMutate={() => setBoardRefreshTick((t) => t + 1)}
                />
              )}
            </motion.section>
          </>
        )}
      </motion.div>
    </div>
  );
}

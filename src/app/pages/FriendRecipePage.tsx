import { useNavigate, useLocation, useParams } from "react-router";
import { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useBuddies } from "../context/BuddiesContext";
import { FRIEND_RECIPES_STORAGE_BASE, scopedStorageKey } from "../userStorage";
import {
  loadSavedCommunityRecipes,
  persistSavedCommunityRecipes,
  sortSavedCommunityRecipesNewestFirst,
  type SavedCommunityRecipeEntry,
} from "../savedCommunityRecipes";
import StickyTopChrome from "../components/StickyTopChrome";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { PAGE_SHELL_SCROLL } from "../brand";
import {
  formatAllergenCsv,
  parseAllergenCsv,
  type AllergenTagId,
} from "../allergyTagConfig";
import { AllergenIconPicker } from "../components/AllergenIconPicker";
import { AllergenBadgeRow } from "../components/AllergenBadgeRow";
import RecipeIngredientDirectionFields from "../components/RecipeIngredientDirectionFields";
import {
  directionRowsFromString,
  directionsStringFromRows,
  ingredientRowsFromString,
  ingredientsStringFromRows,
  newIngredientRow,
  type IngredientRow,
} from "../recipeLineEditorUtils";
import imgRecipeClose from "@project-assets/X.svg";
import imgTrashDelete from "@project-assets/Trash.svg";
import imgAddRecipe from "@project-assets/madison-is-pretty.png";
import iconCheck from "@project-assets/checked box.svg";

export type FriendRecipeEntry = SavedCommunityRecipeEntry;

function parseAllergyTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function FriendRecipePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipeId: editRecipeId } = useParams<{ recipeId?: string }>();
  const isAddView = location.pathname.endsWith("/add");
  const isEditView = Boolean(editRecipeId);
  const isFormView = isAddView || isEditView;
  const { user } = useAuth();
  const recipesStorageKey = scopedStorageKey(user!.id, FRIEND_RECIPES_STORAGE_BASE);
  const { buddies } = useBuddies();
  const [saved, setSaved] = useState<FriendRecipeEntry[]>(() =>
    sortSavedCommunityRecipesNewestFirst(loadSavedCommunityRecipes(recipesStorageKey))
  );

  useEffect(() => {
    setSaved(sortSavedCommunityRecipesNewestFirst(loadSavedCommunityRecipes(recipesStorageKey)));
  }, [recipesStorageKey, location.pathname]);

  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const [buddyId, setBuddyId] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [allergies, setAllergies] = useState("");
  const [accommodateIds, setAccommodateIds] = useState<AllergenTagId[]>([]);
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>(() => [newIngredientRow()]);
  const [directionRows, setDirectionRows] = useState<string[]>(() => [""]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (buddies.length === 0) return;
    if (!buddyId || !buddies.some((b) => b.id === buddyId)) {
      setBuddyId(buddies[0]!.id);
    }
  }, [buddies, buddyId]);

  useEffect(() => {
    if (isAddView && buddies.length === 0) {
      navigate("/friend-recipe", { replace: true });
    }
  }, [isAddView, buddies.length, navigate]);

  useEffect(() => {
    if (isAddView) {
      setRecipeName("");
      setAllergies("");
      setAccommodateIds([]);
      setIngredientRows([newIngredientRow()]);
      setDirectionRows([""]);
      setNotes("");
      return;
    }
    if (!editRecipeId) return;
    const found = loadSavedCommunityRecipes(recipesStorageKey).find((r) => r.id === editRecipeId);
    if (!found || found.wallRecipeId) {
      navigate("/friend-recipe", { replace: true });
      return;
    }
    setBuddyId(found.buddyId ?? buddies[0]?.id ?? "");
    setRecipeName(found.recipeName);
    setAllergies(found.allergies);
    setAccommodateIds(parseAllergenCsv(found.accommodates ?? ""));
    setIngredientRows(ingredientRowsFromString(found.ingredients));
    setDirectionRows(directionRowsFromString(found.directions));
    setNotes(found.notes);
  }, [isAddView, editRecipeId, navigate, buddies, recipesStorageKey]);

  const selectedBuddy = useMemo(() => buddies.find((b) => b.id === buddyId), [buddies, buddyId]);

  const refresh = useCallback(() => {
    setSaved(sortSavedCommunityRecipesNewestFirst(loadSavedCommunityRecipes(recipesStorageKey)));
  }, [recipesStorageKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ingredients = ingredientsStringFromRows(ingredientRows);
    const directions = directionsStringFromRows(directionRows);
    if (!ingredients.trim() || !directions.trim()) {
      window.alert("Add at least one ingredient line and one direction step.");
      return;
    }

    if (editRecipeId) {
      const list = loadSavedCommunityRecipes(recipesStorageKey);
      const existing = list.find((r) => r.id === editRecipeId);
      if (!existing) {
        navigate("/friend-recipe");
        return;
      }
      if (!selectedBuddy) return;
      const updated: FriendRecipeEntry = {
        ...existing,
        buddyId: selectedBuddy.id,
        friendName: selectedBuddy.name,
        recipeName: recipeName.trim(),
        allergies: allergies.trim(),
        accommodates: formatAllergenCsv(accommodateIds),
        ingredients,
        directions,
        notes: notes.trim(),
        savedAt: new Date().toISOString(),
      };
      persistSavedCommunityRecipes(
        recipesStorageKey,
        list.map((r) => (r.id === editRecipeId ? updated : r))
      );
      refresh();
      setRecipeName("");
      setAllergies("");
      setAccommodateIds([]);
      setIngredientRows([newIngredientRow()]);
      setDirectionRows([""]);
      setNotes("");
      navigate("/friend-recipe");
      return;
    }

    if (!selectedBuddy) return;

    const list = loadSavedCommunityRecipes(recipesStorageKey);
    const row: FriendRecipeEntry = {
      id: `recipe-${Date.now()}`,
      buddyId: selectedBuddy.id,
      friendName: selectedBuddy.name,
      recipeName: recipeName.trim(),
      allergies: allergies.trim(),
      accommodates: formatAllergenCsv(accommodateIds),
      ingredients,
      directions,
      notes: notes.trim(),
      savedAt: new Date().toISOString(),
    };
    list.push(row);
    persistSavedCommunityRecipes(recipesStorageKey, list);
    refresh();
    setRecipeName("");
    setAllergies("");
    setAccommodateIds([]);
    setIngredientRows([newIngredientRow()]);
    setDirectionRows([""]);
    setNotes("");
    navigate("/friend-recipe");
  };

  const handleRemove = (entry: FriendRecipeEntry) => {
    if (!confirm(`Are you sure you want to remove "${entry.recipeName}" from your saved recipes?`)) return;
    persistSavedCommunityRecipes(
      recipesStorageKey,
      loadSavedCommunityRecipes(recipesStorageKey).filter((r) => r.id !== entry.id)
    );
    refresh();
    setExpandedRecipeId((cur) => (cur === entry.id ? null : cur));
  };

  if (isFormView) {
    if (isAddView && buddies.length === 0) return null;

    const formHelp = isEditView
      ? "Update who shared it, tags, or steps — then save."
      : "Credit a saved taste profile — pick them below, then add ingredients, steps, and tags.";

    return (
      <div className={PAGE_SHELL_SCROLL}>
        <StickyTopChrome helpContent={formHelp} />

        <motion.div
          className="tb-main-column"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h1
            className="tb-page-title share-tech-bold tb-text-coral"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            {isEditView ? "Edit saved recipe" : "Add a recipe by hand"}
          </motion.h1>

          <motion.form
            onSubmit={handleSubmit}
            className="tb-form-narrow"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <InfoBoxFrame variant={0}>
              <label htmlFor="recipe-buddy" className="tb-field-label-bold share-tech-bold">
                From this profile
              </label>
              <select
                id="recipe-buddy"
                value={buddyId}
                onChange={(e) => setBuddyId(e.target.value)}
                className="tb-select-plain share-tech-regular"
                required
              >
                {buddies.map((b) => (
                  <option key={b.id} value={b.id} className="tb-option-dark">
                    {b.name}
                  </option>
                ))}
              </select>
            </InfoBoxFrame>

            <InfoBoxFrame variant={1}>
              <label htmlFor="recipe-title" className="tb-field-label-bold share-tech-bold">
                Recipe name
              </label>
              <input
                id="recipe-title"
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="tb-input-plain share-tech-regular"
                placeholder="e.g. Grandma soup, Tuesday tacos"
                required
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={2}>
              <AllergenIconPicker
                mode="accommodates"
                selected={accommodateIds}
                onChange={setAccommodateIds}
                groupLabel="Free from (recipe accommodates)"
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={3}>
              <label htmlFor="recipe-allergies" className="tb-field-label-bold share-tech-bold">
                Contains / may contain (optional notes)
              </label>
              <textarea
                id="recipe-allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="tb-textarea-plain share-tech-regular tb-may-contain-input"
                placeholder="e.g. traces of nuts"
                rows={3}
              />
            </InfoBoxFrame>

            <RecipeIngredientDirectionFields
              ingredientRows={ingredientRows}
              onIngredientRowsChange={setIngredientRows}
              directionRows={directionRows}
              onDirectionRowsChange={setDirectionRows}
            />

            <InfoBoxFrame variant={1}>
              <label htmlFor="recipe-notes" className="tb-field-label-bold share-tech-bold">
                Extra notes (optional)
              </label>
              <textarea
                id="recipe-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="tb-textarea-plain share-tech-regular"
                placeholder="Substitutions, tricks, what to serve with…"
                rows={3}
              />
            </InfoBoxFrame>

            <motion.button type="submit" className="tb-submit-wrap" whileTap={{ scale: 0.97 }}>
              <ChalkPillFrame variant={1} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--lg">
                <span className="tb-pill-text-white share-tech-regular">
                  {isEditView ? "Save changes" : "Save recipe"}
                </span>
              </ChalkPillFrame>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => navigate("/friend-recipe")}
              className="tb-link-cancel share-tech-bold tb-text-coral"
              whileHover={{ opacity: 0.7 }}
              whileTap={{ scale: 0.95 }}
            >
              Cancel
            </motion.button>
          </motion.form>
        </motion.div>
      </div>
    );
  }

  const savedListHelp =
    "Tap a card to open a recipe. Board saves show who posted — use + to add your own and tag a buddy profile.";

  return (
    <div className={PAGE_SHELL_SCROLL}>
      <StickyTopChrome helpContent={savedListHelp} />

      <motion.div
        className="tb-main-column"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.img
          alt=""
          src={iconCheck}
          draggable={false}
          className="tb-hero-decor-saved-check"
          style={{ transformOrigin: "50% 80%" }}
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.02 }}
          whileHover={{ rotate: [0, -12, 6, -4, 0], transition: { duration: 0.55 } }}
        />

        <motion.h1
          className="tb-page-title tb-page-title--roomy share-tech-bold tb-text-coral"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          Saved from the board
        </motion.h1>

        <motion.section
          className="tb-section-narrow"
          aria-labelledby="saved-recipes-heading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <h2 id="saved-recipes-heading" className="tb-section-heading share-tech-bold tb-text-coral">
            Your list
          </h2>
          {saved.length === 0 ? (
            <InfoBoxFrame variant={1}>
              <p className="share-tech-regular" style={{ fontSize: "20pt", lineHeight: 1.375 }}>
                Nothing saved yet — open the Buddy Board and tap the check on a recipe, or{" "}
                {buddies.length > 0
                  ? "tap + to add a recipe and tag a buddy profile."
                  : "add a buddy under Saved buddies, then tap + to save a recipe for them."}
              </p>
            </InfoBoxFrame>
          ) : (
            <ul className="tb-saved-list">
              {saved.map((r, i) => {
                const isExpanded = expandedRecipeId === r.id;
                const allergyList = parseAllergyTags(r.allergies);
                const accIds = parseAllergenCsv(r.accommodates ?? "");
                return (
                  <li key={r.id} className="tb-li-relative">
                    <div className="tb-card-relative">
                      <InfoBoxFrame variant={i % 4}>
                        {isExpanded ? (
                          <>
                            {r.recipe_photo && r.recipe_photo.startsWith("data:image/") ? (
                              <img
                                src={r.recipe_photo}
                                alt=""
                                className="tb-wall-recipe-photo tb-wall-recipe-photo--in-card"
                                draggable={false}
                              />
                            ) : null}
                            <h3 className="tb-recipe-h3 tb-recipe-h3--pad share-tech-bold">{r.recipeName}</h3>
                            {accIds.length > 0 ? (
                              <>
                                <p className="tb-panel-heading--spaced share-tech-bold">Free from</p>
                                <AllergenBadgeRow
                                  mode="accommodates"
                                  ids={accIds}
                                  ariaLabel="Recipe is free from"
                                />
                              </>
                            ) : null}
                            {allergyList.length > 0 ? (
                              <>
                                <p className="tb-panel-heading--spaced share-tech-bold">Contains / warnings</p>
                                <ul className="tb-allergy-list tb-allergy-list--pad" aria-label="Allergen notes">
                                  {allergyList.map((tag, ti) => (
                                    <li key={`${r.id}-allergy-${ti}`} className="tb-allergy-pill share-tech-bold">
                                      {tag}
                                    </li>
                                  ))}
                                </ul>
                              </>
                            ) : null}
                            <p className="tb-from-row">
                              <span className="share-tech-bold tb-text-panel">From · </span>
                              <span className="share-tech-regular">{r.friendName}</span>
                            </p>
                            {r.ingredients ? (
                              <div className="tb-recipe-body">
                                <p className="tb-recipe-block-label share-tech-bold">Ingredients</p>
                                <p className="tb-pre-wrap share-tech-regular">{r.ingredients}</p>
                              </div>
                            ) : null}
                            {r.directions ? (
                              <div className="tb-recipe-body">
                                <p className="tb-recipe-block-label share-tech-bold">Directions</p>
                                <p className="tb-pre-wrap share-tech-regular">{r.directions}</p>
                              </div>
                            ) : null}
                            {r.notes ? (
                              <div className="tb-recipe-body">
                                <p className="tb-recipe-block-label share-tech-bold">Notes</p>
                                <p className="tb-pre-wrap share-tech-regular">{r.notes}</p>
                              </div>
                            ) : null}
                            <div className="tb-recipe-actions">
                              {!r.wallRecipeId ? (
                                <motion.button
                                  type="button"
                                  className="tb-submit-wrap"
                                  onClick={() => navigate(`/friend-recipe/edit/${r.id}`)}
                                  whileTap={{ scale: 0.97 }}
                                >
                                  <ChalkPillFrame
                                    variant={(i + 1) % 4}
                                    fillClassName="tb-pill-fill-coral"
                                    innerClassName="tb-pill-inner tb-pill-inner--md"
                                  >
                                    <span className="tb-pill-text-white--sm share-tech-regular">Edit</span>
                                  </ChalkPillFrame>
                                </motion.button>
                              ) : null}
                              <motion.button
                                type="button"
                                onClick={() => handleRemove(r)}
                                className="tb-icon-btn"
                                aria-label={`Remove ${r.recipeName}`}
                                whileHover={{ scale: 1.06, opacity: 0.88 }}
                                whileTap={{ scale: 0.94 }}
                              >
                                <img alt="" src={imgTrashDelete} draggable={false} className="tb-recipe-x-icon" />
                              </motion.button>
                            </div>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="tb-expand-hit"
                            aria-expanded={false}
                            onClick={() => setExpandedRecipeId(r.id)}
                          >
                            <h3 className="tb-recipe-h3 tb-recipe-h3--pad share-tech-bold">{r.recipeName}</h3>
                            {accIds.length > 0 ? (
                              <AllergenBadgeRow
                                mode="accommodates"
                                ids={accIds}
                                ariaLabel="Recipe is free from"
                              />
                            ) : null}
                            {allergyList.length > 0 ? (
                              <ul className="tb-allergy-list tb-allergy-list--collapsed" aria-label="Allergen notes">
                                {allergyList.map((tag, ti) => (
                                  <li key={`${r.id}-allergy-${ti}`} className="tb-allergy-pill share-tech-bold">
                                    {tag}
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            <p className="tb-from-row--collapsed">
                              <span className="share-tech-bold tb-text-panel">From · </span>
                              <span className="share-tech-regular tb-opacity-90">{r.friendName}</span>
                            </p>
                            <p className="share-tech-regular tb-recipe-card-hint">Tap to open recipe</p>
                          </button>
                        )}
                      </InfoBoxFrame>
                      {isExpanded ? (
                        <motion.button
                          type="button"
                          onClick={() => setExpandedRecipeId(null)}
                          className="tb-chevron-btn"
                          aria-label="Close recipe"
                          whileHover={{ opacity: 0.75 }}
                          whileTap={{ scale: 0.94 }}
                        >
                          <img alt="" src={imgRecipeClose} draggable={false} className="tb-recipe-x-icon" aria-hidden />
                        </motion.button>
                      ) : (
                        <motion.button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRemove(r);
                          }}
                          className="tb-chevron-btn"
                          aria-label={`Remove ${r.recipeName} from saved`}
                          whileHover={{ scale: 1.06, opacity: 0.88 }}
                          whileTap={{ scale: 0.94 }}
                        >
                          <img alt="" src={imgTrashDelete} draggable={false} className="tb-recipe-x-icon" aria-hidden />
                        </motion.button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.section>

        {buddies.length > 0 ? (
          <motion.button
            type="button"
            onClick={() => navigate("/friend-recipe/add")}
            className="tb-fab-add"
            aria-label="Add a recipe by hand"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <img alt="" className="tb-img-contain-full" src={imgAddRecipe} draggable={false} />
          </motion.button>
        ) : null}
      </motion.div>
    </div>
  );
}

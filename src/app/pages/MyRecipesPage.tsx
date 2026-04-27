import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import { MY_RECIPES_STORAGE_BASE, scopedStorageKey } from "../userStorage";
import GrayTasteHeader from "../components/GrayTasteHeader";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { PAGE_INTRO_BLURB_TEXT, PAGE_SHELL_SCROLL } from "../brand";
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
import { compressImageFileToDataUrl } from "../recipePhoto";
import imgRecipeClose from "@project-assets/X.svg";
import imgTrashDelete from "@project-assets/Trash.svg";
import imgAddRecipe from "@project-assets/madison-is-pretty.png";
import imgYourRecipesHat from "@project-assets/thick hat.png";

const LEGACY_MY_RECIPES_KEY = "tasteBuddyMyRecipes";

export type MyRecipeEntry = {
  id: string;
  recipeName: string;
  allergies: string;
  /** Comma-separated allergen ids this recipe avoids (free-from). */
  accommodates?: string;
  ingredients: string;
  directions: string;
  notes: string;
  /** Compressed JPEG data URL; included when you post the recipe to the taste wall. */
  recipe_photo?: string;
  savedAt: string;
};

function parseAllergyTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function loadRecipes(storageKey: string): MyRecipeEntry[] {
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
          !!row &&
          typeof row === "object" &&
          typeof (row as MyRecipeEntry).id === "string"
      )
      .map((row) => {
        const m = row as MyRecipeEntry & { recipe_photo?: unknown };
        const recipe_photo =
          typeof m.recipe_photo === "string" && m.recipe_photo.startsWith("data:image/") ? m.recipe_photo : undefined;
        const { recipe_photo: _drop, ...rest } = m;
        return {
          ...rest,
          allergies: typeof row.allergies === "string" ? row.allergies : "",
          accommodates: typeof (row as MyRecipeEntry).accommodates === "string" ? (row as MyRecipeEntry).accommodates : "",
          ...(recipe_photo ? { recipe_photo } : {}),
        };
      });
  } catch {
    return [];
  }
}

function sortNewestFirst(list: MyRecipeEntry[]) {
  return [...list].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

function persistRecipes(storageKey: string, list: MyRecipeEntry[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(list));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      window.alert(
        "Could not save — browser storage is full. Try a smaller photo, or remove old recipes from this device."
      );
      throw e;
    }
    throw e;
  }
}

export { loadRecipes as loadMyRecipeEntries, sortNewestFirst as sortMyRecipesNewestFirst };

export default function MyRecipesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { recipeId: editRecipeId } = useParams<{ recipeId?: string }>();
  const isAddView = location.pathname.endsWith("/add");
  const isEditView = Boolean(editRecipeId);
  const isFormView = isAddView || isEditView;

  const { user } = useAuth();
  const myRecipesStorageKey = scopedStorageKey(user!.id, MY_RECIPES_STORAGE_BASE);

  const [saved, setSaved] = useState<MyRecipeEntry[]>(() => sortNewestFirst(loadRecipes(myRecipesStorageKey)));

  useEffect(() => {
    setSaved(sortNewestFirst(loadRecipes(myRecipesStorageKey)));
  }, [myRecipesStorageKey]);

  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const [recipeName, setRecipeName] = useState("");
  const [allergies, setAllergies] = useState("");
  const [accommodateIds, setAccommodateIds] = useState<AllergenTagId[]>([]);
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>(() => [newIngredientRow()]);
  const [directionRows, setDirectionRows] = useState<string[]>(() => [""]);
  const [notes, setNotes] = useState("");
  const [recipePhoto, setRecipePhoto] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setSaved(sortNewestFirst(loadRecipes(myRecipesStorageKey)));
  }, [myRecipesStorageKey]);

  useEffect(() => {
    if (isAddView) {
      setRecipeName("");
      setAllergies("");
      setAccommodateIds([]);
      setIngredientRows([newIngredientRow()]);
      setDirectionRows([""]);
      setNotes("");
      setRecipePhoto(null);
      return;
    }
    if (!editRecipeId) return;
    const found = loadRecipes(myRecipesStorageKey).find((r) => r.id === editRecipeId);
    if (!found) {
      navigate("/my-recipes", { replace: true });
      return;
    }
    setRecipeName(found.recipeName);
    setAllergies(found.allergies);
    setAccommodateIds(parseAllergenCsv(found.accommodates ?? ""));
    setIngredientRows(ingredientRowsFromString(found.ingredients));
    setDirectionRows(directionRowsFromString(found.directions));
    setNotes(found.notes);
    setRecipePhoto(
      found.recipe_photo && found.recipe_photo.startsWith("data:image/") ? found.recipe_photo : null
    );
  }, [isAddView, editRecipeId, navigate, myRecipesStorageKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ingredients = ingredientsStringFromRows(ingredientRows);
    const directions = directionsStringFromRows(directionRows);
    if (!ingredients.trim() || !directions.trim()) {
      window.alert("Add at least one ingredient line and one direction step.");
      return;
    }
    if (editRecipeId) {
      const list = loadRecipes(myRecipesStorageKey);
      const existing = list.find((r) => r.id === editRecipeId);
      if (!existing) {
        navigate("/my-recipes");
        return;
      }
      const updated: MyRecipeEntry = {
        ...existing,
        recipeName: recipeName.trim(),
        allergies: allergies.trim(),
        accommodates: formatAllergenCsv(accommodateIds),
        ingredients,
        directions,
        notes: notes.trim(),
        savedAt: new Date().toISOString(),
      };
      if (recipePhoto && recipePhoto.startsWith("data:image/")) updated.recipe_photo = recipePhoto;
      else delete updated.recipe_photo;
      try {
        persistRecipes(myRecipesStorageKey, list.map((r) => (r.id === editRecipeId ? updated : r)));
      } catch {
        return;
      }
      refresh();
      setRecipeName("");
      setAllergies("");
      setAccommodateIds([]);
      setIngredientRows([newIngredientRow()]);
      setDirectionRows([""]);
      setNotes("");
      setRecipePhoto(null);
      navigate("/my-recipes");
      return;
    }
    const list = loadRecipes(myRecipesStorageKey);
    const row: MyRecipeEntry = {
      id: `my-recipe-${Date.now()}`,
      recipeName: recipeName.trim(),
      allergies: allergies.trim(),
      accommodates: formatAllergenCsv(accommodateIds),
      ingredients,
      directions,
      notes: notes.trim(),
      savedAt: new Date().toISOString(),
    };
    if (recipePhoto && recipePhoto.startsWith("data:image/")) row.recipe_photo = recipePhoto;
    list.push(row);
    try {
      persistRecipes(myRecipesStorageKey, list);
    } catch {
      list.pop();
      return;
    }
    refresh();
    setRecipeName("");
    setAllergies("");
    setAccommodateIds([]);
    setIngredientRows([newIngredientRow()]);
    setDirectionRows([""]);
    setNotes("");
    setRecipePhoto(null);
    navigate("/my-recipes");
  };

  const handleRemove = (entry: MyRecipeEntry) => {
    if (!confirm(`Are you sure you want to remove "${entry.recipeName}" from your recipes?`)) return;
    persistRecipes(myRecipesStorageKey, loadRecipes(myRecipesStorageKey).filter((r) => r.id !== entry.id));
    refresh();
    setExpandedRecipeId((cur) => (cur === entry.id ? null : cur));
  };

  if (isFormView) {
    return (
      <div className={PAGE_SHELL_SCROLL}>
        <GrayTasteHeader />
        <Navigation />

        <motion.div
          className="tb-main-column"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.img
            alt=""
            src={imgYourRecipesHat}
            draggable={false}
            className="tb-hero-decor-hat"
            style={{ transformOrigin: "50% 80%" }}
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.02 }}
            whileHover={{ rotate: [0, -12, 6, -4, 0], transition: { duration: 0.55 } }}
          />

          <motion.h1
            className="tb-page-title share-tech-bold tb-text-coral"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            {isEditView ? "Edit recipe" : "Add a recipe"}
          </motion.h1>
          <motion.p
            className="tb-intro-blurb share-tech-regular"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            {isEditView
              ? "Update lines (one ingredient per row, numbered steps) — then save."
              : "List ingredients with checkboxes, then numbered steps — Whisk will use them for cook mode."}
          </motion.p>

          <motion.form
            onSubmit={handleSubmit}
            className="tb-form-narrow"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <InfoBoxFrame variant={0}>
              <label htmlFor="my-recipe-title" className="tb-field-label-bold share-tech-bold">
                Recipe name
              </label>
              <input
                id="my-recipe-title"
                type="text"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
                className="tb-input-plain share-tech-regular"
                placeholder="What do you call this dish?"
                required
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={1}>
              <AllergenIconPicker
                mode="accommodates"
                selected={accommodateIds}
                onChange={setAccommodateIds}
                groupLabel="Free from (recipe accommodates)"
              />
              <label htmlFor="my-recipe-allergies" className="tb-field-label-bold share-tech-bold">
                Contains / may contain (optional notes)
              </label>
              <input
                id="my-recipe-allergies"
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="tb-input-plain share-tech-regular"
                placeholder="e.g. traces of nuts — for label warnings"
              />
            </InfoBoxFrame>

            <RecipeIngredientDirectionFields
              ingredientRows={ingredientRows}
              onIngredientRowsChange={setIngredientRows}
              directionRows={directionRows}
              onDirectionRowsChange={setDirectionRows}
            />

            <InfoBoxFrame variant={1}>
              <p className="tb-field-label-bold share-tech-bold">Recipe photo (optional)</p>
              <p className="tb-recipe-lines-hint share-tech-regular">
                Appears on the Buddy Board when you post this recipe from your profile. Large images are resized automatically.
              </p>
              {recipePhoto ? (
                <div className="tb-recipe-photo-preview-wrap">
                  <img src={recipePhoto} alt="" className="tb-recipe-photo-preview" draggable={false} />
                  <motion.button
                    type="button"
                    className="tb-recipe-photo-remove share-tech-bold"
                    onClick={() => setRecipePhoto(null)}
                    whileTap={{ scale: 0.97 }}
                  >
                    Remove photo
                  </motion.button>
                </div>
              ) : null}
              <label className="tb-recipe-photo-file-label share-tech-bold">
                <span className="tb-recipe-photo-file-btn share-tech-regular">Choose image</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="tb-visually-hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    const url = await compressImageFileToDataUrl(f);
                    if (!url) {
                      window.alert("Could not use that image. Try a JPG or PNG under 12 MB.");
                      return;
                    }
                    setRecipePhoto(url);
                  }}
                />
              </label>
            </InfoBoxFrame>

            <InfoBoxFrame variant={0}>
              <label htmlFor="my-recipe-notes" className="tb-field-label-bold share-tech-bold">
                Notes (optional)
              </label>
              <textarea
                id="my-recipe-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="tb-textarea-plain share-tech-regular"
                placeholder="Timing tips, sides, tweaks for next time…"
                rows={3}
              />
            </InfoBoxFrame>

            <motion.button type="submit" className="tb-submit-wrap" whileTap={{ scale: 0.97 }}>
              <ChalkPillFrame variant={0} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--lg">
                <span className="tb-pill-text-white share-tech-regular">
                  {isEditView ? "Save changes" : "Save recipe"}
                </span>
              </ChalkPillFrame>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => navigate("/my-recipes")}
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

  return (
    <div className={PAGE_SHELL_SCROLL}>
      <GrayTasteHeader />
      <Navigation />

      <motion.div
        className="tb-main-column"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.img
          alt=""
          src={imgYourRecipesHat}
          draggable={false}
          className="tb-hero-decor-hat"
          style={{ transformOrigin: "50% 80%" }}
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.02 }}
          whileHover={{ rotate: [0, -12, 6, -4, 0], transition: { duration: 0.55 } }}
        />

        <motion.h1
          className="tb-page-title share-tech-bold tb-text-coral"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          Your recipes
        </motion.h1>
        <motion.p
          className="tb-intro-blurb share-tech-regular"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          Tap a recipe to open it, or + to add a new one.
        </motion.p>

        <motion.section
          className="tb-section-narrow"
          aria-labelledby="my-saved-recipes-heading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <h2 id="my-saved-recipes-heading" className="tb-section-heading share-tech-bold tb-text-coral">
            Saved recipes
          </h2>
          {saved.length === 0 ? (
            <InfoBoxFrame variant={1}>
              <p className="share-tech-regular" style={{ fontSize: "20pt", lineHeight: 1.375 }}>
                Nothing here yet — tap + below to add your first recipe.
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
                              <motion.button
                                type="button"
                                className="tb-submit-wrap"
                                onClick={() => navigate(`/my-recipes/edit/${r.id}`)}
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
                            <div className="tb-recipe-collapsed-title-row">
                              {r.recipe_photo && r.recipe_photo.startsWith("data:image/") ? (
                                <img
                                  src={r.recipe_photo}
                                  alt=""
                                  className="tb-recipe-thumb-collapsed"
                                  draggable={false}
                                />
                              ) : null}
                              <h3 className="tb-recipe-h3 share-tech-bold">{r.recipeName}</h3>
                            </div>
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
                            <p
                              className="share-tech-regular"
                              style={{ fontSize: "20pt", lineHeight: 1.375, color: PAGE_INTRO_BLURB_TEXT, opacity: 0.75 }}
                            >
                              Tap to open recipe
                            </p>
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
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </motion.section>

        <motion.button
          type="button"
          onClick={() => navigate("/my-recipes/add")}
          className="tb-fab-add"
          aria-label="Add a recipe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img alt="" className="tb-img-contain-full" src={imgAddRecipe} draggable={false} />
        </motion.button>
      </motion.div>
    </div>
  );
}

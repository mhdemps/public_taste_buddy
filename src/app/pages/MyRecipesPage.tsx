import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import Navigation from "../components/Navigation";
import { MY_RECIPES_STORAGE_BASE, scopedStorageKey } from "../userStorage";
import GrayTasteHeader from "../components/GrayTasteHeader";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import {
  INFO_PANEL_TEXT,
  PAGE_INTRO_BLURB_TEXT,
  PAGE_SHELL_SCROLL,
} from "../brand";
import imgRemoveRecipe from "@project-assets/party-remove-x.png";
import imgAddRecipe from "@project-assets/madison-is-pretty.png";
import imgYourRecipesHat from "@project-assets/thick hat.png";

const LEGACY_MY_RECIPES_KEY = "tasteBuddyMyRecipes";

export type MyRecipeEntry = {
  id: string;
  recipeName: string;
  allergies: string;
  ingredients: string;
  directions: string;
  notes: string;
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
      .map((row) => ({
        ...row,
        allergies: typeof row.allergies === "string" ? row.allergies : "",
      }));
  } catch {
    return [];
  }
}

function sortNewestFirst(list: MyRecipeEntry[]) {
  return [...list].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

function persistRecipes(storageKey: string, list: MyRecipeEntry[]) {
  localStorage.setItem(storageKey, JSON.stringify(list));
}

export default function MyRecipesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { recipeId: editRecipeId } = useParams<{ recipeId?: string }>();
  const isAddView = location.pathname.endsWith("/add");
  const isEditView = Boolean(editRecipeId);
  const isFormView = isAddView || isEditView;

  const { session } = useAuth();
  const myRecipesStorageKey = scopedStorageKey(session!.user.id, MY_RECIPES_STORAGE_BASE);

  const [saved, setSaved] = useState<MyRecipeEntry[]>(() => sortNewestFirst(loadRecipes(myRecipesStorageKey)));

  useEffect(() => {
    setSaved(sortNewestFirst(loadRecipes(myRecipesStorageKey)));
  }, [myRecipesStorageKey]);

  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const [recipeName, setRecipeName] = useState("");
  const [allergies, setAllergies] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [directions, setDirections] = useState("");
  const [notes, setNotes] = useState("");

  const refresh = useCallback(() => {
    setSaved(sortNewestFirst(loadRecipes(myRecipesStorageKey)));
  }, [myRecipesStorageKey]);

  useEffect(() => {
    if (isAddView) {
      setRecipeName("");
      setAllergies("");
      setIngredients("");
      setDirections("");
      setNotes("");
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
    setIngredients(found.ingredients);
    setDirections(found.directions);
    setNotes(found.notes);
  }, [isAddView, editRecipeId, navigate, myRecipesStorageKey]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        ingredients: ingredients.trim(),
        directions: directions.trim(),
        notes: notes.trim(),
        savedAt: new Date().toISOString(),
      };
      persistRecipes(myRecipesStorageKey, list.map((r) => (r.id === editRecipeId ? updated : r)));
      refresh();
      setRecipeName("");
      setAllergies("");
      setIngredients("");
      setDirections("");
      setNotes("");
      navigate("/my-recipes");
      return;
    }
    const list = loadRecipes(myRecipesStorageKey);
    const row: MyRecipeEntry = {
      id: `my-recipe-${Date.now()}`,
      recipeName: recipeName.trim(),
      allergies: allergies.trim(),
      ingredients: ingredients.trim(),
      directions: directions.trim(),
      notes: notes.trim(),
      savedAt: new Date().toISOString(),
    };
    list.push(row);
    persistRecipes(myRecipesStorageKey, list);
    refresh();
    setRecipeName("");
    setAllergies("");
    setIngredients("");
    setDirections("");
    setNotes("");
    navigate("/my-recipes");
  };

  const handleRemove = (entry: MyRecipeEntry) => {
    if (!confirm(`Remove "${entry.recipeName}" from your recipes?`)) return;
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
            style={{ transformOrigin: "50% 100%" }}
            whileHover={{ rotate: -10 }}
            initial={{ scale: 0.88, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.02 }}
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
              ? "Update ingredients, steps, or notes — then save."
              : "Save ingredients, steps, and notes you want to keep."}
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
              <label htmlFor="my-recipe-allergies" className="tb-field-label-bold share-tech-bold">
                Allergy tags (optional)
              </label>
              <input
                id="my-recipe-allergies"
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="tb-input-plain share-tech-regular"
                placeholder="e.g. nuts, dairy — comma-separated"
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={2}>
              <label htmlFor="my-recipe-ingredients" className="tb-field-label-bold share-tech-bold">
                Ingredients &amp; amounts
              </label>
              <textarea
                id="my-recipe-ingredients"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="tb-textarea-plain share-tech-regular"
                placeholder="Everything that goes in"
                rows={5}
                required
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={3}>
              <label htmlFor="my-recipe-directions" className="tb-field-label-bold share-tech-bold">
                Directions
              </label>
              <textarea
                id="my-recipe-directions"
                value={directions}
                onChange={(e) => setDirections(e.target.value)}
                className="tb-textarea-plain share-tech-regular"
                placeholder="How you make it"
                rows={6}
                required
              />
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
          style={{ transformOrigin: "50% 100%" }}
          whileHover={{ rotate: -10 }}
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.02 }}
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
                return (
                  <li key={r.id} className="tb-li-relative">
                    <div className="tb-card-relative">
                      <InfoBoxFrame variant={i % 4}>
                        {isExpanded ? (
                          <>
                            <h3 className="tb-recipe-h3 tb-recipe-h3--pad share-tech-bold">{r.recipeName}</h3>
                            {allergyList.length > 0 ? (
                              <>
                                <p className="tb-panel-heading--spaced share-tech-bold">Allergies</p>
                                <ul className="tb-allergy-list tb-allergy-list--pad" aria-label="Allergens">
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
                                <img alt="" src={imgRemoveRecipe} draggable={false} className="tb-icon-x-img" />
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
                            <h3 className="tb-recipe-h3 share-tech-bold">{r.recipeName}</h3>
                            {allergyList.length > 0 ? (
                              <ul className="tb-allergy-list tb-allergy-list--collapsed" aria-label="Allergens">
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
                          aria-label="Minimize recipe"
                          whileHover={{ opacity: 0.75 }}
                          whileTap={{ scale: 0.94 }}
                        >
                          <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden
                            className="tb-shrink-0"
                          >
                            <path
                              d="M6 14l6-6 6 6"
                              stroke={INFO_PANEL_TEXT}
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
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

import { useNavigate, useLocation, useParams } from "react-router";
import { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { useBuddies } from "../context/BuddiesContext";
import Navigation from "../components/Navigation";
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
import imgBuddyRecipeHero from "@project-assets/sunny.png";

const STORAGE_KEY = "tasteBuddyFriendRecipes";

export type FriendRecipeEntry = {
  id: string;
  buddyId?: string;
  friendName: string;
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

function loadRecipes(): FriendRecipeEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is FriendRecipeEntry =>
          !!row &&
          typeof row === "object" &&
          typeof (row as FriendRecipeEntry).id === "string"
      )
      .map((row) => ({
        ...row,
        allergies: typeof row.allergies === "string" ? row.allergies : "",
      }));
  } catch {
    return [];
  }
}

function sortNewestFirst(list: FriendRecipeEntry[]) {
  return [...list].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}

function persistRecipes(list: FriendRecipeEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export default function FriendRecipePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recipeId: editRecipeId } = useParams<{ recipeId?: string }>();
  const isAddView = location.pathname.endsWith("/add");
  const isEditView = Boolean(editRecipeId);
  const isFormView = isAddView || isEditView;
  const { buddies } = useBuddies();
  const [saved, setSaved] = useState<FriendRecipeEntry[]>(() => sortNewestFirst(loadRecipes()));

  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const [buddyId, setBuddyId] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [allergies, setAllergies] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [directions, setDirections] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (buddies.length === 0) return;
    if (!buddyId || !buddies.some((b) => b.id === buddyId)) {
      setBuddyId(buddies[0]!.id);
    }
  }, [buddies, buddyId]);

  useEffect(() => {
    if (isFormView && buddies.length === 0) {
      navigate("/friend-recipe", { replace: true });
    }
  }, [isFormView, buddies.length, navigate]);

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
    const found = loadRecipes().find((r) => r.id === editRecipeId);
    if (!found) {
      navigate("/friend-recipe", { replace: true });
      return;
    }
    setBuddyId(found.buddyId ?? (buddies[0]?.id ?? ""));
    setRecipeName(found.recipeName);
    setAllergies(found.allergies);
    setIngredients(found.ingredients);
    setDirections(found.directions);
    setNotes(found.notes);
  }, [isAddView, editRecipeId, navigate, buddies]);

  const selectedBuddy = useMemo(() => buddies.find((b) => b.id === buddyId), [buddies, buddyId]);

  const refresh = useCallback(() => {
    setSaved(sortNewestFirst(loadRecipes()));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBuddy) return;

    if (editRecipeId) {
      const list = loadRecipes();
      const existing = list.find((r) => r.id === editRecipeId);
      if (!existing) {
        navigate("/friend-recipe");
        return;
      }
      const updated: FriendRecipeEntry = {
        ...existing,
        buddyId: selectedBuddy.id,
        friendName: selectedBuddy.name,
        recipeName: recipeName.trim(),
        allergies: allergies.trim(),
        ingredients: ingredients.trim(),
        directions: directions.trim(),
        notes: notes.trim(),
        savedAt: new Date().toISOString(),
      };
      persistRecipes(list.map((r) => (r.id === editRecipeId ? updated : r)));
      refresh();
      setRecipeName("");
      setAllergies("");
      setIngredients("");
      setDirections("");
      setNotes("");
      navigate("/friend-recipe");
      return;
    }

    const list = loadRecipes();
    const row: FriendRecipeEntry = {
      id: `recipe-${Date.now()}`,
      buddyId: selectedBuddy.id,
      friendName: selectedBuddy.name,
      recipeName: recipeName.trim(),
      allergies: allergies.trim(),
      ingredients: ingredients.trim(),
      directions: directions.trim(),
      notes: notes.trim(),
      savedAt: new Date().toISOString(),
    };
    list.push(row);
    persistRecipes(list);
    refresh();
    setRecipeName("");
    setAllergies("");
    setIngredients("");
    setDirections("");
    setNotes("");
    navigate("/friend-recipe");
  };

  const handleRemove = (entry: FriendRecipeEntry) => {
    if (!confirm(`Remove "${entry.recipeName}" from your saved community recipes?`)) return;
    persistRecipes(loadRecipes().filter((r) => r.id !== entry.id));
    refresh();
    setExpandedRecipeId((cur) => (cur === entry.id ? null : cur));
  };

  if (isFormView && buddies.length > 0) {
    return (
      <div className={PAGE_SHELL_SCROLL}>
        <GrayTasteHeader />

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
            {isEditView ? "Edit community recipe" : "Add a community recipe"}
          </motion.h1>
          <motion.p
            className="tb-intro-blurb share-tech-regular"
            style={{ color: PAGE_INTRO_BLURB_TEXT }}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            {isEditView
              ? "Update who shared it, tags, or steps — then save."
              : "Credit whose profile it came from — pick them below, then ingredients, steps, and tags."}
          </motion.p>

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
              <label htmlFor="recipe-allergies" className="tb-field-label-bold share-tech-bold">
                Allergy tags (optional)
              </label>
              <input
                id="recipe-allergies"
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="tb-input-plain share-tech-regular"
                placeholder="e.g. nuts, gluten — comma-separated"
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={3}>
              <label htmlFor="recipe-ingredients" className="tb-field-label-bold share-tech-bold">
                Ingredients &amp; amounts
              </label>
              <textarea
                id="recipe-ingredients"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="tb-textarea-plain share-tech-regular"
                placeholder="List what goes in, as they told you"
                rows={5}
                required
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={0}>
              <label htmlFor="recipe-directions" className="tb-field-label-bold share-tech-bold">
                Directions
              </label>
              <textarea
                id="recipe-directions"
                value={directions}
                onChange={(e) => setDirections(e.target.value)}
                className="tb-textarea-plain share-tech-regular"
                placeholder="Prep, cook times, order of steps…"
                rows={6}
                required
              />
            </InfoBoxFrame>

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

        <Navigation />
      </div>
    );
  }

  return (
    <div className={PAGE_SHELL_SCROLL}>
      <GrayTasteHeader />

      <motion.div
        className="tb-main-column"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.img
          alt=""
          src={imgBuddyRecipeHero}
          draggable={false}
          className="tb-hero-decor-party"
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.02 }}
        />

        <motion.h1
          className="tb-page-title tb-page-title--roomy share-tech-bold tb-text-coral"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          Community recipe swap
        </motion.h1>
        <motion.p
          className="tb-intro-blurb share-tech-regular"
          style={{ color: PAGE_INTRO_BLURB_TEXT }}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.12 }}
        >
          Recipes people have shared — tap to open, or + to save one and tag a public profile.
        </motion.p>

        {buddies.length === 0 ? (
          <motion.div
            className="tb-empty-block--friend"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            <InfoBoxFrame variant={0}>
              <p className="share-tech-regular" style={{ fontSize: 18, lineHeight: 1.375 }}>
                Add someone to Community first so you can tag their profile on shared recipes.
              </p>
            </InfoBoxFrame>
            <motion.button
              type="button"
              onClick={() => navigate("/add-buddy")}
              className="tb-link-wide share-tech-bold"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Add a taste profile
            </motion.button>
          </motion.div>
        ) : null}

        <motion.section
          className="tb-section-narrow"
          aria-labelledby="saved-recipes-heading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <h2 id="saved-recipes-heading" className="tb-section-heading share-tech-bold tb-text-coral">
            Saved from the community
          </h2>
          {saved.length === 0 ? (
            <InfoBoxFrame variant={1}>
              <p className="share-tech-regular" style={{ fontSize: 18, lineHeight: 1.375 }}>
                {buddies.length === 0
                  ? "Nothing saved yet — add a profile in Community, then tap + for your first recipe."
                  : "Nothing here yet — tap + below to save a recipe and link it to someone’s profile."}
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
                            <p className="tb-from-row--collapsed">
                              <span className="share-tech-bold tb-text-panel">From · </span>
                              <span className="share-tech-regular tb-opacity-90">{r.friendName}</span>
                            </p>
                            <p
                              className="share-tech-regular"
                              style={{ fontSize: 16, lineHeight: 1.375, color: PAGE_INTRO_BLURB_TEXT, opacity: 0.75 }}
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

        {buddies.length > 0 ? (
          <motion.button
            type="button"
            onClick={() => navigate("/friend-recipe/add")}
            className="tb-fab-add"
            aria-label="Add a community recipe"
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

      <Navigation />
    </div>
  );
}

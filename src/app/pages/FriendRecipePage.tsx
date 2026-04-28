import { useNavigate, useParams } from "react-router";
import { useState, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { useBuddies } from "../context/BuddiesContext";
import { FRIEND_RECIPES_STORAGE_BASE, scopedStorageKey } from "../userStorage";
import {
  loadSavedCommunityRecipes,
  persistSavedCommunityRecipes,
  type SavedCommunityRecipeEntry,
} from "../savedCommunityRecipes";
import { formatAllergenCsv, parseAllergenCsv } from "../allergyTagConfig";
import StickyTopChrome from "../components/StickyTopChrome";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import { PAGE_SHELL_SCROLL } from "../brand";
import type { AllergenTagId } from "../allergyTagConfig";
import { AllergenIconPicker } from "../components/AllergenIconPicker";
import RecipeIngredientDirectionFields from "../components/RecipeIngredientDirectionFields";
import {
  directionRowsFromString,
  directionsStringFromRows,
  ingredientRowsFromString,
  ingredientsStringFromRows,
  newIngredientRow,
  type IngredientRow,
} from "../recipeLineEditorUtils";

export type FriendRecipeEntry = SavedCommunityRecipeEntry;

export default function FriendRecipePage() {
  const navigate = useNavigate();
  const { recipeId: editRecipeId } = useParams<{ recipeId?: string }>();
  const { user } = useAuth();
  const recipesStorageKey = scopedStorageKey(user!.id, FRIEND_RECIPES_STORAGE_BASE);
  const { buddies } = useBuddies();

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
    if (!editRecipeId) {
      navigate("/whisk", { replace: true });
      return;
    }
    const found = loadSavedCommunityRecipes(recipesStorageKey).find((r) => r.id === editRecipeId);
    if (!found || found.wallRecipeId) {
      navigate("/whisk", { replace: true });
      return;
    }
    setBuddyId(found.buddyId ?? buddies[0]?.id ?? "");
    setRecipeName(found.recipeName);
    setAllergies(found.allergies);
    setAccommodateIds(parseAllergenCsv(found.accommodates ?? ""));
    setIngredientRows(ingredientRowsFromString(found.ingredients));
    setDirectionRows(directionRowsFromString(found.directions));
    setNotes(found.notes);
  }, [editRecipeId, navigate, buddies, recipesStorageKey]);

  const selectedBuddy = useMemo(() => buddies.find((b) => b.id === buddyId), [buddies, buddyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRecipeId) return;
    const ingredients = ingredientsStringFromRows(ingredientRows);
    const directions = directionsStringFromRows(directionRows);
    if (!ingredients.trim() || !directions.trim()) {
      window.alert("Add at least one ingredient line and one direction step.");
      return;
    }

    const list = loadSavedCommunityRecipes(recipesStorageKey);
    const existing = list.find((r) => r.id === editRecipeId);
    if (!existing) {
      navigate("/whisk");
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
    navigate("/whisk");
  };

  return (
    <div className={PAGE_SHELL_SCROLL}>
      <StickyTopChrome />

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
          Edit saved recipe
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
              <span className="tb-pill-text-white share-tech-regular">Save changes</span>
            </ChalkPillFrame>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => navigate("/whisk")}
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

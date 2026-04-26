import { motion } from "motion/react";
import { InfoBoxFrame } from "./InfoBoxFrame";
import { newIngredientRow, type IngredientRow } from "../recipeLineEditorUtils";

type Props = {
  ingredientRows: IngredientRow[];
  onIngredientRowsChange: (rows: IngredientRow[]) => void;
  directionRows: string[];
  onDirectionRowsChange: (rows: string[]) => void;
};

export default function RecipeIngredientDirectionFields({
  ingredientRows,
  onIngredientRowsChange,
  directionRows,
  onDirectionRowsChange,
}: Props) {
  const updateIngredient = (id: string, patch: Partial<IngredientRow>) => {
    onIngredientRowsChange(ingredientRows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeIngredient = (id: string) => {
    if (ingredientRows.length <= 1) {
      onIngredientRowsChange([newIngredientRow()]);
      return;
    }
    onIngredientRowsChange(ingredientRows.filter((r) => r.id !== id));
  };

  const updateDirection = (index: number, value: string) => {
    const next = [...directionRows];
    next[index] = value;
    onDirectionRowsChange(next);
  };

  const removeDirection = (index: number) => {
    if (directionRows.length <= 1) {
      onDirectionRowsChange([""]);
      return;
    }
    onDirectionRowsChange(directionRows.filter((_, i) => i !== index));
  };

  return (
    <>
      <InfoBoxFrame variant={2}>
        <p className="tb-field-label-bold share-tech-bold">Ingredients</p>
        <p className="tb-recipe-lines-hint share-tech-regular">
          One ingredient per line. Check the box to include it when you save (uncheck to skip a line).
        </p>
        <ul className="tb-recipe-lines-list" aria-label="Ingredient lines">
          {ingredientRows.map((row) => (
            <li key={row.id} className="tb-recipe-line-li">
              <label className="tb-recipe-ing-line">
                <input
                  type="checkbox"
                  className="tb-recipe-ing-check"
                  checked={row.included}
                  onChange={(e) => updateIngredient(row.id, { included: e.target.checked })}
                  aria-label={`Include ingredient: ${row.text || "new line"}`}
                />
                <input
                  type="text"
                  value={row.text}
                  onChange={(e) => updateIngredient(row.id, { text: e.target.value })}
                  className="tb-input-plain share-tech-regular tb-recipe-line-input"
                  placeholder="e.g. 2 cups flour"
                />
                <motion.button
                  type="button"
                  className="tb-recipe-line-remove share-tech-bold"
                  onClick={() => removeIngredient(row.id)}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Remove ingredient line"
                >
                  ×
                </motion.button>
              </label>
            </li>
          ))}
        </ul>
        <motion.button
          type="button"
          className="tb-recipe-add-line share-tech-bold"
          onClick={() => onIngredientRowsChange([...ingredientRows, newIngredientRow()])}
          whileTap={{ scale: 0.98 }}
        >
          + Add ingredient
        </motion.button>
      </InfoBoxFrame>

      <InfoBoxFrame variant={3}>
        <p className="tb-field-label-bold share-tech-bold">Directions</p>
        <p className="tb-recipe-lines-hint share-tech-regular">Numbered steps — one action per line (Whisk uses these as check-off steps).</p>
        <ul className="tb-recipe-lines-list" aria-label="Direction steps">
          {directionRows.map((line, index) => (
            <li key={`dir-${index}`} className="tb-recipe-line-li">
              <div className="tb-recipe-dir-line">
                <span className="tb-recipe-dir-num share-tech-bold" aria-hidden>
                  {index + 1}.
                </span>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => updateDirection(index, e.target.value)}
                  className="tb-input-plain share-tech-regular tb-recipe-line-input"
                  placeholder={`Step ${index + 1}…`}
                />
                <motion.button
                  type="button"
                  className="tb-recipe-line-remove share-tech-bold"
                  onClick={() => removeDirection(index)}
                  whileTap={{ scale: 0.95 }}
                  aria-label={`Remove step ${index + 1}`}
                >
                  ×
                </motion.button>
              </div>
            </li>
          ))}
        </ul>
        <motion.button
          type="button"
          className="tb-recipe-add-line share-tech-bold"
          onClick={() => onDirectionRowsChange([...directionRows, ""])}
          whileTap={{ scale: 0.98 }}
        >
          + Add step
        </motion.button>
      </InfoBoxFrame>
    </>
  );
}

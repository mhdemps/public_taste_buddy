import { useState, type Dispatch, type SetStateAction } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  loadSavedCommunityRecipes,
  persistSavedCommunityRecipes,
  type SavedCommunityRecipeEntry,
} from "../savedCommunityRecipes";
import { InfoBoxFrame } from "./InfoBoxFrame";
import { ChalkPillFrame } from "./ChalkPillFrame";
import { parseAllergenCsv } from "../allergyTagConfig";
import { AllergenBadgeRow } from "./AllergenBadgeRow";
import { recipeCookProgressKey } from "../recipeMakeProgress";
import { toggleWhiskMakeLater } from "../whiskMakeLater";
import { toggleWhiskFavorite } from "../whiskFavorites";
import imgRecipeClose from "@project-assets/X.svg";
import imgTrashDelete from "@project-assets/Trash.svg";
import iconSaveHover from "@project-assets/save hover.svg";
import iconHeart from "@project-assets/heart.svg";
import iconHeartClicked from "@project-assets/clicked heart.svg";

function parseAllergyTags(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

type Props = {
  storageKey: string;
  entries: SavedCommunityRecipeEntry[];
  onMutate: () => void;
  userId: string;
  makeLaterSet: Set<string>;
  setMakeLaterSet: Dispatch<SetStateAction<Set<string>>>;
  favoritesSet: Set<string>;
  setFavoritesSet: Dispatch<SetStateAction<Set<string>>>;
};

export default function SavedFromBoardRecipeCards({
  storageKey,
  entries,
  onMutate,
  userId,
  makeLaterSet,
  setMakeLaterSet,
  favoritesSet,
  setFavoritesSet,
}: Props) {
  const navigate = useNavigate();
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const handleRemove = (entry: SavedCommunityRecipeEntry) => {
    if (!confirm(`Are you sure you want to remove "${entry.recipeName}" from your saved recipes?`)) return;
    persistSavedCommunityRecipes(
      storageKey,
      loadSavedCommunityRecipes(storageKey).filter((r) => r.id !== entry.id)
    );
    onMutate();
    setExpandedRecipeId((cur) => (cur === entry.id ? null : cur));
  };

  return (
    <ul className="tb-saved-list">
      {entries.map((r, i) => {
        const isExpanded = expandedRecipeId === r.id;
        const allergyList = parseAllergyTags(r.allergies);
        const accIds = parseAllergenCsv(r.accommodates ?? "");
        const pk = recipeCookProgressKey("friend", r.id);
        const isLater = makeLaterSet.has(pk);
        const isFavorite = favoritesSet.has(pk);
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
                        <AllergenBadgeRow mode="accommodates" ids={accIds} ariaLabel="Recipe is free from" />
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
                      <motion.button
                        type="button"
                        className="tb-make-fav-toggle"
                        aria-pressed={isFavorite}
                        aria-label={isFavorite ? "Remove favorite from this recipe" : "Favorite this recipe"}
                        title={isFavorite ? "Unfavorite" : "Favorite"}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setFavoritesSet(toggleWhiskFavorite(userId, pk))}
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
                          isLater ? "Remove from make later" : "A recipe you want to make later — tap to tag"
                        }
                        whileTap={{ scale: 0.94 }}
                        onClick={() => setMakeLaterSet(toggleWhiskMakeLater(userId, pk))}
                      >
                        <img src={iconSaveHover} alt="" className="tb-make-later-icon" draggable={false} />
                      </motion.button>
                      <motion.button
                        type="button"
                        className="tb-submit-wrap"
                        onClick={() => navigate(`/whisk/cook/friend/${r.id}`)}
                        whileTap={{ scale: 0.97 }}
                      >
                        <ChalkPillFrame
                          variant={(i + 2) % 4}
                          fillClassName="tb-pill-fill-coral"
                          innerClassName="tb-pill-inner tb-pill-inner--md"
                        >
                          <span className="tb-pill-text-white--sm share-tech-regular">Cook along</span>
                        </ChalkPillFrame>
                      </motion.button>
                      {!r.wallRecipeId ? (
                        <motion.button
                          type="button"
                          className="tb-submit-wrap"
                          onClick={() => navigate(`/friend-recipe/edit/${r.id}`)}
                          whileTap={{ scale: 0.97 }}
                        >
                          <ChalkPillFrame
                            variant={(i + 1) % 4}
                            fillClassName="tb-pill-fill-light--soft"
                            innerClassName="tb-pill-inner tb-pill-inner--md"
                          >
                            <span className="share-tech-regular" style={{ color: "#5c4030" }}>
                              Edit
                            </span>
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
                  <div className="tb-make-card-shell">
                    <div className="tb-make-card-header-row">
                      <button
                        type="button"
                        className="tb-expand-hit tb-make-card-hit"
                        aria-expanded={false}
                        onClick={() => setExpandedRecipeId(r.id)}
                      >
                        <h3 className="tb-recipe-h3 share-tech-bold">{r.recipeName}</h3>
                        {accIds.length > 0 ? (
                          <AllergenBadgeRow mode="accommodates" ids={accIds} ariaLabel="Recipe is free from" />
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
                          isLater ? "Remove from make later" : "A recipe you want to make later — tap to tag"
                        }
                        whileTap={{ scale: 0.94 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
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
                  <img alt="" src={imgTrashDelete} draggable={false} className="tb-recipe-x-icon" />
                </motion.button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

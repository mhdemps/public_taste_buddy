import { useNavigate } from "react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { useBuddies } from "../context/BuddiesContext";
import Navigation from "../components/Navigation";
import GrayTasteHeader from "../components/GrayTasteHeader";
import { PAGE_INTRO_BLURB_TEXT, PAGE_SHELL_SCROLL } from "../brand";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";

function optStr(s: string): string | undefined {
  const t = s.trim();
  return t === "" ? undefined : t;
}

export default function AddBuddyPage() {
  const navigate = useNavigate();
  const { addBuddy } = useBuddies();
  const [name, setName] = useState("");
  const [favoriteFood, setFavoriteFood] = useState("");
  const [personality, setPersonality] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [parties, setParties] = useState("");
  const [recipes, setRecipes] = useState("");
  const [allergies, setAllergies] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const partiesRaw = parties.trim();
    let partiesAttended: number | undefined;
    if (partiesRaw !== "") {
      const n = Number.parseInt(partiesRaw, 10);
      partiesAttended = Number.isNaN(n) ? undefined : n;
    }

    addBuddy({
      name: name.trim(),
      favoriteFood: optStr(favoriteFood),
      personality: optStr(personality),
      specialty: optStr(specialty),
      partiesAttended,
      recipesGiven: optStr(recipes),
      allergies: optStr(allergies),
    });
    navigate("/buddies");
  };

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
          Add a taste profile
        </motion.h1>
        <motion.p
          className="tb-intro-blurb share-tech-regular"
          style={{ color: PAGE_INTRO_BLURB_TEXT }}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.1 }}
        >
          This info can show up on their public profile — favorite flavors, what they bring to the table, and dietary notes others should know.
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          className="tb-form-narrow"
          initial={{ y: 26, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.12 }}
        >
          <InfoBoxFrame variant={0}>
            <label htmlFor="add-buddy-name" className="tb-field-label share-tech-regular">
              Name
            </label>
            <input
              id="add-buddy-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="tb-input-plain share-tech-regular"
              placeholder="What should we call them?"
              required
            />
          </InfoBoxFrame>

          <InfoBoxFrame variant={1}>
            <label htmlFor="add-buddy-food" className="tb-field-label share-tech-regular">
              Favorite food
            </label>
            <input
              id="add-buddy-food"
              type="text"
              value={favoriteFood}
              onChange={(e) => setFavoriteFood(e.target.value)}
              className="tb-input-plain share-tech-regular"
              placeholder="Optional"
            />
          </InfoBoxFrame>

          <InfoBoxFrame variant={2}>
            <label htmlFor="add-buddy-personality" className="tb-field-label share-tech-regular">
              Personality
            </label>
            <input
              id="add-buddy-personality"
              type="text"
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              className="tb-input-plain share-tech-regular"
              placeholder="Optional"
            />
          </InfoBoxFrame>

          <InfoBoxFrame variant={3}>
            <label htmlFor="add-buddy-specialty" className="tb-field-label share-tech-regular">
              Specialty
            </label>
            <input
              id="add-buddy-specialty"
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="tb-input-plain share-tech-regular"
              placeholder="Optional — what they cook best"
            />
          </InfoBoxFrame>

          <InfoBoxFrame variant={0}>
            <label htmlFor="add-buddy-parties" className="tb-field-label share-tech-regular">
              Gatherings joined
            </label>
            <input
              id="add-buddy-parties"
              type="number"
              min={0}
              value={parties}
              onChange={(e) => setParties(e.target.value)}
              className="tb-input-plain share-tech-regular"
              placeholder="Optional"
            />
          </InfoBoxFrame>

          <InfoBoxFrame variant={1}>
            <label htmlFor="add-buddy-recipes" className="tb-field-label share-tech-regular">
              Recipes shared
            </label>
            <input
              id="add-buddy-recipes"
              type="text"
              value={recipes}
              onChange={(e) => setRecipes(e.target.value)}
              className="tb-input-plain share-tech-regular"
              placeholder="Optional — dishes they’ve shared"
            />
          </InfoBoxFrame>

          <InfoBoxFrame variant={2}>
            <label htmlFor="add-buddy-allergies" className="tb-field-label share-tech-regular">
              Allergies &amp; restrictions
            </label>
            <textarea
              id="add-buddy-allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="tb-textarea-plain share-tech-regular"
              placeholder="Tag foods to avoid — e.g. nuts, dairy, shellfish (comma-separated is fine)"
              rows={4}
            />
          </InfoBoxFrame>

          <motion.button type="submit" className="tb-submit-wrap" whileTap={{ scale: 0.97 }}>
            <ChalkPillFrame variant={2} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--lg">
              <span className="tb-pill-text-white share-tech-regular">Save profile</span>
            </ChalkPillFrame>
          </motion.button>

          <motion.button
            type="button"
            onClick={() => navigate("/buddies")}
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

import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import {
  useBuddies,
  circleForBuddyColor,
  getBuddyColorIndex,
  type BuddyEditablePayload,
} from "../context/BuddiesContext";
import Navigation from "../components/Navigation";
import { InfoBoxFrame } from "../components/InfoBoxFrame";
import { ChalkPillFrame } from "../components/ChalkPillFrame";
import GrayTasteHeader from "../components/GrayTasteHeader";
import { PAGE_SHELL, PAGE_SHELL_SCROLL } from "../brand";
import { BUDDY_IN_CIRCLE_H_PCT, BUDDY_IN_CIRCLE_W_PCT, BUDDY_PROFILE_CIRCLE_MAX } from "../buddyLayout";

function buddyToForm(b: {
  name: string;
  favoriteFood?: string;
  personality?: string;
  specialty?: string;
  partiesAttended?: number;
  recipesGiven?: string;
  allergies?: string;
}): BuddyEditablePayload {
  return {
    name: b.name,
    favoriteFood: b.favoriteFood ?? "",
    personality: b.personality ?? "",
    specialty: b.specialty ?? "",
    partiesAttended: b.partiesAttended != null ? String(b.partiesAttended) : "",
    recipesGiven: b.recipesGiven ?? "",
    allergies: b.allergies ?? "",
  };
}

export default function BuddyInfoPage() {
  const navigate = useNavigate();
  const { buddyId } = useParams<{ buddyId: string }>();
  const { getBuddyById, removeBuddy, updateBuddy } = useBuddies();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<BuddyEditablePayload>({
    name: "",
    favoriteFood: "",
    personality: "",
    specialty: "",
    partiesAttended: "",
    recipesGiven: "",
    allergies: "",
  });

  const buddy = buddyId ? getBuddyById(buddyId) : null;

  useEffect(() => {
    setEditing(false);
  }, [buddyId]);

  useEffect(() => {
    if (buddy && !editing) {
      setForm(buddyToForm(buddy));
    }
  }, [buddy, editing]);

  if (!buddy) {
    return (
      <div className={PAGE_SHELL}>
        <GrayTasteHeader />
        <div className="tb-not-found-stack">
          <p className="share-tech-bold tb-text-coral">Buddy not found</p>
          <motion.button
            type="button"
            onClick={() => navigate("/buddies")}
            className="tb-submit-wrap"
            whileTap={{ scale: 0.98 }}
          >
            <ChalkPillFrame
              variant={0}
              fillClassName="tb-pill-fill-light"
              innerClassName="tb-pill-inner tb-pill-inner--md"
            >
              <span className="share-tech-bold tb-text-coral" style={{ fontSize: 17 }}>
                All buddies
              </span>
            </ChalkPillFrame>
          </motion.button>
        </div>
        <Navigation />
      </div>
    );
  }

  const detailCircle = circleForBuddyColor(getBuddyColorIndex(buddy.buddyImage));

  const handleRemove = () => {
    if (confirm(`Are you sure you want to remove ${buddy.name}?`)) {
      removeBuddy(buddyId!);
      navigate("/buddies");
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBuddy(buddy.id, form);
    setEditing(false);
  };

  const openEdit = () => {
    setForm(buddyToForm(buddy));
    setEditing(true);
  };

  return (
    <div className={PAGE_SHELL_SCROLL}>
      <GrayTasteHeader />

      <div className="tb-main-column">
        <div className="tb-buddy-profile-back-row">
          <motion.button
            type="button"
            onClick={() => navigate("/buddies")}
            className="tb-submit-wrap"
            aria-label="Back to all buddies"
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChalkPillFrame
              variant={1}
              fillClassName="tb-pill-fill-back"
              innerClassName="tb-pill-inner tb-pill-inner--back"
            >
              <span className="tb-back-chevron share-tech-bold" aria-hidden>
                ‹
              </span>
              <span className="share-tech-bold tb-text-coral" style={{ fontSize: 18 }}>
                All buddies
              </span>
            </ChalkPillFrame>
          </motion.button>
        </div>

        <motion.div
          className="tb-buddy-profile-stage"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className={BUDDY_PROFILE_CIRCLE_MAX}>
            <img
              alt=""
              className="tb-abs-cover"
              style={{ borderRadius: "50%" }}
              src={detailCircle}
              draggable={false}
            />
            <div className="tb-buddy-face-layer">
              <div
                className="tb-buddy-face-inner"
                style={{
                  width: `${BUDDY_IN_CIRCLE_W_PCT}%`,
                  height: `${BUDDY_IN_CIRCLE_H_PCT}%`,
                  maxWidth: `${BUDDY_IN_CIRCLE_W_PCT}%`,
                  maxHeight: `${BUDDY_IN_CIRCLE_H_PCT}%`,
                }}
              >
                <img alt="" className="tb-buddy-face-img" src={buddy.smilingImage} draggable={false} />
              </div>
            </div>
          </div>
        </motion.div>

        {!editing && (
          <motion.h1
            className="tb-buddy-profile-name share-tech-bold"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {buddy.name}
          </motion.h1>
        )}

        {editing ? (
          <motion.form
            id="buddy-edit-form"
            onSubmit={handleSave}
            className="tb-form-edit-stack"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.35 }}
          >
            <InfoBoxFrame variant={0}>
              <label htmlFor="edit-name" className="tb-field-label--tight share-tech-regular">
                Name
              </label>
              <input
                id="edit-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="tb-input-plain share-tech-regular"
                required
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={1}>
              <label htmlFor="edit-food" className="tb-field-label--tight share-tech-regular">
                Favorite Food
              </label>
              <input
                id="edit-food"
                type="text"
                value={form.favoriteFood}
                onChange={(e) => setForm((f) => ({ ...f, favoriteFood: e.target.value }))}
                className="tb-input-plain share-tech-regular"
                placeholder="Optional"
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={2}>
              <label htmlFor="edit-personality" className="tb-field-label--tight share-tech-regular">
                Personality
              </label>
              <input
                id="edit-personality"
                type="text"
                value={form.personality}
                onChange={(e) => setForm((f) => ({ ...f, personality: e.target.value }))}
                className="tb-input-plain share-tech-regular"
                placeholder="Optional"
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={3}>
              <label htmlFor="edit-specialty" className="tb-field-label--tight share-tech-regular">
                Specialty
              </label>
              <input
                id="edit-specialty"
                type="text"
                value={form.specialty}
                onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
                className="tb-input-plain share-tech-regular"
                placeholder="Optional"
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={0}>
              <label htmlFor="edit-parties" className="tb-field-label--tight share-tech-regular">
                Parties Attended
              </label>
              <input
                id="edit-parties"
                type="number"
                min={0}
                value={form.partiesAttended}
                onChange={(e) => setForm((f) => ({ ...f, partiesAttended: e.target.value }))}
                className="tb-input-plain share-tech-regular"
                placeholder="Optional"
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={1}>
              <label htmlFor="edit-recipes" className="tb-field-label--tight share-tech-regular">
                Recipes Given
              </label>
              <input
                id="edit-recipes"
                type="text"
                value={form.recipesGiven}
                onChange={(e) => setForm((f) => ({ ...f, recipesGiven: e.target.value }))}
                className="tb-input-plain share-tech-regular"
                placeholder="Optional"
              />
            </InfoBoxFrame>

            <InfoBoxFrame variant={2}>
              <label htmlFor="edit-allergies" className="tb-field-label--tight share-tech-regular">
                Allergies &amp; restrictions
              </label>
              <textarea
                id="edit-allergies"
                value={form.allergies}
                onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
                className="tb-textarea-plain share-tech-regular"
                placeholder="Optional — foods to avoid"
                rows={4}
              />
            </InfoBoxFrame>
          </motion.form>
        ) : (
          <motion.div
            className="tb-detail-stack"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            {buddy.favoriteFood && (
              <InfoBoxFrame variant={0}>
                <h3 className="tb-detail-h3 share-tech-bold">Favorite Food</h3>
                <p className="tb-detail-p share-tech-regular">{buddy.favoriteFood}</p>
              </InfoBoxFrame>
            )}

            {buddy.personality && (
              <InfoBoxFrame variant={1}>
                <h3 className="tb-detail-h3 share-tech-bold">Personality</h3>
                <p className="tb-detail-p share-tech-regular">{buddy.personality}</p>
              </InfoBoxFrame>
            )}

            {buddy.specialty && (
              <InfoBoxFrame variant={2}>
                <h3 className="tb-detail-h3 share-tech-bold">Specialty</h3>
                <p className="tb-detail-p share-tech-regular">{buddy.specialty}</p>
              </InfoBoxFrame>
            )}

            {buddy.partiesAttended !== undefined && buddy.partiesAttended !== null && (
              <InfoBoxFrame variant={3}>
                <h3 className="tb-detail-h3 share-tech-bold">Parties Attended</h3>
                <p className="tb-detail-p share-tech-regular">{buddy.partiesAttended}</p>
              </InfoBoxFrame>
            )}

            {buddy.recipesGiven && (
              <InfoBoxFrame variant={0}>
                <h3 className="tb-detail-h3 share-tech-bold">Recipes Given</h3>
                <p className="tb-detail-p share-tech-regular">{buddy.recipesGiven}</p>
              </InfoBoxFrame>
            )}

            {buddy.allergies && (
              <InfoBoxFrame variant={1}>
                <h3 className="tb-detail-h3 share-tech-bold">Allergies &amp; restrictions</h3>
                <p className="tb-pre-wrap share-tech-regular">{buddy.allergies}</p>
              </InfoBoxFrame>
            )}
          </motion.div>
        )}

        <motion.div
          className="tb-detail-actions"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
        >
          {editing ? (
            <div className="tb-pill-actions-row">
              <motion.button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setForm(buddyToForm(buddy));
                }}
                className="tb-submit-wrap"
                whileTap={{ scale: 0.97 }}
              >
                <ChalkPillFrame
                  variant={2}
                  fillClassName="tb-pill-fill-light--soft"
                  innerClassName="tb-pill-inner tb-pill-inner--sm"
                >
                  <span className="share-tech-regular tb-text-coral" style={{ fontSize: 18 }}>
                    Cancel
                  </span>
                </ChalkPillFrame>
              </motion.button>
              <motion.button
                type="submit"
                form="buddy-edit-form"
                className="tb-submit-wrap"
                whileTap={{ scale: 0.97 }}
              >
                <ChalkPillFrame
                  variant={3}
                  fillClassName="tb-pill-fill-coral--tight"
                  innerClassName="tb-pill-inner tb-pill-inner--sm"
                >
                  <span className="tb-pill-text-white share-tech-regular">Save changes</span>
                </ChalkPillFrame>
              </motion.button>
            </div>
          ) : (
            <motion.button type="button" onClick={openEdit} className="tb-submit-wrap" whileTap={{ scale: 0.97 }}>
              <ChalkPillFrame variant={0} fillClassName="tb-pill-fill-coral" innerClassName="tb-pill-inner tb-pill-inner--lg">
                <span className="tb-pill-text-white share-tech-regular">Edit buddy</span>
              </ChalkPillFrame>
            </motion.button>
          )}

          <motion.button
            type="button"
            onClick={handleRemove}
            className="tb-link-text share-tech-regular"
            whileHover={{ opacity: 0.7 }}
            whileTap={{ scale: 0.95 }}
          >
            Remove Buddy
          </motion.button>
        </motion.div>
      </div>

      <Navigation />
    </div>
  );
}

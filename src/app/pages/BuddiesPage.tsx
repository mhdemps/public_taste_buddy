import { useNavigate } from "react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useBuddies, circleForBuddyColor, getBuddyColorIndex } from "../context/BuddiesContext";
import StickyTopChrome from "../components/StickyTopChrome";
import { PAGE_SHELL_SCROLL } from "../brand";
import { BUDDY_IN_CIRCLE_H_PCT, BUDDY_IN_CIRCLE_W_PCT } from "../buddyLayout";
import imgAddBuddy from "@project-assets/madison-is-pretty.png";

function BuddyCard({
  name,
  buddyImage,
  smilingImage,
  backgroundImage,
  circleFlipped,
  buddyId,
}: {
  name: string;
  buddyImage: string;
  smilingImage: string;
  backgroundImage: string;
  circleFlipped: boolean;
  buddyId: string;
}) {
  const navigate = useNavigate();
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => {
      navigate(`/buddy/${buddyId}`);
    }, 600);
  };

  return (
    <div className="tb-buddy-card">
      <div className="tb-buddy-scale-wrap">
        <motion.button
          type="button"
          aria-label={`${name} — open public taste profile`}
          onClick={handleClick}
          className="tb-buddy-circle-btn"
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.96 }}
        >
          <img
            alt=""
            className="tb-abs-cover"
            style={{
              borderRadius: "50%",
              transform: circleFlipped ? "rotate(180deg)" : "none",
            }}
            src={backgroundImage}
            draggable={false}
          />
          <AnimatePresence mode="wait">
            <motion.div
              key={isClicked ? "smiling" : "normal"}
              className="tb-buddy-face-layer"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="tb-buddy-face-inner"
                style={{
                  width: `${BUDDY_IN_CIRCLE_W_PCT}%`,
                  height: `${BUDDY_IN_CIRCLE_H_PCT}%`,
                  maxWidth: `${BUDDY_IN_CIRCLE_W_PCT}%`,
                  maxHeight: `${BUDDY_IN_CIRCLE_H_PCT}%`,
                }}
              >
                <img alt="" className="tb-buddy-face-img" src={isClicked ? smilingImage : buddyImage} draggable={false} />
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.button>
      </div>
      <p
        className="tb-buddy-name share-tech-bold"
        style={{
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          WebkitTextSizeAdjust: "100%",
        }}
      >
        {name}
      </p>
    </div>
  );
}

export default function BuddiesPage() {
  const navigate = useNavigate();
  const { buddies } = useBuddies();

  return (
    <div className={PAGE_SHELL_SCROLL} data-name="Saved buddies">
      <StickyTopChrome helpContent="Profiles you keep for parties and community recipes on this device. The live Buddy Board with everyone who has an account is the center tab below. Use + to add another buddy to this list." />

      <motion.div
        className="tb-main-column"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="tb-buddies-title share-tech-bold"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.05 }}
        >
          Saved buddies
        </motion.h1>

        <div className="tb-buddies-grid-wrap">
          <motion.div
            className="tb-buddies-grid"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            {buddies.map((buddy, index) => (
              <BuddyCard
                key={buddy.id}
                name={buddy.name}
                buddyImage={buddy.buddyImage}
                smilingImage={buddy.smilingImage}
                backgroundImage={circleForBuddyColor(getBuddyColorIndex(buddy.buddyImage))}
                circleFlipped={((index % 2) + Math.floor(index / 2)) % 2 === 1}
                buddyId={buddy.id}
              />
            ))}
          </motion.div>
        </div>

        <motion.button
          type="button"
          onClick={() => navigate("/add-buddy")}
          className="tb-fab-add tb-fab-add--buddy"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <img alt="Add a taste profile" className="tb-img-contain-full" src={imgAddBuddy} />
        </motion.button>
      </motion.div>
    </div>
  );
}

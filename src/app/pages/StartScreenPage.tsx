import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import GrayTasteHeader from "../components/GrayTasteHeader";
import {
  HOME_HERO_HEADLINE_CLASS,
  HOME_HERO_STACK_CLASS,
  INTRO_BUDDY_IMG_CLASS,
  MASCOT_SHARED_LAYOUT_ID,
  PAGE_SHELL,
} from "../brand";
import imgOrangeShadow from "@project-assets/orange shadow.png";
import imgOrangeSmileShadow from "@project-assets/orange smile shadow.png";

export default function StartScreenPage() {
  const navigate = useNavigate();
  const [isSmiling, setIsSmiling] = useState(false);

  const handleBuddyClick = () => {
    if (isSmiling) return;
    setIsSmiling(true);
    window.setTimeout(() => navigate("/welcome"), 600);
  };

  return (
    <div className={PAGE_SHELL} data-name="Start Screen">
      <GrayTasteHeader />

      <div className={`${HOME_HERO_STACK_CLASS} tb-hero-stack--pb40`}>
        <div className={`${HOME_HERO_HEADLINE_CLASS} tb-hero-headline--hidden tb-text-coral`} aria-hidden>
          <p style={{ marginBottom: 0 }}>Your buddy for </p>
          <p>culinary exploration!</p>
        </div>

        <div className="tb-row-center">
          <button
            type="button"
            className="tb-mascot-hit tb-mascot-hit--start"
            onClick={handleBuddyClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleBuddyClick();
              }
            }}
            aria-label="Taste Buddy — tap to continue"
          >
            <motion.img
              layoutId={MASCOT_SHARED_LAYOUT_ID}
              src={isSmiling ? imgOrangeSmileShadow : imgOrangeShadow}
              alt=""
              draggable={false}
              className={INTRO_BUDDY_IMG_CLASS}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

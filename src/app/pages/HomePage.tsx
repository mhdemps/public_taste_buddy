import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import Navigation from "../components/Navigation";
import GrayTasteHeader from "../components/GrayTasteHeader";
import {
  HOME_BUDDY_IMG_CLASS,
  HOME_HERO_HEADLINE_CLASS,
  HOME_HERO_STACK_CLASS,
  MASCOT_SHARED_LAYOUT_ID,
  PAGE_SHELL,
} from "../brand";
import imgOrangeShadow from "@project-assets/orange shadow.png";
import imgOrangeSmileShadow from "@project-assets/orange smile shadow.png";

const MASCOT_SPRING = { type: "spring" as const, stiffness: 420, damping: 38, mass: 0.85 };

const HUB_TAGLINE_EASE = [0.33, 1, 0.68, 1] as const;

function MascotButton({
  isSmiling,
  onClick,
}: {
  isSmiling: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="tb-mascot-hit">
      <motion.img
        layoutId={MASCOT_SHARED_LAYOUT_ID}
        alt=""
        src={isSmiling ? imgOrangeSmileShadow : imgOrangeShadow}
        className={`${HOME_BUDDY_IMG_CLASS} tb-img-no-transition`}
        draggable={false}
        transition={MASCOT_SPRING}
      />
    </button>
  );
}

export default function HomePage() {
  const location = useLocation();
  const fromWelcome = Boolean((location.state as { fromWelcome?: boolean } | null)?.fromWelcome);
  const [isSmiling, setIsSmiling] = useState(fromWelcome);

  const navigate = useNavigate();

  const handleMascotClick = () => {
    setIsSmiling(true);
    window.setTimeout(() => {
      navigate("/");
    }, 300);
  };

  return (
    <div className={PAGE_SHELL} data-name="home">
      <GrayTasteHeader />

      <div className={`${HOME_HERO_STACK_CLASS} tb-hero-stack--pb40`}>
        <motion.div
          className={`${HOME_HERO_HEADLINE_CLASS} tb-text-coral`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.58, ease: HUB_TAGLINE_EASE, delay: 0.12 }}
        >
          <p style={{ marginBottom: 0 }}>Your buddy for </p>
          <p>culinary exploration!</p>
        </motion.div>

        <div className="tb-row-center">
          <MascotButton isSmiling={isSmiling} onClick={handleMascotClick} />
        </div>
      </div>

      <Navigation />
    </div>
  );
}

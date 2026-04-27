import { useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import GrayTasteHeader from "../components/GrayTasteHeader";
import {
  HOME_BUDDY_IMG_CLASS,
  HOME_HERO_HEADLINE_CLASS,
  HOME_HERO_STACK_CLASS,
  MASCOT_SHARED_LAYOUT_ID,
  PAGE_SHELL,
  WELCOME_MASCOT_INITIAL_SCALE,
} from "../brand";
import imgOrangeSmileShadow from "@project-assets/orange smile shadow.png";

const SMOOTH_EASE = [0.22, 1, 0.36, 1] as const;

const HOLD_MS_AFTER_TEXT = 950;
const TEXT_DELAY_S = 0.08;
const TEXT_DURATION_S = 0.36;

const MASCOT_SPRING = { type: "spring" as const, stiffness: 420, damping: 38, mass: 0.85 };

export default function TextInPage() {
  const navigate = useNavigate();

  const goHome = () => navigate("/", { state: { fromWelcome: true } });

  useEffect(() => {
    const textDoneMs = (TEXT_DELAY_S + TEXT_DURATION_S) * 1000;
    const t = window.setTimeout(() => {
      navigate("/", { state: { fromWelcome: true } });
    }, textDoneMs + HOLD_MS_AFTER_TEXT);
    return () => window.clearTimeout(t);
  }, [navigate]);

  return (
    <div className={PAGE_SHELL} data-name="text in">
      <GrayTasteHeader />

      <div
        className={`${HOME_HERO_STACK_CLASS} tb-hero-stack--top tb-welcome-skip tb-hero-stack--pb40`}
        onClick={goHome}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goHome();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Continue to home — happens automatically, or tap to skip."
      >
        <motion.div
          className={`${HOME_HERO_HEADLINE_CLASS} tb-text-coral`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: TEXT_DURATION_S,
            ease: SMOOTH_EASE,
            delay: TEXT_DELAY_S,
          }}
        >
          <p style={{ marginBottom: 0 }}>Welcome in —</p>
          <p>your taste community awaits!</p>
        </motion.div>

        <div className="tb-row-center">
          <button type="button" tabIndex={-1} aria-hidden className="tb-mascot-hit tb-mascot-hit--no-pointer">
            <motion.img
              layoutId={MASCOT_SHARED_LAYOUT_ID}
              src={imgOrangeSmileShadow}
              alt=""
              draggable={false}
              className={`${HOME_BUDDY_IMG_CLASS} tb-img-no-transition`}
              initial={{ scale: WELCOME_MASCOT_INITIAL_SCALE }}
              animate={{ scale: 1 }}
              transition={{
                scale: {
                  duration: TEXT_DURATION_S,
                  delay: TEXT_DELAY_S,
                  ease: SMOOTH_EASE,
                },
                layout: MASCOT_SPRING,
              }}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

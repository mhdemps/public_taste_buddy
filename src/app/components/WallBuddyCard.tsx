import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { getBuddyAppearanceByPaletteIndex } from "../context/BuddiesContext";
import { BUDDY_IN_CIRCLE_H_PCT, BUDDY_IN_CIRCLE_W_PCT } from "../buddyLayout";
import BuddyAvatar from "./BuddyAvatar";
import type { BuddySvgSelection } from "../buddyAppearance";

export default function WallBuddyCard({
  navigateTo,
  displayName,
  paletteIndex,
  gridIndex,
  svgSelection,
}: {
  navigateTo: string;
  displayName: string;
  paletteIndex: number;
  gridIndex: number;
  svgSelection?: BuddySvgSelection | null;
}) {
  const navigate = useNavigate();
  const [isClicked, setIsClicked] = useState(false);
  const { buddyImage, smilingImage, circleImage } = getBuddyAppearanceByPaletteIndex(paletteIndex);
  const circleFlipped = ((gridIndex % 2) + Math.floor(gridIndex / 2)) % 2 === 1;

  const handleClick = () => {
    setIsClicked(true);
    window.setTimeout(() => {
      navigate(navigateTo);
    }, 450);
  };

  return (
    <div className="tb-buddy-card">
      <div className="tb-buddy-scale-wrap">
        <motion.button
          type="button"
          aria-label={`${displayName} — open taste profile`}
          onClick={handleClick}
          className="tb-buddy-circle-btn"
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.96 }}
        >
          {svgSelection ? (
            <BuddyAvatar
              selection={svgSelection}
              circleBackgroundIndex={paletteIndex}
              circleStyle={{ transform: circleFlipped ? "rotate(180deg)" : "none" }}
              className="tb-buddy-avatar-shell"
              innerClassName="tb-buddy-face-inner"
              imgClassName="tb-buddy-face-img"
            />
          ) : (
            <>
              <img
                alt=""
                className="tb-abs-cover"
                style={{
                  borderRadius: "50%",
                  transform: circleFlipped ? "rotate(180deg)" : "none",
                }}
                src={circleImage}
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
                  <img alt="" className="tb-buddy-face-img" src={isClicked ? smilingImage : buddyImage} draggable={false} />
                </div>
              </div>
            </>
          )}
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
        {displayName}
      </p>
    </div>
  );
}

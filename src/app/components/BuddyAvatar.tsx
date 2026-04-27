import type { CSSProperties, ReactNode } from "react";
import {
  getBuddyBodyAsset,
  getBuddyCircleImage,
  getBuddyHatAsset,
  getBuddyEyeAsset,
  getBuddySmileAsset,
  getBuddyBackdropAtIndex,
  type BuddySvgSelection,
} from "../buddyAppearance";
import { BUDDY_IN_CIRCLE_H_PCT, BUDDY_IN_CIRCLE_W_PCT } from "../buddyLayout";

type BuddyAvatarProps = {
  selection: BuddySvgSelection;
  alt?: string;
  /** Overrides `circleBackgroundIndex` and body-default circle. */
  circleImage?: string;
  /** Uses saved profile / wall `buddy_color_index` (backdrop index). */
  circleBackgroundIndex?: number;
  /** When true, only the layered SVG (body, eyes, hat, smile) is shown — no circular backdrop image. */
  hideBackdrop?: boolean;
  circleStyle?: CSSProperties;
  className?: string;
  innerClassName?: string;
  imgClassName?: string;
  /** Renders after the circle backdrop, before the face (e.g. name on the ring). */
  beforeFace?: ReactNode;
};

export default function BuddyAvatar({
  selection,
  alt = "",
  circleImage,
  circleBackgroundIndex,
  hideBackdrop = false,
  circleStyle,
  className = "",
  innerClassName = "tb-buddy-face-inner",
  imgClassName = "tb-buddy-face-img",
  beforeFace,
}: BuddyAvatarProps) {
  const bodySrc = getBuddyBodyAsset(selection.bodyKey);
  const eyeSrc = getBuddyEyeAsset(selection.eyeKey);
  const hatSrc = getBuddyHatAsset(selection.hatKey);
  const smileSrc = getBuddySmileAsset(selection.smileKey);
  const resolvedCircleImage =
    circleImage ??
    (circleBackgroundIndex != null && !Number.isNaN(circleBackgroundIndex)
      ? getBuddyBackdropAtIndex(circleBackgroundIndex)
      : getBuddyCircleImage(selection.bodyKey));

  return (
    <div className={className}>
      {!hideBackdrop ? (
        <img alt="" className="tb-abs-cover" style={{ borderRadius: "50%", ...circleStyle }} src={resolvedCircleImage} draggable={false} />
      ) : null}
      {beforeFace}
      <div className="tb-buddy-face-layer">
        <div
          className={innerClassName}
          style={{
            width: `${BUDDY_IN_CIRCLE_W_PCT}%`,
            height: `${BUDDY_IN_CIRCLE_H_PCT}%`,
            maxWidth: `${BUDDY_IN_CIRCLE_W_PCT}%`,
            maxHeight: `${BUDDY_IN_CIRCLE_H_PCT}%`,
          }}
        >
          <div className="tb-buddy-svg-stack">
            <img alt={alt} className={`${imgClassName} tb-buddy-svg-layer`} src={bodySrc} draggable={false} />
            {eyeSrc ? (
              <img alt="" className={`${imgClassName} tb-buddy-svg-layer tb-buddy-svg-layer--eyes`} src={eyeSrc} draggable={false} />
            ) : null}
            {hatSrc ? <img alt="" className={`${imgClassName} tb-buddy-svg-layer tb-buddy-svg-layer--hat`} src={hatSrc} draggable={false} /> : null}
            <img alt="" className={`${imgClassName} tb-buddy-svg-layer tb-buddy-svg-layer--smile`} src={smileSrc} draggable={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

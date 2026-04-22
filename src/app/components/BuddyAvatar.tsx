import type { CSSProperties } from "react";
import {
  getBuddyBodyAsset,
  getBuddyCircleImage,
  getBuddyHatAsset,
  getBuddySmileAsset,
  getLightCircleImageAtIndex,
  type BuddySvgSelection,
} from "../buddyAppearance";
import { BUDDY_IN_CIRCLE_H_PCT, BUDDY_IN_CIRCLE_W_PCT } from "../buddyLayout";

type BuddyAvatarProps = {
  selection: BuddySvgSelection;
  alt?: string;
  /** Overrides `circleBackgroundIndex` and body-default circle. */
  circleImage?: string;
  /** Uses saved profile / wall `buddy_color_index` (0–5 light circles). */
  circleBackgroundIndex?: number;
  circleStyle?: CSSProperties;
  className?: string;
  innerClassName?: string;
  imgClassName?: string;
};

export default function BuddyAvatar({
  selection,
  alt = "",
  circleImage,
  circleBackgroundIndex,
  circleStyle,
  className = "",
  innerClassName = "tb-buddy-face-inner",
  imgClassName = "tb-buddy-face-img",
}: BuddyAvatarProps) {
  const bodySrc = getBuddyBodyAsset(selection.bodyKey);
  const hatSrc = getBuddyHatAsset(selection.hatKey);
  const smileSrc = getBuddySmileAsset(selection.smileKey);
  const resolvedCircleImage =
    circleImage ??
    (circleBackgroundIndex != null && !Number.isNaN(circleBackgroundIndex)
      ? getLightCircleImageAtIndex(circleBackgroundIndex)
      : getBuddyCircleImage(selection.bodyKey));

  return (
    <div className={className}>
      <img alt="" className="tb-abs-cover" style={{ borderRadius: "50%", ...circleStyle }} src={resolvedCircleImage} draggable={false} />
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
            {hatSrc ? <img alt="" className={`${imgClassName} tb-buddy-svg-layer tb-buddy-svg-layer--hat`} src={hatSrc} draggable={false} /> : null}
            <img alt="" className={`${imgClassName} tb-buddy-svg-layer tb-buddy-svg-layer--smile`} src={smileSrc} draggable={false} />
          </div>
        </div>
      </div>
    </div>
  );
}

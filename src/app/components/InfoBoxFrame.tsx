import type { CSSProperties, ReactNode } from "react";
import { useId } from "react";
import { INFO_PANEL_INPUT_TEXT, INFO_PANEL_TEXT } from "../brand";

/**
 * Coral “pill” with SVG chalk displacement. Only the background layer tilts on hover;
 * copy lives in a sibling with no transform so it stays crisp at any angle.
 */
const CHALK_VARIANTS = [
  { seed: 11, scale: 2.45, freq: "0.062 0.084", radius: "1.35rem 1.08rem 1.42rem 1.12rem", tilt: "tb-infobox-tilt-0" },
  { seed: 29, scale: 2.72, freq: "0.074 0.066", radius: "1.1rem 1.48rem 1.06rem 1.36rem", tilt: "tb-infobox-tilt-1" },
  { seed: 47, scale: 2.35, freq: "0.068 0.09", radius: "1.44rem 1.14rem 1.26rem 1.06rem", tilt: "tb-infobox-tilt-2" },
  { seed: 63, scale: 2.55, freq: "0.056 0.076", radius: "1.06rem 1.34rem 1.52rem 1.14rem", tilt: "tb-infobox-tilt-3" },
] as const;

export function InfoBoxFrame({
  children,
  variant = 0,
}: {
  children: ReactNode;
  /** Cycles 0–3 for different noise seeds, corner asymmetry, tilt & hover direction. */
  variant?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const v = CHALK_VARIANTS[((variant % 4) + 4) % 4]!;
  const filterId = `tb-infobox-chalk-${uid}`;

  return (
    <div className="tb-chalk-group">
      <svg width={0} height={0} className="pointer-events-none absolute" aria-hidden>
        <defs>
          <filter id={filterId} x="-28%" y="-28%" width="156%" height="156%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={v.freq}
              numOctaves={3}
              seed={v.seed}
              stitchTiles="stitch"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={v.scale}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <div className={`pointer-events-none tb-infobox-chalk-fill ${v.tilt}`}>
        <span
          aria-hidden
          className="tb-infobox-chalk-surface"
          style={{
            filter: `url(#${filterId})`,
            borderRadius: v.radius,
          }}
        />
      </div>
      <div
        className="tb-infobox-inner"
        style={
          {
            color: INFO_PANEL_TEXT,
            ["--tb-input-fill" as string]: INFO_PANEL_INPUT_TEXT,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  );
}

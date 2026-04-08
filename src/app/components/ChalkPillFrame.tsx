import type { ReactNode } from "react";
import { useId } from "react";

const PILL_VARIANTS = [
  { seed: 11, scale: 1.48, freq: "0.068 0.088", tilt: "tb-pill-tilt-0" },
  { seed: 29, scale: 1.62, freq: "0.078 0.07", tilt: "tb-pill-tilt-1" },
  { seed: 47, scale: 1.4, freq: "0.072 0.092", tilt: "tb-pill-tilt-2" },
  { seed: 63, scale: 1.55, freq: "0.06 0.08", tilt: "tb-pill-tilt-3" },
] as const;

export function ChalkPillFrame({
  children,
  variant = 0,
  className = "",
  fillClassName,
  innerClassName = "tb-pill-inner tb-pill-inner--std",
}: {
  children: ReactNode;
  variant?: number;
  className?: string;
  /** Border + background (+ shadow) for the sketched fill layer */
  fillClassName: string;
  innerClassName?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const v = PILL_VARIANTS[((variant % 4) + 4) % 4]!;
  const filterId = `tb-chalk-pill-${uid}`;

  return (
    <div className={`tb-chalk-group tb-chalk-group--inline ${className}`.trim()}>
      <svg width={0} height={0} className="pointer-events-none absolute" aria-hidden>
        <defs>
          <filter id={filterId} x="-26%" y="-26%" width="152%" height="152%">
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
      <div className={`pointer-events-none tb-pill-chalk-fill ${v.tilt}`}>
        <span
          aria-hidden
          className={`tb-pill-chalk-surface ${fillClassName}`}
          style={{ filter: `url(#${filterId})` }}
        />
      </div>
      <div className={innerClassName}>{children}</div>
    </div>
  );
}

import { useNavigate } from "react-router";
import iconChef from "@project-assets/gray chef.png";
import iconParty from "@project-assets/gray party.png";
import iconHome from "@project-assets/gray home.png";
import iconRefresh from "@project-assets/gray swap.png";
import iconProfile from "@project-assets/gray buddy.png";

const ICON_TILT_CLASS = [
  "tb-nav-icon-btn tb-nav-tilt-0",
  "tb-nav-icon-btn tb-nav-tilt-1",
  "tb-nav-icon-btn tb-nav-tilt-2",
  "tb-nav-icon-btn tb-nav-tilt-3",
  "tb-nav-icon-btn tb-nav-tilt-4",
] as const;

interface NavIconProps {
  icon: string;
  tiltClass: string;
  onClick?: () => void;
}

function NavIcon({ icon, tiltClass, onClick }: NavIconProps) {
  return (
    <button type="button" onClick={onClick} className={tiltClass}>
      <img alt="" src={icon} draggable={false} className="tb-nav-icon-img" />
    </button>
  );
}

const navItems = [
  { id: "chef", icon: iconChef, path: "/my-recipes" as const },
  { id: "party", icon: iconParty, path: "/party" as const },
  { id: "home", icon: iconHome, path: "/home" as const },
  { id: "welcome", icon: iconRefresh, path: "/friend-recipe" as const },
  { id: "profile", icon: iconProfile, path: "/buddies" as const },
];

export default function Navigation() {
  const navigate = useNavigate();

  return (
    <>
      <svg width={0} height={0} className="tb-nav-svg-hidden" aria-hidden>
        <defs>
          <filter id="tb-nav-chalk-edge" x="-22%" y="-22%" width="144%" height="144%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.072"
              numOctaves={3}
              seed="11"
              stitchTiles="stitch"
              result="chalkNoise"
            />
            <feDisplacementMap in="SourceGraphic" in2="chalkNoise" scale={2.5} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>

      <div className="tb-nav-dock">
        <nav aria-label="Main" className="tb-nav-bar">
          <span
            aria-hidden
            className="tb-nav-chalk-bg"
            style={{ filter: "url(#tb-nav-chalk-edge)" }}
          />
          <div className="tb-nav-inner">
            {navItems.map(({ id, icon, path }, index) => (
              <div key={id} className="tb-nav-slot">
                <NavIcon
                  icon={icon}
                  tiltClass={ICON_TILT_CLASS[index % ICON_TILT_CLASS.length]!}
                  onClick={() => navigate(path)}
                />
              </div>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}

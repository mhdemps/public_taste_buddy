import { useLocation, useNavigate } from "react-router";
import iconChef from "@project-assets/gray chef.png";
import iconWhisk from "@project-assets/whisk.svg";
import iconHome from "@project-assets/bud button.svg";
import iconSave from "@project-assets/checked off.svg";
import iconProfile from "@project-assets/gray buddy.png";

const ICON_TILT_CLASS = [
  "tb-nav-tilt-0",
  "tb-nav-tilt-1",
  "tb-nav-tilt-2",
  "tb-nav-tilt-3",
  "tb-nav-tilt-4",
] as const;

function routeMatches(path: string, pathname: string): boolean {
  if (path === "/") return pathname === "/" || pathname === "";
  return pathname === path || pathname.startsWith(`${path}/`);
}

interface NavItemDef {
  id: string;
  icon: string;
  path: string;
  label: string;
  description: string;
}

const navItems: readonly NavItemDef[] = [
  {
    id: "profile",
    icon: iconProfile,
    path: "/profile",
    label: "Profile",
    description: "Your public profile and wall posts",
  },
  {
    id: "chef",
    icon: iconChef,
    path: "/my-recipes",
    label: "Recipes",
    description: "Recipes you create and save for yourself",
  },
  {
    id: "home",
    icon: iconHome,
    path: "/",
    label: "Buddies",
    description: "Buddy board — see buddies and recipes",
  },
  {
    id: "welcome",
    icon: iconSave,
    path: "/friend-recipe",
    label: "Saved",
    description: "Recipes you saved for buddy profiles on this device",
  },
  {
    id: "whisk",
    icon: iconWhisk,
    path: "/whisk",
    label: "Make",
    description: "Make a recipe step-by-step — ingredients and directions",
  },
];

function NavSlot({
  id,
  icon,
  path,
  label,
  description,
  index,
  pathname,
  navigate,
}: NavItemDef & { index: number; pathname: string; navigate: ReturnType<typeof useNavigate> }) {
  const active = routeMatches(path, pathname);
  return (
    <div className="tb-nav-slot">
      <button
        type="button"
        onClick={() => navigate(path)}
        title={description}
        aria-label={`${label}: ${description}`}
        aria-current={active ? "page" : undefined}
        className={`tb-nav-item${active ? " tb-nav-item--active" : ""}`}
      >
        <span className={`tb-nav-icon-frame ${ICON_TILT_CLASS[index % ICON_TILT_CLASS.length]!}`}>
          <img alt="" src={icon} draggable={false} className="tb-nav-icon-img" />
        </span>
        <span className="tb-nav-label share-tech-regular">{label}</span>
      </button>
    </div>
  );
}

export default function Navigation() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="tb-nav-dock">
      <nav aria-label="Main" className="tb-nav-bar">
        <div className="tb-nav-inner">
          {navItems.map((item, index) => (
            <NavSlot key={item.id} {...item} index={index} pathname={pathname} navigate={navigate} />
          ))}
        </div>
      </nav>
    </div>
  );
}

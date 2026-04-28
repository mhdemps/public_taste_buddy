import { useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import iconChef from "@project-assets/gray chef.png";
import iconWhisk from "@project-assets/whisk.svg";
import iconHome from "@project-assets/bud button.svg";
import iconSave from "@project-assets/checked off.svg";
import iconProfile from "@project-assets/gray buddy.png";
import imgSignOut from "@project-assets/sign out icon.svg";
import { fetchProfileByUserId } from "../../lib/communityApi";
import { useAuth } from "../context/AuthContext";
import {
  PROFILE_DISPLAY_SAVED_EVENT,
  type ProfileDisplaySavedDetail,
} from "../profileDisplayEvents";
import { HeaderPageHelp } from "./HeaderPageHelp";

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
    description: "Recipes you saved from the Buddy Board",
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

export default function Navigation({ helpContent }: { helpContent?: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [signOutLabel, setSignOutLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setSignOutLabel(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await fetchProfileByUserId(user.id);
      if (cancelled) return;
      if (data?.display_name?.trim()) {
        setSignOutLabel(data.display_name.trim());
      } else if (!error) {
        setSignOutLabel("Taste buddy");
      } else {
        setSignOutLabel(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, pathname]);

  useEffect(() => {
    const onSaved = (e: Event) => {
      const detail = (e as CustomEvent<ProfileDisplaySavedDetail>).detail;
      if (detail?.displayName) setSignOutLabel(detail.displayName);
    };
    window.addEventListener(PROFILE_DISPLAY_SAVED_EVENT, onSaved);
    return () => window.removeEventListener(PROFILE_DISPLAY_SAVED_EVENT, onSaved);
  }, []);

  const signOutTitle = signOutLabel
    ? `Sign out — you’re signed in as ${signOutLabel}. Return to Who’s Cooking`
    : "Sign out — return to Who’s Cooking";

  const hasHelp = helpContent != null;
  const innerClass = `tb-nav-inner${hasHelp ? " tb-nav-inner--with-help" : " tb-nav-inner--no-help"}`;

  return (
    <div className="tb-nav-dock">
      <nav aria-label="Main" className="tb-nav-bar">
        <div className={innerClass}>
          {hasHelp ? (
            <div className="tb-nav-slot tb-nav-slot--chrome">
              <div className="tb-nav-item">
                <HeaderPageHelp
                  iconFrameClassName={`tb-nav-icon-frame ${ICON_TILT_CLASS[0]!}`}
                  afterButton={<span className="tb-nav-label share-tech-regular">Help</span>}
                >
                  {helpContent}
                </HeaderPageHelp>
              </div>
            </div>
          ) : null}
          {navItems.map((item, index) => (
            <NavSlot key={item.id} {...item} index={index} pathname={pathname} navigate={navigate} />
          ))}
          {user ? (
            <div className="tb-nav-slot tb-nav-slot--chrome">
              <button
                type="button"
                className="tb-nav-item"
                onClick={() => void signOut()}
                title={signOutTitle}
                aria-label={signOutTitle}
              >
                <span className={`tb-nav-icon-frame ${ICON_TILT_CLASS[3]!}`}>
                  <img alt="" src={imgSignOut} draggable={false} className="tb-nav-icon-img" />
                </span>
                <span className="tb-nav-label share-tech-regular">Sign out</span>
              </button>
            </div>
          ) : null}
        </div>
      </nav>
    </div>
  );
}

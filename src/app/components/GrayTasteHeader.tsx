import imgTasteBuddyLogo from "@project-assets/trans-orange.png";
import { useAuth } from "../context/AuthContext";

/** Same size/position everywhere — centered above page content */
export default function GrayTasteHeader({ showSignOut = true }: { showSignOut?: boolean }) {
  const { user, signOut } = useAuth();

  return (
    <header className="tb-header">
      {showSignOut && user ? (
        <button
          type="button"
          className="tb-header-sign-out share-tech-regular"
          onClick={() => void signOut()}
        >
          Switch profile
        </button>
      ) : null}
      <img
        src={imgTasteBuddyLogo}
        alt="Taste Buddy — share and explore public taste profiles"
        className="tb-header-logo"
        draggable={false}
      />
    </header>
  );
}
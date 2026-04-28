import imgLineLogo from "@project-assets/Line Logo.svg";
import imgTasteBuddyLogo from "@project-assets/trans-orange.png";
import { useAuth } from "../context/AuthContext";

/** Same size/position everywhere — centered above page content */
export default function GrayTasteHeader({ showSignOut = true }: { showSignOut?: boolean }) {
  const { user } = useAuth();

  const signedIn = Boolean(showSignOut && user);

  const headerLogoSrc = signedIn ? imgLineLogo : imgTasteBuddyLogo;

  return (
    <header className={`tb-header${signedIn ? " tb-header--signed-in" : ""}`}>
      {signedIn ? (
        <div className="tb-header-line-bleed">
          <div className="tb-header-line-track">
            <img
              src={headerLogoSrc}
              alt="Taste Buddy — share and explore public taste profiles"
              className="tb-header-logo tb-header-logo--line"
              draggable={false}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="tb-header-slot tb-header-slot--start" />
          <div className="tb-header-slot tb-header-slot--center">
            <div className="tb-header-brand-block">
              <img
                src={headerLogoSrc}
                alt="Taste Buddy — share and explore public taste profiles"
                className="tb-header-logo"
                draggable={false}
              />
            </div>
          </div>
          <div className="tb-header-slot tb-header-slot--end" />
        </>
      )}
    </header>
  );
}

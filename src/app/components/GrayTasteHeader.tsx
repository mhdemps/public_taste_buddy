import imgTasteBuddyLogo from "@project-assets/trans-orange.png";

/** Same size/position everywhere — centered above page content */
export default function GrayTasteHeader() {
  return (
    <header className="tb-header">
      <img
        src={imgTasteBuddyLogo}
        alt="Taste Buddy — share and explore public taste profiles"
        className="tb-header-logo"
        draggable={false}
      />
    </header>
  );
}

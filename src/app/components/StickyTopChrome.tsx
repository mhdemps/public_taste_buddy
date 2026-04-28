import GrayTasteHeader from "./GrayTasteHeader";
import Navigation from "./Navigation";

/** Header + bottom nav pinned to the top of the scroll shell (see `.tb-sticky-top-chrome`). */
export default function StickyTopChrome() {
  return (
    <div className="tb-sticky-top-chrome">
      <GrayTasteHeader />
      <Navigation />
    </div>
  );
}

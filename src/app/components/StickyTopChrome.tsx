import type { ComponentProps } from "react";
import GrayTasteHeader from "./GrayTasteHeader";
import Navigation from "./Navigation";

/** Header + bottom nav pinned to the top of the scroll shell (see `.tb-sticky-top-chrome`). */
export default function StickyTopChrome(props: ComponentProps<typeof GrayTasteHeader>) {
  const { helpContent, ...headerProps } = props;
  return (
    <div className="tb-sticky-top-chrome">
      <GrayTasteHeader {...headerProps} />
      <Navigation helpContent={helpContent} />
    </div>
  );
}

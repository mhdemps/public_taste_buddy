import { Outlet, useLocation } from "react-router";
import { LayoutGroup } from "motion/react";

/**
 * Shared layout scope so the main mascot can morph across / → /welcome → /home
 * without opacity cross-fades on the character.
 */
export default function AppRootLayout() {
  const location = useLocation();
  return (
    <LayoutGroup id="tastebuddy-mascot-scope">
      <Outlet key={location.pathname} />
    </LayoutGroup>
  );
}

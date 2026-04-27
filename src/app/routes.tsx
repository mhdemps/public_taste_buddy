import { createBrowserRouter, Navigate } from "react-router";
import AppRootLayout from "./AppRootLayout";
import ProtectedLayout from "./ProtectedLayout";
import ChooseProfilePage from "./pages/ChooseProfilePage";
import TextInPage from "./pages/TextInPage";
import HomePage from "./pages/HomePage";
import CommunityWallPage from "./pages/CommunityWallPage";
import ProfilePage from "./pages/ProfilePage";
import CustomizeBuddyPage from "./pages/CustomizeBuddyPage";
import MemberProfilePage from "./pages/MemberProfilePage";
import BuddiesPage from "./pages/BuddiesPage";
import BuddyInfoPage from "./pages/BuddyInfoPage";
import AddBuddyPage from "./pages/AddBuddyPage";
import MakeRecipesPage from "./pages/MakeRecipesPage";
import FriendRecipePage from "./pages/FriendRecipePage";
import MyRecipesPage from "./pages/MyRecipesPage";

function LegacyPartyRedirect() {
  return <Navigate to="/whisk" replace />;
}

export const router = createBrowserRouter([
  { path: "/sign-in", Component: ChooseProfilePage },
  {
    Component: ProtectedLayout,
    children: [
      {
        path: "/",
        Component: AppRootLayout,
        children: [
          { index: true, Component: CommunityWallPage },
          { path: "welcome", Component: TextInPage },
          { path: "home", Component: HomePage },
          { path: "profile", Component: ProfilePage },
          { path: "profile/customize-buddy", Component: CustomizeBuddyPage },
          { path: "member/:userId", Component: MemberProfilePage },
          { path: "buddies", Component: BuddiesPage },
          { path: "buddy/:buddyId", Component: BuddyInfoPage },
          { path: "add-buddy", Component: AddBuddyPage },
          { path: "party/edit/:partyId", Component: LegacyPartyRedirect },
          { path: "party/add", Component: LegacyPartyRedirect },
          { path: "party", Component: LegacyPartyRedirect },
          { path: "whisk/cook/:source/:recipeId", Component: MakeRecipesPage },
          { path: "whisk", Component: MakeRecipesPage },
          { path: "friend-recipe/edit/:recipeId", Component: FriendRecipePage },
          { path: "friend-recipe/add", element: <Navigate to="/friend-recipe" replace /> },
          { path: "friend-recipe", Component: FriendRecipePage },
          { path: "my-recipes/edit/:recipeId", Component: MyRecipesPage },
          { path: "my-recipes/add", Component: MyRecipesPage },
          { path: "my-recipes", Component: MyRecipesPage },
        ],
      },
    ],
  },
]);

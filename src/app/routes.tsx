import { createBrowserRouter } from "react-router";
import AppRootLayout from "./AppRootLayout";
import StartScreenPage from "./pages/StartScreenPage";
import TextInPage from "./pages/TextInPage";
import HomePage from "./pages/HomePage";
import BuddiesPage from "./pages/BuddiesPage";
import BuddyInfoPage from "./pages/BuddyInfoPage";
import AddBuddyPage from "./pages/AddBuddyPage";
import AttendPartyPage from "./pages/AttendPartyPage";
import FriendRecipePage from "./pages/FriendRecipePage";
import MyRecipesPage from "./pages/MyRecipesPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppRootLayout,
    children: [
      { index: true, Component: StartScreenPage },
      { path: "welcome", Component: TextInPage },
      { path: "home", Component: HomePage },
      { path: "buddies", Component: BuddiesPage },
      { path: "buddy/:buddyId", Component: BuddyInfoPage },
      { path: "add-buddy", Component: AddBuddyPage },
      { path: "party/edit/:partyId", Component: AttendPartyPage },
      { path: "party/add", Component: AttendPartyPage },
      { path: "party", Component: AttendPartyPage },
      { path: "friend-recipe/edit/:recipeId", Component: FriendRecipePage },
      { path: "friend-recipe/add", Component: FriendRecipePage },
      { path: "friend-recipe", Component: FriendRecipePage },
      { path: "my-recipes/edit/:recipeId", Component: MyRecipesPage },
      { path: "my-recipes/add", Component: MyRecipesPage },
      { path: "my-recipes", Component: MyRecipesPage },
    ],
  },
]);

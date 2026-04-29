import imgBreadDisplay from "@project-assets/bread display.svg";
import imgBurgerDisplay from "@project-assets/burger display.svg";
import imgCakeDisplay from "@project-assets/cake display.svg";
import imgChickenDisplay from "@project-assets/chicken display.svg";
import imgChefyDisplay from "@project-assets/chefy display.svg";
import imgCupcakeDisplay from "@project-assets/cupcake display.svg";
import imgEggDisplay from "@project-assets/egg display.svg";
import imgFineDineDisplay from "@project-assets/fine dine display.svg";
import imgFishDisplay from "@project-assets/fish display.svg";
import imgFunDrinkDisplay from "@project-assets/fun drink display.svg";
import imgLickDisplay from "@project-assets/lick display.svg";
import imgPastaDisplay from "@project-assets/pasta display.svg";
import imgPizzaDisplay from "@project-assets/pizza display.svg";
import imgPlateDisplay from "@project-assets/plate display.svg";
import imgRamenDisplay from "@project-assets/ramen display.svg";
import imgSaladDisplay from "@project-assets/salad display.svg";
import imgSoupDisplay from "@project-assets/soup display.svg";
import imgSteakDisplay from "@project-assets/steak display.svg";
import imgTastyDisplay from "@project-assets/tasty display.svg";
import imgYumDisplay from "@project-assets/yum display.svg";

export const RECIPE_DISPLAY_OPTIONS = [
  { id: "egg", label: "Egg", src: imgEggDisplay },
  { id: "fish", label: "Fish", src: imgFishDisplay },
  { id: "chicken", label: "Chicken", src: imgChickenDisplay },
  { id: "salad", label: "Salad", src: imgSaladDisplay },
  { id: "soup", label: "Soup", src: imgSoupDisplay },
  { id: "steak", label: "Steak", src: imgSteakDisplay },
  { id: "fine_dine", label: "Fine dining", src: imgFineDineDisplay },
  { id: "chefy", label: "Chefy", src: imgChefyDisplay },
  { id: "plate", label: "Plate", src: imgPlateDisplay },
  { id: "burger", label: "Burger", src: imgBurgerDisplay },
  { id: "pizza", label: "Pizza", src: imgPizzaDisplay },
  { id: "pasta", label: "Pasta", src: imgPastaDisplay },
  { id: "ramen", label: "Ramen", src: imgRamenDisplay },
  { id: "bread", label: "Bread", src: imgBreadDisplay },
  { id: "fun_drink", label: "Fun drink", src: imgFunDrinkDisplay },
  { id: "lick", label: "Lick", src: imgLickDisplay },
  { id: "yum", label: "Yum", src: imgYumDisplay },
  { id: "tasty", label: "Tasty", src: imgTastyDisplay },
  { id: "cupcake", label: "Cupcake", src: imgCupcakeDisplay },
  { id: "cake", label: "Cake", src: imgCakeDisplay },
] as const;

export type RecipeDisplayId = (typeof RECIPE_DISPLAY_OPTIONS)[number]["id"];

const DISPLAY_ID_SET = new Set<string>(RECIPE_DISPLAY_OPTIONS.map((o) => o.id));

export function isRecipeDisplayId(id: string | undefined): id is RecipeDisplayId {
  return typeof id === "string" && DISPLAY_ID_SET.has(id);
}

export function recipeDisplaySrc(id: string | undefined): string | undefined {
  if (!id) return undefined;
  return RECIPE_DISPLAY_OPTIONS.find((o) => o.id === id)?.src;
}

export async function recipeDisplayToDataUrl(id: string): Promise<string | null> {
  const src = recipeDisplaySrc(id);
  if (!src) return null;
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(typeof fr.result === "string" ? fr.result : null);
      fr.onerror = () => reject(fr.error);
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function resolveRecipeCoverDataUrl(r: {
  recipe_photo?: string;
  recipe_display_id?: string;
}): Promise<string | null> {
  if (r.recipe_photo?.startsWith("data:image/")) return r.recipe_photo;
  if (isRecipeDisplayId(r.recipe_display_id)) {
    return recipeDisplayToDataUrl(r.recipe_display_id);
  }
  return null;
}

/** For `<img src>` — data URL from an old upload or a bundled illustration URL. */
export function recipeCoverImageSrc(r: {
  recipe_photo?: string;
  recipe_display_id?: string;
}): string | undefined {
  if (r.recipe_photo?.startsWith("data:image/")) return r.recipe_photo;
  return recipeDisplaySrc(r.recipe_display_id);
}

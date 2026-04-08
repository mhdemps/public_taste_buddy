import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import buddyPurple from "@project-assets/purple buddy.png";
import buddyCyan from "@project-assets/blue buddy.png";
import buddyYellow from "@project-assets/yellow buddy.png";
import buddyGreen from "@project-assets/green buddy.png";
import buddyRed from "@project-assets/red buddy.png";
import buddyOrange from "@project-assets/orange buddy.png";
import buddyPurpleSmile from "@project-assets/purple buddy smile.png";
import buddyCyanSmile from "@project-assets/blue buddy smile.png";
import buddyYellowSmile from "@project-assets/yellow buddy smile.png";
import buddyGreenSmile from "@project-assets/green buddy smile.png";
import buddyRedSmile from "@project-assets/red buddy smile.png";
import buddyOrangeSmile from "@project-assets/orange buddy smile.png";
import lightCirclePurple from "@project-assets/light purple circle.png";
import lightCircleBlue from "@project-assets/light blue circle.png";
import lightCircleYellow from "@project-assets/light yellow circle.png";
import lightCircleGreen from "@project-assets/light green circle.png";
import lightCircleRed from "@project-assets/light red circle.png";
import lightCircleOrange from "@project-assets/light orange circle.png";

export interface Buddy {
  id: string;
  name: string;
  buddyImage: string;
  smilingImage: string;
  circleImage: string;
  backgroundColor: string;
  favoriteFood?: string;
  personality?: string;
  specialty?: string;
  partiesAttended?: number;
  recipesGiven?: string;
  /** Foods to avoid — free text or comma-separated tags */
  allergies?: string;
}

export interface BuddyEditablePayload {
  name: string;
  favoriteFood: string;
  personality: string;
  specialty: string;
  partiesAttended: string;
  recipesGiven: string;
  allergies: string;
}

interface BuddiesContextType {
  buddies: Buddy[];
  addBuddy: (buddy: Omit<Buddy, "id" | "buddyImage" | "smilingImage" | "circleImage" | "backgroundColor">) => void;
  updateBuddy: (id: string, payload: BuddyEditablePayload) => void;
  removeBuddy: (id: string) => void;
  getBuddyById: (id: string) => Buddy | undefined;
}

const BuddiesContext = createContext<BuddiesContextType | undefined>(undefined);

const buddyImages = [buddyPurple, buddyCyan, buddyYellow, buddyGreen, buddyRed, buddyOrange];
const buddySmilingImages = [buddyPurpleSmile, buddyCyanSmile, buddyYellowSmile, buddyGreenSmile, buddyRedSmile, buddyOrangeSmile];
/** Indexed same as buddy colors: purple, cyan/blue, yellow, green, red, orange — never use index i behind buddy i */
const lightCircles = [
  lightCirclePurple,
  lightCircleBlue,
  lightCircleYellow,
  lightCircleGreen,
  lightCircleRed,
  lightCircleOrange,
];

/**
 * Buddy asset color 0–5: purple, cyan, yellow, green, red, orange.
 * Circle art index matches reference layout (always contrasts buddy hue).
 */
export function getBuddyColorIndex(buddyImage: string): number {
  const i = buddyImages.findIndex((img) => img === buddyImage);
  return i === -1 ? 0 : i;
}

/** Reference pairings: Bip purple→yellow, Bop cyan→orange, George yellow→purple, etc. */
const CIRCLE_FOR_BUDDY_COLOR = [2, 5, 0, 1, 3, 0] as const;

export function circleForBuddyColor(buddyColorIndex: number): string {
  const idx = CIRCLE_FOR_BUDDY_COLOR[Math.min(buddyColorIndex, 5)] ?? 2;
  if (idx === buddyColorIndex) {
    const fallback = [0, 1, 2, 3, 4, 5].find((c) => c !== buddyColorIndex) ?? 0;
    return lightCircles[fallback];
  }
  return lightCircles[idx];
}

/**
 * Buddies / buddy profile must not load these assets (legacy URLs in localStorage included).
 */
function decodeUrlLoose(url: string): string {
  try {
    return decodeURIComponent(url).toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

function urlReferencesBannedBuddyAsset(url: string): boolean {
  const s = decodeUrlLoose(url);
  return (
    s.includes("orange shadow") ||
    s.includes("orange smile shadow") ||
    s.includes("orange party") ||
    s.includes("party-top-buddy")
  );
}

function inferBuddyColorIndexFromUrls(b: Buddy): number {
  const s = decodeUrlLoose(`${b.buddyImage} ${b.smilingImage}`);
  if (s.includes("purple buddy")) return 0;
  if (s.includes("blue buddy")) return 1;
  if (s.includes("yellow buddy")) return 2;
  if (s.includes("green buddy")) return 3;
  if (s.includes("red buddy")) return 4;
  if (s.includes("orange buddy")) return 5;
  if (s.includes("orange shadow") || s.includes("orange smile shadow") || s.includes("orange party")) return 5;
  return 0;
}

function migrateBannedBuddyPageAssets(list: Buddy[]): Buddy[] {
  return list.map((b) => {
    const bad =
      urlReferencesBannedBuddyAsset(b.buddyImage) ||
      urlReferencesBannedBuddyAsset(b.smilingImage);
    if (!bad) return b;
    const idx = inferBuddyColorIndexFromUrls(b);
    return {
      ...b,
      buddyImage: buddyImages[idx]!,
      smilingImage: buddySmilingImages[idx]!,
    };
  });
}

function migrateBuddyCircles(list: Buddy[]): Buddy[] {
  return list.map((b) => ({
    ...b,
    circleImage: circleForBuddyColor(getBuddyColorIndex(b.buddyImage)),
  }));
}

const backgroundColors = ["#b19cd9", "#7dd3d3", "#ffd966", "#93c47d", "#ea9999", "#f6b26b"];

const initialBuddySeeds: Omit<Buddy, "circleImage">[] = [
  {
    id: "bip",
    name: "Bip",
    buddyImage: buddyPurple,
    smilingImage: buddyPurpleSmile,
    backgroundColor: "#b19cd9",
    favoriteFood: "Blueberry pancakes",
    personality: "Cheerful and energetic",
    specialty: "Breakfast dishes"
  },
  {
    id: "bop",
    name: "Bop",
    buddyImage: buddyCyan,
    smilingImage: buddyCyanSmile,
    backgroundColor: "#7dd3d3",
    favoriteFood: "Seafood pasta",
    personality: "Calm and collected",
    specialty: "Seafood cuisine"
  },
  {
    id: "george",
    name: "George",
    buddyImage: buddyYellow,
    smilingImage: buddyYellowSmile,
    backgroundColor: "#ffd966",
    favoriteFood: "Lemon tart",
    personality: "Creative and curious",
    specialty: "Desserts & pastries"
  },
  {
    id: "redbud",
    name: "Red Bud",
    buddyImage: buddyGreen,
    smilingImage: buddyGreenSmile,
    backgroundColor: "#93c47d",
    favoriteFood: "Fresh salads",
    personality: "Health-conscious and wise",
    specialty: "Healthy cooking"
  },
  {
    id: "gabby",
    name: "Gabby",
    buddyImage: buddyRed,
    smilingImage: buddyRedSmile,
    backgroundColor: "#ea9999",
    favoriteFood: "Spicy tacos",
    personality: "Bold and adventurous",
    specialty: "Spicy dishes"
  },
  {
    id: "madi",
    name: "Madi",
    buddyImage: buddyOrange,
    smilingImage: buddyOrangeSmile,
    backgroundColor: "#f6b26b",
    favoriteFood: "Pumpkin soup",
    personality: "Warm and friendly",
    specialty: "Comfort food"
  },
  {
    id: "riley",
    name: "Riley",
    buddyImage: buddyYellow,
    smilingImage: buddyYellowSmile,
    backgroundColor: "#ffd966",
    favoriteFood: "Banana bread",
    personality: "Sweet and caring",
    specialty: "Baked goods"
  },
];

const initialBuddies: Buddy[] = initialBuddySeeds.map((b) => ({
  ...b,
  circleImage: circleForBuddyColor(getBuddyColorIndex(b.buddyImage)),
}));

export function BuddiesProvider({ children }: { children: ReactNode }) {
  const [buddies, setBuddies] = useState<Buddy[]>(() => {
    const saved = localStorage.getItem("tasteBuddyBuddies");
    if (!saved) return initialBuddies;
    const parsed = JSON.parse(saved) as Buddy[];
    return migrateBuddyCircles(migrateBannedBuddyPageAssets(parsed));
  });

  useEffect(() => {
    localStorage.setItem('tasteBuddyBuddies', JSON.stringify(buddies));
  }, [buddies]);

  const addBuddy = (newBuddy: Omit<Buddy, "id" | "buddyImage" | "smilingImage" | "circleImage" | "backgroundColor">) => {
    const randomIndex = Math.floor(Math.random() * buddyImages.length);

    const id = `buddy-${Date.now()}`;
    const buddy: Buddy = {
      ...newBuddy,
      id,
      buddyImage: buddyImages[randomIndex],
      smilingImage: buddySmilingImages[randomIndex],
      circleImage: circleForBuddyColor(randomIndex),
      backgroundColor: backgroundColors[randomIndex],
    };

    setBuddies([...buddies, buddy]);
  };

  const trimOrUndef = (s: string) => {
    const t = s.trim();
    return t === "" ? undefined : t;
  };

  const updateBuddy = (id: string, payload: BuddyEditablePayload) => {
    const partiesRaw = payload.partiesAttended.trim();
    let partiesAttended: number | undefined;
    if (partiesRaw === "") partiesAttended = undefined;
    else {
      const n = Number.parseInt(partiesRaw, 10);
      partiesAttended = Number.isNaN(n) ? undefined : n;
    }

    setBuddies(
      buddies.map((b) =>
        b.id !== id
          ? b
          : {
              ...b,
              name: payload.name.trim() || b.name,
              favoriteFood: trimOrUndef(payload.favoriteFood),
              personality: trimOrUndef(payload.personality),
              specialty: trimOrUndef(payload.specialty),
              recipesGiven: trimOrUndef(payload.recipesGiven),
              allergies: trimOrUndef(payload.allergies),
              partiesAttended,
            }
      )
    );
  };

  const removeBuddy = (id: string) => {
    setBuddies(buddies.filter(buddy => buddy.id !== id));
  };

  const getBuddyById = (id: string) => {
    return buddies.find(buddy => buddy.id === id);
  };

  return (
    <BuddiesContext.Provider value={{ buddies, addBuddy, updateBuddy, removeBuddy, getBuddyById }}>
      {children}
    </BuddiesContext.Provider>
  );
}

export function useBuddies() {
  const context = useContext(BuddiesContext);
  if (!context) {
    throw new Error("useBuddies must be used within BuddiesProvider");
  }
  return context;
}

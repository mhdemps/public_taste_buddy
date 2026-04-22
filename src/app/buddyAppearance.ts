import lightCirclePurple from "@project-assets/light purple circle.png";
import lightCircleBlue from "@project-assets/light blue circle.png";
import lightCircleYellow from "@project-assets/light yellow circle.png";
import lightCircleGreen from "@project-assets/light green circle.png";
import lightCircleRed from "@project-assets/light red circle.png";
import lightCircleOrange from "@project-assets/light orange circle.png";

import blueBody from "../../assets/Blue.svg";
import greenBody from "../../assets/Green.svg";
import orangeBody from "../../assets/Orange.svg";
import pinkBody from "../../assets/Pink.svg";
import purpleBody from "../../assets/Purple.svg";
import yellowBody from "../../assets/Yellow.svg";

import buckTeefSmile from "../../assets/Buck Teeth.svg";
import grinSmile from "../../assets/Grin.svg";
import happySmile from "../../assets/Happy.svg";
import smileSmile from "../../assets/Smile.svg";
import smirkSmile from "../../assets/Smirk.svg";

import chefHat from "../../assets/Chef.svg";
import cowboyHat from "../../assets/Cowboy.svg";
import jdHat from "../../assets/Spinny.svg";
import partyHat from "../../assets/Party Hat.svg";
import sousChefHat from "../../assets/Sous Chef.svg";

export type BuddyBodyKey = "purple" | "blue" | "yellow" | "green" | "pink" | "orange";
export type BuddyHatKey = "none" | "chef" | "sous-chef" | "cowboy" | "party" | "jd";
export type BuddySmileKey = "smile" | "happy" | "grin" | "smirk" | "buck-teef";

export type BuddySvgSelection = {
  bodyKey: BuddyBodyKey;
  hatKey: BuddyHatKey;
  smileKey: BuddySmileKey;
};

type Option<T extends string> = {
  key: T;
  label: string;
  asset?: string;
};

const lightCircles = [
  lightCirclePurple,
  lightCircleBlue,
  lightCircleYellow,
  lightCircleGreen,
  lightCircleRed,
  lightCircleOrange,
] as const;

/** Stored as `buddy_color_index` in profiles: which light circle PNG (0–5). */
export const BUDDY_CIRCLE_COUNT = lightCircles.length;

export const buddyCircleBackgroundLabels = [
  "Light purple",
  "Light blue",
  "Light yellow",
  "Light green",
  "Light red",
  "Light orange",
] as const;

const CIRCLE_FOR_BUDDY_COLOR = [2, 5, 0, 1, 3, 0] as const;

export const buddyBodyOptions: readonly Option<BuddyBodyKey>[] = [
  { key: "purple", label: "Purple", asset: purpleBody },
  { key: "blue", label: "Blue", asset: blueBody },
  { key: "yellow", label: "Yellow", asset: yellowBody },
  { key: "green", label: "Green", asset: greenBody },
  { key: "pink", label: "Pink", asset: pinkBody },
  { key: "orange", label: "Orange", asset: orangeBody },
] as const;

export const buddyHatOptions: readonly Option<BuddyHatKey>[] = [
  { key: "none", label: "None" },
  { key: "chef", label: "Chef toque", asset: chefHat },
  { key: "sous-chef", label: "Sous-chef", asset: sousChefHat },
  { key: "cowboy", label: "Cowboy hat", asset: cowboyHat },
  { key: "party", label: "Party hat", asset: partyHat },
  { key: "jd", label: "Ball cap", asset: jdHat },
] as const;

export const buddySmileOptions: readonly Option<BuddySmileKey>[] = [
  { key: "smile", label: "Classic smile", asset: smileSmile },
  { key: "happy", label: "Beaming", asset: happySmile },
  { key: "grin", label: "Big grin", asset: grinSmile },
  { key: "smirk", label: "Smirk", asset: smirkSmile },
  { key: "buck-teef", label: "Goofy teeth", asset: buckTeefSmile },
] as const;

const bodyIndexByKey: Record<BuddyBodyKey, number> = {
  purple: 0,
  blue: 1,
  yellow: 2,
  green: 3,
  pink: 4,
  orange: 5,
};

const legacyBodyKeyByPaletteIndex: BuddyBodyKey[] = ["purple", "blue", "yellow", "green", "pink", "orange"];

const bodyAssetByKey: Record<BuddyBodyKey, string> = Object.fromEntries(
  buddyBodyOptions.map((option) => [option.key, option.asset!])
) as Record<BuddyBodyKey, string>;

const hatAssetByKey: Record<Exclude<BuddyHatKey, "none">, string> = {
  chef: chefHat,
  "sous-chef": sousChefHat,
  cowboy: cowboyHat,
  party: partyHat,
  jd: jdHat,
};

const smileAssetByKey: Record<BuddySmileKey, string> = Object.fromEntries(
  buddySmileOptions.map((option) => [option.key, option.asset!])
) as Record<BuddySmileKey, string>;

export function getDefaultBuddySvgSelection(): BuddySvgSelection {
  return {
    bodyKey: "purple",
    hatKey: "none",
    smileKey: "smile",
  };
}

export function paletteIndexFromBodyKey(bodyKey: BuddyBodyKey): number {
  return bodyIndexByKey[bodyKey];
}

export function bodyKeyFromPaletteIndex(paletteIndex: number): BuddyBodyKey {
  const i = Math.max(0, Math.min(legacyBodyKeyByPaletteIndex.length - 1, Math.floor(paletteIndex)));
  return legacyBodyKeyByPaletteIndex[i] ?? "purple";
}

export function coerceBuddyBodyKey(value: string | null | undefined, fallbackPaletteIndex = 0): BuddyBodyKey {
  if (value && value in bodyIndexByKey) {
    return value as BuddyBodyKey;
  }
  return bodyKeyFromPaletteIndex(fallbackPaletteIndex);
}

export function coerceBuddyHatKey(value: string | null | undefined): BuddyHatKey {
  if (value === "chef" || value === "sous-chef" || value === "cowboy" || value === "party" || value === "jd") {
    return value;
  }
  return "none";
}

export function coerceBuddySmileKey(value: string | null | undefined): BuddySmileKey {
  if (value === "smile" || value === "happy" || value === "grin" || value === "smirk" || value === "buck-teef") {
    return value;
  }
  return "smile";
}

export function coerceBuddySvgSelection(
  input:
    | Partial<BuddySvgSelection>
    | {
        buddy_body_key?: string | null;
        buddy_hat_key?: string | null;
        buddy_smile_key?: string | null;
        buddy_color_index?: number | null;
      }
    | null
    | undefined
): BuddySvgSelection {
  const bodyValue =
    typeof input === "object" && input
      ? "buddy_body_key" in input
        ? input.buddy_body_key
        : input.bodyKey
      : undefined;

  const hatValue =
    typeof input === "object" && input
      ? "buddy_hat_key" in input
        ? input.buddy_hat_key
        : input.hatKey
      : undefined;

  const smileValue =
    typeof input === "object" && input
      ? "buddy_smile_key" in input
        ? input.buddy_smile_key
        : input.smileKey
      : undefined;

  return {
    bodyKey: coerceBuddyBodyKey(bodyValue, 0),
    hatKey: coerceBuddyHatKey(hatValue),
    smileKey: coerceBuddySmileKey(smileValue),
  };
}

export function circleForBuddyColorIndex(buddyColorIndex: number): string {
  const clampedIndex = Math.max(0, Math.min(5, Math.floor(buddyColorIndex)));
  const circleIndex = CIRCLE_FOR_BUDDY_COLOR[clampedIndex] ?? 2;
  return lightCircles[circleIndex] ?? lightCircleYellow;
}

/** Circle art for a saved profile / wall card (`buddy_color_index`). */
export function getLightCircleImageAtIndex(circleIndex: number): string {
  const i = Math.max(0, Math.min(lightCircles.length - 1, Math.floor(circleIndex)));
  return lightCircles[i] ?? lightCirclePurple;
}

export function getBuddyCircleBackgroundLabel(circleIndex: number): string {
  const i = Math.max(0, Math.min(buddyCircleBackgroundLabels.length - 1, Math.floor(circleIndex)));
  return buddyCircleBackgroundLabels[i] ?? "Light purple";
}

export function getBuddyCircleImage(bodyKey: BuddyBodyKey): string {
  return circleForBuddyColorIndex(paletteIndexFromBodyKey(bodyKey));
}

export function getBuddyBodyAsset(bodyKey: BuddyBodyKey): string {
  return bodyAssetByKey[bodyKey];
}

export function getBuddyHatAsset(hatKey: BuddyHatKey): string | null {
  return hatKey === "none" ? null : hatAssetByKey[hatKey];
}

export function getBuddySmileAsset(smileKey: BuddySmileKey): string {
  return smileAssetByKey[smileKey];
}

export function getBuddyBodyLabel(bodyKey: BuddyBodyKey): string {
  return buddyBodyOptions.find((option) => option.key === bodyKey)?.label ?? "Purple";
}

export function getBuddyHatLabel(hatKey: BuddyHatKey): string {
  return buddyHatOptions.find((option) => option.key === hatKey)?.label ?? "None";
}

export function getBuddySmileLabel(smileKey: BuddySmileKey): string {
  return buddySmileOptions.find((option) => option.key === smileKey)?.label ?? "Classic smile";
}

export function cycleBuddyOption<T extends string>(options: readonly Option<T>[], current: T, direction: -1 | 1): T {
  const currentIndex = Math.max(
    0,
    options.findIndex((option) => option.key === current)
  );
  const nextIndex = (currentIndex + direction + options.length) % options.length;
  return options[nextIndex]?.key ?? current;
}

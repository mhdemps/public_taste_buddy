import lightPurpleSvg from "../../assets/light purple.svg";
import lightBlueSvg from "../../assets/light blue.svg";
import lightYellowSvg from "../../assets/light yellow.svg";
import lightGreenSvg from "../../assets/light green.svg";
import lightRedSvg from "../../assets/light red.svg";
import lightOrangeSvg from "../../assets/light orange.svg";
import lightPinkSvg from "../../assets/light pink.svg";

import colorPurpleSvg from "../../assets/Purple.svg";
import colorBlueSvg from "../../assets/Blue.svg";
import colorYellowSvg from "../../assets/Yellow.svg";
import colorGreenSvg from "../../assets/Green.svg";
import colorPinkSvg from "../../assets/Pink.svg";
import colorOrangeSvg from "../../assets/Orange.svg";
import colorRedSvg from "../../assets/red.svg";

import darkPurpleSvg from "../../assets/dark purple.svg";
import darkBlueSvg from "../../assets/dark blue.svg";
import darkYellowSvg from "../../assets/dark yellow.svg";
import darkGreenSvg from "../../assets/dark green.svg";
import darkRedSvg from "../../assets/dark red.svg";
import darkOrangeSvg from "../../assets/dark orange.svg";
import darkPinkSvg from "../../assets/dark pink.svg";

import purpleBody from "../../assets/purple body.svg";
import blueBody from "../../assets/blue body.svg";
import yellowBody from "../../assets/yellow body.svg";
import greenBody from "../../assets/green body.svg";
import pinkBody from "../../assets/pink body.svg";
import orangeBody from "../../assets/orange body.svg";
import redBody from "../../assets/red body.svg";

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
import beretHat from "../../assets/beret.svg";
import jesterHat from "../../assets/jester hat.svg";

import purpleBodyDisplay from "../../assets/purple body display.svg";
import blueBodyDisplay from "../../assets/blue body display.svg";
import yellowBodyDisplay from "../../assets/yellow body display.svg";
import greenBodyDisplay from "../../assets/green body display.svg";
import pinkBodyDisplay from "../../assets/pink body display.svg";
import orangeBodyDisplay from "../../assets/orange body display.svg";
import redBodyDisplay from "../../assets/red body display.svg";

import chefHatDisplay from "../../assets/chef display.svg";
import sousChefHatDisplay from "../../assets/sous chef display.svg";
import cowboyHatDisplay from "../../assets/cowboy display.svg";
import partyHatDisplay from "../../assets/party hat display.svg";
import spinnyHatDisplay from "../../assets/spinny display.svg";
import beretHatDisplay from "../../assets/beret display.svg";
import jesterHatDisplay from "../../assets/jester display.svg";
import noDisplayIcon from "../../assets/no display.svg";

import smileDisplay from "../../assets/smile display.svg";
import beamDisplay from "../../assets/beam display.svg";
import grinDisplay from "../../assets/grin display.svg";
import smirkDisplay from "../../assets/smirk display.svg";
import goofyTeethDisplay from "../../assets/goofy teeth display.svg";

import openEyes from "../../assets/open eyes.svg";
import heartEyes from "../../assets/heart eyes.svg";
import dizzyEyes from "../../assets/dizzy eyes.svg";
import winkEyes from "../../assets/wink eyes.svg";
import squintEyes from "../../assets/squint eyes.svg";
import upEyes from "../../assets/up eyes.svg";
import downEyes from "../../assets/down eyes.svg";
import openEyesDisplay from "../../assets/open eyes display.svg";
import heartEyesDisplay from "../../assets/heart eyes display.svg";
import dizzyEyesDisplay from "../../assets/dizzy display.svg";
import winkEyesDisplay from "../../assets/wink display.svg";
import squintEyesDisplay from "../../assets/squint display.svg";
import upEyesDisplay from "../../assets/up eyes display.svg";
import downEyesDisplay from "../../assets/down eyes display.svg";
/** Flat list: light SVG (0–6), color SVG (7–13), dark SVG (14–20). */
const buddyBackdropSrcTable = [
  lightPurpleSvg,
  lightBlueSvg,
  lightYellowSvg,
  lightGreenSvg,
  lightRedSvg,
  lightOrangeSvg,
  lightPinkSvg,
  colorPurpleSvg,
  colorBlueSvg,
  colorYellowSvg,
  colorGreenSvg,
  colorPinkSvg,
  colorOrangeSvg,
  colorRedSvg,
  darkPurpleSvg,
  darkBlueSvg,
  darkYellowSvg,
  darkGreenSvg,
  darkRedSvg,
  darkOrangeSvg,
  darkPinkSvg,
] as const;

const buddyBackdropLabelTable = [
  "Light purple",
  "Light blue",
  "Light yellow",
  "Light green",
  "Light red",
  "Light orange",
  "Light pink",
  "Color purple",
  "Color blue",
  "Color yellow",
  "Color green",
  "Color pink",
  "Color orange",
  "Color red",
  "Dark purple",
  "Dark blue",
  "Dark yellow",
  "Dark green",
  "Dark red",
  "Dark orange",
  "Dark pink",
] as const;

/** Legacy three rows (light / color / dark); customize only offers the color row. */
export const BUDDY_BACKDROP_LIGHT_INDICES = [0, 1, 2, 3, 4, 5, 6] as const;
export const BUDDY_BACKDROP_COLOR_INDICES = [7, 8, 9, 10, 11, 12, 13] as const;
export const BUDDY_BACKDROP_DARK_INDICES = [14, 15, 16, 17, 18, 19, 20] as const;

/** Indices shown in Customize buddy backdrop strip (medium row only). */
export const BUDDY_BACKDROP_PICKER_INDICES = BUDDY_BACKDROP_COLOR_INDICES;

export type BuddyBodyKey = "purple" | "blue" | "yellow" | "green" | "pink" | "orange" | "red";
export type BuddyHatKey = "none" | "chef" | "sous-chef" | "cowboy" | "party" | "jd" | "beret" | "jester";
export type BuddySmileKey = "smile" | "happy" | "grin" | "smirk" | "buck-teef";
export type BuddyEyeKey = "none" | "open" | "heart" | "dizzy" | "wink" | "squint" | "up" | "down";

export type BuddySvgSelection = {
  bodyKey: BuddyBodyKey;
  eyeKey: BuddyEyeKey;
  hatKey: BuddyHatKey;
  smileKey: BuddySmileKey;
};

type Option<T extends string> = {
  key: T;
  label: string;
  /** Layer art on the buddy character */
  asset?: string;
  /** Customize-page chip thumbnail only (e.g. * display.svg) */
  pickerSrc?: string;
};

export const BUDDY_BACKDROP_COUNT = buddyBackdropSrcTable.length;

/** @deprecated Use BUDDY_BACKDROP_COUNT — kept for call sites that still say “circle”. */
export const BUDDY_CIRCLE_COUNT = BUDDY_BACKDROP_COUNT;

/** @deprecated Use getBuddyBackdropLabel */
export const buddyCircleBackgroundLabels = buddyBackdropLabelTable;

export const buddyBodyOptions: readonly Option<BuddyBodyKey>[] = [
  { key: "purple", label: "Purple", asset: purpleBody, pickerSrc: purpleBodyDisplay },
  { key: "blue", label: "Blue", asset: blueBody, pickerSrc: blueBodyDisplay },
  { key: "yellow", label: "Yellow", asset: yellowBody, pickerSrc: yellowBodyDisplay },
  { key: "green", label: "Green", asset: greenBody, pickerSrc: greenBodyDisplay },
  { key: "pink", label: "Pink", asset: pinkBody, pickerSrc: pinkBodyDisplay },
  { key: "orange", label: "Orange", asset: orangeBody, pickerSrc: orangeBodyDisplay },
  { key: "red", label: "Red", asset: redBody, pickerSrc: redBodyDisplay },
] as const;

export const buddyHatOptions: readonly Option<BuddyHatKey>[] = [
  { key: "none", label: "None", pickerSrc: noDisplayIcon },
  { key: "chef", label: "Chef toque", asset: chefHat, pickerSrc: chefHatDisplay },
  { key: "sous-chef", label: "Sous-chef", asset: sousChefHat, pickerSrc: sousChefHatDisplay },
  { key: "cowboy", label: "Cowboy hat", asset: cowboyHat, pickerSrc: cowboyHatDisplay },
  { key: "party", label: "Party hat", asset: partyHat, pickerSrc: partyHatDisplay },
  { key: "jd", label: "Ball cap", asset: jdHat, pickerSrc: spinnyHatDisplay },
  { key: "beret", label: "Beret", asset: beretHat, pickerSrc: beretHatDisplay },
  { key: "jester", label: "Jester", asset: jesterHat, pickerSrc: jesterHatDisplay },
] as const;

export const buddySmileOptions: readonly Option<BuddySmileKey>[] = [
  { key: "smile", label: "Classic smile", asset: smileSmile, pickerSrc: smileDisplay },
  { key: "happy", label: "Beaming", asset: happySmile, pickerSrc: beamDisplay },
  { key: "grin", label: "Big grin", asset: grinSmile, pickerSrc: grinDisplay },
  { key: "smirk", label: "Smirk", asset: smirkSmile, pickerSrc: smirkDisplay },
  { key: "buck-teef", label: "Goofy teeth", asset: buckTeefSmile, pickerSrc: goofyTeethDisplay },
] as const;

export const buddyEyeOptions: readonly Option<BuddyEyeKey>[] = [
  { key: "none", label: "No eyes", pickerSrc: noDisplayIcon },
  { key: "open", label: "Open", asset: openEyes, pickerSrc: openEyesDisplay },
  { key: "heart", label: "Heart", asset: heartEyes, pickerSrc: heartEyesDisplay },
  { key: "dizzy", label: "Dizzy", asset: dizzyEyes, pickerSrc: dizzyEyesDisplay },
  { key: "wink", label: "Wink", asset: winkEyes, pickerSrc: winkEyesDisplay },
  { key: "squint", label: "Squint", asset: squintEyes, pickerSrc: squintEyesDisplay },
  { key: "up", label: "Look up", asset: upEyes, pickerSrc: upEyesDisplay },
  { key: "down", label: "Look down", asset: downEyes, pickerSrc: downEyesDisplay },
] as const;

const bodyIndexByKey: Record<BuddyBodyKey, number> = {
  purple: 0,
  blue: 1,
  yellow: 2,
  green: 3,
  pink: 4,
  orange: 5,
  red: 6,
};

const legacyBodyKeyByPaletteIndex: BuddyBodyKey[] = ["purple", "blue", "yellow", "green", "pink", "orange", "red"];

const bodyAssetByKey: Record<BuddyBodyKey, string> = Object.fromEntries(
  buddyBodyOptions.map((option) => [option.key, option.asset!])
) as Record<BuddyBodyKey, string>;

const hatAssetByKey: Record<Exclude<BuddyHatKey, "none">, string> = {
  chef: chefHat,
  "sous-chef": sousChefHat,
  cowboy: cowboyHat,
  party: partyHat,
  jd: jdHat,
  beret: beretHat,
  jester: jesterHat,
};

const smileAssetByKey: Record<BuddySmileKey, string> = Object.fromEntries(
  buddySmileOptions.map((option) => [option.key, option.asset!])
) as Record<BuddySmileKey, string>;

const eyeAssetByKey: Record<Exclude<BuddyEyeKey, "none">, string> = {
  open: openEyes,
  heart: heartEyes,
  dizzy: dizzyEyes,
  wink: winkEyes,
  squint: squintEyes,
  up: upEyes,
  down: downEyes,
};

function clampBackdropIndex(index: number): number {
  return Math.max(0, Math.min(BUDDY_BACKDROP_COUNT - 1, Math.floor(index)));
}

/** Map any stored backdrop index to the medium “color” row (same column). Used when opening customize after a light/dark choice. */
export function toColorRowBackdropIndex(index: number): number {
  const i = clampBackdropIndex(index);
  if (i < 7) return 7 + i;
  if (i < 14) return i;
  return 7 + (i - 14);
}

export function getBuddyBackdropAtIndex(index: number): string {
  const i = clampBackdropIndex(index);
  return buddyBackdropSrcTable[i] ?? buddyBackdropSrcTable[0];
}

export function getBuddyBackdropLabel(index: number): string {
  const i = clampBackdropIndex(index);
  return buddyBackdropLabelTable[i] ?? buddyBackdropLabelTable[0];
}

/** Backdrop index for brand-new profiles (light yellow). Keep in sync with `api/core.mjs` POST /api/profiles. */
export const NEW_PROFILE_BUDDY_COLOR_INDEX = 2;

/** Default SVG buddy for new profiles — light yellow + orange body + chef + open eyes + smile. */
export function getDefaultBuddySvgSelection(): BuddySvgSelection {
  return {
    bodyKey: "orange",
    eyeKey: "open",
    hatKey: "chef",
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
  if (
    value === "chef" ||
    value === "sous-chef" ||
    value === "cowboy" ||
    value === "party" ||
    value === "jd" ||
    value === "beret" ||
    value === "jester"
  ) {
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

export function coerceBuddyEyeKey(value: string | null | undefined): BuddyEyeKey {
  if (value === "none" || value === "open" || value === "heart" || value === "dizzy" || value === "wink" || value === "squint" || value === "up" || value === "down") {
    return value;
  }
  return "open";
}

export function coerceBuddySvgSelection(
  input:
    | Partial<BuddySvgSelection>
    | {
        buddy_body_key?: string | null;
        buddy_eye_key?: string | null;
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
        : "bodyKey" in input
          ? input.bodyKey
          : undefined
      : undefined;

  const eyeValue =
    typeof input === "object" && input
      ? "buddy_eye_key" in input
        ? input.buddy_eye_key
        : "eyeKey" in input
          ? input.eyeKey
          : undefined
      : undefined;

  const hatValue =
    typeof input === "object" && input
      ? "buddy_hat_key" in input
        ? input.buddy_hat_key
        : "hatKey" in input
          ? input.hatKey
          : undefined
      : undefined;

  const smileValue =
    typeof input === "object" && input
      ? "buddy_smile_key" in input
        ? input.buddy_smile_key
        : "smileKey" in input
          ? input.smileKey
          : undefined
      : undefined;

  return {
    bodyKey: coerceBuddyBodyKey(bodyValue, 0),
    eyeKey: coerceBuddyEyeKey(eyeValue),
    hatKey: coerceBuddyHatKey(hatValue),
    smileKey: coerceBuddySmileKey(smileValue),
  };
}

/** Pair light backdrop slot (0–5) to buddy hue for defaults — 7 body hues. */
const CIRCLE_FOR_BUDDY_COLOR = [2, 5, 0, 1, 3, 0, 4] as const;

export function circleForBuddyColorIndex(buddyColorIndex: number): string {
  const clamped = Math.max(0, Math.min(CIRCLE_FOR_BUDDY_COLOR.length - 1, Math.floor(buddyColorIndex)));
  const circleSlot = CIRCLE_FOR_BUDDY_COLOR[clamped] ?? 2;
  return getBuddyBackdropAtIndex(circleSlot);
}

/** @deprecated Alias for getBuddyBackdropAtIndex */
export function getLightCircleImageAtIndex(circleIndex: number): string {
  return getBuddyBackdropAtIndex(circleIndex);
}

/** @deprecated Alias for getBuddyBackdropLabel */
export function getBuddyCircleBackgroundLabel(circleIndex: number): string {
  return getBuddyBackdropLabel(circleIndex);
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

export function getBuddyEyeAsset(eyeKey: BuddyEyeKey | null | undefined): string | null {
  const k = coerceBuddyEyeKey(eyeKey);
  if (k === "none") return null;
  return eyeAssetByKey[k] ?? openEyes;
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

export function getBuddyEyeLabel(eyeKey: BuddyEyeKey): string {
  return buddyEyeOptions.find((option) => option.key === eyeKey)?.label ?? "Open";
}

export function cycleBuddyOption<T extends string>(options: readonly Option<T>[], current: T, direction: -1 | 1): T {
  const currentIndex = Math.max(
    0,
    options.findIndex((option) => option.key === current)
  );
  const nextIndex = (currentIndex + direction + options.length) % options.length;
  return options[nextIndex]?.key ?? current;
}

import pGluten from "@project-assets/Gluten.svg";
import pDairy from "@project-assets/Dairy.svg";
import pEgg from "@project-assets/Egg.svg";
import pFish from "@project-assets/Fish.svg";
import pShellfish from "@project-assets/Shellfish.svg";
import pPeanut from "@project-assets/Peanut.svg";
import pNuts from "@project-assets/Nuts.svg";
import pSoy from "@project-assets/Soy.svg";
import pSesame from "@project-assets/Sesame.svg";
import nGluten from "@project-assets/No Gluten.svg";
import nDairy from "@project-assets/No Dairy.svg";
import nEgg from "@project-assets/No Egg.svg";
import nFish from "@project-assets/No Fish.svg";
import nShellfish from "@project-assets/No Shellfish.svg";
import nPeanut from "@project-assets/No Peanut.svg";
import nNuts from "@project-assets/No Nuts.svg";
import nSoy from "@project-assets/No Soy.svg";
import nSesame from "@project-assets/No Sesame.svg";

export const ALLERGEN_CATALOG = [
  { id: "gluten" as const, label: "Gluten", profileIcon: pGluten, accommodatesIcon: nGluten },
  { id: "dairy" as const, label: "Dairy", profileIcon: pDairy, accommodatesIcon: nDairy },
  { id: "egg" as const, label: "Egg", profileIcon: pEgg, accommodatesIcon: nEgg },
  { id: "fish" as const, label: "Fish", profileIcon: pFish, accommodatesIcon: nFish },
  { id: "shellfish" as const, label: "Shellfish", profileIcon: pShellfish, accommodatesIcon: nShellfish },
  { id: "peanut" as const, label: "Peanut", profileIcon: pPeanut, accommodatesIcon: nPeanut },
  { id: "nuts" as const, label: "Tree nuts", profileIcon: pNuts, accommodatesIcon: nNuts },
  { id: "soy" as const, label: "Soy", profileIcon: pSoy, accommodatesIcon: nSoy },
  { id: "sesame" as const, label: "Sesame", profileIcon: pSesame, accommodatesIcon: nSesame },
] as const;

export type AllergenTagId = (typeof ALLERGEN_CATALOG)[number]["id"];

const ID_ORDER = ALLERGEN_CATALOG.map((x) => x.id);
const ORDER_INDEX = new Map<AllergenTagId, number>(ID_ORDER.map((id, i) => [id, i]));
const ID_SET = new Set<string>(ID_ORDER);

function normalizeTokenToId(token: string): AllergenTagId | null {
  const t = token.trim().toLowerCase();
  if (!t) return null;
  const aliases: Record<string, AllergenTagId> = {
    gluten: "gluten",
    wheat: "gluten",
    dairy: "dairy",
    milk: "dairy",
    lactose: "dairy",
    egg: "egg",
    eggs: "egg",
    fish: "fish",
    shellfish: "shellfish",
    shrimp: "shellfish",
    crab: "shellfish",
    lobster: "shellfish",
    peanut: "peanut",
    peanuts: "peanut",
    nuts: "nuts",
    nut: "nuts",
    treenuts: "nuts",
    "tree nuts": "nuts",
    soy: "soy",
    soya: "soy",
    sesame: "sesame",
  };
  const mapped = aliases[t] ?? (ID_SET.has(t) ? (t as AllergenTagId) : null);
  return mapped ?? null;
}

/** Parse comma/semicolon list into known allergen ids (order preserved, then sorted). */
export function parseAllergenCsv(raw: string): AllergenTagId[] {
  if (!raw?.trim()) return [];
  const seen = new Set<AllergenTagId>();
  const out: AllergenTagId[] = [];
  for (const part of raw.split(/[,;]/)) {
    const id = normalizeTokenToId(part);
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return sortAllergenIds(out);
}

export function formatAllergenCsv(ids: readonly AllergenTagId[]): string {
  return sortAllergenIds([...new Set(ids)]).join(", ");
}

export function sortAllergenIds(ids: AllergenTagId[]): AllergenTagId[] {
  return [...ids].sort((a, b) => (ORDER_INDEX.get(a) ?? 0) - (ORDER_INDEX.get(b) ?? 0));
}

/** Profile field: first paragraph = tag list; following paragraphs = free notes. */
export function decodeProfileAllergiesField(raw: string): { tagIds: AllergenTagId[]; extraNotes: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { tagIds: [], extraNotes: "" };
  const parts = trimmed.split(/\n\n+/);
  const head = parts[0] ?? "";
  const extraNotes = parts.slice(1).join("\n\n").trim();
  const tagIds = parseAllergenCsv(head);
  if (tagIds.length === 0 && head.trim() && !extraNotes) {
    return { tagIds: [], extraNotes: head.trim() };
  }
  return { tagIds, extraNotes };
}

export function encodeProfileAllergiesField(tagIds: readonly AllergenTagId[], extraNotes: string): string {
  const tags = formatAllergenCsv(tagIds);
  const notes = extraNotes.trim();
  if (!tags) return notes || "";
  if (!notes) return tags;
  return `${tags}\n\n${notes}`;
}

export function catalogEntry(id: AllergenTagId) {
  return ALLERGEN_CATALOG.find((x) => x.id === id)!;
}

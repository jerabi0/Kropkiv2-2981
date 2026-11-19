import { useSyncExternalStore } from "react";
export const ELEMENTS = ["Néon", "Feu", "Glace", "Foudre", "Ténèbres"] as const;
export const TERRAINS = [
  "Cité néon", "Volcan", "Banquise", "Plaine orageuse", "Caverne obscure", "Océan",
  "Steppe", "Canyon", "Sanctuaire", "Jungle", "Cosmos", "Cratère",
] as const;
export const TERRAIN_COLORS = [
  "#4ff3ff", "#ff8a3c", "#9fe8ff", "#ffe14a", "#c79bff", "#3fa9ff",
  "#7dffb0", "#e0a85e", "#fff2a8", "#7ee06a", "#9a8cff", "#ff2a3a",
] as const;
export const SEALS = [
  "Cercle magique",
  "Chaînes",
  "Barrière",
  "Talismans",
  "Cube",
  "Éclair",
  "Sakura",
  "Toile",
  "Enfer",
  "Vague",
  "Crâne",
  "Constellation",
] as const;
export const EFFECT_COLORS = ["#4ff3ff", "#ff8a3c", "#9fe8ff", "#ffe14a", "#c79bff"];
export const ARENA_KEY = "kropki-arena-presentation-v1";
export type ArenaSettings = {
  element: number;
  seal: number;
  sound: boolean;
  effects: boolean;
  avatar: "ninja" | "samurai" | "mage" | "photo";
  hair: string;
  skin: string;
  eyes: string;
  cloth: string;
  photo: string;
};
export const defaults: ArenaSettings = {
  element: 0,
  seal: 0,
  sound: false,
  effects: true,
  avatar: "ninja",
  hair: "#0d1018",
  skin: "#d9a47a",
  eyes: "#4ff3ff",
  cloth: "#202842",
  photo: "",
};
export function restoreArena(raw: string | null): ArenaSettings {
  try {
    const v = JSON.parse(raw ?? "null");
    if (!v || v.version !== 1) return { ...defaults };
    const a = { ...defaults };
    if (Number.isInteger(v.terrain) && v.terrain >= 0 && v.terrain < TERRAINS.length) a.terrain = v.terrain;\n    if (Number.isInteger(v.element) && v.element >= 0 && v.element < 5) a.element = v.element;
    if (Number.isInteger(v.seal) && v.seal >= 0 && v.seal < 12) a.seal = v.seal;
    for (const k of ["sound", "effects"] as const) if (typeof v[k] === "boolean") a[k] = v[k];
    if (["ninja", "samurai", "mage", "photo"].includes(v.avatar)) a.avatar = v.avatar;
    for (const k of ["hair", "skin", "eyes", "cloth"] as const)
      if (/^#[0-9a-f]{6}$/i.test(v[k])) a[k] = v[k];
    if (
      typeof v.photo === "string" &&
      v.photo.length < 250000 &&
      /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(v.photo)
    )
      a.photo = v.photo;
    if (a.avatar === "photo" && !a.photo) a.avatar = "ninja";
    return a;
  } catch {
    return { ...defaults };
  }
}
let state = { ...defaults },
  loaded = false,
  warning = "";
const listeners = new Set<() => void>();
function load() {
  if (loaded) return;
  loaded = true;
  try {
    state = restoreArena(localStorage.getItem(ARENA_KEY));
  } catch {
    warning = "Stockage indisponible : préférences conservées pour cette session seulement.";
  }
}
export function updateArena(patch: Partial<ArenaSettings>) {
  load();
  state = { ...state, ...patch };
  try {
    localStorage.setItem(ARENA_KEY, JSON.stringify({ version: 1, ...state }));
    warning = "";
  } catch {
    warning = "Stockage indisponible : préférences conservées pour cette session seulement.";
  }
  listeners.forEach((fn) => fn());
}
export function useArenaSettings() {
  load();
  const settings = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    () => state,
  );
  return { settings, warning, update: updateArena };
}

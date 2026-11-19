import { describe, test, expect } from "bun:test";
import { restoreArena, defaults, ELEMENTS, SEALS, SEAL_STYLES, TERRAINS } from "./arena-settings";
describe("Habillage sans données de jeu", () => {
  test("douze terrains, cinq styles de coup et douze scellements", () => {
    expect(TERRAINS.length).toBe(12);
    expect(new Set(TERRAINS).size).toBe(12);
    expect(ELEMENTS.length).toBe(5);
    expect(SEAL_STYLES.length).toBe(5);
    expect(SEALS.length).toBe(12);
    expect(new Set(SEALS).size).toBe(12);
  });
  test("les cinq styles de scellement sont restaurés et les valeurs invalides ignorées", () => {
    for (let sealStyle = 0; sealStyle < 5; sealStyle++)
      expect(restoreArena(JSON.stringify({ version: 1, sealStyle })).sealStyle).toBe(sealStyle);
    for (const sealStyle of [-1, 5, 99, "cube"])
      expect(restoreArena(JSON.stringify({ version: 1, sealStyle })).sealStyle).toBe(defaults.sealStyle);
  });
  test("terrain hors limites ignoré", () => {
    for (const terrain of [-1, 12, 99, "volcan"]) {
      const s = restoreArena(JSON.stringify({ version: 1, terrain }));
      expect(s.terrain).toBe(defaults.terrain);
    }
  });
  test("sauvegarde absente, cassée et version inconnue", () => {
    for (const raw of [null, "{", "null", '{"version":2,"element":4}'])
      expect(restoreArena(raw)).toEqual(defaults);
  });
  test("valeurs hors limites et champs malveillants rejetés", () => {
    const v = restoreArena(
      JSON.stringify({
        version: 1,
        element: 99,
        seal: -1,
        sound: "yes",
        effects: 0,
        avatar: "enemy",
        skin: "url(evil)",
        photo: "https://evil.test/photo",
      }),
    );
    expect(v).toEqual(defaults);
  });
  test("les douze styles et cinq éléments sont restaurables", () => {
    for (let seal = 0; seal < 12; seal++)
      for (let element = 0; element < 5; element++) {
        const s = restoreArena(
          JSON.stringify({
            version: 1,
            seal,
            element,
            terrain: 11,
            sound: true,
            effects: false,
            avatar: "mage",
            eyes: "#aabbcc",
          }),
        );
        expect(s.seal).toBe(seal);
        expect(s.element).toBe(element);
        expect(s.terrain).toBe(11);
        expect(s.sound).toBe(true);
        expect(s.effects).toBe(false);
        expect(s.avatar).toBe("mage");
        expect(s.eyes).toBe("#aabbcc");
      }
  });
  test("photo uniquement PNG locale, sans URL extérieure", () => {
    expect(
      restoreArena(
        JSON.stringify({
          version: 1,
          avatar: "photo",
          photo: "data:image/svg+xml;base64,PHN2Zz4=",
        }),
      ).avatar,
    ).toBe("ninja");
    expect(
      restoreArena(
        JSON.stringify({ version: 1, avatar: "photo", photo: "data:image/png;base64,aGVsbG8=" }),
      ).avatar,
    ).toBe("photo");
  });
});

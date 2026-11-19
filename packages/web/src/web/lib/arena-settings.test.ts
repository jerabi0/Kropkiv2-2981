import { describe, test, expect } from "bun:test";
import { restoreArena, defaults, ELEMENTS, SEALS } from "./arena-settings";
describe("Habillage sans données de jeu", () => {
  test("cinq éléments et douze scellements", () => {
    expect(ELEMENTS.length).toBe(5);
    expect(SEALS.length).toBe(12);
    expect(new Set(SEALS).size).toBe(12);
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
            sound: true,
            effects: false,
            avatar: "mage",
            eyes: "#aabbcc",
          }),
        );
        expect(s.seal).toBe(seal);
        expect(s.element).toBe(element);
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

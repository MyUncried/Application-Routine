/* eslint-disable @typescript-eslint/no-require-imports -- jest.isolateModules exige des require */
import { describe, expect, it, jest } from "@jest/globals";

type Names = typeof import("../referenceNames");

/** Charge `referenceNames` avec un téléphone dans la langue donnée (registre de modules isolé). */
function namesFor(languageCode: string): Names {
  let names: Names | null = null;
  jest.isolateModules(() => {
    jest.doMock("expo-localization", () => ({ getLocales: () => [{ languageTag: `${languageCode}-XX`, languageCode, regionCode: "XX" }] }));
    names = require("../referenceNames");
  });
  return names!;
}

describe("J1.8 — noms des Catégories et Zones fournies par KODJO", () => {
  it("en français : le nom enregistré, inchangé", () => {
    const names = namesFor("fr");
    expect(names.categoryDisplayName("etirements", "Étirements")).toBe("Étirements");
    expect(names.bodyZoneDisplayName("poignets-mains", "Poignets et mains")).toBe("Poignets et mains");
  });

  it("en anglais : traduit tant que l'utilisateur ne l'a pas renommé ; sinon son nom, tel quel", () => {
    const names = namesFor("en");
    expect(names.categoryDisplayName("etirements", "Étirements")).toBe("Stretching");
    expect(names.categoryDisplayName("etirements", "Souplesse")).toBe("Souplesse");
    expect(names.categoryDisplayName("user-123", "Yoga")).toBe("Yoga");
    expect(names.bodyZoneDisplayName("epaules", "Épaules")).toBe("Shoulders");
  });
});

import { describe, expect, it } from "@jest/globals";

import { resolveLanguage, resolveLocaleTag } from "./locale";

const device = (...tags: string[]) =>
  tags.map((tag) => {
    const [languageCode, regionCode] = tag.split("-");
    return { languageCode: languageCode ?? null, regionCode: regionCode ?? null };
  });

describe("J1 — langue de l'interface (règles 2 et 3 du 23/11/2026)", () => {
  it("prend la première langue du téléphone prise en charge", () => {
    expect(resolveLanguage(device("fr-FR", "en-US"))).toBe("fr");
    expect(resolveLanguage(device("en-GB", "fr-FR"))).toBe("en");
    expect(resolveLanguage(device("ja-JP", "fr-FR"))).toBe("fr");
  });

  it("se replie sur l'anglais si aucune langue n'est prise en charge, ou si la liste est vide", () => {
    expect(resolveLanguage(device("ja-JP", "ko-KR"))).toBe("en");
    expect(resolveLanguage([])).toBe("en");
    expect(resolveLanguage([{ languageCode: null, regionCode: null }])).toBe("en");
  });

  it("garde la région du téléphone qui accompagne la langue affichée, sinon une région par défaut", () => {
    expect(resolveLocaleTag(device("en-GB"), "en")).toBe("en-GB");
    expect(resolveLocaleTag(device("fr-CA", "en-US"), "fr")).toBe("fr-CA");
    expect(resolveLocaleTag(device("ja-JP"), "en")).toBe("en-US");
    expect(resolveLocaleTag(device("de-DE", "fr"), "fr")).toBe("fr-FR");
  });
});

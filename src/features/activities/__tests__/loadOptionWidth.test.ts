import { describe, expect, it } from "@jest/globals";

import { LOAD_OPTION_TEXT_INSET, loadOptionWidth, loadTextWidth } from "@/features/activities/loadOptionWidth";

/**
 * Recette du 20/10 (RC-14) : option Avec de la Charge (séries identiques) de 62 si la charge commune
 * y tient avec une marge de 4 de chaque côté, sinon élargie au strict nécessaire (Inter Semi Bold 12).
 */
describe("RC-14 — largeur de l'option Avec de la Charge", () => {
  it("62 tant que le texte tient (« 20 kg », « 0,25 kg », « 99,75 kg ») ; le plus large des textes décide", () => {
    expect(LOAD_OPTION_TEXT_INSET).toBe(4);
    expect(loadTextWidth("20 kg")).toBeCloseTo(32.8, 1);
    expect(loadTextWidth("99,75 kg")).toBeCloseTo(50.8, 1);
    for (const text of ["Avec", "20 kg", "0,25 kg", "99,75 kg", "999 kg"]) expect(loadOptionWidth(text)).toBe(62);
    expect(loadOptionWidth()).toBe(62);
    expect(loadOptionWidth("20 kg", "1234567,25")).toBe(77);
  });

  it("au-delà, le strict nécessaire (arrondi au point supérieur) ; caractère inconnu compté comme le chiffre le plus large", () => {
    expect(loadOptionWidth("487,75 kg")).toBe(67);
    expect(loadOptionWidth("1234567,25 kg")).toBe(95);
    expect(loadTextWidth("?")).toBe(loadTextWidth("4"));
  });
});

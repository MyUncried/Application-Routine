import { describe, expect, it } from "@jest/globals";

import { ELEMENT_FORMAT_KEYS, QUICK_START_KEYS } from "@/domain/sessions/formats";
import { SESSION_FORMATS } from "@/features/sessions/sessionFormats";

/**
 * PRE-9 (story C.1) — les vignettes du Catalogue (PRE-8, Q-E5) restent la projection d'affichage du
 * registre du domaine : mêmes clés, Libre en plus. Leur disponibilité n'est pas modifiée par C.1
 * (mise à disposition : C.2, sous réserve des défauts d'ARB-04).
 */
describe("PRE-9 C.1 — vignettes et registre des Formats", () => {
  it("chaque Format et chaque départ rapide du registre a sa vignette, Libre en plus ; seul Libre est disponible", () => {
    expect(SESSION_FORMATS.map((format) => format.key).sort()).toEqual([...ELEMENT_FORMAT_KEYS, ...QUICK_START_KEYS, "FREE"].sort());
    expect(SESSION_FORMATS.filter((format) => format.available).map((format) => format.key)).toEqual(["FREE"]);
  });
});

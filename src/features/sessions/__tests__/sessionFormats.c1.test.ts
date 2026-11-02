import { describe, expect, it } from "@jest/globals";

import { ELEMENT_FORMAT_KEYS, PRECONFIGURATION_KEYS, SESSION_ORIGINS } from "@/domain/sessions/formats";
import { SESSION_FORMATS } from "@/features/sessions/sessionFormats";

/**
 * PRE-9 (story C.1 ; réalignement du 02/11/2026) — les vignettes du Catalogue (PRE-8, Q-E5) restent
 * la projection d'affichage du registre du domaine : une vignette par origine de création issue de la
 * grille des modèles (`SESSION_ORIGINS` hors cartes Exercice et Séance), Libre en plus. Elles couvrent
 * les quatre Formats spécialisés et les six préconfigurations (Tabata et départs rapides) ; Gainage
 * et mobilité, retiré des départs rapides le 02/11, reste une origine lisible des Séances déjà
 * enregistrées. Leur disponibilité n'est pas modifiée par C.1 (mise à disposition : C.2).
 */
describe("PRE-9 C.1 — vignettes et registre des Formats", () => {
  it("une vignette par origine de modèle du registre, Libre en plus ; chaque Format et chaque préconfiguration a la sienne ; seul Libre est disponible", () => {
    const keys = SESSION_FORMATS.map((format) => format.key);
    const modelOrigins = SESSION_ORIGINS.filter((origin) => origin !== "EXERCISE_CARD" && origin !== "SESSION_CARD");
    expect([...keys].sort()).toEqual([...modelOrigins, "FREE"].sort());
    expect(keys).toEqual(expect.arrayContaining([...ELEMENT_FORMAT_KEYS, ...PRECONFIGURATION_KEYS, "FREE"]));
    // Seule vignette hors de la grille du 02/11 : l'origine conservée en lecture (D-25).
    const grid: readonly string[] = [...ELEMENT_FORMAT_KEYS, ...PRECONFIGURATION_KEYS, "FREE"];
    expect(keys.filter((key) => !grid.includes(key))).toEqual(["CORE_MOBILITY"]);
    expect(SESSION_FORMATS.filter((format) => format.available).map((format) => format.key)).toEqual(["FREE"]);
  });
});

import { describe, expect, it } from "@jest/globals";

import { findMovementNameConflict } from "@/domain/activities/Movement";
import { rankMovements, type MovementSearchCandidate } from "@/domain/activities/movementSuggestion";

/**
 * PRE-7 story R-8 (D-448 point 1, recette JA2 cr-4) — recherche par début de mot, en plus de R02 :
 * un mouvement est trouvé dès que chaque mot tapé (normalisé) est le début d'un mot distinct de son
 * nom ou d'un alias ; ordre stable d'une frappe à l'autre (nom identique, puis débuts de mot par
 * nom normalisé et identifiant, puis les autres résultats R02). Matrice I/O de
 * `spec-r-8-recherche-prefixe-variante.md`. Les garde-fous R07 restent vérifiés par
 * `movementSearch.r07.test.ts`.
 */

function candidate(id: string, name: string, overrides: Partial<MovementSearchCandidate> = {}): MovementSearchCandidate {
  return { id, name, aliases: [], categoryId: "renfo", bodyZoneIds: ["jambes"], ...overrides };
}

const LIBRARY: readonly MovementSearchCandidate[] = [
  candidate("pompes", "Pompes", { aliases: ["push-up"], bodyZoneIds: ["bras"] }),
  candidate("sautes-haut", "Squats sautés haut"),
  candidate("squats", "Squats"),
  candidate("sautes-bas", "Squats sautés bas"),
  candidate("assistes-lents", "Squats assistés lents"),
  candidate("assistes", "Squats assistés"),
  candidate("bulgare", "Squat bulgare"),
];

const ids = (query: string, library = LIBRARY) => rankMovements(query, library).map((result) => result.id);

describe("PRE-7 R-8 — recherche par début de mot (D-448 point 1)", () => {
  it("début de mot : « Squ » → Squats, Squats sautés bas, par nom ; Pompes absent", () => {
    const library = [candidate("squats", "Squats"), candidate("sautes-bas", "Squats sautés bas"), candidate("pompes", "Pompes")];
    expect(ids("Squ", library)).toEqual(["squats", "sautes-bas"]);
    expect(rankMovements("Squ", library).every((result) => result.wordPrefix)).toBe(true);
  });

  it("deux mots, dernier partiel : « Squats sau » → Squats sautés bas, Squats sautés haut", () => {
    expect(ids("Squats sau").slice(0, 2)).toEqual(["sautes-bas", "sautes-haut"]);
    const prefixed = rankMovements("Squats sau", LIBRARY).filter((result) => result.wordPrefix).map((result) => result.id);
    expect(prefixed).toEqual(["sautes-bas", "sautes-haut"]);
  });

  it("« Squats » trouve aussi Squats sautés bas ; nom identique en tête", () => {
    const found = ids("Squats");
    expect(found[0]).toBe("squats");
    expect(found).toContain("sautes-bas");
  });

  it("ordre stable : « Squats as » puis « Squats ass » → même ordre relatif des Squats assistés", () => {
    const relative = (query: string) => ids(query).filter((id) => id === "assistes" || id === "assistes-lents");
    expect(relative("Squats as")).toEqual(["assistes", "assistes-lents"]);
    expect(relative("Squats ass")).toEqual(relative("Squats as"));
    expect(relative("Squats assi")).toEqual(relative("Squats as"));
  });

  it("chaque mot tapé commence un mot DISTINCT : « Squats squ » ne retient pas « Squats » seul", () => {
    expect(rankMovements("Squats squ", [candidate("squats", "Squats")]).some((result) => result.wordPrefix)).toBe(false);
  });

  it("accents et casse neutralisés, sans rognage de pluriel : « SQUATS SAUTE » → Squats sautés …", () => {
    const prefixed = rankMovements("SQUATS SAUTE", LIBRARY).filter((result) => result.wordPrefix).map((result) => result.id);
    expect(prefixed).toEqual(["sautes-bas", "sautes-haut"]);
  });

  it("alias : « push » → Pompes, une seule fois", () => {
    const found = ids("push");
    expect(found).toEqual(["pompes"]);
    expect(rankMovements("push", LIBRARY)[0]?.wordPrefix).toBe(true);
  });

  it("aucun début de mot : « Natation » → []", () => {
    expect(ids("Natation")).toEqual([]);
  });

  it("ordre complet : nom identique, puis débuts de mot par nom normalisé, puis rapprochement R02 seul", () => {
    // « squats » ne commence aucun mot de « Squat bulgare » : rapprochement R02 seul, en dernier.
    expect(ids("Squats")).toEqual(["squats", "assistes", "assistes-lents", "sautes-bas", "sautes-haut", "bulgare"]);
    expect(rankMovements("Squats", LIBRARY).find((result) => result.id === "bulgare")?.wordPrefix).toBe(false);
  });

  it("nom identique par alias : en tête, devant les débuts de mot", () => {
    const library = [candidate("a", "Squats assistés"), candidate("z", "Zzz", { aliases: ["Squats"] })];
    expect(ids("Squats", library)[0]).toBe("z");
  });

  it("« Squats sau » : Squats sautés bas en tête, Squats ensuite (R02 seul)", () => {
    const library = [candidate("squats", "Squats"), candidate("sautes-bas", "Squats sautés bas")];
    expect(ids("Squats sau", library)).toEqual(["sautes-bas", "squats"]);
  });

  it("C01 inchangé : un début de mot n'est pas un conflit d'unicité", () => {
    expect(findMovementNameConflict("Squ", [{ id: "squats", name: "Squats" }], null)).toBeNull();
  });
});

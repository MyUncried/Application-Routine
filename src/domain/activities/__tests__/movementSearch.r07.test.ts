import { describe, expect, it } from "@jest/globals";

import { findMovementNameConflict, type Movement } from "@/domain/activities/Movement";
import {
  movementNameScore,
  normalizeSearchText,
  rankMovements,
  searchTokens,
  type MovementSearchCandidate,
  type MovementSearchContext,
} from "@/domain/activities/movementSuggestion";

/**
 * PRE-7 story R-5 (D-445 C01, v7 §6 R02 à R07) — jeu de cas de référence R07, automatisé.
 *
 * R07 (v7 l.211-243) : ce jeu « tient lieu de définition opérationnelle du comportement attendu »
 * et conditionne toute évolution des coefficients, des seuils ou de l'algorithme. Il vérifie,
 * pour chaque requête, la présence des résultats attendus, leur classement lorsqu'il est
 * pertinent, l'absence de doublon par mouvement et le déclenchement ou non de la suggestion ;
 * JAMAIS la reproduction de la formule (aucune valeur de score attendue). Les dix cas minimaux de
 * la v7 (l.232-243) sont repris tels quels ; les cas ajoutés couvrent les huit familles. Chaque
 * défaut réel corrigé y ajoute son cas.
 */

function candidate(id: string, name: string, overrides: Partial<MovementSearchCandidate> = {}): MovementSearchCandidate {
  return { id, name, aliases: [], categoryId: "renfo", bodyZoneIds: ["jambes"], ...overrides };
}

/** Bibliothèque de référence : noms tels que saisis, alias, Catégories et Zones variées. */
const LIBRARY: readonly MovementSearchCandidate[] = [
  candidate("squat", "Squat"),
  candidate("squats-sautes", "Squats sautés"),
  candidate("squat-bulgare", "Squat bulgare"),
  candidate("etirements", "Étirements", { categoryId: "souplesse", bodyZoneIds: ["dos"] }),
  candidate("pompes", "Pompes", { aliases: ["Push-up", "Pompe classique"], categoryId: "renfo", bodyZoneIds: ["bras"] }),
  candidate("pompes-genoux", "Pompes sur les genoux", { bodyZoneIds: ["bras"] }),
  candidate("dos", "Dos", { categoryId: "souplesse", bodyZoneIds: ["dos"] }),
  candidate("fentes-avant", "Fentes avant"),
  candidate("fentes-arriere", "Fentes arrière"),
  candidate("pente", "Pente"),
  candidate("burpees", "Burpees", { categoryId: "cardio" }),
  candidate("gainage", "Gainage", { aliases: ["Planche"], categoryId: "renfo", bodyZoneIds: ["abdos"] }),
  candidate("planche-laterale", "Planche latérale", { bodyZoneIds: ["abdos"] }),
  candidate("bras", "Bras tendus", { categoryId: "souplesse", bodyZoneIds: ["bras"] }),
];

function search(query: string, context: MovementSearchContext = {}, library = LIBRARY) {
  return rankMovements(query, library, context);
}

function ids(query: string, context: MovementSearchContext = {}) {
  return search(query, context).map((result) => result.id);
}

function resultFor(query: string, id: string, context: MovementSearchContext = {}) {
  return search(query, context).find((result) => result.id === id);
}

/** Aucun mouvement n'apparaît deux fois (R05, R07). */
function expectNoDuplicate(query: string) {
  const found = ids(query);
  expect(new Set(found).size).toBe(found.length);
}

describe("PRE-7 R-5 — R07 : cas minimaux de la v7 (l.232-243)", () => {
  it("Correspondance exacte : « Squat » → Squat en tête, suggéré", () => {
    expect(ids("Squat")[0]).toBe("squat");
    expect(resultFor("Squat", "squat")?.suggested).toBe(true);
  });

  it("Accents et casse : « ETIREMENTS » → Étirements au-dessus du seuil haut", () => {
    expect(resultFor("ETIREMENTS", "etirements")?.suggested).toBe(true);
  });

  it("Pluriel : « Pompe » → Pompes au-dessus du seuil haut", () => {
    expect(resultFor("Pompe", "pompes")?.suggested).toBe(true);
  });

  it("Pluriel, mot court épargné : « Dos » → Dos rapproché, le radical n'étant pas rogné", () => {
    expect(resultFor("Dos", "dos")).toBeDefined();
    expect(searchTokens("Dos")).toEqual(["dos"]);
  });

  it("Faute de frappe : « squatt » → Squat rapproché", () => {
    expect(resultFor("squatt", "squat")).toBeDefined();
  });

  it("Nom partiel : « Pompes genoux » → Pompes sur les genoux au-dessus du seuil haut", () => {
    expect(resultFor("Pompes genoux", "pompes-genoux")?.suggested).toBe(true);
  });

  it("Ordre des mots : « genoux pompes » → même score que « Pompes genoux »", () => {
    expect(movementNameScore("genoux pompes", "Pompes sur les genoux")).toBe(
      movementNameScore("Pompes genoux", "Pompes sur les genoux"),
    );
    expect(resultFor("genoux pompes", "pompes-genoux")?.suggested).toBe(true);
  });

  it("Alias : « push-up » → Pompes rapproché, et une seule fois", () => {
    const found = ids("push-up");
    expect(found).toContain("pompes");
    expect(found.filter((id) => id === "pompes")).toHaveLength(1);
    expect(resultFor("push-up", "pompes")?.suggested).toBe(true);
  });

  it("Différence significative : « Fente » → Pente non rapproché, initiales différentes", () => {
    expect(resultFor("Fente", "pente")).toBeUndefined();
  });

  it("Différence significative : « Fentes avant » → Fentes arrière jamais suggéré comme le même mouvement", () => {
    expect(resultFor("Fentes avant", "fentes-avant")?.suggested).toBe(true);
    expect(resultFor("Fentes avant", "fentes-arriere")?.suggested ?? false).toBe(false);
    expect(ids("Fentes avant")[0]).toBe("fentes-avant");
  });
});

describe("PRE-7 R-5 — R07 : familles complétées", () => {
  it("correspondances exactes : un nom saisi tel quel est en tête et suggéré", () => {
    for (const { id, name } of LIBRARY) {
      expect(ids(name)[0]).toBe(id);
      expect(resultFor(name, id)?.suggested).toBe(true);
    }
  });

  it("accents, casse, espaces et ponctuation sont neutralisés", () => {
    expect(normalizeSearchText("  Squats-SAUTÉS !  ")).toBe("squats sautes");
    expect(ids("squats   sautes")[0]).toBe("squats-sautes");
    expect(ids("PLANCHE LATERALE")[0]).toBe("planche-laterale");
  });

  it("pluriels : rognage prudent, « genoux » → « genou », « bras » intact", () => {
    expect(searchTokens("Pompes sur les genoux")).toEqual(["pompe", "genou"]);
    expect(searchTokens("Pompes genoux")).toEqual(["pompe", "genou"]);
    expect(searchTokens("Bras")).toEqual(["bras"]);
    expect(resultFor("Squats", "squat")?.suggested).toBe(true);
  });

  it("fautes de frappe : « burpes » → Burpees rapproché ; une faute sur l'initiale n'est pas rapprochée par la distance", () => {
    expect(resultFor("burpes", "burpees")).toBeDefined();
    expect(resultFor("Gainaje", "gainage")).toBeDefined();
    expect(resultFor("Bainage", "gainage")?.suggested ?? false).toBe(false);
  });

  it("noms partiels : « Squat » liste aussi Squat bulgare et Squats sautés, après Squat", () => {
    const found = ids("Squat");
    expect(found.indexOf("squat")).toBe(0);
    expect(found).toContain("squat-bulgare");
  });

  it("alias : « Planche » fait remonter Gainage (alias) et Planche latérale (nom), chacun une fois", () => {
    const found = ids("Planche");
    expect(found).toEqual(expect.arrayContaining(["gainage", "planche-laterale"]));
    expectNoDuplicate("Planche");
    expectNoDuplicate("Pompe");
  });

  it("alias partagé par deux mouvements : deux résultats distincts, aucun rattachement", () => {
    const library = [
      candidate("a", "Gainage ventral", { aliases: ["Planche"] }),
      candidate("b", "Gainage dynamique", { aliases: ["Planche"] }),
    ];
    expect(search("Planche", {}, library).map((result) => result.id).sort()).toEqual(["a", "b"]);
  });

  it("différences significatives : sans rapport, rien n'est présenté", () => {
    expect(ids("Natation")).toEqual([]);
    expect(ids("Course")).toEqual([]);
  });

  it("requête vide ou faite de mots fonctionnels seulement : aucun classement", () => {
    expect(ids("")).toEqual([]);
    expect(ids("   ")).toEqual([]);
  });
});

describe("PRE-7 R-5 — R02 : signaux Catégorie et Zones (bonus plafonnés)", () => {
  it("les bonus réordonnent deux candidats de même score de nom", () => {
    // PRE-7 (R-8, D-448 point 1) : requête « Squatt » (faute de frappe) au lieu de « Squat ». « Squat »
    // est désormais un nom identique (alias) des deux candidats, classés par nom normalisé avant
    // tout score ; les bonus ne réordonnent que les rapprochements R02, que « Squatt » produit seul.
    const library = [
      candidate("x", "Squat large", { aliases: ["Squat"], categoryId: "renfo", bodyZoneIds: ["jambes"] }),
      candidate("y", "Squat lent", { aliases: ["Squat"], categoryId: "souplesse", bodyZoneIds: ["dos"] }),
    ];
    const plain = search("Squatt", {}, library).map((result) => result.id);
    const withSignals = search("Squatt", { categoryId: "souplesse", bodyZoneIds: ["dos"] }, library).map((result) => result.id);
    expect(plain[0]).toBe("x");
    expect(withSignals[0]).toBe("y");
  });

  it("un rapprochement faible reste non suggéré malgré deux bonus ; les bonus ne font entrer personne dans la liste", () => {
    const context = { categoryId: "cardio", bodyZoneIds: ["jambes"] };
    expect(resultFor("burpes", "burpees")?.suggested).toBe(false);
    expect(resultFor("burpes", "burpees", context)?.suggested).toBe(false);
    expect(resultFor("Natation", "squat", { categoryId: "renfo", bodyZoneIds: ["jambes"] })).toBeUndefined();
  });

  it("un résultat suggéré reste classé devant un résultat non suggéré, bonus compris", () => {
    const library = [candidate("burpees", "Burpees", { categoryId: "cardio" }), candidate("burpes-sautes", "Burpes sautés", { categoryId: "renfo" })];
    const found = search("burpes", { categoryId: "cardio", bodyZoneIds: ["jambes"] }, library);
    expect(found.map((result) => [result.id, result.suggested])).toEqual([
      ["burpes-sautes", true],
      ["burpees", false],
    ]);
  });
});

describe("PRE-7 R-5 — C01 : findMovementNameConflict (unicité, distincte de la recherche)", () => {
  const movements: Pick<Movement, "id" | "name">[] = [
    { id: "m1", name: "Squats" },
    { id: "m2", name: "Étirements" },
  ];

  it("même clé canonique (espaces, casse, accents) : conflit", () => {
    expect(findMovementNameConflict("  squats ", movements, null)?.id).toBe("m1");
    expect(findMovementNameConflict("ETIREMENTS", movements, null)?.id).toBe("m2");
  });

  it("le mouvement en cours d'édition est exclu ; nom vide ou différent : aucun conflit", () => {
    expect(findMovementNameConflict("SQUATS", movements, "m1")).toBeNull();
    expect(findMovementNameConflict("Squat", movements, null)).toBeNull();
    expect(findMovementNameConflict("   ", movements, null)).toBeNull();
  });

  it("une proximité de recherche n'est pas un conflit d'unicité (« Pompe » / « Pompes »)", () => {
    expect(findMovementNameConflict("Pompe", [{ id: "p", name: "Pompes" }], null)).toBeNull();
  });
});

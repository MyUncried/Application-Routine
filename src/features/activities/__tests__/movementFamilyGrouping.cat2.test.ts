import { describe, expect, it } from "@jest/globals";

import type { MovementChoice } from "@/features/activities/ActivityDefinitionService";
import { groupResultsByFamily } from "@/features/activities/movementFamilyGrouping";
import { familyRuns } from "@/features/activities/MovementSuggestionPanel";

/**
 * PRE-9 CAT.2 — clarification de Hermann du 30/10/2026 : une famille = une pile unique et continue
 * dans les résultats, au rang de son premier membre ; résultats indépendants dans leur ordre relatif.
 */
const choice = (id: string, family: string | null, rank = 1): MovementChoice =>
  ({
    movement: { id, name: id, levelGroup: family === null ? null : { groupId: family } },
    level: family === null ? null : { rank, total: 3 },
  }) as unknown as MovementChoice;

const ids = (list: readonly MovementChoice[]) => list.map((entry) => entry.movement.id);

describe("CAT.2 — regroupement des familles dans les résultats", () => {
  it("exemple de Hermann : A1, B, A2, C → A1, A2, B, C ; un seul filet pour la famille A", () => {
    const grouped = groupResultsByFamily([choice("A1", "A", 1), choice("B", null), choice("A2", "A", 2), choice("C", null)]);
    expect(ids(grouped)).toEqual(["A1", "A2", "B", "C"]);
    expect(familyRuns(grouped)).toEqual([[0, 1]]);
  });

  it("un résultat indépendant classé avant le premier membre reste avant la pile ; ordre des membres conservé", () => {
    const grouped = groupResultsByFamily([
      choice("X", null),
      choice("A2", "A", 2),
      choice("Y", null),
      choice("B1", "B", 1),
      choice("A1", "A", 1),
      choice("B2", "B", 2),
      choice("Z", null),
    ]);
    // Membres d'une pile dans l'ordre des Niveaux.
    expect(ids(grouped)).toEqual(["X", "A1", "A2", "Y", "B1", "B2", "Z"]);
    expect(familyRuns(grouped)).toEqual([
      [1, 2],
      [4, 5],
    ]);
  });

  // Réponse de Hermann du 30/10 : la pile montre aussi les membres que la recherche ne trouve pas.
  it("la pile complète la famille avec les membres hors recherche, dans l'ordre des Niveaux", () => {
    const pool = [choice("A1", "A", 1), choice("A2", "A", 2), choice("A3", "A", 3), choice("B", null), choice("C", null)];
    const grouped = groupResultsByFamily([choice("C", null), choice("A2", "A", 2), choice("B", null)], pool);
    expect(ids(grouped)).toEqual(["C", "A1", "A2", "A3", "B"]);
    expect(familyRuns(grouped)).toEqual([[1, 3]]);
  });

  it("sans famille : ordre inchangé", () => {
    const list = [choice("C", null), choice("A", null), choice("B", null)];
    expect(ids(groupResultsByFamily(list))).toEqual(["C", "A", "B"]);
  });
});

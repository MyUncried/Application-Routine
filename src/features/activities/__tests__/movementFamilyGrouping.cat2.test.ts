import { describe, expect, it } from "@jest/globals";

import type { MovementChoice } from "@/features/activities/ActivityDefinitionService";
import { groupResultsByFamily } from "@/features/activities/movementFamilyGrouping";
import { familyRuns } from "@/features/activities/MovementSuggestionPanel";

/**
 * PRE-9 CAT.2 — clarification de Hermann du 30/10/2026 : une famille = une pile unique et continue
 * dans les résultats, au rang de son premier membre ; résultats indépendants dans leur ordre relatif.
 */
const choice = (id: string, family: string | null): MovementChoice =>
  ({
    movement: { id, name: id, levelGroup: family === null ? null : { groupId: family } },
    level: family === null ? null : { rank: 1, count: 2 },
  }) as unknown as MovementChoice;

const ids = (list: readonly MovementChoice[]) => list.map((entry) => entry.movement.id);

describe("CAT.2 — regroupement des familles dans les résultats", () => {
  it("exemple de Hermann : A1, B, A2, C → A1, A2, B, C ; un seul filet pour la famille A", () => {
    const grouped = groupResultsByFamily([choice("A1", "A"), choice("B", null), choice("A2", "A"), choice("C", null)]);
    expect(ids(grouped)).toEqual(["A1", "A2", "B", "C"]);
    expect(familyRuns(grouped)).toEqual([[0, 1]]);
  });

  it("un résultat indépendant classé avant le premier membre reste avant la pile ; ordre des membres conservé", () => {
    const grouped = groupResultsByFamily([
      choice("X", null),
      choice("A2", "A"),
      choice("Y", null),
      choice("B1", "B"),
      choice("A1", "A"),
      choice("B2", "B"),
      choice("Z", null),
    ]);
    expect(ids(grouped)).toEqual(["X", "A2", "A1", "Y", "B1", "B2", "Z"]);
    expect(familyRuns(grouped)).toEqual([
      [1, 2],
      [4, 5],
    ]);
  });

  it("sans famille : ordre inchangé", () => {
    const list = [choice("C", null), choice("A", null), choice("B", null)];
    expect(ids(groupResultsByFamily(list))).toEqual(["C", "A", "B"]);
  });
});

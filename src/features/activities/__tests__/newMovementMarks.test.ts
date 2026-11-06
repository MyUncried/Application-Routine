import { beforeEach, describe, expect, it } from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";

import {
  clearDisplayedNewMovements,
  consumeNewMovementScrollTarget,
  markMovementCreated,
  noteNewMovementsDisplayed,
  resetNewMovementMarks,
  useNewMovementMarks,
} from "@/features/activities/newMovementMarks";

/**
 * D-510 (Hermann, 06/11/2026) — cycle de vie du marquage « New » : état d'affichage en mémoire, jamais persisté.
 */
beforeEach(() => {
  resetNewMovementMarks();
});

const ids = (marks: { readonly ids: ReadonlySet<string> }) => [...marks.ids].sort();

describe("D-510 : marquage des fiches créées", () => {
  it("plusieurs créations portent la marque en même temps ; la dernière est la cible du défilement", () => {
    const { result } = renderHook(() => useNewMovementMarks());
    act(() => {
      markMovementCreated("a");
      markMovementCreated("b");
    });
    expect(ids(result.current)).toEqual(["a", "b"]);
    expect(result.current.scrollTarget).toBe("b");
    act(() => consumeNewMovementScrollTarget("b"));
    expect(result.current.scrollTarget).toBeNull();
    expect(ids(result.current)).toEqual(["a", "b"]);
  });

  it("quitter la vue Mouvements retire seulement les marques déjà affichées", () => {
    const { result } = renderHook(() => useNewMovementMarks());
    act(() => {
      markMovementCreated("vue");
      noteNewMovementsDisplayed();
      // Créée ensuite ailleurs (Composition), jamais affichée.
      markMovementCreated("composition");
      clearDisplayedNewMovements();
    });
    expect(ids(result.current)).toEqual(["composition"]);
    act(() => {
      noteNewMovementsDisplayed();
      clearDisplayedNewMovements();
    });
    expect(ids(result.current)).toEqual([]);
    expect(result.current.scrollTarget).toBeNull();
  });

  it("quitter sans rien avoir affiché ne retire rien", () => {
    const { result } = renderHook(() => useNewMovementMarks());
    act(() => {
      markMovementCreated("a");
      clearDisplayedNewMovements();
    });
    expect(ids(result.current)).toEqual(["a"]);
  });

  it("une cible déjà consommée n'est pas réactivée ; consommer une autre fiche ne change rien", () => {
    const { result } = renderHook(() => useNewMovementMarks());
    act(() => {
      markMovementCreated("a");
      consumeNewMovementScrollTarget("x");
    });
    expect(result.current.scrollTarget).toBe("a");
  });
});

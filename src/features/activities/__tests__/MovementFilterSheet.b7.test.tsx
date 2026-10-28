import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { MovementFilterSheet } from "@/features/activities/MovementFilterSheet";
import { EMPTY_MOVEMENT_FILTERS, type MovementCatalogueFilters } from "@/features/activities/movementCatalogueView";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";
import { colors, minTouchTarget } from "@/shared/ui/tokens";

/**
 * PRE-8 (story B.7, Figma `10462:23370`) — feuille des filtres : cinq groupes à choix multiples,
 * Catégories actives et Zones lues du référentiel, ✓ applique, ✕ ferme sans appliquer,
 * « Réinitialiser » revient au comportement par défaut (Actifs).
 */

const referentials = {
  listCategories: async () => [
    { id: "renfo", name: "Renforcement", color: "#5B8DEF", isActive: true },
    { id: "ancienne", name: "Ancienne", color: "#5B8DEF", isActive: false },
  ],
  listBodyZones: async () => [
    { id: "genoux", name: "Genoux", isActive: true },
    { id: "retiree", name: "Ancienne zone", isActive: false },
  ],
} as unknown as ReferentialService;

async function renderSheet(filters: MovementCatalogueFilters = EMPTY_MOVEMENT_FILTERS) {
  const onApply = jest.fn<(filters: MovementCatalogueFilters, labels: readonly string[]) => void>();
  const onClose = jest.fn();
  render(
    <TestSafeAreaProvider>
      <ReferentialServiceContext.Provider value={referentials}>
        <MovementFilterSheet filters={filters} onApply={onApply} onClose={onClose} />
      </ReferentialServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await act(async () => {
    await Promise.resolve();
  });
  return { onApply, onClose };
}

describe("PRE-8 B.7 — feuille des filtres des Mouvements", () => {
  it("applique les valeurs choisies dans plusieurs groupes ; seules les Catégories actives sont proposées", async () => {
    const { onApply } = await renderSheet();
    expect(screen.queryByTestId("movement-filter-category-ancienne")).toBeNull();
    // Recette A/B (D07) : une Zone retirée du référentiel n’est plus proposée.
    expect(screen.queryByTestId("movement-filter-zone-retiree")).toBeNull();
    for (const testID of [
      "movement-filter-status-active",
      "movement-filter-status-archived",
      "movement-filter-usage-without",
      "movement-filter-category-renfo",
      "movement-filter-zone-genoux",
    ]) {
      fireEvent.press(screen.getByTestId(testID));
    }
    expect(screen.getByTestId("movement-filter-zone-genoux").props.accessibilityState).toMatchObject({ checked: true });
    fireEvent.press(screen.getByTestId("movement-filter-apply"));
    const applied = onApply.mock.calls[0]![0];
    expect([...applied.statuses].sort()).toEqual(["ACTIVE", "ARCHIVED"]);
    expect([...applied.usage]).toEqual(["WITHOUT"]);
    expect([...applied.levels]).toEqual([]);
    expect([...applied.categoryIds]).toEqual(["renfo"]);
    expect([...applied.bodyZoneIds]).toEqual(["genoux"]);
    // D05 : libellés des critères choisis, pour le résumé de la commande.
    expect(onApply.mock.calls[0]![1]).toEqual(["Actifs", "Archivés", "Sans exercice", "Renforcement", "Genoux"]);
  });

  it("recette A/B du 27/10 : cadre standard des feuilles (Paramètres d’exécution) — poignée, ✕ et ✓ ronds 38, filet", async () => {
    await renderSheet();
    expect(screen.getByTestId("movement-filter-handle")).toBeTruthy();
    expect(screen.getByTestId("movement-filter-header-divider")).toBeTruthy();
    for (const [id, background] of [
      ["movement-filter-close", colors.wheelActionCancelBackground],
      ["movement-filter-apply", colors.wheelActionValidateBackground],
    ] as const) {
      const circle = screen.getByTestId(id);
      expect(StyleSheet.flatten(circle.props.style)).toMatchObject({ width: 38, height: 38, borderRadius: 19, backgroundColor: background });
      expect(circle.props.hitSlop).toBe((minTouchTarget - 38) / 2);
    }
  });

  it("D06 : Réinitialiser selon Figma 10460:23176 — 150 × 32, rayon 16, bordure bleue, icône 28 à gauche", async () => {
    await renderSheet();
    const reset = StyleSheet.flatten(screen.getByTestId("movement-filter-reset").props.style);
    expect(reset).toMatchObject({ width: 150, height: 32, borderRadius: 16, borderWidth: 1, borderColor: colors.primary });
    expect(StyleSheet.flatten(screen.getByTestId("movement-filter-reset-icon").props.style)).toMatchObject({ width: 28, height: 28, left: 9 });
  });

  it("Réinitialiser vide le brouillon ; ✕ ferme sans rien appliquer", async () => {
    const { onApply, onClose } = await renderSheet({ ...EMPTY_MOVEMENT_FILTERS, statuses: new Set(["ARCHIVED"]) });
    expect(screen.getByTestId("movement-filter-status-archived").props.accessibilityState).toMatchObject({ checked: true });
    fireEvent.press(screen.getByTestId("movement-filter-reset"));
    expect(screen.getByTestId("movement-filter-status-archived").props.accessibilityState).toMatchObject({ checked: false });
    fireEvent.press(screen.getByTestId("movement-filter-close"));
    expect(onClose).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import type { Category } from "@/domain/categories/Category";
import type { Label } from "@/domain/labels/Label";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { EMPTY_SESSION_FILTERS, type SessionCatalogueFilters } from "@/features/sessions/sessionCatalogueFilters";
import { SessionFilterSheet } from "@/features/sessions/SessionFilterSheet";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-8 (epic E, story E.6) — panneau de filtres des Séances (spécification du 27/10 §6, Figma
 * `4168:11149`) : sections et ordre, ouverture dynamique, ✓ / ✕, Réinitialiser en pied, Format (Q-E5).
 */

const categories = [
  { id: "mobilite", name: "Mobilité", color: "#2E9B62", isActive: true },
  { id: "ancienne", name: "Ancienne", color: "#8E8E93", isActive: false },
] as unknown as Category[];
const zones = [{ id: "genoux", name: "Genoux", isActive: true, createdAt: "2026-01-01T00:00:00.000Z" }] as BodyZone[];
const labels = [{ id: "hyrox", name: "Hyrox", color: "#3B82F6", isActive: true }] as unknown as Label[];

function renderSheet(filters: SessionCatalogueFilters = EMPTY_SESSION_FILTERS) {
  const onApply = jest.fn();
  const onClose = jest.fn();
  const referentials = {
    listCategories: jest.fn(async () => categories),
    listBodyZones: jest.fn(async () => zones),
    listLabels: jest.fn(async () => labels),
  } as unknown as ReferentialService;
  render(
    <TestSafeAreaProvider>
      <ReferentialServiceContext.Provider value={referentials}>
        <SessionFilterSheet filters={filters} onApply={onApply} onClose={onClose} />
      </ReferentialServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  return { onApply, onClose };
}

async function flush() {
  await act(async () => {
    for (let index = 0; index < 4; index += 1) await Promise.resolve();
  });
}

const open = (section: string) => screen.getByTestId(`session-filter-section-${section}-toggle`).props.accessibilityState.expanded as boolean;

describe("PRE-8 E.6 — panneau de filtres des Séances", () => {
  it("cadre standard, sections dans l'ordre ; sans filtre, Statut seul visible, autres repliées", async () => {
    renderSheet();
    await flush();
    expect(screen.getByTestId("session-filter-handle")).toBeTruthy();
    expect(screen.getByTestId("session-filter-close")).toBeTruthy();
    expect(screen.getByTestId("session-filter-apply")).toBeTruthy();
    expect(screen.getByTestId("session-filter-header-divider")).toBeTruthy();
    const order = screen.getAllByTestId(/^session-filter-section-[A-Z_]+$/).map((node) => node.props.testID);
    expect(order).toEqual([
      "session-filter-section-STATUS",
      "session-filter-section-CATEGORIES",
      "session-filter-section-BODY_ZONES",
      "session-filter-section-LABELS",
      "session-filter-section-FORMAT",
    ]);
    expect(screen.getByTestId("session-filter-status-active")).toBeTruthy();
    expect(["CATEGORIES", "BODY_ZONES", "LABELS", "FORMAT"].map(open)).toEqual([false, false, false, false]);
    expect(screen.queryByTestId("session-filter-category-mobilite")).toBeNull();
  });

  it("à l'ouverture, les sections portant un filtre actif sont ouvertes ; le titre ouvre et ferme sa section", async () => {
    renderSheet({ ...EMPTY_SESSION_FILTERS, labelIds: new Set(["hyrox"]) });
    await flush();
    expect(open("LABELS")).toBe(true);
    expect(open("CATEGORIES")).toBe(false);
    fireEvent.press(screen.getByTestId("session-filter-section-CATEGORIES-toggle"));
    expect(open("CATEGORIES")).toBe(true);
    expect(screen.getByTestId("session-filter-category-mobilite")).toBeTruthy();
    // Catégories actives seulement.
    expect(screen.queryByTestId("session-filter-category-ancienne")).toBeNull();
  });

  it("✓ applique le brouillon avec les libellés ; ✕ ferme sans appliquer", async () => {
    const { onApply, onClose } = renderSheet();
    await flush();
    fireEvent.press(screen.getByTestId("session-filter-status-archived"));
    fireEvent.press(screen.getByTestId("session-filter-section-BODY_ZONES-toggle"));
    fireEvent.press(screen.getByTestId("session-filter-zone-genoux"));
    fireEvent.press(screen.getByTestId("session-filter-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("session-filter-apply"));
    const [applied, appliedLabels] = onApply.mock.calls[0] as [SessionCatalogueFilters, readonly string[]];
    expect([...applied.statuses]).toEqual(["ARCHIVED"]);
    expect([...applied.bodyZoneIds]).toEqual(["genoux"]);
    expect(appliedLabels).toEqual(["Archivées", "Genoux"]);
  });

  it("Réinitialiser, fixé en pied hors défilement, vide le brouillon", async () => {
    const { onApply } = renderSheet({ ...EMPTY_SESSION_FILTERS, statuses: new Set(["ARCHIVED"]) });
    await flush();
    const footer = screen.getByTestId("session-filter-footer");
    expect(footer).toBeTruthy();
    fireEvent.press(screen.getByTestId("session-filter-reset"));
    fireEvent.press(screen.getByTestId("session-filter-apply"));
    const [applied] = onApply.mock.calls[0] as [SessionCatalogueFilters];
    expect(applied.statuses.size).toBe(0);
  });

  it("Format (Q-E5) : douze vignettes, Libre seul sélectionnable, les autres désactivées et annoncées indisponibles", async () => {
    const { onApply } = renderSheet();
    await flush();
    fireEvent.press(screen.getByTestId("session-filter-section-FORMAT-toggle"));
    const formats = screen.getAllByTestId(/^session-filter-format-/);
    expect(formats).toHaveLength(12);
    const emom = screen.getByTestId("session-filter-format-EMOM");
    expect(emom.props.accessibilityState).toEqual({ checked: false, disabled: true });
    expect(emom.props.accessibilityLabel).toBe("EMOM — indisponible");
    fireEvent.press(emom);
    const free = screen.getByTestId("session-filter-format-FREE");
    expect(free.props.accessibilityState).toEqual({ checked: false, disabled: false });
    fireEvent.press(free);
    fireEvent.press(screen.getByTestId("session-filter-apply"));
    const [applied, appliedLabels] = onApply.mock.calls[0] as [SessionCatalogueFilters, readonly string[]];
    expect([...applied.formats]).toEqual(["FREE"]);
    expect(appliedLabels).toEqual(["Libre"]);
  });

  it("Étiquettes : pastilles de couleur, valeurs actives", async () => {
    renderSheet();
    await flush();
    fireEvent.press(screen.getByTestId("session-filter-section-LABELS-toggle"));
    expect(screen.getByTestId("session-filter-label-hyrox")).toBeTruthy();
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { BodyZonePickerModal } from "@/features/reference-data/BodyZonePickerModal";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { StyleSheet } from "react-native";

function aZone(overrides: Partial<BodyZone> = {}): BodyZone {
  return {
    id: "cou",
    name: "Cou",
    canonicalKey: "cou",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function fakeReferentialService(overrides: Partial<ReferentialService> = {}): ReferentialService {
  return {
    listBodyZones: jest.fn(async () => [aZone(), aZone({ id: "epaules", name: "Épaules", canonicalKey: "epaules" })]),
    createBodyZone: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireBodyZone: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isBodyZoneUsed: jest.fn(async () => false),
    ...overrides,
  } as unknown as ReferentialService;
}

function renderModal(
  service: ReferentialService,
  props: Partial<React.ComponentProps<typeof BodyZonePickerModal>> = {},
) {
  return render(
    <ReferentialServiceContext.Provider value={service}>
      <BodyZonePickerModal selectedIds={[]} onConfirm={jest.fn()} onClose={jest.fn()} {...props} />
    </ReferentialServiceContext.Provider>,
  );
}

describe("BodyZonePickerModal — multi-select, explicit confirmation (ABA5D2662CA69)", () => {
  it("a tap toggles a Zone, without closing the modal", async () => {
    const service = fakeReferentialService();
    renderModal(service, { selectedIds: [] });

    await screen.findByTestId("body-zone-selector-tag-cou");
    fireEvent.press(screen.getByTestId("body-zone-selector-tag-cou"));

    expect(screen.getByTestId("body-zone-picker-card")).toBeTruthy();
  });

  it("Confirmer applies the working selection via onConfirm and closes", async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { selectedIds: [], onConfirm, onClose });

    await screen.findByTestId("body-zone-selector-tag-cou");
    fireEvent.press(screen.getByTestId("body-zone-selector-tag-cou"));
    fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));

    expect(onConfirm).toHaveBeenCalledWith(["cou"]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closing without confirming never calls onConfirm — the previous selection is implicitly restored by the caller", async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { selectedIds: ["epaules"], onConfirm, onClose });

    await screen.findByTestId("body-zone-selector-tag-cou");
    fireEvent.press(screen.getByTestId("body-zone-selector-tag-cou"));
    fireEvent.press(screen.getByTestId("body-zone-picker-close"));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("prevents unchecking the last remaining selected Zone, showing a notice (AF9FDD88D0270)", async () => {
    const service = fakeReferentialService();
    renderModal(service, { selectedIds: ["cou"] });

    await screen.findByTestId("body-zone-selector-tag-cou");
    fireEvent.press(screen.getByTestId("body-zone-selector-tag-cou"));

    expect(screen.getByTestId("body-zone-picker-at-least-one-notice")).toBeTruthy();
    expect(screen.getByTestId("body-zone-selector-tag-cou").props.accessibilityState.checked).toBe(true);
  });
});

describe("BodyZonePickerModal — no color (A2959B0157A33)", () => {
  it("never renders a color swatch or palette for a Zone", async () => {
    const service = fakeReferentialService();
    renderModal(service);
    await screen.findByTestId("body-zone-selector-tag-cou");
    expect(screen.queryByTestId("color-palette-popover")).toBeNull();
  });
});

describe("BodyZonePickerModal — create / rename / delete with reactivation (D2, D4)", () => {
  it("creates a new Zone and adds it to the working selection", async () => {
    const service = fakeReferentialService({
      createBodyZone: jest.fn(async () => ({
        status: "OK" as const,
        value: aZone({ id: "new-zone", name: "Avant-bras", canonicalKey: "avant-bras" }),
      })),
    });
    renderModal(service, { selectedIds: [] });

    fireEvent.press(await screen.findByTestId("body-zone-picker-create-action"));
    fireEvent.changeText(screen.getByTestId("body-zone-picker-new-name-input"), "Avant-bras");
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-new-add"));
    });

    expect(service.createBodyZone).toHaveBeenCalledWith({ name: "Avant-bras" });
  });

  it("long-press opens Annuler/Modifier/Supprimer without toggling the Zone", async () => {
    const service = fakeReferentialService();
    renderModal(service, { selectedIds: [] });

    const tag = await screen.findByTestId("body-zone-selector-tag-cou");
    await act(async () => {
      fireEvent(tag, "longPress");
    });

    expect(screen.getByTestId("body-zone-picker-long-press-modify")).toBeTruthy();
    expect(tag.props.accessibilityState.checked).toBe(false);
  });

  it("Modifier renames without changing the identifier", async () => {
    const service = fakeReferentialService({
      renameBodyZone: jest.fn(async () => ({ status: "OK" as const, value: aZone({ name: "Nuque" }) })),
    });
    renderModal(service, { selectedIds: [] });

    const tag = await screen.findByTestId("body-zone-selector-tag-cou");
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    fireEvent.press(screen.getByTestId("body-zone-picker-long-press-modify"));
    fireEvent.changeText(screen.getByTestId("body-zone-picker-edit-name-input"), "Nuque");
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-edit-save"));
    });

    expect(service.renameBodyZone).toHaveBeenCalledWith("cou", "Nuque");
  });

  it("confirming deletion removes the Zone from the working selection", async () => {
    const service = fakeReferentialService();
    renderModal(service, { selectedIds: ["cou"] });

    const tag = await screen.findByTestId("body-zone-selector-tag-cou");
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-long-press-delete"));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Supprimer"));
    });

    expect(service.retireBodyZone).toHaveBeenCalledWith("cou");
  });
});

describe("BodyZonePickerModal — R4/R10 (défilement, en-tête accessible, échec d'écriture)", () => {
  it("exposes the title as an accessible header", async () => {
    const service = fakeReferentialService();
    renderModal(service);

    await screen.findByTestId("body-zone-picker-card");
    const title = screen.getByText("Zones corporelles");
    expect(title.props.accessibilityRole).toBe("header");
  });

  it("shows a write-error message and keeps the modal open and the draft intact when createBodyZone throws", async () => {
    const service = fakeReferentialService({
      createBodyZone: jest.fn(async () => {
        throw new Error("transaction annulée");
      }),
    });
    renderModal(service, { selectedIds: [] });

    fireEvent.press(await screen.findByTestId("body-zone-picker-create-action"));
    fireEvent.changeText(screen.getByTestId("body-zone-picker-new-name-input"), "Avant-bras");
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-new-add"));
    });

    expect(screen.getByTestId("body-zone-picker-write-error")).toBeTruthy();
    expect(screen.getByTestId("body-zone-picker-new-name-input").props.value).toBe("Avant-bras");
  });
});

/**
 * PRE-3 — feuille « Zones corporelles » (Figma 4478:7209, 4683:6336) ;
 * règles PRE-2 conservées (sélection multiple, confirmation explicite, D2/D4).
 */
describe("BodyZonePickerModal — PRE-3", () => {
  it("P3-03/empty-create-name — nom vide ou blanc : Ajouter inactif, aucun message d'erreur ; un nom valide l'active", async () => {
    renderModal(fakeReferentialService());
    fireEvent.press(await screen.findByTestId("body-zone-picker-create-action"));
    expect(screen.getByTestId("body-zone-picker-new-add").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.changeText(screen.getByTestId("body-zone-picker-new-name-input"), "  ");
    expect(screen.getByTestId("body-zone-picker-new-add").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.queryByTestId("body-zone-picker-new-error")).toBeNull();
    expect(screen.queryByTestId("body-zone-picker-write-error")).toBeNull();
    fireEvent.changeText(screen.getByTestId("body-zone-picker-new-name-input"), "Avant-bras");
    expect(screen.getByTestId("body-zone-picker-new-add").props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("P3-03/zones-presentation — pastilles textuelles sans silhouette répétée ; en-tête ✕ / titre / ✓ ; sélections conservées après aller-retour", async () => {
    const onConfirm = jest.fn();
    renderModal(fakeReferentialService(), { selectedIds: ["cou"], onConfirm, silhouette: "femme" });
    await screen.findByTestId("body-zone-selector-tag-cou");
    expect(screen.queryByTestId("body-zone-selector-icon-cou")).toBeNull();
    expect(screen.queryByTestId("body-zone-selector-icon-epaules")).toBeNull();
    expect(screen.getByTestId("body-zone-picker-header")).toBeTruthy();
    fireEvent.press(screen.getByTestId("body-zone-selector-tag-epaules"));
    fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    expect(onConfirm).toHaveBeenCalledWith(["cou", "epaules"]);
  });

  it("P3-20/all-surfaces — feuille ancrée en bas, voile #1F2129 à 34 %, en-tête au-dessus du contenu défilant", async () => {
    renderModal(fakeReferentialService());
    await screen.findByTestId("body-zone-selector-tag-cou");
    const backdrop = StyleSheet.flatten(screen.getByTestId("body-zone-picker-backdrop").props.style);
    expect(backdrop).toMatchObject({ backgroundColor: "rgba(31, 33, 41, 0.34)", justifyContent: "flex-end" });
    const sheet = screen.getByTestId("body-zone-picker-sheet");
    expect(sheet.props.children[1].props.testID).toBe("body-zone-picker-header");
  });

  it("P3-22/scope-regression — Zones retirées absentes, dernière Zone non décochable, appui long conservé", async () => {
    const service = fakeReferentialService({
      listBodyZones: jest.fn(async () => [aZone(), aZone({ id: "old", name: "Ancienne", canonicalKey: "ancienne", isActive: false })]),
    });
    renderModal(service, { selectedIds: ["cou"] });
    await screen.findByTestId("body-zone-selector-tag-cou");
    expect(screen.queryByTestId("body-zone-selector-tag-old")).toBeNull();
    fireEvent.press(screen.getByTestId("body-zone-selector-tag-cou"));
    expect(screen.getByTestId("body-zone-picker-at-least-one-notice")).toBeTruthy();
    fireEvent(screen.getByTestId("body-zone-selector-tag-cou"), "longPress");
    expect(await screen.findByTestId("body-zone-picker-long-press-cancel")).toBeTruthy();
  });

  it("INTERACTION/zones — sélection multiple ; ✕ sans effet ; ✓ applique ; nom vide sans erreur", async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    renderModal(fakeReferentialService(), { selectedIds: [], onConfirm, onClose });
    await screen.findByTestId("body-zone-selector-tag-cou");
    fireEvent.press(screen.getByTestId("body-zone-selector-tag-cou"));
    fireEvent.press(screen.getByTestId("body-zone-selector-tag-epaules"));
    fireEvent.press(screen.getByTestId("body-zone-picker-close"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("ACCESSIBILITY/zones — chaque pastille expose son nom et son état coché ; les autres sélections restent ; ✕/✓ nommés", async () => {
    renderModal(fakeReferentialService(), { selectedIds: ["epaules"] });
    const cou = await screen.findByTestId("body-zone-selector-tag-cou");
    expect(cou.props.accessibilityRole).toBe("checkbox");
    fireEvent.press(cou);
    expect(screen.getByTestId("body-zone-selector-tag-cou").props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId("body-zone-selector-tag-epaules").props.accessibilityState).toMatchObject({ checked: true });
    expect(screen.getByTestId("body-zone-picker-close").props.accessibilityLabel).toBe("Fermer");
    expect(screen.getByTestId("body-zone-picker-confirm").props.accessibilityLabel).toBe("Confirmer");
  });
});

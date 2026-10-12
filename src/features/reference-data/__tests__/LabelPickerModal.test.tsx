import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { Modal, StyleSheet } from "react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { Label } from "@/domain/labels/Label";
import { LabelPickerModal } from "@/features/reference-data/LabelPickerModal";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";

function aLabel(overrides: Partial<Label> = {}): Label {
  return {
    id: "focus",
    name: "Focus",
    canonicalKey: "focus",
    color: "#3B82F6",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function fakeReferentialService(overrides: Partial<ReferentialService> = {}): ReferentialService {
  return {
    listLabels: jest.fn(async () => [aLabel()]),
    createLabel: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameLabel: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    recolorLabel: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireLabel: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isLabelUsed: jest.fn(async () => false),
    ...overrides,
  } as unknown as ReferentialService;
}

function renderModal(
  service: ReferentialService,
  props: Partial<React.ComponentProps<typeof LabelPickerModal>> = {},
) {
  return render(
    <ReferentialServiceContext.Provider value={service}>
      <LabelPickerModal selectedId={null} onSelect={jest.fn()} onClose={jest.fn()} {...props} />
    </ReferentialServiceContext.Provider>,
  );
}

describe("LabelPickerModal — zero or one, toggle off on second touch (A3409468666E5)", () => {
  // Révisé recette 3 (D-355) — auparavant : « a touch on an Étiquette selects it and closes the modal ».
  it("D-355 — a touch MARKS the Étiquette without closing; ✓ applies it then closes", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { onSelect, onClose });

    await screen.findByTestId("label-picker-tag-focus");
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-tag-focus"));
    });
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("label-picker-tag-focus").props.accessibilityState).toMatchObject({ selected: true });

    fireEvent.press(screen.getByTestId("label-picker-confirm"));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("focus"), { timeout: 3000 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("D-355 — ✕ abandons the marked choice: the previous Étiquette is kept (onSelect never called)", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    renderModal(fakeReferentialService(), { selectedId: null, onSelect, onClose });
    fireEvent.press(await screen.findByTestId("label-picker-tag-focus"));
    fireEvent.press(screen.getByTestId("label-picker-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  // Révisé recette 3 (D-355) — auparavant : le nouveau toucher retirait l'affectation immédiatement.
  it("D-355 — a new touch on the marked Étiquette unmarks it; ✓ then confirms the removal (null)", async () => {
    const onSelect = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { selectedId: "focus", onSelect });

    await screen.findByTestId("label-picker-tag-focus");
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-tag-focus"));
    });
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByTestId("label-picker-tag-focus").props.accessibilityState).toMatchObject({ selected: false });

    fireEvent.press(screen.getByTestId("label-picker-confirm"));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(null), { timeout: 3000 });
  });

  /** R10 (CE-T03-16 L1677) : l'action proposée (choisir/retirer) est distincte du nom et de l'état sélectionné. */
  it("hints the proposed action — Choisir when unselected, Retirer when selected", async () => {
    const service = fakeReferentialService();
    const unselected = renderModal(service, { selectedId: null });

    const unselectedTag = await screen.findByTestId("label-picker-tag-focus");
    expect(unselectedTag.props.accessibilityHint).toBe("Choisir");
    unselected.unmount();

    renderModal(service, { selectedId: "focus" });
    const selectedTag = await screen.findByTestId("label-picker-tag-focus");
    expect(selectedTag.props.accessibilityHint).toBe("Retirer");
  });
});

describe("LabelPickerModal — long-press menu (A03C567FAE159)", () => {
  it("long-press opens Annuler/Modifier/Supprimer without selecting or deselecting", async () => {
    const onSelect = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { onSelect, selectedId: null });

    const tag = await screen.findByTestId("label-picker-tag-focus");
    await act(async () => {
      fireEvent(tag, "longPress");
    });

    expect(screen.getByTestId("label-picker-long-press-modify")).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("LabelPickerModal — create / modify / delete with reactivation (D2, D4)", () => {
  // Révisé recette 3 (D-355) — auparavant : la création choisissait l'Étiquette et fermait la feuille.
  it("D-355 — ↑ creates the Étiquette with the colour of the bar, MARKS it, keeps the form (same field: keyboard kept); ✓ then applies it", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const service = fakeReferentialService({
      listLabels: jest.fn(async () => [aLabel(), aLabel({ id: "new-label", name: "Sport", canonicalKey: "sport", color: "#E5484D" })]),
      createLabel: jest.fn(async () => ({
        status: "OK" as const,
        value: aLabel({ id: "new-label", name: "Sport", canonicalKey: "sport", color: "#E5484D" }),
      })),
    });
    renderModal(service, { onSelect, onClose });

    fireEvent.press(await screen.findByTestId("label-picker-create-action"));
    const input = screen.getByTestId("label-picker-new-name-input");
    fireEvent.changeText(input, "Sport");
    fireEvent.press(screen.getByTestId("label-picker-new-color-band-#E5484D"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-new-add"));
      fireEvent.press(screen.getByTestId("label-picker-new-add"));
    });

    expect(service.createLabel).toHaveBeenCalledTimes(1);
    expect(service.createLabel).toHaveBeenCalledWith({ name: "Sport", color: "#E5484D" });
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("label-picker-new-name-input")).toBe(input);
    expect(input.props.value).toBe("");
    await waitFor(() => expect(screen.getByTestId("label-picker-tag-new-label").props.accessibilityState).toMatchObject({ selected: true }));

    fireEvent.press(screen.getByTestId("label-picker-confirm"));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("new-label"), { timeout: 3000 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Modifier renames and recolors without changing the identifier", async () => {
    const service = fakeReferentialService({
      renameLabel: jest.fn(async () => ({ status: "OK" as const, value: aLabel({ name: "Concentration" }) })),
      recolorLabel: jest.fn(async () => ({ status: "OK" as const, value: aLabel({ color: "#E5484D" }) })),
    });
    renderModal(service);

    const tag = await screen.findByTestId("label-picker-tag-focus");
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    fireEvent.press(screen.getByTestId("label-picker-long-press-modify"));
    fireEvent.changeText(screen.getByTestId("label-picker-edit-name-input"), "Concentration");
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-edit-save"));
    });

    expect(service.renameLabel).toHaveBeenCalledWith("focus", "Concentration");
    expect(service.recolorLabel).toHaveBeenCalled();
  });

  it("after Supprimer, the modal stays open and the Étiquette is absent from the list (§4.10 L138/L139)", async () => {
    const service = fakeReferentialService();
    renderModal(service, { selectedId: "focus" });

    const tag = await screen.findByTestId("label-picker-tag-focus");
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    service.listLabels = jest.fn(async () => [aLabel({ isActive: false })]);
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-long-press-delete"));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Supprimer"));
    });

    expect(service.retireLabel).toHaveBeenCalledWith("focus");
    expect(screen.getByTestId("label-picker-card")).toBeTruthy();
  });
});

describe("LabelPickerModal — R4/R10 (palette en flux, défilement, en-tête accessible, échec d'écriture)", () => {
  it("exposes the title as an accessible header", async () => {
    const service = fakeReferentialService();
    renderModal(service);

    await screen.findByTestId("label-picker-card");
    const title = screen.getByText("Étiquettes");
    expect(title.props.accessibilityRole).toBe("header");
  });

  // Révisé recette 3 (N-03) — auparavant : pastille « Couleur » ouvrant une palette déroulante.
  it("N-03 — the creation colours are an inline horizontal bar of 12 colours (no swatch opening a palette)", async () => {
    const service = fakeReferentialService();
    renderModal(service);

    fireEvent.press(await screen.findByTestId("label-picker-create-action"));
    const band = screen.getByTestId("label-picker-new-color-band");
    expect(StyleSheet.flatten(band.props.style).position).not.toBe("absolute");
    expect(within(band).getAllByRole("radio")).toHaveLength(12);
    expect(screen.queryByLabelText("Couleur")).toBeNull();
    expect(screen.queryByTestId("color-palette-popover")).toBeNull();
  });

  it("shows a write-error message and keeps the modal open and the draft intact when createLabel throws", async () => {
    const onClose = jest.fn();
    const service = fakeReferentialService({
      createLabel: jest.fn(async () => {
        throw new Error("transaction annulée");
      }),
    });
    renderModal(service, { onClose });

    fireEvent.press(await screen.findByTestId("label-picker-create-action"));
    fireEvent.changeText(screen.getByTestId("label-picker-new-name-input"), "Sport");
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-new-add"));
    });

    expect(screen.getByTestId("label-picker-write-error")).toBeTruthy();
    expect(screen.getByTestId("label-picker-new-name-input").props.value).toBe("Sport");
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("LabelPickerModal — recette 3 (N-03 : présentation alignée sur la Catégorie)", () => {
  it("N-03 — feuille ancrée en bas, pleine largeur, hauteur au contenu ; en-tête ✕ / titre / ✓ avec séparateur ; plus de Fermer / Annuler / Ajouter en bas ; ↑ dans le champ", async () => {
    renderModal(fakeReferentialService());
    await screen.findByTestId("label-picker-tag-focus");

    expect(StyleSheet.flatten(screen.getByTestId("label-picker-backdrop").props.style).justifyContent).toBe("flex-end");
    const sheet = StyleSheet.flatten(screen.getByTestId("label-picker-sheet").props.style);
    expect(sheet.width).toBe("100%");
    expect(sheet.height).toBeUndefined();
    expect(sheet.maxHeight).toBe("90%");
    const header = screen.getByTestId("label-picker-header");
    expect(StyleSheet.flatten(header.props.style)).toMatchObject({ borderBottomWidth: 1 });
    expect(within(header).getByTestId("label-picker-close")).toBeTruthy();
    expect(within(header).getByTestId("label-picker-confirm").props.accessibilityLabel).toBe("Confirmer l’étiquette");
    expect(within(header).getByRole("header")).toBeTruthy();

    fireEvent.press(screen.getByTestId("label-picker-create-action"));
    expect(screen.queryByTestId("label-picker-new-cancel")).toBeNull();
    expect(screen.queryByText("Fermer")).toBeNull();
    expect(screen.queryByText("Ajouter")).toBeNull();
    const send = screen.getByTestId("label-picker-new-add");
    expect(StyleSheet.flatten(send.props.style)).toMatchObject({ position: "absolute", width: 32, height: 32 });
    expect(within(screen.getByTestId("label-picker-new-row")).getByText("↑")).toBeTruthy();
  });

  it("N-03 — pastille de la pilule : Ø 12, marges égales (9) à gauche, en haut et en bas dans la pilule de 30 (contour 1)", async () => {
    renderModal(fakeReferentialService());
    const tag = StyleSheet.flatten((await screen.findByTestId("label-picker-tag-focus")).props.style);
    const swatch = StyleSheet.flatten(screen.getByTestId("label-picker-tag-focus-swatch").props.style);
    expect(swatch).toMatchObject({ width: 12, height: 12, borderRadius: 6 });
    const border = tag.borderWidth as number;
    const left = border + (tag.paddingLeft as number);
    const vertical = ((tag.height as number) - (swatch.height as number)) / 2;
    expect(tag.alignItems).toBe("center");
    expect(left).toBe(vertical);
    expect(vertical).toBe(9);
  });
});

describe("LabelPickerModal — recette 3 (N-01 : appui long avec clavier, Modifier effectif)", () => {
  it("N-01 — formulaire de création ouvert : l’appui long ouvre le menu en calque (aucun Modal imbriqué → le clavier reste), ✕ conserve le texte ; Modifier ouvre l’édition de l’entrée ciblée, puis la création revient avec son texte", async () => {
    const service = fakeReferentialService({
      renameLabel: jest.fn(async () => ({ status: "OK" as const, value: aLabel({ name: "Concentration" }) })),
      recolorLabel: jest.fn(async () => ({ status: "OK" as const, value: aLabel() })),
    });
    renderModal(service);
    fireEvent.press(await screen.findByTestId("label-picker-create-action"));
    const createInput = screen.getByTestId("label-picker-new-name-input");
    fireEvent.changeText(createInput, "Provisoire");
    const modalsBefore = screen.UNSAFE_getAllByType(Modal).length;

    await act(async () => {
      fireEvent(screen.getByTestId("label-picker-tag-focus"), "longPress");
    });
    expect(screen.getByTestId("label-picker-long-press-card")).toBeTruthy();
    expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(modalsBefore);
    // Le champ reste monté et inchangé derrière le menu (masqué à VoiceOver, accessibilityViewIsModal).
    expect(screen.getByTestId("label-picker-new-name-input", { includeHiddenElements: true })).toBe(createInput);

    fireEvent.press(screen.getByTestId("label-picker-long-press-cancel"));
    expect(screen.queryByTestId("label-picker-long-press-card")).toBeNull();
    expect(screen.getByTestId("label-picker-new-name-input").props.value).toBe("Provisoire");

    await act(async () => {
      fireEvent(screen.getByTestId("label-picker-tag-focus"), "longPress");
    });
    fireEvent.press(screen.getByTestId("label-picker-long-press-modify"));
    const editInput = screen.getByTestId("label-picker-edit-name-input");
    expect(editInput.props.value).toBe("Focus");
    fireEvent.changeText(editInput, "Concentration");
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-edit-save"));
    });
    expect(service.renameLabel).toHaveBeenCalledWith("focus", "Concentration");
    expect(service.createLabel).not.toHaveBeenCalled();
    expect(screen.queryByTestId("label-picker-edit-row")).toBeNull();
    expect(screen.getByTestId("label-picker-new-name-input").props.value).toBe("Provisoire");
  });
});

import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { Category } from "@/domain/categories/Category";
import { CategoryPickerModal } from "@/features/reference-data/CategoryPickerModal";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { StyleSheet } from "react-native";

function aCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cardio",
    name: "Cardio",
    canonicalKey: "cardio",
    color: "#3B82F6",
    isPredefined: true,
    displayOrder: 1,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function fakeReferentialService(overrides: Partial<ReferentialService> = {}): ReferentialService {
  return {
    listCategories: jest.fn(async () => [aCategory()]),
    createCategory: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameCategory: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    recolorCategory: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireCategory: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isCategoryUsed: jest.fn(async () => false),
    ...overrides,
  } as unknown as ReferentialService;
}

function renderModal(
  service: ReferentialService,
  props: Partial<React.ComponentProps<typeof CategoryPickerModal>> = {},
) {
  return render(
    <ReferentialServiceContext.Provider value={service}>
      <CategoryPickerModal
        selectedId={null}
        onSelect={jest.fn()}
        onClose={jest.fn()}
        {...props}
      />
    </ReferentialServiceContext.Provider>,
  );
}

describe("CategoryPickerModal — selection (AC873C19CD5A9)", () => {
  it("a tap on an active Category selects it and closes the modal, with no extra validation button", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { onSelect, onClose });

    await screen.findByTestId("category-picker-tag-cardio");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-tag-cardio"));
    });

    expect(onSelect).toHaveBeenCalledWith("cardio");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("announces each Category's name and selected state, color always accompanied by the name", async () => {
    const service = fakeReferentialService();
    renderModal(service, { selectedId: "cardio" });

    const tag = await screen.findByTestId("category-picker-tag-cardio");
    expect(tag.props.accessibilityLabel).toContain("Cardio");
    expect(tag.props.accessibilityState.selected).toBe(true);
  });
});

describe("CategoryPickerModal — create (D2 reactivation)", () => {
  it("creates a new Category with the chosen color, selects it and closes", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const service = fakeReferentialService({
      createCategory: jest.fn(async () => ({
        status: "OK" as const,
        value: aCategory({ id: "new-cat", name: "Danse", isPredefined: false, displayOrder: null }),
      })),
    });
    renderModal(service, { onSelect, onClose });

    await screen.findByTestId("category-picker-create-action");
    fireEvent.press(screen.getByTestId("category-picker-create-action"));
    fireEvent.changeText(screen.getByTestId("category-picker-new-name-input"), "Danse");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-new-add"));
    });

    expect(service.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Danse" }),
    );
    expect(onSelect).toHaveBeenCalledWith("new-cat");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a duplicate error and never closes when the name's key matches an active Category", async () => {
    const onClose = jest.fn();
    const service = fakeReferentialService({
      createCategory: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    });
    renderModal(service, { onClose });

    fireEvent.press(await screen.findByTestId("category-picker-create-action"));
    fireEvent.changeText(screen.getByTestId("category-picker-new-name-input"), "Cardio");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-new-add"));
    });

    expect(screen.getByTestId("category-picker-new-error")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("CategoryPickerModal — long-press menu and deletion (D4, §4.10)", () => {
  it("long-press opens the Annuler/Modifier/Supprimer menu without changing the selection", async () => {
    const onSelect = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { onSelect, selectedId: "cardio" });

    const tag = await screen.findByTestId("category-picker-tag-cardio");
    await act(async () => {
      fireEvent(tag, "longPress");
    });

    expect(screen.getByTestId("category-picker-long-press-modify")).toBeTruthy();
    expect(screen.getByTestId("category-picker-long-press-delete")).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows the used-value deletion message when the Category is referenced by an existing Exercise", async () => {
    const service = fakeReferentialService({ isCategoryUsed: jest.fn(async () => true) });
    renderModal(service, { selectedId: "cardio" });

    const tag = await screen.findByTestId("category-picker-tag-cardio");
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-long-press-delete"));
    });

    expect(screen.getByText(/objets/)).toBeTruthy();
  });

  it("after confirming deletion, the modal stays open and the value is absent from the list (§4.10 L138)", async () => {
    const service = fakeReferentialService();
    const { rerender } = renderModal(service, { selectedId: "cardio" });

    const tag = await screen.findByTestId("category-picker-tag-cardio");
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-long-press-delete"));
    });

    service.listCategories = jest.fn(async () => [aCategory({ isActive: false })]);
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Supprimer"));
    });

    expect(screen.queryByTestId("category-picker-tag-cardio")).toBeNull();
    expect(screen.getByTestId("category-picker-card")).toBeTruthy();
    rerender(
      <ReferentialServiceContext.Provider value={service}>
        <CategoryPickerModal selectedId="cardio" onSelect={jest.fn()} onClose={jest.fn()} />
      </ReferentialServiceContext.Provider>,
    );
  });

  it("Modifier opens an inline rename/recolor form, and saving applies both", async () => {
    const service = fakeReferentialService({
      renameCategory: jest.fn(async () => ({ status: "OK" as const, value: aCategory({ name: "Cardio intense" }) })),
      recolorCategory: jest.fn(async () => ({ status: "OK" as const, value: aCategory({ color: "#E5484D" }) })),
    });
    renderModal(service, { selectedId: "cardio" });

    const tag = await screen.findByTestId("category-picker-tag-cardio");
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    fireEvent.press(screen.getByTestId("category-picker-long-press-modify"));

    fireEvent.changeText(screen.getByTestId("category-picker-edit-name-input"), "Cardio intense");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-edit-save"));
    });

    expect(service.renameCategory).toHaveBeenCalledWith("cardio", "Cardio intense");
    expect(service.recolorCategory).toHaveBeenCalled();
  });
});

describe("CategoryPickerModal — R4/R10 (palette en flux, défilement, en-tête accessible, échec d'écriture)", () => {
  it("exposes the title as an accessible header", async () => {
    const service = fakeReferentialService();
    renderModal(service);

    await screen.findByTestId("category-picker-card");
    const title = screen.getByText("Catégorie");
    expect(title.props.accessibilityRole).toBe("header");
  });

  it("renders the create palette inline (never a position: absolute overlay)", async () => {
    const service = fakeReferentialService();
    renderModal(service);

    fireEvent.press(await screen.findByTestId("category-picker-create-action"));
    fireEvent.press(screen.getByLabelText("Couleur"));

    const palette = screen.getByTestId("color-palette-popover");
    expect(palette.props.style.position).not.toBe("absolute");
  });

  it("shows a write-error message and keeps the modal open and the draft intact when createCategory throws", async () => {
    const onClose = jest.fn();
    const service = fakeReferentialService({
      createCategory: jest.fn(async () => {
        throw new Error("transaction annulée");
      }),
    });
    renderModal(service, { onClose });

    fireEvent.press(await screen.findByTestId("category-picker-create-action"));
    fireEvent.changeText(screen.getByTestId("category-picker-new-name-input"), "Danse");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-new-add"));
    });

    expect(screen.getByTestId("category-picker-write-error")).toBeTruthy();
    expect(screen.getByTestId("category-picker-new-name-input").props.value).toBe("Danse");
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("CategoryPickerModal — predefined categories are administrable like custom ones (§4.10 L137)", () => {
  it("renders no isPredefined guard — a predefined Category offers the same long-press actions", async () => {
    const service = fakeReferentialService();
    renderModal(service, { selectedId: null });

    const tag = await screen.findByTestId("category-picker-tag-cardio");
    expect(tag).toBeTruthy();
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    expect(screen.getByTestId("category-picker-long-press-delete")).toBeTruthy();
  });
});

/**
 * PRE-3 — feuille « Catégorie de l'exercice » (Figma 4332:7095, 4474:7157) ;
 * comportements PRE-2 conservés (appui court = sélection, D2/D4).
 */
describe("CategoryPickerModal — PRE-3", () => {
  it("P3-03/empty-create-name — nom vide ou blanc : Ajouter inactif, aucun message d'erreur ; un nom valide l'active", async () => {
    renderModal(fakeReferentialService());
    fireEvent.press(await screen.findByTestId("category-picker-create-action"));
    const add = screen.getByTestId("category-picker-new-add");
    expect(add.props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.changeText(screen.getByTestId("category-picker-new-name-input"), "   ");
    expect(screen.getByTestId("category-picker-new-add").props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.queryByTestId("category-picker-new-error")).toBeNull();
    expect(screen.queryByTestId("category-picker-write-error")).toBeNull();
    fireEvent.changeText(screen.getByTestId("category-picker-new-name-input"), "Danse");
    expect(screen.getByTestId("category-picker-new-add").props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("P3-20/all-surfaces — feuille ancrée en bas, voile #1F2129 à 34 %, en-tête ✕ / titre / ✓, pastilles 30 rayon 16", async () => {
    renderModal(fakeReferentialService(), { selectedId: "cardio" });
    const tag = await screen.findByTestId("category-picker-tag-cardio");
    const backdrop = StyleSheet.flatten(screen.getByTestId("category-picker-backdrop").props.style);
    expect(backdrop).toMatchObject({ backgroundColor: "rgba(31, 33, 41, 0.34)", justifyContent: "flex-end" });
    expect(screen.getByTestId("category-picker-header")).toBeTruthy();
    expect(screen.getByTestId("category-picker-close")).toBeTruthy();
    expect(screen.getByTestId("category-picker-confirm")).toBeTruthy();
    const pill = StyleSheet.flatten(tag.props.style);
    expect(pill).toMatchObject({ height: 30, borderRadius: 16, backgroundColor: "#E5F0FF", borderColor: "#8283F2" });
  });

  it("P3-22/scope-regression — valeurs retirées absentes de la liste, menu d'appui long et sélection par appui court conservés", async () => {
    const onSelect = jest.fn();
    const service = fakeReferentialService({
      listCategories: jest.fn(async () => [
        aCategory(),
        aCategory({ id: "old", name: "Ancienne", canonicalKey: "ancienne", isActive: false }),
      ]),
    });
    renderModal(service, { onSelect });
    await screen.findByTestId("category-picker-tag-cardio");
    expect(screen.queryByTestId("category-picker-tag-old")).toBeNull();
    fireEvent(screen.getByTestId("category-picker-tag-cardio"), "longPress");
    expect(await screen.findByTestId("category-picker-long-press-cancel")).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("INTERACTION/category — sélection simple isolée : ✕ ferme sans sélectionner, ✓ ferme en conservant la sélection courante", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    renderModal(fakeReferentialService(), { selectedId: "cardio", onSelect, onClose });
    await screen.findByTestId("category-picker-tag-cardio");
    fireEvent.press(screen.getByTestId("category-picker-close"));
    fireEvent.press(screen.getByTestId("category-picker-confirm"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("ACCESSIBILITY/category — nom et état sélectionné, ✕/✓ nommés, titre en-tête, Ajouter annoncé désactivé sans erreur", async () => {
    renderModal(fakeReferentialService(), { selectedId: "cardio" });
    const tag = await screen.findByTestId("category-picker-tag-cardio");
    expect(tag.props.accessibilityLabel).toContain("Cardio");
    expect(tag.props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("category-picker-close").props.accessibilityLabel.length).toBeGreaterThan(0);
    expect(screen.getByTestId("category-picker-confirm").props.accessibilityLabel).toBe("Valider la catégorie");
    expect(screen.getByRole("header")).toBeTruthy();
    fireEvent.press(screen.getByTestId("category-picker-create-action"));
    expect(screen.getByTestId("category-picker-new-add").props.accessibilityState).toMatchObject({ disabled: true });
  });
});

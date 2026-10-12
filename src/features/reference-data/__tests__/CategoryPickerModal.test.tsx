import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
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
  // Décision propriétaire D-8 (12/10) : remplace « sélection et fermeture au toucher »
  // (AC873C19CD5A9, D-222) pour la Catégorie — le toucher marque, ✓ confirme.
  it("D-8 — a tap MARKS the Category without closing; ✓ confirms the assignment then closes", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { onSelect, onClose });

    await screen.findByTestId("category-picker-tag-cardio");
    expect(screen.getByTestId("category-picker-confirm").props.accessibilityState).toMatchObject({ disabled: true });
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-tag-cardio"));
    });
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("category-picker-tag-cardio").props.accessibilityState).toMatchObject({ selected: true });

    fireEvent.press(screen.getByTestId("category-picker-confirm"));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("cardio"), { timeout: 3000 });
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
  it("D-8 — ↑ creates the Category and MARKS it as chosen without closing; ✓ then assigns it", async () => {
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
    // D-8 : créée dans le référentiel et marquée ; ni affectée ni fermée avant ✓.
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("category-picker-confirm"));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("new-cat"), { timeout: 3000 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("D-8 — ✕ abandons the choice: previous Category kept, a Category created in the sheet stays in the referential (never deleted silently)", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const service = fakeReferentialService({
      createCategory: jest.fn(async () => ({
        status: "OK" as const,
        value: aCategory({ id: "new-cat", name: "Danse", isPredefined: false, displayOrder: null }),
      })),
    });
    renderModal(service, { selectedId: "cardio", onSelect, onClose });
    fireEvent.press(await screen.findByTestId("category-picker-create-action"));
    fireEvent.changeText(screen.getByTestId("category-picker-new-name-input"), "Danse");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-new-add"));
    });
    fireEvent.press(screen.getByTestId("category-picker-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
    expect(service.retireCategory).not.toHaveBeenCalled();
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
    // PRE-3 (Figma 4332:7095) : titre de feuille « Catégorie de l’exercice ».
    const title = screen.getByText("Catégorie de l’exercice");
    expect(title.props.accessibilityRole).toBe("header");
  });

  it("renders the create palette inline (never a position: absolute overlay)", async () => {
    const service = fakeReferentialService();
    renderModal(service);

    fireEvent.press(await screen.findByTestId("category-picker-create-action"));

    // Recette 1 : la palette est le bandeau figé (4474:7157), toujours visible — plus de pastille à déplier.
    const palette = screen.getByTestId("category-picker-new-color-band");
    expect(StyleSheet.flatten(palette.props.style).position).not.toBe("absolute");
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

  it("P3-20/all-surfaces — feuille ancrée en bas, voile #1F2129 à 34 %, en-tête ✕ / titre / ✓ (D-8), pastilles 30 rayon 16, action Créer 32", async () => {
    renderModal(fakeReferentialService(), { selectedId: "cardio" });
    const tag = await screen.findByTestId("category-picker-tag-cardio");
    const backdrop = StyleSheet.flatten(screen.getByTestId("category-picker-backdrop").props.style);
    expect(backdrop).toMatchObject({ backgroundColor: "rgba(31, 33, 41, 0.34)", justifyContent: "flex-end" });
    expect(screen.getByTestId("category-picker-header")).toBeTruthy();
    expect(screen.getByTestId("category-picker-close")).toBeTruthy();
    // D-8 (12/10) : la coche de validation de la maquette devient la règle — ✓ confirme le choix.
    expect(StyleSheet.flatten(screen.getByTestId("category-picker-confirm").props.style)).toMatchObject({
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "#0508E5",
    });
    expect(screen.getByText("Catégorie de l’exercice")).toBeTruthy();
    const pill = StyleSheet.flatten(tag.props.style);
    expect(pill).toMatchObject({ height: 30, borderRadius: 16, backgroundColor: "#E5F0FF", borderColor: "#8283F2" });
    expect(StyleSheet.flatten(screen.getByTestId("category-picker-create-action").props.style)).toMatchObject({
      height: 32,
      borderRadius: 16,
      borderColor: "#8283F2",
    });
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

  it("INTERACTION/category — sélection marquée au toucher puis confirmée par ✓ (D-8) ; ✕ ferme sans sélectionner", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    renderModal(fakeReferentialService(), { selectedId: null, onSelect, onClose });
    await screen.findByTestId("category-picker-tag-cardio");
    fireEvent.press(screen.getByTestId("category-picker-close"));
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-tag-cardio"));
    });
    expect(onSelect).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("category-picker-confirm"));
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith("cardio"), { timeout: 3000 });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("ACCESSIBILITY/category — nom et état sélectionné, ✕ et ✓ nommés (D-8), titre en-tête, Ajouter annoncé désactivé sans erreur", async () => {
    renderModal(fakeReferentialService(), { selectedId: "cardio" });
    const tag = await screen.findByTestId("category-picker-tag-cardio");
    expect(tag.props.accessibilityLabel).toContain("Cardio");
    expect(tag.props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("category-picker-close").props.accessibilityLabel.length).toBeGreaterThan(0);
    expect(screen.getByTestId("category-picker-confirm").props.accessibilityLabel).toBe("Confirmer la catégorie");
    expect(screen.getByRole("header").props.children).toBe("Catégorie de l’exercice");
    fireEvent.press(screen.getByTestId("category-picker-create-action"));
    expect(screen.getByTestId("category-picker-new-add").props.accessibilityState).toMatchObject({ disabled: true });
  });
});

describe("CategoryPickerModal — recette 1 F-03 (clavier)", () => {
  it("la feuille évite le clavier iOS et ramène le formulaire en vue à son ouverture et à l'apparition du clavier", async () => {
    const { Keyboard, KeyboardAvoidingView, Platform, ScrollView } = jest.requireActual<typeof import("react-native")>("react-native");
    const scrollToEnd = jest.spyOn(ScrollView.prototype, "scrollToEnd");
    const listeners: Record<string, () => void> = {};
    const addListener = jest.spyOn(Keyboard, "addListener").mockImplementation(((event: string, listener: () => void) => {
      listeners[event] = listener;
      return { remove: jest.fn() };
    }) as unknown as typeof Keyboard.addListener);
    renderModal(fakeReferentialService());

    await screen.findByTestId("category-picker-backdrop");
    expect(screen.UNSAFE_getByType(KeyboardAvoidingView).props.testID).toBe("category-picker-backdrop");
    expect(screen.UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe(Platform.OS === "ios" ? "padding" : undefined);

    scrollToEnd.mockClear();
    fireEvent.press(screen.getByTestId("category-picker-create-action"));
    fireEvent(screen.getByTestId("category-picker-card"), "contentSizeChange", 360, 900);
    expect(scrollToEnd).toHaveBeenCalled();

    scrollToEnd.mockClear();
    expect(listeners.keyboardDidShow).toBeDefined();
    act(() => listeners.keyboardDidShow!());
    expect(scrollToEnd).toHaveBeenCalled();
    scrollToEnd.mockRestore();
    addListener.mockRestore();
  });

  it("formulaire fermé : aucun défilement forcé de la liste", async () => {
    const { ScrollView } = jest.requireActual<typeof import("react-native")>("react-native");
    const scrollToEnd = jest.spyOn(ScrollView.prototype, "scrollToEnd");
    renderModal(fakeReferentialService());
    fireEvent(await screen.findByTestId("category-picker-card"), "contentSizeChange", 360, 900);
    expect(scrollToEnd).not.toHaveBeenCalled();
    scrollToEnd.mockRestore();
  });
});

describe("CategoryPickerModal — recette 1 (T-61)", () => {
  it("T-61 — texte agrandi : en-tête à hauteur minimale (jamais fixe), titre non limité à une ligne", async () => {
    renderModal(fakeReferentialService());
    const header = StyleSheet.flatten((await screen.findByTestId("category-picker-header")).props.style);
    expect(header.height).toBeUndefined();
    expect(header.minHeight).toBe(56);
    expect(screen.getByRole("header").props.numberOfLines).toBeUndefined();
  });
});

describe("CategoryPickerModal — recette 1 (T-34/T-59 : Envoyer ↑ et bandeau de couleurs)", () => {
  it("action « Envoyer » ↑ dans le champ : inactive à vide, active avec un nom, crée avec la couleur choisie dans le bandeau ; Annuler conservé", async () => {
    const service = fakeReferentialService({
      createCategory: jest.fn(async () => ({
        status: "OK" as const,
        value: aCategory({ id: "new-cat", name: "Danse", color: "#2E9B62", isPredefined: false, displayOrder: null }),
      })),
    });
    renderModal(service);
    fireEvent.press(await screen.findByTestId("category-picker-create-action"));

    const send = () => screen.getByTestId("category-picker-new-add");
    expect(within(screen.getByTestId("category-picker-new-row")).getByText("↑")).toBeTruthy();
    expect(StyleSheet.flatten(send().props.style)).toMatchObject({ position: "absolute", width: 32, height: 32, borderRadius: 16 });
    expect(send().props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByTestId("category-picker-new-cancel")).toBeTruthy();

    const band = screen.getByTestId("category-picker-new-color-band");
    expect(band.props.accessibilityRole).toBe("radiogroup");
    expect(StyleSheet.flatten(band.props.style)).toMatchObject({ flexDirection: "row", height: 40 });
    const segments = within(band).getAllByRole("radio");
    expect(segments).toHaveLength(12);
    fireEvent.press(screen.getByTestId("category-picker-new-color-band-#2E9B62"));
    const selected = StyleSheet.flatten(screen.getByTestId("category-picker-new-color-band-#2E9B62").props.style);
    expect(selected).toMatchObject({ height: 40, borderRadius: 3, borderWidth: 2, borderColor: "#FFFFFF", backgroundColor: "#2E9B62" });
    expect(StyleSheet.flatten(screen.getByTestId("category-picker-new-color-band-#E5484D").props.style).height).toBe(32);

    fireEvent.changeText(screen.getByTestId("category-picker-new-name-input"), "Danse");
    expect(send().props.accessibilityState).toMatchObject({ disabled: false });
    await act(async () => {
      fireEvent.press(send());
    });
    expect(service.createCategory).toHaveBeenCalledWith({ name: "Danse", color: "#2E9B62" });
  });
});

describe("CategoryPickerModal — D-8 et « Réduire les animations »", () => {
  it("✓ affecte puis ferme immédiatement, sans animation, quand « Réduire les animations » est actif", async () => {
    const { AccessibilityInfo } = jest.requireActual<typeof import("react-native")>("react-native");
    jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValueOnce(true);
    const onSelect = jest.fn();
    const onClose = jest.fn();
    renderModal(fakeReferentialService(), { onSelect, onClose });
    fireEvent.press(await screen.findByTestId("category-picker-tag-cardio"));
    fireEvent.press(screen.getByTestId("category-picker-confirm"));
    expect(onSelect).toHaveBeenCalledWith("cardio");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

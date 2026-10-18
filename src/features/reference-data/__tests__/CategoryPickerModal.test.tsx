import { readFileSync } from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";

import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { Category } from "@/domain/categories/Category";
import { CategoryPickerModal } from "@/features/reference-data/CategoryPickerModal";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { SESSION_COLORS } from "@/domain/sessions/Session";
import { strings } from "@/shared/i18n";
import { AccessibilityInfo, Modal, ScrollView, StyleSheet } from "react-native";

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

    // PRE-4 story 4.3 (FR-20-09, AC11) : message propre à la Catégorie, qui remplace
    // le message commun du départ (« … attachée aux objets … »).
    expect(
      screen.getByText("Cette catégorie ne sera plus proposée. Les exercices qui l’utilisent actuellement la conserveront."),
    ).toBeTruthy();
    expect(screen.queryByText(/objets/)).toBeNull();
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
  it("action « Envoyer » ↑ dans le champ : inactive à vide, active avec un nom, crée avec la couleur choisie dans le bandeau ; Annuler retiré (recette 2)", async () => {
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
    // Recette 2 (N-01/N-02, décision du 12/10) : plus d’Annuler dans le formulaire de création ; ✕ ferme la feuille.
    expect(screen.queryByTestId("category-picker-new-cancel")).toBeNull();

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

describe("category-picker — recette 2 (N-01/N-02 : clavier)", () => {
  it("clavier ouvert : espace réduit sous le formulaire de création ; refermé : espacement d’origine", async () => {
    const { Keyboard } = jest.requireActual<typeof import("react-native")>("react-native");
    const listeners: Record<string, () => void> = {};
    const spy = jest.spyOn(Keyboard, "addListener").mockImplementation(((event: string, listener: () => void) => {
      listeners[event] = listener;
      return { remove: jest.fn() };
    }) as unknown as typeof Keyboard.addListener);
    renderModal(fakeReferentialService());
    fireEvent.press(await screen.findByTestId("category-picker-create-action"));
    const content = () => StyleSheet.flatten(screen.getByTestId("category-picker-card").props.contentContainerStyle);
    const sheet = () => StyleSheet.flatten(screen.getByTestId("category-picker-sheet").props.style);
    expect(content().paddingBottom ?? content().padding).toBe(24);
    act(() => listeners.keyboardWillShow!());
    expect(content().paddingBottom).toBe(8);
    expect(sheet().paddingBottom).toBe(0);
    act(() => listeners.keyboardWillHide!());
    expect(content().paddingBottom ?? content().padding).toBe(24);
    spy.mockRestore();
  });
});

describe("CategoryPickerModal — recette 3 (N-01 : ↑ ne ferme pas le clavier)", () => {
  it("N-01 — ↑ crée la Catégorie sans démonter le formulaire (même champ, clavier conservé), vide le nom, une seule création, ni affectation ni fermeture", async () => {
    let resolveCreate: (value: unknown) => void = () => {};
    const service = fakeReferentialService({
      createCategory: jest.fn(
        () =>
          new Promise((resolve) => {
            resolveCreate = resolve;
          }),
      ) as unknown as ReferentialService["createCategory"],
    });
    const onSelect = jest.fn();
    const onClose = jest.fn();
    renderModal(service, { onSelect, onClose });
    fireEvent.press(await screen.findByTestId("category-picker-create-action"));
    const input = screen.getByTestId("category-picker-new-name-input");
    fireEvent.changeText(input, "Danse");

    // Appuis répétés pendant l’écriture : une seule création.
    fireEvent.press(screen.getByTestId("category-picker-new-add"));
    fireEvent.press(screen.getByTestId("category-picker-new-add"));
    await act(async () => {
      resolveCreate({ status: "OK", value: aCategory({ id: "new-cat", name: "Danse", isPredefined: false, displayOrder: null }) });
    });
    expect(service.createCategory).toHaveBeenCalledTimes(1);

    // Le formulaire reste ouvert, avec le MÊME champ (jamais démonté → le focus et le clavier restent).
    expect(screen.getByTestId("category-picker-new-row")).toBeTruthy();
    expect(screen.getByTestId("category-picker-new-name-input")).toBe(input);
    expect(screen.getByTestId("category-picker-new-name-input").props.value).toBe("");
    // Nom vidé : ↑ inactif, un nouvel appui ne crée rien.
    expect(screen.getByTestId("category-picker-new-add").props.accessibilityState).toMatchObject({ disabled: true });
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("CategoryPickerModal — recette 3 (N-01 : appui long avec clavier, Modifier effectif)", () => {
  it("N-01 — formulaire de création ouvert : appui long en calque (aucun Modal imbriqué → clavier conservé), ✕ conserve le texte provisoire ; Modifier affiche l’édition de l’entrée ciblée, puis la création revient avec son texte", async () => {
    const service = fakeReferentialService();
    renderModal(service);
    fireEvent.press(await screen.findByTestId("category-picker-create-action"));
    const createInput = screen.getByTestId("category-picker-new-name-input");
    fireEvent.changeText(createInput, "Provisoire");
    const modalsBefore = screen.UNSAFE_getAllByType(Modal).length;
    const target = screen.getByTestId("category-picker-tag-cardio");

    await act(async () => {
      fireEvent(target, "longPress");
    });
    expect(screen.getByTestId("category-picker-long-press-card")).toBeTruthy();
    expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(modalsBefore);
    // Le champ reste monté et inchangé derrière le menu (masqué à VoiceOver, accessibilityViewIsModal).
    expect(screen.getByTestId("category-picker-new-name-input", { includeHiddenElements: true })).toBe(createInput);

    fireEvent.press(screen.getByTestId("category-picker-long-press-cancel"));
    expect(screen.queryByTestId("category-picker-long-press-card")).toBeNull();
    expect(screen.getByTestId("category-picker-new-name-input").props.value).toBe("Provisoire");

    await act(async () => {
      fireEvent(target, "longPress");
    });
    fireEvent.press(screen.getByTestId("category-picker-long-press-modify"));
    expect(screen.getByTestId("category-picker-edit-name-input")).toBeTruthy();
    expect(screen.getByTestId("category-picker-edit-name-input").props.value).not.toBe("");
    expect(screen.queryByTestId("category-picker-new-row")).toBeNull();
    fireEvent.press(screen.getByTestId("category-picker-edit-cancel"));
    expect(service.renameCategory).not.toHaveBeenCalled();
    expect(screen.getByTestId("category-picker-new-name-input").props.value).toBe("Provisoire");
  });
});

describe("CategoryPickerModal — recette 3 (N-01, dernier écart : clavier sans interruption)", () => {
  it("N-01 — clavier ouvert → appui long → Modifier → Annuler, puis → Modifier → Enregistrer : le champ focalisé n’est JAMAIS démonté (même instance), la saisie provisoire est conservée", async () => {
    const service = fakeReferentialService();
    renderModal(service);
    fireEvent.press(await screen.findByTestId("category-picker-create-action"));
    const field = screen.getByTestId("category-picker-new-name-input");
    fireEvent.changeText(field, "Provisoire");
    const same = (testID: string) => expect(screen.getByTestId(testID, { includeHiddenElements: true })).toBe(field);

    // Appui long → menu → Modifier : le même champ passe en modification, prérempli.
    await act(async () => {
      fireEvent(screen.getByTestId("category-picker-tag-cardio"), "longPress");
    });
    same("category-picker-new-name-input");
    fireEvent.press(screen.getByTestId("category-picker-long-press-modify"));
    same("category-picker-edit-name-input");
    expect(field.props.value).toBe("Cardio");
    fireEvent.changeText(field, "Brouillon de modification");

    // Annuler : le même champ revient à la création, saisie provisoire intacte, rien d’enregistré.
    fireEvent.press(screen.getByTestId("category-picker-edit-cancel"));
    same("category-picker-new-name-input");
    expect(field.props.value).toBe("Provisoire");
    expect(service.renameCategory).not.toHaveBeenCalled();

    // Même parcours, puis Enregistrer : même champ, renommage de l’entrée ciblée, retour à la création.
    await act(async () => {
      fireEvent(screen.getByTestId("category-picker-tag-cardio"), "longPress");
    });
    fireEvent.press(screen.getByTestId("category-picker-long-press-modify"));
    same("category-picker-edit-name-input");
    fireEvent.changeText(field, "Cardio R3");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-edit-save"));
    });
    expect(service.renameCategory).toHaveBeenCalledWith(expect.any(String), "Cardio R3");
    same("category-picker-new-name-input");
    expect(field.props.value).toBe("Provisoire");
  });
});


/**
 * PRE-4 story 4.3 — feuille de Catégorie : relevé AC1 contrôlé sur les arbres
 * Figma, ordre (AC4), liste longue (AC7), suppression (AC11), échecs (AC12).
 * Les autres critères sont prouvés par les tests PRE-3 cités dans la spec 4.3.
 */
describe("CategoryPickerModal — PRE-4 story 4.3", () => {
  type FigmaNode = {
    id: string;
    type: string;
    name: string;
    properties?: { characters?: string; visible?: boolean; fills?: { color?: { r: number; g: number; b: number } }[] };
  };
  function frameNodes(frameId: string): FigmaNode[] {
    const file = path.join(__dirname, "../../../../docs/preparation/PRE-4/figma", `${frameId.replace(":", "-")}.json.gz`);
    return (JSON.parse(gunzipSync(readFileSync(file)).toString("utf8")) as { nodes: FigmaNode[] }).nodes;
  }
  const texts = (nodes: FigmaNode[]) => nodes.filter((node) => node.type === "TEXT").map((node) => node.properties?.characters ?? "");
  const SHEET_FRAMES = ["8328:35810", "8328:35932", "8328:36056", "8328:36348", "8328:36441", "8328:36536"];

  it("PRE4-4.3/AC1 — relevé : six feuilles avec séparateur d'en-tête ; menu D-354 absent (NON VÉRIFIABLE) ; dialogues I et L aux messages distincts, poignée masquée ; barre de 16 cases contre 12 couleurs (D-026)", async () => {
    for (const frameId of SHEET_FRAMES) {
      const nodes = frameNodes(frameId);
      expect(nodes.some((node) => node.name === "Divider / Modal Header — 1px" && node.properties?.visible !== false)).toBe(true);
      // D-354 (✕ / Modifier / Supprimer) n'apparaît dans aucune frame : relevé NON VÉRIFIABLE.
      expect(texts(nodes)).not.toContain("Modifier");
    }
    const messages = ["8328:35932", "8328:36441"].map((frameId) => {
      const nodes = frameNodes(frameId);
      expect(nodes.find((node) => node.name === "Poignée" && node.type === "RECTANGLE")?.properties?.visible).toBe(false);
      return nodes.find((node) => node.name === "Message — Confirmation")?.properties?.characters?.replace(/'/g, "’");
    });
    expect(messages).toEqual([
      strings.referenceData.deleteConfirm.categoryUsedMessage,
      strings.referenceData.deleteConfirm.bodyZoneUsedMessage,
    ]);
    const band = frameNodes("8328:36056").filter((node) => node.name.startsWith("Segment — "));
    expect(band).toHaveLength(16);
    expect(SESSION_COLORS).toHaveLength(12);
    renderModal(fakeReferentialService());
    fireEvent.press(await screen.findByTestId("category-picker-create-action"));
    expect(screen.getByTestId("category-picker-new-color-band").props.children).toHaveLength(12);
  });

  it("PRE4-4.3/AC4 — ordre du référentiel conservé (prédéfinies puis personnelles, ordre du Repository) ; marquer une Catégorie ne le change pas", async () => {
    const ordered = [
      aCategory({ id: "renforcement", name: "Renforcement", displayOrder: 0 }),
      aCategory({ id: "cardio", name: "Cardio", displayOrder: 1 }),
      aCategory({ id: "danse", name: "Danse", isPredefined: false, displayOrder: 0, createdAt: "2026-02-01T00:00:00.000Z" }),
      aCategory({ id: "yoga", name: "Yoga", isPredefined: false, displayOrder: 0, createdAt: "2026-03-01T00:00:00.000Z" }),
    ];
    renderModal(fakeReferentialService({ listCategories: jest.fn(async () => ordered) }));
    await screen.findByTestId("category-picker-tag-yoga");
    const order = () =>
      within(screen.getByTestId("category-picker-tag-row"))
        .getAllByRole("button")
        .map((tag) => tag.props.testID as string);
    const expected = ordered.map((category) => `category-picker-tag-${category.id}`);
    expect(order()).toEqual(expected);
    fireEvent.press(screen.getByTestId("category-picker-tag-yoga"));
    expect(screen.getByTestId("category-picker-tag-yoga").props.accessibilityState).toEqual({ selected: true });
    expect(order()).toEqual(expected);
    expect(screen.getByTestId("category-picker-sheet")).toBeTruthy();
  });

  it("PRE4-4.3/AC7 — trente Catégories : feuille bornée (90 %), liste défilante, en-tête ✕ / ✓ hors de la liste (visible clavier ouvert) ; nom long lisible en entier", async () => {
    const longName = "Renforcement musculaire du tronc, gainage et respiration";
    const many = Array.from({ length: 30 }, (_, index) =>
      aCategory({ id: `c${index}`, name: index === 29 ? longName : `Catégorie ${index}`, displayOrder: index }),
    );
    renderModal(fakeReferentialService({ listCategories: jest.fn(async () => many) }), { selectedId: "c0" });
    await screen.findByTestId("category-picker-tag-c29");
    expect(StyleSheet.flatten(screen.getByTestId("category-picker-sheet").props.style).maxHeight).toBe("90%");
    expect(screen.UNSAFE_getByType(ScrollView).props.testID).toBe("category-picker-card");
    // Clavier ouvert (formulaire de création) : ✕ et ✓ restent dans l'en-tête, hors de la zone défilante.
    fireEvent.press(screen.getByTestId("category-picker-create-action"));
    const list = screen.getByTestId("category-picker-card");
    expect(within(list).queryByTestId("category-picker-confirm")).toBeNull();
    expect(within(screen.getByTestId("category-picker-header")).getByTestId("category-picker-confirm")).toBeTruthy();
    expect(within(screen.getByTestId("category-picker-header")).getByTestId("category-picker-close")).toBeTruthy();
    const tag = screen.getByTestId("category-picker-tag-c29");
    expect(tag.props.accessibilityLabel).toBe(longName);
    expect(within(tag).getByText(longName).props.numberOfLines).toBeUndefined();
  });

  it("PRE4-4.3/AC11 — entrée utilisée : message propre à la Catégorie ; non utilisée : texte du code de départ (P34) ; titre « Supprimer « {nom} » ? »", async () => {
    for (const [used, message] of [
      [true, "Cette catégorie ne sera plus proposée. Les exercices qui l’utilisent actuellement la conserveront."],
      [false, "Cette valeur sera retirée des choix proposés."],
    ] as const) {
      const view = renderModal(fakeReferentialService({ isCategoryUsed: jest.fn(async () => used) }));
      const target = await screen.findByTestId("category-picker-tag-cardio");
      await act(async () => {
        fireEvent(target, "longPress");
      });
      fireEvent.press(screen.getByTestId("category-picker-long-press-delete"));
      expect(screen.getByText("Supprimer « Cardio » ?")).toBeTruthy();
      expect(screen.getByText(message)).toBeTruthy();
      view.unmount();
    }
  });

  // Q53 (8), règle de Hermann (2026-10-18) : la Catégorie affectée supprimée depuis la feuille
  // de l'Exercice quitte aussi sa sélection — ✓ applique une autre Catégorie choisie ensuite.
  it("PRE4-4.3/AC11 — après suppression confirmée de la Catégorie affectée : feuille ouverte sans l'entrée ; Q53 (8) : elle quitte la sélection, ✓ applique la Catégorie choisie ensuite", async () => {
    const reduceMotion = jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    let active = true;
    const service = fakeReferentialService({
      listCategories: jest.fn(async () => [aCategory({ isActive: active }), aCategory({ id: "yoga", name: "Yoga", canonicalKey: "yoga" })]),
      isCategoryUsed: jest.fn(async () => true),
      retireCategory: jest.fn(async () => {
        active = false;
        return { status: "OK" as const, value: aCategory({ isActive: false }) };
      }),
    });
    const onSelect = jest.fn();
    const onClose = jest.fn();
    renderModal(service, { selectedId: "cardio", onSelect, onClose });
    const target = await screen.findByTestId("category-picker-tag-cardio");
    await act(async () => {
      fireEvent(target, "longPress");
    });
    fireEvent.press(screen.getByTestId("category-picker-long-press-delete"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-long-press-delete-confirm-confirm"));
    });
    expect(service.retireCategory).toHaveBeenCalledWith("cardio");
    expect(screen.queryByTestId("category-picker-tag-cardio")).toBeNull();
    expect(screen.getByTestId("category-picker-sheet")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByTestId("category-picker-confirm").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("category-picker-tag-yoga"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-confirm"));
    });
    expect(onSelect).toHaveBeenCalledWith("yoga");
    reduceMotion.mockRestore();
  });

  it("PRE4-4.3/AC12 — échec de suppression : message du code de départ, feuille ouverte, affectation intacte  ; aucune action destructive par simple sélection", async () => {
    const service = fakeReferentialService({
      retireCategory: jest.fn(async () => {
        throw new Error("disque plein");
      }),
    });
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    renderModal(service, { selectedId: "cardio", onSelect, onClose });
    const tag = await screen.findByTestId("category-picker-tag-cardio");
    // Simple sélection : jamais de suppression.
    fireEvent.press(tag);
    expect(service.retireCategory).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    fireEvent.press(screen.getByTestId("category-picker-long-press-delete"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-long-press-delete-confirm-confirm"));
    });
    expect(screen.getByTestId("category-picker-write-error").props.children).toBe(
      "La modification n’a pas pu être enregistrée. Réessayez.",
    );
    expect(screen.getByTestId("category-picker-tag-cardio")).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

/**
 * PRE-4, décision Q53 (8) de Hermann (2026-10-18) : Catégorie supprimée — elle quitte la liste
 * de l'Exercice depuis lequel la suppression est faite ; les autres Exercices qui l'ont la
 * montrent choisie, sur fond rouge clair, sans menu.
 */
describe("CategoryPickerModal — PRE-4 Q53 (8)", () => {
  async function deleteCategory(id: string) {
    const target = await screen.findByTestId(`category-picker-tag-${id}`);
    await act(async () => {
      fireEvent(target, "longPress");
    });
    fireEvent.press(screen.getByTestId("category-picker-long-press-delete"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-long-press-delete-confirm-confirm"));
    });
  }
  function retiringService(used: boolean) {
    const retired = new Set<string>();
    return fakeReferentialService({
      listCategories: jest.fn(async () =>
        [aCategory(), aCategory({ id: "force", name: "Force", canonicalKey: "force", displayOrder: 2 })].map((category) => ({
          ...category,
          isActive: !retired.has(category.id),
        })),
      ),
      isCategoryUsed: jest.fn(async () => used),
      retireCategory: jest.fn(async (id: string) => {
        retired.add(id);
        return { status: "OK" as const, value: aCategory({ id, isActive: false }) };
      }),
    });
  }

  it("PRE4-Q53/category-other-exercise — Catégorie retirée avant l'ouverture et affectée : listée, choisie, fond #FFF1F0, état dans le nom accessible, sans menu ; non affectée : absente", async () => {
    const service = fakeReferentialService({
      listCategories: jest.fn(async () => [
        aCategory({ isActive: false }),
        aCategory({ id: "force", name: "Force", canonicalKey: "force", displayOrder: 2 }),
        aCategory({ id: "yoga", name: "Yoga", canonicalKey: "yoga", displayOrder: 3, isActive: false }),
      ]),
    });
    renderModal(service, { selectedId: "cardio" });
    const cardio = await screen.findByTestId("category-picker-tag-cardio");
    expect(cardio.props.accessibilityState).toMatchObject({ selected: true });
    expect(StyleSheet.flatten(cardio.props.style).backgroundColor).toBe("#FFF1F0");
    expect(cardio.props.accessibilityLabel).toContain("Cardio, retirée de la liste des choix");
    expect(cardio.props.accessibilityActions).toBeUndefined();
    await act(async () => {
      fireEvent(cardio, "longPress");
    });
    expect(screen.queryByTestId("category-picker-long-press-delete")).toBeNull();
    expect(screen.queryByTestId("category-picker-tag-yoga")).toBeNull();
    expect(screen.queryByText(/retirée/i)).toBeNull();
    // Remplacer : une autre Catégorie se choisit ; la Catégorie retirée reste listée.
    fireEvent.press(screen.getByTestId("category-picker-tag-force"));
    expect(screen.getByTestId("category-picker-tag-cardio").props.accessibilityState).toMatchObject({ selected: false });
  });

  // Règle de Hermann : dans l'Exercice d'où la suppression est faite, la Catégorie disparaît du
  // sélecteur et de la sélection, même si d'autres objets l'utilisent ; une autre se choisit.
  it("PRE4-Q53/category-delete-current-used — supprimée depuis l'Exercice courant, utilisée ailleurs : quitte aussi la liste et la sélection, ✓ inactif, « Choisissez-en une autre » ; une autre Catégorie se choisit", async () => {
    const onCategoryRetired = jest.fn();
    renderModal(retiringService(true), { selectedId: "cardio", onCategoryRetired });
    await deleteCategory("cardio");
    expect(screen.queryByTestId("category-picker-tag-cardio")).toBeNull();
    expect(onCategoryRetired).toHaveBeenCalledWith("cardio");
    expect(screen.getByTestId("category-picker-retired-notice").props.children).toBe(
      "Cette valeur a été retirée. Choisissez-en une autre.",
    );
    expect(screen.getByTestId("category-picker-confirm").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("category-picker-tag-force"));
    expect(screen.getByTestId("category-picker-confirm").props.accessibilityState).toMatchObject({ disabled: false });
  });

  it("PRE4-Q53/category-delete-current-unused — supprimée depuis l'Exercice courant, utilisée nulle part : quitte la liste et la sélection, ✓ inactif, « Choisissez-en une autre »", async () => {
    const onCategoryRetired = jest.fn();
    renderModal(retiringService(false), { selectedId: "cardio", onCategoryRetired });
    await deleteCategory("cardio");
    expect(screen.queryByTestId("category-picker-tag-cardio")).toBeNull();
    expect(onCategoryRetired).toHaveBeenCalledWith("cardio");
    expect(screen.getByTestId("category-picker-retired-notice").props.children).toBe(
      "Cette valeur a été retirée. Choisissez-en une autre.",
    );
    expect(screen.getByTestId("category-picker-confirm").props.accessibilityState).toMatchObject({ disabled: true });
  });
});

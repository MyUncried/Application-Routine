import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { BodyZonePickerModal } from "@/features/reference-data/BodyZonePickerModal";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { Modal, StyleSheet } from "react-native";

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
    expect(screen.getByText("Créer une zone corporelle")).toBeTruthy();
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

describe("BodyZonePickerModal — recette 1 F-03 (clavier)", () => {
  it("la feuille évite le clavier iOS et ramène le formulaire en vue à son ouverture et à l'apparition du clavier", async () => {
    const { Keyboard, KeyboardAvoidingView, Platform, ScrollView } = jest.requireActual<typeof import("react-native")>("react-native");
    const scrollToEnd = jest.spyOn(ScrollView.prototype, "scrollToEnd");
    const listeners: Record<string, () => void> = {};
    const addListener = jest.spyOn(Keyboard, "addListener").mockImplementation(((event: string, listener: () => void) => {
      listeners[event] = listener;
      return { remove: jest.fn() };
    }) as unknown as typeof Keyboard.addListener);
    renderModal(fakeReferentialService());

    await screen.findByTestId("body-zone-picker-backdrop");
    expect(screen.UNSAFE_getByType(KeyboardAvoidingView).props.testID).toBe("body-zone-picker-backdrop");
    expect(screen.UNSAFE_getByType(KeyboardAvoidingView).props.behavior).toBe(Platform.OS === "ios" ? "padding" : undefined);

    scrollToEnd.mockClear();
    fireEvent.press(await screen.findByTestId("body-zone-picker-create-action"));
    fireEvent(screen.getByTestId("body-zone-picker-card"), "contentSizeChange", 360, 900);
    expect(scrollToEnd).toHaveBeenCalled();

    scrollToEnd.mockClear();
    expect(listeners.keyboardDidShow).toBeDefined();
    act(() => listeners.keyboardDidShow!());
    expect(scrollToEnd).toHaveBeenCalled();
    scrollToEnd.mockRestore();
    addListener.mockRestore();
  });
});

describe("BodyZonePickerModal — recette 1 (T-61)", () => {
  it("T-61 — texte agrandi : en-tête à hauteur minimale (jamais fixe), titre non limité à une ligne", async () => {
    renderModal(fakeReferentialService());
    const header = StyleSheet.flatten((await screen.findByTestId("body-zone-picker-header")).props.style);
    expect(header.height).toBeUndefined();
    expect(header.minHeight).toBe(56);
    expect(screen.getByRole("header").props.numberOfLines).toBeUndefined();
  });
});

describe("BodyZonePickerModal — recette 1 (T-34/T-59 : Envoyer ↑)", () => {
  it("action « Envoyer » ↑ dans le champ : inactive à vide, active avec un nom ; Annuler retiré (recette 2) ; aucune palette", async () => {
    renderModal(fakeReferentialService());
    fireEvent.press(await screen.findByTestId("body-zone-picker-create-action"));
    const send = () => screen.getByTestId("body-zone-picker-new-add");
    expect(screen.getByText("↑")).toBeTruthy();
    expect(StyleSheet.flatten(send().props.style)).toMatchObject({ position: "absolute", width: 32, height: 32, borderRadius: 16 });
    expect(send().props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.changeText(screen.getByTestId("body-zone-picker-new-name-input"), "Mollets");
    expect(send().props.accessibilityState).toMatchObject({ disabled: false });
    // Recette 2 (N-01/N-02, décision du 12/10) : plus d’Annuler dans le formulaire de création ; ✕ ferme la feuille.
    expect(screen.queryByTestId("body-zone-picker-new-cancel")).toBeNull();
    expect(screen.queryByRole("radiogroup")).toBeNull();
  });
});

describe("body-zone-picker — recette 2 (N-01/N-02 : clavier)", () => {
  it("clavier ouvert : espace réduit sous le formulaire de création ; refermé : espacement d’origine", async () => {
    const { Keyboard } = jest.requireActual<typeof import("react-native")>("react-native");
    const listeners: Record<string, () => void> = {};
    const spy = jest.spyOn(Keyboard, "addListener").mockImplementation(((event: string, listener: () => void) => {
      listeners[event] = listener;
      return { remove: jest.fn() };
    }) as unknown as typeof Keyboard.addListener);
    renderModal(fakeReferentialService());
    fireEvent.press(await screen.findByTestId("body-zone-picker-create-action"));
    const content = () => StyleSheet.flatten(screen.getByTestId("body-zone-picker-card").props.contentContainerStyle);
    const sheet = () => StyleSheet.flatten(screen.getByTestId("body-zone-picker-sheet").props.style);
    expect(content().paddingBottom ?? content().padding).toBe(24);
    act(() => listeners.keyboardWillShow!());
    expect(content().paddingBottom).toBe(8);
    expect(sheet().paddingBottom).toBe(0);
    act(() => listeners.keyboardWillHide!());
    expect(content().paddingBottom ?? content().padding).toBe(24);
    spy.mockRestore();
  });
});

describe("BodyZonePickerModal — recette 3 (N-02 : ↑ ne ferme pas le clavier)", () => {
  it("N-02 — ↑ crée la Zone sans démonter le formulaire (même champ, clavier conservé), l’ajoute à la sélection, vide le nom ; une seule création", async () => {
    let resolveCreate: (value: unknown) => void = () => {};
    const service = fakeReferentialService({
      createBodyZone: jest.fn(
        () =>
          new Promise((resolve) => {
            resolveCreate = resolve;
          }),
      ) as unknown as ReferentialService["createBodyZone"],
    });
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    renderModal(service, { selectedIds: [], onConfirm, onClose });
    fireEvent.press(await screen.findByTestId("body-zone-picker-create-action"));
    const input = screen.getByTestId("body-zone-picker-new-name-input");
    fireEvent.changeText(input, "Avant-bras");

    fireEvent.press(screen.getByTestId("body-zone-picker-new-add"));
    fireEvent.press(screen.getByTestId("body-zone-picker-new-add"));
    await act(async () => {
      resolveCreate({ status: "OK", value: aZone({ id: "new-zone", name: "Avant-bras", canonicalKey: "avant-bras" }) });
    });
    expect(service.createBodyZone).toHaveBeenCalledTimes(1);

    expect(screen.getByTestId("body-zone-picker-new-row")).toBeTruthy();
    expect(screen.getByTestId("body-zone-picker-new-name-input")).toBe(input);
    expect(screen.getByTestId("body-zone-picker-new-name-input").props.value).toBe("");
    expect(screen.getByTestId("body-zone-picker-new-add").props.accessibilityState).toMatchObject({ disabled: true });
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("BodyZonePickerModal — recette 3 (N-01 : appui long avec clavier, Modifier effectif)", () => {
  it("N-01 — formulaire de création ouvert : appui long en calque (aucun Modal imbriqué → clavier conservé), ✕ conserve le texte provisoire ; Modifier affiche l’édition de l’entrée ciblée, puis la création revient avec son texte", async () => {
    const service = fakeReferentialService();
    renderModal(service);
    fireEvent.press(await screen.findByTestId("body-zone-picker-create-action"));
    const createInput = screen.getByTestId("body-zone-picker-new-name-input");
    fireEvent.changeText(createInput, "Provisoire");
    const modalsBefore = screen.UNSAFE_getAllByType(Modal).length;
    const target = screen.getByTestId("body-zone-selector-tag-cou");

    await act(async () => {
      fireEvent(target, "longPress");
    });
    expect(screen.getByTestId("body-zone-picker-long-press-card")).toBeTruthy();
    expect(screen.UNSAFE_getAllByType(Modal)).toHaveLength(modalsBefore);
    // Le champ reste monté et inchangé derrière le menu (masqué à VoiceOver, accessibilityViewIsModal).
    expect(screen.getByTestId("body-zone-picker-new-name-input", { includeHiddenElements: true })).toBe(createInput);

    fireEvent.press(screen.getByTestId("body-zone-picker-long-press-cancel"));
    expect(screen.queryByTestId("body-zone-picker-long-press-card")).toBeNull();
    expect(screen.getByTestId("body-zone-picker-new-name-input").props.value).toBe("Provisoire");

    await act(async () => {
      fireEvent(target, "longPress");
    });
    fireEvent.press(screen.getByTestId("body-zone-picker-long-press-modify"));
    expect(screen.getByTestId("body-zone-picker-edit-name-input")).toBeTruthy();
    expect(screen.getByTestId("body-zone-picker-edit-name-input").props.value).not.toBe("");
    expect(screen.queryByTestId("body-zone-picker-new-row")).toBeNull();
    fireEvent.press(screen.getByTestId("body-zone-picker-edit-cancel"));
    expect(service.renameBodyZone).not.toHaveBeenCalled();
    expect(screen.getByTestId("body-zone-picker-new-name-input").props.value).toBe("Provisoire");
  });
});

describe("BodyZonePickerModal — recette 3 (N-01, dernier écart : clavier sans interruption)", () => {
  it("N-01 — clavier ouvert → appui long → Modifier → Annuler, puis → Modifier → Enregistrer : le champ focalisé n’est JAMAIS démonté (même instance), la saisie provisoire est conservée", async () => {
    const service = fakeReferentialService();
    renderModal(service);
    fireEvent.press(await screen.findByTestId("body-zone-picker-create-action"));
    const field = screen.getByTestId("body-zone-picker-new-name-input");
    fireEvent.changeText(field, "Provisoire");
    const same = (testID: string) => expect(screen.getByTestId(testID, { includeHiddenElements: true })).toBe(field);

    // Appui long → menu → Modifier : le même champ passe en modification, prérempli.
    await act(async () => {
      fireEvent(screen.getByTestId("body-zone-selector-tag-cou"), "longPress");
    });
    same("body-zone-picker-new-name-input");
    fireEvent.press(screen.getByTestId("body-zone-picker-long-press-modify"));
    same("body-zone-picker-edit-name-input");
    expect(field.props.value).toBe("Cou");
    fireEvent.changeText(field, "Brouillon de modification");

    // Annuler : le même champ revient à la création, saisie provisoire intacte, rien d’enregistré.
    fireEvent.press(screen.getByTestId("body-zone-picker-edit-cancel"));
    same("body-zone-picker-new-name-input");
    expect(field.props.value).toBe("Provisoire");
    expect(service.renameBodyZone).not.toHaveBeenCalled();

    // Même parcours, puis Enregistrer : même champ, renommage de l’entrée ciblée, retour à la création.
    await act(async () => {
      fireEvent(screen.getByTestId("body-zone-selector-tag-cou"), "longPress");
    });
    fireEvent.press(screen.getByTestId("body-zone-picker-long-press-modify"));
    same("body-zone-picker-edit-name-input");
    fireEvent.changeText(field, "Cou R3");
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-edit-save"));
    });
    expect(service.renameBodyZone).toHaveBeenCalledWith(expect.any(String), "Cou R3");
    same("body-zone-picker-new-name-input");
    expect(field.props.value).toBe("Provisoire");
  });
});


/**
 * PRE-4 story 4.3 — feuille des Zones : seul le message d'une Zone utilisée change
 * (bilan §4.3). Suppression depuis la feuille : décision Q53 (7) de Hermann (2026-10-18) —
 * la Zone quitte la feuille et la sélection de l'Exercice courant (PRE-3) ; les autres
 * Exercices qui l'avaient la gardent, en rouge dans leur feuille.
 */
describe("BodyZonePickerModal — PRE-4 story 4.3", () => {
  async function deleteZone(id: string) {
    const target = await screen.findByTestId(`body-zone-selector-tag-${id}`);
    await act(async () => {
      fireEvent(target, "longPress");
    });
    fireEvent.press(screen.getByTestId("body-zone-picker-long-press-delete"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-long-press-delete-confirm-confirm"));
    });
  }

  it("PRE4-4.3/AC11 — entrée utilisée : message propre à la Zone corporelle ; non utilisée : texte du code de départ (P34)", async () => {
    for (const [used, message] of [
      [true, "Cette zone corporelle ne sera plus proposée. Les exercices qui l’utilisent actuellement la conserveront."],
      [false, "Cette valeur sera retirée des choix proposés."],
    ] as const) {
      const view = renderModal(fakeReferentialService({ isBodyZoneUsed: jest.fn(async () => used) }));
      const target = await screen.findByTestId("body-zone-selector-tag-cou");
      await act(async () => {
        fireEvent(target, "longPress");
      });
      fireEvent.press(screen.getByTestId("body-zone-picker-long-press-delete"));
      expect(screen.getByText("Supprimer « Cou » ?")).toBeTruthy();
      expect(screen.getByText(message)).toBeTruthy();
      view.unmount();
    }
  });

  // Q53 (7), précision de Hermann du 2026-10-18 : la Zone supprimée depuis la feuille de
  // l'Exercice courant en disparaît (liste et sélection) ; un AUTRE Exercice qui l'avait la
  // garde, cochée sur fond rouge clair dans sa propre feuille.
  it("PRE4-Q53/delete-current-vs-other — supprimée depuis l'Exercice courant : quitte sa liste et sa sélection (et celle de l'Exercice) ; dans la feuille d'un autre Exercice qui l'avait : cochée, fond rouge clair", async () => {
    const retired = new Set<string>();
    const zones = () =>
      [aZone(), aZone({ id: "epaules", name: "Épaules", canonicalKey: "epaules" })].map((zone) => ({
        ...zone,
        isActive: !retired.has(zone.id),
      }));
    const service = fakeReferentialService({
      listBodyZones: jest.fn(async () => zones()),
      isBodyZoneUsed: jest.fn(async () => true),
      retireBodyZone: jest.fn(async (id: string) => {
        retired.add(id);
        return { status: "OK" as const, value: aZone({ id, isActive: false }) };
      }),
    });
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const onZoneRetired = jest.fn();
    const current = renderModal(service, { selectedIds: ["cou", "epaules"], onConfirm, onClose, onZoneRetired });
    await deleteZone("cou");
    expect(service.retireBodyZone).toHaveBeenCalledWith("cou");
    expect(screen.queryByTestId("body-zone-selector-tag-cou")).toBeNull();
    expect(onZoneRetired).toHaveBeenCalledWith("cou");
    expect(screen.getByTestId("body-zone-picker-sheet")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });
    expect(onConfirm).toHaveBeenCalledWith(["epaules"]);
    current.unmount();

    // Autre Exercice auquel « Cou » était déjà affectée : affectation conservée, fond rouge.
    renderModal(service, { selectedIds: ["cou"] });
    const cou = await screen.findByTestId("body-zone-selector-tag-cou");
    expect(cou.props.accessibilityState).toEqual({ checked: true });
    expect(StyleSheet.flatten(cou.props.style).backgroundColor).toBe("#FFF1F0");
    expect(cou.props.accessibilityLabel).toBe("Cou, retirée de la liste des choix");
  });

  it("PRE4-Q53/delete-not-proposed — une Zone supprimée n'est plus proposée à un Exercice qui ne l'a pas", async () => {
    const service = fakeReferentialService({
      listBodyZones: jest.fn(async () => [aZone({ isActive: false }), aZone({ id: "epaules", name: "Épaules", canonicalKey: "epaules" })]),
    });
    renderModal(service, { selectedIds: ["epaules"] });
    await screen.findByTestId("body-zone-selector-tag-epaules");
    expect(screen.queryByTestId("body-zone-selector-tag-cou")).toBeNull();
  });

  it("PRE4-Q53/delete-only-zone — seule Zone de l'Exercice supprimée : elle quitte la feuille, avis « au moins une Zone », sans erreur ; ✓ applique une sélection vide (Terminer inactif côté Éditeur)", async () => {
    const retired = new Set<string>();
    const service = fakeReferentialService({
      listBodyZones: jest.fn(async () =>
        [aZone(), aZone({ id: "epaules", name: "Épaules", canonicalKey: "epaules" })].map((zone) => ({
          ...zone,
          isActive: !retired.has(zone.id),
        })),
      ),
      isBodyZoneUsed: jest.fn(async () => true),
      retireBodyZone: jest.fn(async (id: string) => {
        retired.add(id);
        return { status: "OK" as const, value: aZone({ id, isActive: false }) };
      }),
    });
    const onConfirm = jest.fn();
    renderModal(service, { selectedIds: ["cou"], onConfirm });
    await deleteZone("cou");
    expect(screen.queryByTestId("body-zone-selector-tag-cou")).toBeNull();
    expect(screen.getByTestId("body-zone-picker-at-least-one-notice").props.children).toBe(
      "Au moins une Zone doit rester sélectionnée.",
    );
    expect(screen.queryByTestId("body-zone-picker-write-error")).toBeNull();
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });
    expect(onConfirm).toHaveBeenCalledWith([]);
  });

  it("PRE4-4.3/AC11 — annuler la suppression laisse la sélection intacte", async () => {
    const onConfirm = jest.fn();
    const service = fakeReferentialService({ isBodyZoneUsed: jest.fn(async () => true) });
    renderModal(service, { selectedIds: ["cou"], onConfirm });
    const target = await screen.findByTestId("body-zone-selector-tag-cou");
    await act(async () => {
      fireEvent(target, "longPress");
    });
    fireEvent.press(screen.getByTestId("body-zone-picker-long-press-delete"));
    fireEvent.press(screen.getByTestId("body-zone-picker-long-press-delete-confirm-cancel"));
    expect(service.retireBodyZone).not.toHaveBeenCalled();
    expect(screen.getByTestId("body-zone-selector-tag-cou").props.accessibilityState).toEqual({ checked: true });
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });
    expect(onConfirm).toHaveBeenCalledWith(["cou"]);
  });

  it("PRE4-4.3/AC12 — échec de suppression : message du code de départ, feuille ouverte, sélection intacte ; une simple sélection ne supprime jamais", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const service = fakeReferentialService({
      retireBodyZone: jest.fn(async () => {
        throw new Error("disque plein");
      }),
    });
    const onConfirm = jest.fn();
    renderModal(service, { selectedIds: ["cou"], onConfirm });
    fireEvent.press(await screen.findByTestId("body-zone-selector-tag-epaules"));
    expect(service.retireBodyZone).not.toHaveBeenCalled();
    await deleteZone("cou");
    expect(screen.getByTestId("body-zone-picker-write-error").props.children).toBe(
      "La modification n’a pas pu être enregistrée. Réessayez.",
    );
    expect(screen.getByTestId("body-zone-selector-tag-cou").props.accessibilityState).toEqual({ checked: true });
    expect(onConfirm).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});

/**
 * PRE-4, décision Q53 de Hermann (2026-10-18, remplace Q49 b pour les Zones) : une Zone
 * retirée affectée à l'Exercice reste visible, cochée et interactive, sur fond rouge clair,
 * sans mention visible ; jamais proposée à un Exercice qui ne l'a pas.
 */
describe("BodyZonePickerModal — PRE-4 Q53 (Zone retirée encore affectée)", () => {
  const withRetiredLegs = () =>
    fakeReferentialService({
      listBodyZones: jest.fn(async () => [
        aZone(),
        aZone({ id: "jambes", name: "Jambes", canonicalKey: "jambes", isActive: false }),
        aZone({ id: "old", name: "Ancienne", canonicalKey: "ancienne", isActive: false }),
      ]),
    });

  it("PRE4-Q53/picker-visible — Zone retirée affectée : listée, cochée, fond #FFF1F0, aucun texte « Retirée », état annoncé par son nom accessible ; Zone retirée non affectée absente", async () => {
    renderModal(withRetiredLegs(), { selectedIds: ["jambes"] });
    const legs = await screen.findByTestId("body-zone-selector-tag-jambes");
    expect(legs.props.accessibilityState).toEqual({ checked: true });
    expect(legs.props.accessibilityRole).toBe("checkbox");
    expect(legs.props.accessibilityLabel).toBe("Jambes, retirée de la liste des choix");
    expect(StyleSheet.flatten(legs.props.style).backgroundColor).toBe("#FFF1F0");
    expect(screen.getByText("Jambes")).toBeTruthy();
    expect(screen.queryByText(/retirée/i)).toBeNull();
    expect(screen.queryByTestId("body-zone-selector-tag-old")).toBeNull();
    // Zone active : ni fond rouge ni libellé d'état.
    const cou = screen.getByTestId("body-zone-selector-tag-cou");
    expect(StyleSheet.flatten(cou.props.style).backgroundColor).not.toBe("#FFF1F0");
    expect(cou.props.accessibilityLabel).toBe("Cou");
  });

  it("PRE4-Q53/picker-last-zone — dernière Zone : non décochable, message « au moins une Zone » existant", async () => {
    const onConfirm = jest.fn();
    renderModal(withRetiredLegs(), { selectedIds: ["jambes"], onConfirm });
    fireEvent.press(await screen.findByTestId("body-zone-selector-tag-jambes"));
    expect(screen.getByTestId("body-zone-picker-at-least-one-notice").props.children).toBe(
      "Au moins une Zone doit rester sélectionnée.",
    );
    expect(screen.getByTestId("body-zone-selector-tag-jambes").props.accessibilityState).toEqual({ checked: true });
    fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    expect(onConfirm).toHaveBeenCalledWith(["jambes"]);
  });

  it("PRE4-Q53/picker-replace — remplacer : cocher une autre Zone puis décocher la Zone retirée, qui reste listée (décochée) jusqu'à la fermeture ; ✓ applique", async () => {
    const onConfirm = jest.fn();
    renderModal(withRetiredLegs(), { selectedIds: ["jambes"], onConfirm });
    fireEvent.press(await screen.findByTestId("body-zone-selector-tag-cou"));
    fireEvent.press(screen.getByTestId("body-zone-selector-tag-jambes"));
    const legs = screen.getByTestId("body-zone-selector-tag-jambes");
    expect(legs.props.accessibilityState).toEqual({ checked: false });
    expect(StyleSheet.flatten(legs.props.style).backgroundColor).toBe("#FFF1F0");
    // Elle peut être recochée tant que la feuille est ouverte (conserver).
    fireEvent.press(legs);
    expect(screen.getByTestId("body-zone-selector-tag-jambes").props.accessibilityState).toEqual({ checked: true });
    fireEvent.press(screen.getByTestId("body-zone-selector-tag-jambes"));
    fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    expect(onConfirm).toHaveBeenCalledWith(["cou"]);
  });

  it("PRE4-Q53/picker-no-menu — Zone retirée : ni menu d'appui long, ni action « Modifier ou supprimer »", async () => {
    const service = withRetiredLegs();
    renderModal(service, { selectedIds: ["jambes", "cou"] });
    const legs = await screen.findByTestId("body-zone-selector-tag-jambes");
    expect(legs.props.accessibilityActions).toBeUndefined();
    await act(async () => {
      fireEvent(legs, "longPress");
    });
    expect(screen.queryByTestId("body-zone-picker-long-press-cancel")).toBeNull();
    expect(service.isBodyZoneUsed).not.toHaveBeenCalled();
    // La Zone active garde son menu PRE-3.
    expect(screen.getByTestId("body-zone-selector-tag-cou").props.accessibilityActions).toHaveLength(1);
  });
});

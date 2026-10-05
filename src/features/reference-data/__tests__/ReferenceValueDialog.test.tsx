import { fireEvent, render, screen } from "@testing-library/react-native";
import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { useRef } from "react";
import { AccessibilityInfo, View } from "react-native";

import { ReferenceValueDialog, type ReferenceValueDialogProps } from "@/features/reference-data/ReferenceValueDialog";

/**
 * R10 (CE-UI-09 L2840 ; CE-T03-16 L1677) : `findNodeHandle` ne résout jamais
 * de nœud natif réel sous `react-test-renderer` (environnement Jest, hors de
 * portée de ce composant) — seul `AccessibilityInfo.setAccessibilityFocus`
 * (invocation et moment exacts) est donc observable ici ; la résolution
 * réelle du tag natif reste `PENDING_DEVICE` (ACCESSIBILITY_CHECK).
 */
function Harness(props: Omit<ReferenceValueDialogProps, "returnFocusRef">) {
  const listRef = useRef<View>(null);
  return (
    <>
      <View ref={listRef} testID="harness-list" />
      <ReferenceValueDialog {...props} returnFocusRef={listRef} />
    </>
  );
}

describe("ReferenceValueDialog — long-press menu (D4, D-259)", () => {
  it("offers exactly Annuler, Modifier, Supprimer, without selecting or deselecting the value", () => {
    const onCancel = jest.fn();
    const onModify = jest.fn();
    const onDelete = jest.fn();
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={false}
        onCancel={onCancel}
        onModify={onModify}
        onDelete={onDelete}
        testIDPrefix="ref-dialog"
      />,
    );

    expect(screen.getByTestId("ref-dialog-cancel")).toBeTruthy();
    expect(screen.getByTestId("ref-dialog-modify")).toBeTruthy();
    expect(screen.getByTestId("ref-dialog-delete")).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
    expect(onModify).not.toHaveBeenCalled();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("Annuler calls onCancel without touching Modifier/Supprimer", () => {
    const onCancel = jest.fn();
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={false}
        onCancel={onCancel}
        onModify={jest.fn()}
        onDelete={jest.fn()}
        testIDPrefix="ref-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId("ref-dialog-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("Modifier delegates editing to the caller and never opens the delete confirmation", () => {
    const onModify = jest.fn();
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={false}
        onCancel={jest.fn()}
        onModify={onModify}
        onDelete={jest.fn()}
        testIDPrefix="ref-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId("ref-dialog-modify"));
    expect(onModify).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("ref-dialog-delete-confirm-card")).toBeNull();
  });
});

describe("ReferenceValueDialog — delete confirmation (§4.10 L134/L135)", () => {
  it("shows the exact title 'Supprimer « {nom} » ?' with the current name", () => {
    render(
      <ReferenceValueDialog
        name="Récupération douce"
        isUsed={false}
        onCancel={jest.fn()}
        onModify={jest.fn()}
        onDelete={jest.fn()}
        testIDPrefix="ref-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId("ref-dialog-delete"));

    const card = screen.getByTestId("ref-dialog-delete-confirm-card");
    expect(card).toBeTruthy();
    expect(screen.getByText(/Supprimer.*Récupération douce.*\?/)).toBeTruthy();
  });

  it("shows the used-value message when isUsed is true, distinct from the unused message", () => {
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={true}
        onCancel={jest.fn()}
        onModify={jest.fn()}
        onDelete={jest.fn()}
        testIDPrefix="ref-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId("ref-dialog-delete"));

    expect(screen.getByText(/objets/)).toBeTruthy();
  });

  it("Annuler on the confirmation step calls onCancel without deleting", () => {
    const onCancel = jest.fn();
    const onDelete = jest.fn();
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={false}
        onCancel={onCancel}
        onModify={jest.fn()}
        onDelete={onDelete}
        testIDPrefix="ref-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId("ref-dialog-delete"));
    fireEvent.press(screen.getByLabelText("Annuler"));
    expect(onDelete).not.toHaveBeenCalled();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("confirming deletion calls onDelete exactly once", () => {
    const onDelete = jest.fn();
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={false}
        onCancel={jest.fn()}
        onModify={jest.fn()}
        onDelete={onDelete}
        testIDPrefix="ref-dialog"
      />,
    );
    fireEvent.press(screen.getByTestId("ref-dialog-delete"));
    fireEvent.press(screen.getByLabelText("Supprimer"));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});

describe("ReferenceValueDialog — retour explicite du focus (R10, CE-UI-09 L2840, CE-T03-16 L1677)", () => {
  // `jest.spyOn` sur une méthode déjà espionnée réutilise le MÊME mock —
  // sans restauration explicite, les comptages d'appels s'accumuleraient
  // entre les tests (ni `restoreMocks` ni `clearMocks` dans jest.config.js).
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns accessibility focus to the list's real native node on Annuler (menu step)", () => {
    const setAccessibilityFocus = jest
      .spyOn(AccessibilityInfo, "setAccessibilityFocus")
      .mockImplementation(() => {});
    // `jest.spyOn` réutilise le MÊME mock s'il est déjà espionné — aucun
    // `clearMocks`/`restoreMocks` dans `jest.config.js` : l'historique
    // d'appels d'un test précédent de ce fichier survit sans ce reset
    // explicite, confirmé empiriquement.
    setAccessibilityFocus.mockClear();
    const onCancel = jest.fn();
    render(
      <Harness name="Focus" isUsed={false} onCancel={onCancel} onModify={jest.fn()} onDelete={jest.fn()} testIDPrefix="ref-dialog" />,
    );

    fireEvent.press(screen.getByTestId("ref-dialog-cancel"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(setAccessibilityFocus).toHaveBeenCalledTimes(1);
  });

  it("returns accessibility focus to the list on Annuler (delete-confirmation step)", () => {
    const setAccessibilityFocus = jest
      .spyOn(AccessibilityInfo, "setAccessibilityFocus")
      .mockImplementation(() => {});
    // `jest.spyOn` réutilise le MÊME mock s'il est déjà espionné — aucun
    // `clearMocks`/`restoreMocks` dans `jest.config.js` : l'historique
    // d'appels d'un test précédent de ce fichier survit sans ce reset
    // explicite, confirmé empiriquement.
    setAccessibilityFocus.mockClear();
    render(
      <Harness name="Focus" isUsed={false} onCancel={jest.fn()} onModify={jest.fn()} onDelete={jest.fn()} testIDPrefix="ref-dialog" />,
    );

    fireEvent.press(screen.getByTestId("ref-dialog-delete"));
    fireEvent.press(screen.getByLabelText("Annuler"));

    expect(setAccessibilityFocus).toHaveBeenCalledTimes(1);
  });

  it("returns accessibility focus to the list once deletion is confirmed", () => {
    const setAccessibilityFocus = jest
      .spyOn(AccessibilityInfo, "setAccessibilityFocus")
      .mockImplementation(() => {});
    // `jest.spyOn` réutilise le MÊME mock s'il est déjà espionné — aucun
    // `clearMocks`/`restoreMocks` dans `jest.config.js` : l'historique
    // d'appels d'un test précédent de ce fichier survit sans ce reset
    // explicite, confirmé empiriquement.
    setAccessibilityFocus.mockClear();
    const onDelete = jest.fn();
    render(
      <Harness name="Focus" isUsed={false} onCancel={jest.fn()} onModify={jest.fn()} onDelete={onDelete} testIDPrefix="ref-dialog" />,
    );

    fireEvent.press(screen.getByTestId("ref-dialog-delete"));
    fireEvent.press(screen.getByLabelText("Supprimer"));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(setAccessibilityFocus).toHaveBeenCalledTimes(1);
  });

  it("never returns focus on Modifier — the edit form's own autoFocus takes over instead", () => {
    const setAccessibilityFocus = jest
      .spyOn(AccessibilityInfo, "setAccessibilityFocus")
      .mockImplementation(() => {});
    // `jest.spyOn` réutilise le MÊME mock s'il est déjà espionné — aucun
    // `clearMocks`/`restoreMocks` dans `jest.config.js` : l'historique
    // d'appels d'un test précédent de ce fichier survit sans ce reset
    // explicite, confirmé empiriquement.
    setAccessibilityFocus.mockClear();
    const onModify = jest.fn();
    render(
      <Harness name="Focus" isUsed={false} onCancel={jest.fn()} onModify={onModify} onDelete={jest.fn()} testIDPrefix="ref-dialog" />,
    );

    fireEvent.press(screen.getByTestId("ref-dialog-modify"));

    expect(onModify).toHaveBeenCalledTimes(1);
    expect(setAccessibilityFocus).not.toHaveBeenCalled();
  });

  it("never calls setAccessibilityFocus when returnFocusRef is not provided (backwards compatible)", () => {
    const setAccessibilityFocus = jest
      .spyOn(AccessibilityInfo, "setAccessibilityFocus")
      .mockImplementation(() => {});
    // `jest.spyOn` réutilise le MÊME mock s'il est déjà espionné — aucun
    // `clearMocks`/`restoreMocks` dans `jest.config.js` : l'historique
    // d'appels d'un test précédent de ce fichier survit sans ce reset
    // explicite, confirmé empiriquement.
    setAccessibilityFocus.mockClear();
    render(
      <ReferenceValueDialog
        name="Focus"
        isUsed={false}
        onCancel={jest.fn()}
        onModify={jest.fn()}
        onDelete={jest.fn()}
        testIDPrefix="ref-dialog"
      />,
    );

    fireEvent.press(screen.getByTestId("ref-dialog-cancel"));

    expect(setAccessibilityFocus).not.toHaveBeenCalled();
  });
});

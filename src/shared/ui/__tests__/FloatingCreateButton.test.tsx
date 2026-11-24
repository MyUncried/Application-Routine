import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { ScrollView, StyleSheet, Text } from "react-native";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";

import { en } from "@/shared/i18n/resources/en";
import { fr } from "@/shared/i18n/resources/fr";
import { FloatingCreateButton, FLOATING_LONG_PRESS_MS } from "@/shared/ui/FloatingCreateButton";
import {
  currentFloatingPosition,
  parseFloatingPosition,
  resetFloatingPositionForTests,
  restoreFloatingPosition,
  settleFloatingPosition,
} from "@/shared/ui/floatingCreatePosition";

/**
 * UI-FAB-01 (D-558 ; DSF Bouton flottant § 2 et § 5) — bouton flottant « Créer » : rendu, toucher simple, déplacement (appui
 * maintenu puis glissement, rangement contre le bord le plus proche, hauteur bornée), position conservée sur l'appareil.
 * Jest n'exerce ni le flou natif, ni l'arbitrage des gestes d'iOS : recette sur iPhone nécessaire.
 */
const mockFiles = new Map<string, string>();
jest.mock("expo-file-system", () => {
  class File {
    readonly key: string;
    constructor(_directory: unknown, name: string) {
      this.key = name;
    }
    get exists() {
      return mockFiles.has(this.key);
    }
    create() {
      mockFiles.set(this.key, "");
    }
    write(content: string) {
      mockFiles.set(this.key, content);
    }
    textSync() {
      return mockFiles.get(this.key) ?? "";
    }
  }
  return { File, Paths: { document: "doc" } };
});

const LAYER = { width: 402, height: 874 };
/** Bas du bouton à la position par défaut (barre de navigation 78 + 12) ; haut de la zone permise (bas de la zone de contexte). */
const BOTTOM = 90;
const TOP_LIMIT = 207;

function renderButton(onPress = jest.fn()) {
  const view = render(
    <FloatingCreateButton variant="movement" accessibilityLabel="Créer un mouvement" onPress={onPress} bottom={BOTTOM} topLimit={TOP_LIMIT} />,
  );
  fireEvent(screen.getByTestId("floating-create-layer"), "layout", { nativeEvent: { layout: { x: 0, y: 0, ...LAYER } } });
  return { onPress, ...view };
}

const position = () => StyleSheet.flatten(screen.getByTestId("floating-create-position").props.style);

function drag(translationX: number, translationY: number) {
  act(() => {
    fireGestureHandler(getByGestureTestId("floating-create-pan"), [
      { state: State.BEGAN, translationX: 0, translationY: 0 },
      { state: State.ACTIVE, translationX: translationX / 2, translationY: translationY / 2 },
      { state: State.ACTIVE, translationX, translationY },
      { state: State.END, translationX, translationY },
    ]);
  });
}

beforeEach(() => {
  mockFiles.clear();
  resetFloatingPositionForTests();
});
afterEach(() => {
  resetFloatingPositionForTests();
});

describe("FloatingCreateButton — rendu et toucher", () => {
  it("rond de 60 en bas à droite : 16 du bord, 12 au-dessus de la barre ; verre blanc à 65 %, liseré blanc 1,2 ; contenu bleu", () => {
    renderButton();
    expect(position()).toMatchObject({ position: "absolute", width: 60, height: 60, right: 16, bottom: BOTTOM });
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-face-veil").props.style)).toMatchObject({
      backgroundColor: "rgba(255, 255, 255, 0.65)",
      borderWidth: 1.2,
      borderColor: "rgba(255, 255, 255, 0.95)",
      borderRadius: 30,
    });
    expect(screen.getByTestId("floating-create-glyph-movement")).toBeTruthy();
  });

  it("le toucher simple déclenche l'action ; libellé VoiceOver propre à l'écran", () => {
    const { onPress } = renderButton();
    const button = screen.getByLabelText("Créer un mouvement");
    expect(button.props.accessibilityRole).toBe("button");
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("inactif : atténué, sans action ; masqué (menu ouvert) : absent", () => {
    const onPress = jest.fn();
    const view = render(
      <FloatingCreateButton variant="plus" accessibilityLabel="Ouvrir le menu Créer" onPress={onPress} bottom={BOTTOM} topLimit={TOP_LIMIT} disabled />,
    );
    expect(position().opacity).toBe(0.45);
    fireEvent.press(screen.getByLabelText("Ouvrir le menu Créer"));
    expect(onPress).not.toHaveBeenCalled();
    view.rerender(<FloatingCreateButton variant="plus" accessibilityLabel="Ouvrir le menu Créer" onPress={onPress} bottom={BOTTOM} topLimit={TOP_LIMIT} hidden />);
    expect(screen.queryByTestId("floating-create")).toBeNull();
  });

  it("chaque variante a son contenu (Figma 13039:49732)", () => {
    for (const variant of ["plus", "calendar", "movement", "session", "program", "close"] as const) {
      const view = render(<FloatingCreateButton variant={variant} accessibilityLabel="x" onPress={jest.fn()} bottom={BOTTOM} topLimit={TOP_LIMIT} />);
      expect(screen.getByTestId(`floating-create-glyph-${variant}`)).toBeTruthy();
      view.unmount();
    }
  });
});

describe("FloatingCreateButton — déplacement (DSF § 5)", () => {
  it("le glissement ne démarre qu'après un appui maintenu", () => {
    renderButton();
    const pan = getByGestureTestId("floating-create-pan") as unknown as { config: { activateAfterLongPress?: number } };
    expect(pan.config.activateAfterLongPress).toBe(FLOATING_LONG_PRESS_MS);
  });

  it("au relâchement, rangé contre le bord le plus proche, à la hauteur du relâchement", () => {
    renderButton();
    // Centre de départ x = 402 − 16 − 30 = 356 ; glissé de −250 : x = 106, à gauche du milieu (201).
    drag(-250, -200);
    expect(position()).toMatchObject({ left: 16, bottom: BOTTOM + 200 });
    expect(currentFloatingPosition()).toEqual({ side: "LEFT", lift: 200 });
    // Glissé à droite du milieu : retour contre le bord droit, hauteur conservée.
    drag(250, 0);
    expect(position()).toMatchObject({ right: 16, bottom: BOTTOM + 200 });
  });

  it("hauteur bornée : jamais sous la position par défaut, jamais au-dessus du bas de la zone de contexte", () => {
    renderButton();
    drag(0, 300);
    expect(position().bottom).toBe(BOTTOM);
    drag(0, -2000);
    // Haut du bouton au bas de la zone de contexte : 874 − 207 − 60 = 607 au-dessus du bas de la couche.
    expect(position().bottom).toBe(874 - TOP_LIMIT - 60);
  });

  it("position conservée sur l'appareil et commune à tous les écrans : relue après redémarrage", () => {
    const first = renderButton();
    drag(-250, -120);
    first.unmount();
    expect(JSON.parse(mockFiles.get("kodjo-floating-create.json")!)).toEqual({ side: "LEFT", lift: 120 });
    // Redémarrage : mémoire vidée, fichier conservé.
    resetFloatingPositionForTests();
    expect(restoreFloatingPosition()).toEqual({ side: "LEFT", lift: 120 });
    resetFloatingPositionForTests();
    renderButton();
    expect(position()).toMatchObject({ left: 16, bottom: BOTTOM + 120 });
  });

  it("le défilement d'une liste n'est pas gêné : le geste ne naît que sur le bouton, la couche laisse passer les touchers", () => {
    render(
      <>
        <ScrollView testID="list">
          <Text>contenu</Text>
        </ScrollView>
        <FloatingCreateButton variant="session" accessibilityLabel="Créer une séance" onPress={jest.fn()} bottom={BOTTOM} topLimit={TOP_LIMIT} />
      </>,
    );
    expect(screen.getByTestId("floating-create-layer").props.pointerEvents).toBe("box-none");
    expect(screen.getByTestId("list").props.scrollEnabled).not.toBe(false);
  });
});

describe("floatingCreatePosition — règles pures", () => {
  it("bord le plus proche du centre ; hauteur bornée", () => {
    expect(settleFloatingPosition(150, 402, 50, 400)).toEqual({ side: "LEFT", lift: 50 });
    expect(settleFloatingPosition(250, 402, -10, 400)).toEqual({ side: "RIGHT", lift: 0 });
    expect(settleFloatingPosition(250, 402, 900, 400)).toEqual({ side: "RIGHT", lift: 400 });
  });

  it("lecture tolérante : valeur illisible → position par défaut", () => {
    expect(parseFloatingPosition("{")).toEqual({ side: "RIGHT", lift: 0 });
    expect(parseFloatingPosition(JSON.stringify({ side: "UP", lift: -3 }))).toEqual({ side: "RIGHT", lift: 0 });
    expect(parseFloatingPosition(JSON.stringify({ side: "LEFT", lift: 42 }))).toEqual({ side: "LEFT", lift: 42 });
  });
});

describe("libellés VoiceOver du bouton flottant — français et anglais", () => {
  it("un libellé par écran, traduit", () => {
    expect(fr.shared.floatingCreate).toEqual({
      createRoutine: "Créer une routine",
      createSlot: "Créer un créneau unique",
      createMovement: "Créer un mouvement",
      createSession: "Créer une séance",
      createProgram: "Créer un programme",
      openCreateMenu: "Ouvrir le menu Créer",
      closeCreateMenu: "Fermer le menu Créer",
    });
    expect(en.shared.floatingCreate).toEqual({
      createRoutine: "Create a routine",
      createSlot: "Create a one-off slot",
      createMovement: "Create a movement",
      createSession: "Create a workout",
      createProgram: "Create a program",
      openCreateMenu: "Open the Create menu",
      closeCreateMenu: "Close the Create menu",
    });
    expect(en.screens.activities.addToSession.addStopPoint).toBe("Add a hold");
  });
});

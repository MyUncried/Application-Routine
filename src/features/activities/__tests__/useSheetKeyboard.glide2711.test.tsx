import { describe, expect, it, jest } from "@jest/globals";
import { act, render, renderHook, screen } from "@testing-library/react-native";
import { DeviceEventEmitter, Dimensions, Platform, type ScrollView, type TextInput } from "react-native";

import { numberTarget, type ExecutionParametersInput } from "@/domain/activities/ExecutionParameters";
import { openSheetDraft } from "@/domain/activities/ExecutionParametersDraft";
import { ExecutionParametersSheet } from "@/features/activities/ExecutionParametersSheet";
import { INITIAL_SHEET_SURFACE_STATE } from "@/features/activities/sheetSurface";
import { keyboardGlideProgress, useSheetKeyboard, type SheetKeyboardGlide } from "@/features/activities/useSheetKeyboard";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette iPhone du 27/11/2026 (matin), « Barre du clavier synchronisée », Hermann : « L'apparition du clavier n'est plus synchronisée
 * avec le défilement de l'écran (c'est variable d'un format à l'autre) » ; « L'écran se déplace vers le haut en un mouvement saccadé » ;
 * « composition de séance : l'écran saute vers le bas à la fermeture du clavier au lieu de glisser de manière synchronisée. »
 *
 * Jest ne joue ni le clavier iOS, ni `useAnimatedKeyboard`, ni `scrollTo` du fil UI : ces tests vérifient seulement le plan du
 * défilement (départ, arrivée, moment) et la marge gardée jusqu'à la disparition du clavier. La synchronisation réelle se juge sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));

const KEYBOARD = { endCoordinates: { screenX: 0, screenY: 500, width: 390, height: 344 }, duration: 250, easing: "keyboard" };

function params(): ExecutionParametersInput {
  return {
    version: 5,
    mode: "REPETITIONS",
    series: { kind: "UNIFORM", count: 3, target: numberTarget(10), pauseSeconds: 15, loadKg: 20, workPhases: [] },
    sideMode: "UNILATERAL",
    sideOrder: "BY_SIDE",
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    loadEnabled: true,
  };
}

describe("keyboardGlideProgress — avancement porté par la course du clavier", () => {
  it("ouverture : 0 au départ, 1 à l'arrivée, proportionnel entre les deux, borné", () => {
    expect(keyboardGlideProgress(100, 100, 400)).toBe(0);
    expect(keyboardGlideProgress(250, 100, 400)).toBe(0.5);
    expect(keyboardGlideProgress(400, 100, 400)).toBe(1);
    expect(keyboardGlideProgress(450, 100, 400)).toBe(1);
    expect(keyboardGlideProgress(50, 100, 400)).toBe(0);
  });

  it("fermeture : de la hauteur de départ à 0", () => {
    expect(keyboardGlideProgress(344, 344, 0)).toBe(0);
    expect(keyboardGlideProgress(172, 344, 0)).toBe(0.5);
    expect(keyboardGlideProgress(0, 344, 0)).toBe(1);
  });

  it("course nulle (clavier déjà arrivé) : arrivée", () => {
    expect(keyboardGlideProgress(344, 344, 344.5)).toBe(1);
  });
});

describe("useSheetKeyboard — défilement planifié pendant l'animation du clavier (iOS)", () => {
  function setup(rowWindowY: number) {
    const glide = { bodyTopAt: jest.fn((_top: number, measured: number) => measured), restingOffset: jest.fn((offset: number) => Math.min(offset, 40)), start: jest.fn(), stop: jest.fn() };
    const body = { measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) => callback(0, 100, 390, 600) };
    const scrollRef = { current: { getNativeScrollRef: () => body, scrollTo: jest.fn() } as unknown as ScrollView };
    const input = { measureInWindow: (callback: (x: number, y: number, w: number, h: number) => void) => callback(0, rowWindowY, 80, 44), focus: jest.fn(), blur: jest.fn() } as unknown as TextInput;
    const field = { kind: "load", row: "uniform" } as const;
    const { result } = renderHook(() =>
      useSheetKeyboard({
        draft: openSheetDraft(params()),
        surface: INITIAL_SHEET_SURFACE_STATE,
        dispatchSurface: jest.fn(),
        commit: jest.fn(),
        order: [field],
        scrollRef,
        reduceMotion: false,
        glide: glide as SheetKeyboardGlide,
      }),
    );
    act(() => {
      result.current.register(field, 44)(input);
      result.current.onFocus(field);
    });
    return { glide, result };
  }

  it("ligne sous le futur haut du clavier : défilement demandé à keyboardWillShow, jusqu'à la hauteur finale du clavier", () => {
    expect(Platform.OS).toBe("ios");
    // Ligne 600..644 (fenêtre), clavier à 500 : la ligne doit finir à 500 - 12 → défilement de 156, porté par la course jusqu'à 344.
    const { glide } = setup(600);
    act(() => {
      DeviceEventEmitter.emit("keyboardWillShow", KEYBOARD);
    });
    expect(glide.start).toHaveBeenCalledTimes(1);
    expect(glide.start).toHaveBeenCalledWith(0, 156, 344);
    // Fin de l'animation : suivi arrêté ; la révélation de secours ne trouve plus rien à faire sur l'appareil.
    act(() => {
      DeviceEventEmitter.emit("keyboardDidShow", KEYBOARD);
    });
    expect(glide.stop).toHaveBeenCalled();
  });

  it("ligne déjà au-dessus du futur clavier : aucun défilement", () => {
    const { glide } = setup(300);
    act(() => {
      DeviceEventEmitter.emit("keyboardWillShow", KEYBOARD);
    });
    expect(glide.start).not.toHaveBeenCalled();
  });

  it("clavier déjà affiché (changement de champ, nouvel keyboardWillShow) : pas de second départ", () => {
    const { glide } = setup(600);
    act(() => {
      DeviceEventEmitter.emit("keyboardWillShow", KEYBOARD);
      DeviceEventEmitter.emit("keyboardDidShow", KEYBOARD);
      DeviceEventEmitter.emit("keyboardWillShow", KEYBOARD);
    });
    expect(glide.start).toHaveBeenCalledTimes(1);
  });

  it("fermeture : le corps redescend avec le clavier vers son défilement de repos ; marge gardée jusqu'à keyboardDidHide", () => {
    const { glide, result } = setup(600);
    act(() => {
      DeviceEventEmitter.emit("keyboardWillShow", KEYBOARD);
      DeviceEventEmitter.emit("keyboardDidShow", KEYBOARD);
      result.current.onScroll({ nativeEvent: { contentOffset: { x: 0, y: 156 } } } as never);
    });
    glide.start.mockClear();
    act(() => {
      DeviceEventEmitter.emit("keyboardWillHide", KEYBOARD);
    });
    expect(glide.start).toHaveBeenCalledWith(156, 40, 0);
    expect(result.current.keyboardFrame).toBeNull();
    expect(result.current.insetFrame).not.toBeNull();
    act(() => {
      DeviceEventEmitter.emit("keyboardDidHide", KEYBOARD);
    });
    expect(result.current.insetFrame).toBeNull();
  });

  it("cadre de fermeture (keyboardWillChangeFrame sous l'écran) : la marge reste", () => {
    const { result } = setup(600);
    act(() => {
      DeviceEventEmitter.emit("keyboardWillShow", KEYBOARD);
      DeviceEventEmitter.emit("keyboardWillChangeFrame", { ...KEYBOARD, endCoordinates: { ...KEYBOARD.endCoordinates, screenY: Dimensions.get("screen").height } });
    });
    expect(result.current.insetFrame?.screenY).toBe(500);
  });
});

describe("Feuille — marge de défilement commune à la modale et à la page", () => {
  it("page « Exercice libre » : plus de course ajoutée par iOS ni de réserves sous les cadres ; marge gardée jusqu'à la disparition", () => {
    render(
      <TestSafeAreaProvider>
        <ExecutionParametersSheet
          parent={params()}
          profileSideRecoverySecondsDefault={10}
          exerciseSignals="absent"
          freeFormat
          freeMovement={{ movement: { name: "Squats sautés", media: [], bodyZoneIds: [] }, levelRank: 3 }}
          movementName="Squats sautés"
          recovery={{ seconds: 30, onApply: jest.fn() }}
          presentation="page"
          onApply={jest.fn()}
          onCancel={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    const hidden = { includeHiddenElements: true } as const;
    const body = () => screen.getByTestId("execution-sheet-body", hidden).props as { contentInset?: { bottom: number }; automaticallyAdjustKeyboardInsets?: boolean };
    expect(body().automaticallyAdjustKeyboardInsets).toBe(false);
    expect(body().contentInset).toEqual({ bottom: 0 });
    act(() => {
      DeviceEventEmitter.emit("keyboardWillShow", KEYBOARD);
      DeviceEventEmitter.emit("keyboardDidShow", KEYBOARD);
    });
    expect(screen.queryByTestId("execution-sheet-keyboard-room", hidden)).toBeNull();
    expect(screen.queryByTestId("execution-sheet-keyboard-bar-room", hidden)).toBeNull();
    // Page non mesurée : tout le clavier (haut à 500), moins la marge de sécurité (34), plus la marge de révélation (12).
    expect(body().contentInset).toEqual({ bottom: Dimensions.get("window").height - 500 - 34 + 12 });
    act(() => {
      DeviceEventEmitter.emit("keyboardWillHide", KEYBOARD);
    });
    expect(body().contentInset).toEqual({ bottom: Dimensions.get("window").height - 500 - 34 + 12 });
    act(() => {
      DeviceEventEmitter.emit("keyboardDidHide", KEYBOARD);
    });
    expect(body().contentInset).toEqual({ bottom: 0 });
  });
});

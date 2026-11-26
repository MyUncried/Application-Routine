import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useEffect, useState } from "react";
import { AccessibilityInfo, ScrollView, StyleSheet, Text } from "react-native";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

import { en } from "@/shared/i18n/resources/en";
import { fr } from "@/shared/i18n/resources/fr";
import { CREATE_MENU_LAYER } from "@/features/sessions/CreateMenu";
import { FLOATING_CREATE_LAYER, FLOATING_CREATE_OPACITY, FLOATING_FADE_MS, FloatingCreateButton } from "@/shared/ui/FloatingCreateButton";
import { FloatingCreateHost, FloatingCreateSlot } from "@/shared/ui/FloatingCreateHost";
import {
  FLOATING_DRAG_THRESHOLD,
  FLOATING_FOLLOW_SPRING,
  FLOATING_MOMENTUM_SECONDS,
  FLOATING_SETTLE_SPRING,
  currentFloatingPosition,
  followLag,
  parseFloatingPosition,
  releaseTarget,
  resetFloatingPositionForTests,
  restoreFloatingPosition,
} from "@/shared/ui/floatingCreatePosition";

/**
 * UI-FAB-01 (D-558, D-594 ; DSF Bouton flottant § 2 et § 5 ; audit AUDIT-FAB-PHYSIQUE du 24/11/2026) — bouton flottant
 * « Créer » : rendu, toucher, glissement dès 10 pt, élan, rangement contre le bord gauche ou droit, hauteur libre bornée à
 * l'écran, position conservée, hôte des onglets. Le simulacre de Reanimated pose les ressorts instantanément : la sensation
 * (retard, dépassement) se recette sur iPhone ; ses lois sont vérifiées ici comme fonctions pures.
 */
const mockFiles = new Map<string, string>();
const mockSpringConfigs: { reduceMotion?: unknown }[] = [];

/** Sans verre natif (iOS antérieur à 26) : le simulacre jest-expo le déclare disponible par défaut. */
let mockLiquidGlass = true;
jest.mock("expo-glass-effect", () => ({
  ...(jest.requireActual("expo-glass-effect") as object),
  isLiquidGlassAvailable: () => mockLiquidGlass,
}));
function withoutNativeGlass(run: () => void) {
  mockLiquidGlass = false;
  try {
    run();
  } finally {
    mockLiquidGlass = true;
  }
}
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

// Valeurs animées persistantes d'un rendu à l'autre (le simulacre livré en recrée une à chaque rendu).
jest.mock("react-native-reanimated", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const reanimated = require("react-native-reanimated/mock") as Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useState: useStableState } = require("react") as typeof import("react");
  return {
    ...reanimated,
    withSpring: (to: number, config: { reduceMotion?: unknown }) => {
      mockSpringConfigs.push(config);
      return to;
    },
    useSharedValue: <T,>(init: T) => {
      const [shared] = useStableState(() => {
        const box = { value: init, get: () => box.value, set: (next: T) => void (box.value = next) };
        return box;
      });
      return shared;
    },
  };
});

// Hôte : le focus d'un écran est simulé par son montage.
jest.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useEffect: useMountEffect } = require("react") as typeof import("react");
    useMountEffect(effect, [effect]);
  },
}));

const W = 402;
const H = 874;
const INSETS = { top: 62, bottom: 34, left: 0, right: 0 };
/** Bas par défaut : barre de navigation (78) + 12. */
const BOTTOM = 90;
const RIGHT_LEFT = W - 16 - 60;
const DEFAULT_TOP = H - BOTTOM - 60;
const MAX_TOP = H - INSETS.bottom - 60;

/** Le simulacre de Reanimated calcule le style animé au rendu : un rendu de plus reflète les valeurs posées par les effets. */
let refresh: () => void = () => undefined;

function renderButton(onPress = jest.fn()) {
  // Élément neuf à chaque rendu (un élément identique ne serait pas rendu de nouveau).
  const element = () => (
    <SafeAreaInsetsContext.Provider value={INSETS}>
      <FloatingCreateButton variant="movement" accessibilityLabel="Créer un mouvement" onPress={onPress} bottom={BOTTOM} />
    </SafeAreaInsetsContext.Provider>
  );
  const view = render(element());
  fireEvent(screen.getByTestId("floating-create-layer"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: W, height: H } } });
  refresh = () => view.rerender(element());
  refresh();
  return { onPress, ...view };
}

const place = () => {
  refresh();
  const transform = StyleSheet.flatten(screen.getByTestId("floating-create-position").props.style).transform as { translateX?: number; translateY?: number }[];
  return { left: transform[0]!.translateX!, top: transform[1]!.translateY! };
};

function fling(translationX: number, translationY: number, velocityX = 0, velocityY = 0) {
  act(() => {
    fireGestureHandler(getByGestureTestId("floating-create-pan"), [
      { state: State.BEGAN, translationX: 0, translationY: 0 },
      { state: State.ACTIVE, translationX: translationX / 2, translationY: translationY / 2 },
      { state: State.ACTIVE, translationX, translationY, velocityX, velocityY },
      { state: State.END, translationX, translationY, velocityX, velocityY },
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
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-position").props.style)).toMatchObject({ position: "absolute", width: 60, height: 60 });
    expect(place()).toEqual({ left: RIGHT_LEFT, top: DEFAULT_TOP });
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-face-veil").props.style)).toMatchObject({
      // Essai lentille (verre natif) : voile léger ; sans verre natif, 65 % (test « sans verre natif »).
      backgroundColor: "rgba(255, 255, 255, 0.22)",
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
    const view = render(<FloatingCreateButton variant="plus" accessibilityLabel="Ouvrir le menu Créer" onPress={onPress} bottom={BOTTOM} disabled />);
    fireEvent(screen.getByTestId("floating-create-layer"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: W, height: H } } });
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-position").props.style).opacity).toBe(0.45);
    fireEvent.press(screen.getByLabelText("Ouvrir le menu Créer"));
    expect(onPress).not.toHaveBeenCalled();
    view.rerender(<FloatingCreateButton variant="plus" accessibilityLabel="Ouvrir le menu Créer" onPress={onPress} bottom={BOTTOM} hidden />);
    expect(screen.queryByTestId("floating-create")).toBeNull();
  });

  it("recette du 24/11 : sans verre natif, bouton à 70 % d'opacité ; couche au-dessus de la zone de contexte (zIndex 1), sous le menu Créer", () => {
    withoutNativeGlass(() => renderButton());
    expect(screen.queryByTestId("floating-create-face-glass")).toBeNull();
    expect(FLOATING_CREATE_OPACITY).toBe(0.7);
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-position").props.style).opacity).toBe(0.7);
    const layer = StyleSheet.flatten(screen.getByTestId("floating-create-layer").props.style);
    expect(layer).toMatchObject({ zIndex: FLOATING_CREATE_LAYER, elevation: FLOATING_CREATE_LAYER, position: "absolute" });
    expect(FLOATING_CREATE_LAYER).toBeGreaterThan(1);
    expect(FLOATING_CREATE_LAYER).toBeLessThan(CREATE_MENU_LAYER);
  });

  it("recette du 24/11 : « Réduire les animations » suivi en direct — ressorts sans animation quand il est activé", async () => {
    const enabled = jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(true);
    try {
      const reduced = renderButton();
      await act(async () => {});
      mockSpringConfigs.length = 0;
      fling(-200, -300);
      expect(mockSpringConfigs.length).toBeGreaterThan(0);
      expect(mockSpringConfigs.every((config) => config.reduceMotion === "always")).toBe(true);
      reduced.unmount();
    } finally {
      enabled.mockRestore();
    }
    renderButton();
    mockSpringConfigs.length = 0;
    fling(-200, -300);
    expect(mockSpringConfigs.every((config) => config.reduceMotion === "never")).toBe(true);
  });

  it("essai lentille du 24/11 : verre natif « clear » visible, voile blanc léger, sans opacité d'ensemble ; bleu : verre teinté, sans voile ni liseré", () => {
    renderButton();
    const glass = () => screen.getByTestId("floating-create-face-glass").props;
    const veil = () => StyleSheet.flatten(screen.getByTestId("floating-create-face-veil").props.style);
    expect(glass()).toMatchObject({ glassEffectStyle: "clear", colorScheme: "light" });
    expect(glass().tintColor).toBeUndefined();
    expect(veil()).toMatchObject({ backgroundColor: "rgba(255, 255, 255, 0.22)", borderWidth: 1.2 });
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-position").props.style).opacity).toBe(1);
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-face").props.style).shadowOpacity).toBe(0.22);
    fireEvent(screen.getByTestId("floating-create"), "longPress");
    expect(glass().tintColor).toBe("rgba(5, 8, 229, 0.7)");
    expect(veil()).toMatchObject({ backgroundColor: "transparent", borderWidth: 0 });
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-position").props.style).opacity).toBe(1);
  });

  it("recette du 24/11 (sans verre natif) : appui long — fond bleu et symbole blanc, sans action ; conservé ; nouvel appui long : retour", () => {
    const onPress = jest.fn();
    let first: ReturnType<typeof renderButton> | undefined;
    withoutNativeGlass(() => {
      first = renderButton(onPress);
    });
    const veil = () => StyleSheet.flatten(screen.getByTestId("floating-create-face-veil").props.style).backgroundColor;
    const glyph = () => JSON.stringify(screen.getByTestId("floating-create-glyph-movement").children.map((child) => (typeof child === "string" ? child : child.props)));
    expect(veil()).toBe("rgba(255, 255, 255, 0.65)");
    fireEvent(screen.getByTestId("floating-create"), "longPress");
    expect(onPress).not.toHaveBeenCalled();
    expect(veil()).toBe("rgba(5, 8, 229, 0.65)");
    expect(glyph()).toContain("#FFFFFF");
    expect(glyph()).not.toContain("#0508E5");
    // Bouton bleu : sans liseré ; 70 % et ombre à 22 % dans les deux couleurs (recette du 24/11).
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-position").props.style).opacity).toBe(0.7);
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-face-veil").props.style).borderWidth).toBe(0);
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-face").props.style).shadowOpacity).toBe(0.22);
    expect(JSON.parse(mockFiles.get("kodjo-floating-create.json")!)).toMatchObject({ side: "RIGHT", tone: "BLUE" });
    first!.unmount();
    resetFloatingPositionForTests();
    let second: ReturnType<typeof renderButton> | undefined;
    withoutNativeGlass(() => {
      second = renderButton(onPress);
    });
    expect(veil()).toBe("rgba(5, 8, 229, 0.65)");
    fireEvent(screen.getByTestId("floating-create"), "longPress");
    expect(veil()).toBe("rgba(255, 255, 255, 0.65)");
    expect(glyph()).toContain("#0508E5");
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-position").props.style).opacity).toBe(0.7);
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-face-veil").props.style).borderWidth).toBe(1.2);
    expect(StyleSheet.flatten(screen.getByTestId("floating-create-face").props.style).shadowOpacity).toBe(0.22);
    expect(JSON.parse(mockFiles.get("kodjo-floating-create.json")!).tone).toBeUndefined();
    second!.unmount();
  });

  it("recette du 24/11 : effacé (placement) — fondu lent de 600 ms, ni toucher ni VoiceOver ; réapparaît", () => {
    const onPress = jest.fn();
    const element = (faded: boolean) => (
      <FloatingCreateButton variant="plus" accessibilityLabel="Ouvrir le menu Créer" onPress={onPress} bottom={BOTTOM} faded={faded} />
    );
    const view = render(element(true));
    fireEvent(screen.getByTestId("floating-create-layer"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: W, height: H } } });
    expect(FLOATING_FADE_MS).toBe(600);
    const fadeLayer = () => screen.getByTestId("floating-create-fade", { includeHiddenElements: true });
    expect(fadeLayer().props).toMatchObject({ pointerEvents: "none", accessibilityElementsHidden: true, importantForAccessibility: "no-hide-descendants" });
    expect(screen.queryByLabelText("Ouvrir le menu Créer")).toBeNull();
    fireEvent.press(screen.getByTestId("floating-create", { includeHiddenElements: true }));
    expect(onPress).not.toHaveBeenCalled();
    view.rerender(element(false));
    expect(fadeLayer().props).toMatchObject({ pointerEvents: "auto", accessibilityElementsHidden: false });
    fireEvent.press(screen.getByLabelText("Ouvrir le menu Créer"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("chaque variante a son contenu (Figma 13039:49732)", () => {
    for (const variant of ["plus", "calendar", "movement", "session", "program", "close"] as const) {
      const view = render(<FloatingCreateButton variant={variant} accessibilityLabel="x" onPress={jest.fn()} bottom={BOTTOM} />);
      fireEvent(screen.getByTestId("floating-create-layer"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: W, height: H } } });
      expect(screen.getByTestId(`floating-create-glyph-${variant}`)).toBeTruthy();
      view.unmount();
    }
  });
});

describe("FloatingCreateButton — glissement et relâchement (D-594)", () => {
  it("glissement reconnu dès 10 pt, sans appui long", () => {
    renderButton();
    const pan = getByGestureTestId("floating-create-pan") as unknown as { config: { minDist?: number; activateAfterLongPress?: number } };
    expect(pan.config.minDist).toBe(FLOATING_DRAG_THRESHOLD);
    expect(pan.config.activateAfterLongPress).toBeUndefined();
  });

  it("lâché au centre sans élan : rangé contre le bord le plus proche, à la hauteur du relâchement", () => {
    renderButton();
    // Centre de départ x = 356 ; glissé de −200 : x = 156, moitié gauche.
    fling(-200, -300);
    expect(place()).toEqual({ left: 16, top: DEFAULT_TOP - 300 });
    expect(currentFloatingPosition()).toEqual({ side: "LEFT", top: DEFAULT_TOP - 300 });
  });

  it("l'élan choisit le bord : lancé vers la droite depuis la moitié gauche, il va à droite ; la hauteur garde l'élan", () => {
    renderButton();
    fling(-200, 0);
    // Centre à x = 46, lancé à 1 200 pt/s vers la droite : 46 + 1 200 × 0,175 = 256 > 201 → droite.
    fling(30, -40, 1200, -400);
    expect(place()).toEqual({ left: RIGHT_LEFT, top: DEFAULT_TOP - 40 - 400 * FLOATING_MOMENTUM_SECONDS });
  });

  it("hauteur libre sur tout l'écran (en-tête, zone de contexte, barre de navigation) mais bouton entier visible", () => {
    renderButton();
    fling(0, -2000, 0, -3000);
    expect(place().top).toBe(INSETS.top);
    fling(0, 2000, 0, 3000);
    expect(place().top).toBe(MAX_TOP);
    expect(MAX_TOP).toBeGreaterThan(DEFAULT_TOP);
  });

  it("position conservée sur l'appareil et commune à tous les écrans : relue après redémarrage", () => {
    const first = renderButton();
    fling(-250, -120);
    first.unmount();
    expect(JSON.parse(mockFiles.get("kodjo-floating-create.json")!)).toEqual({ side: "LEFT", top: DEFAULT_TOP - 120 });
    resetFloatingPositionForTests();
    expect(restoreFloatingPosition()).toEqual({ side: "LEFT", top: DEFAULT_TOP - 120 });
    resetFloatingPositionForTests();
    renderButton();
    expect(place()).toEqual({ left: 16, top: DEFAULT_TOP - 120 });
  });

  it("le défilement d'une liste n'est pas gêné : le geste ne naît que sur le bouton, la couche laisse passer les touchers", () => {
    render(
      <>
        <ScrollView testID="list">
          <Text>contenu</Text>
        </ScrollView>
        <FloatingCreateButton variant="session" accessibilityLabel="Créer une séance" onPress={jest.fn()} bottom={BOTTOM} />
      </>,
    );
    expect(screen.getByTestId("floating-create-layer").props.pointerEvents).toBe("box-none");
    expect(screen.getByTestId("list").props.scrollEnabled).not.toBe(false);
  });
});

describe("floatingCreatePosition — lois physiques (audit AUDIT-FAB-PHYSIQUE)", () => {
  const bounds = { width: W, minTop: INSETS.top, maxTop: MAX_TOP };

  it("ressorts de la référence : suivi (réponse 0,25 s, amortissement 0,85), pose (réponse 0,6 s, amortissement 0,7)", () => {
    const spring = (response: number, ratio: number) => ({ stiffness: (2 * Math.PI / response) ** 2, damping: (4 * Math.PI * ratio) / response });
    expect(FLOATING_FOLLOW_SPRING.stiffness).toBeCloseTo(spring(0.25, 0.85).stiffness, -1);
    expect(FLOATING_FOLLOW_SPRING.damping).toBeCloseTo(spring(0.25, 0.85).damping, 0);
    expect(FLOATING_SETTLE_SPRING.stiffness).toBeCloseTo(spring(0.6, 0.7).stiffness, -1);
    expect(FLOATING_SETTLE_SPRING.damping).toBeCloseTo(spring(0.6, 0.7).damping, 0);
  });

  it("retard sur le doigt croissant avec la vitesse : ≈ 20 pt à 300 pt/s, 68 pt à 1 000 pt/s, 135 pt à 2 000 pt/s", () => {
    expect(followLag(300)).toBeCloseTo(20, 0);
    expect(followLag(1000)).toBeCloseTo(68, 0);
    expect(followLag(2000)).toBeCloseTo(135, 0);
  });

  it("relâchement : toujours contre un bord, jamais au centre ; élan projeté, hauteur bornée", () => {
    expect(releaseTarget(171, 400, 0, 0, bounds)).toEqual({ side: "RIGHT", left: RIGHT_LEFT, top: 400 });
    expect(releaseTarget(170, 400, 0, 0, bounds)).toEqual({ side: "LEFT", left: 16, top: 400 });
    expect(releaseTarget(300, 400, -1000, 0, bounds).side).toBe("LEFT");
    expect(releaseTarget(16, 400, 0, 1000, bounds).top).toBe(400 + 175);
    expect(releaseTarget(16, 400, 0, -10000, bounds).top).toBe(INSETS.top);
  });

  it("lecture tolérante : illisible → défaut ; ancien format (côté et lift) → côté conservé, hauteur par défaut", () => {
    expect(parseFloatingPosition("{")).toEqual({ side: "RIGHT", top: null });
    expect(parseFloatingPosition(JSON.stringify({ side: "LEFT", lift: 42 }))).toEqual({ side: "LEFT", top: null });
    expect(parseFloatingPosition(JSON.stringify({ side: "LEFT", top: 300 }))).toEqual({ side: "LEFT", top: 300 });
  });
});

describe("FloatingCreateHost — devant la barre de navigation (D-594)", () => {
  function Screen({ label }: { readonly label: string }) {
    return <FloatingCreateSlot config={{ variant: "session", label, onPress: jest.fn() }} />;
  }

  it("l'écran affiché confie son bouton à l'hôte, rendu après le contenu (donc devant la barre) ; retiré quand l'écran part", () => {
    function Harness() {
      const [shown, setShown] = useState(true);
      useEffect(() => {
        harness.hide = () => setShown(false);
      });
      return (
        <FloatingCreateHost>
          <Text testID="tabs-content">onglets et barre</Text>
          {shown ? <Screen label="Créer une séance" /> : null}
        </FloatingCreateHost>
      );
    }
    const harness: { hide: () => void } = { hide: () => undefined };
    const view = render(<Harness />);
    const root = view.toJSON() as unknown as { type: string; props: { testID?: string } }[];
    expect(root.map((node) => node.props.testID)).toEqual(["tabs-content", "floating-create-layer"]);
    fireEvent(screen.getByTestId("floating-create-layer"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: W, height: H } } });
    expect(screen.getByLabelText("Créer une séance")).toBeTruthy();
    act(() => harness.hide());
    expect(screen.queryByTestId("floating-create")).toBeNull();
  });

  it("sans hôte (écran hors onglets), l'écran rend lui-même son bouton", () => {
    render(<Screen label="Créer une séance" />);
    expect(screen.getByTestId("floating-create-layer")).toBeTruthy();
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

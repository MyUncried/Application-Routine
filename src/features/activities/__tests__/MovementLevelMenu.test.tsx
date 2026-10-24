import { describe, expect, it, jest } from "@jest/globals";
import { Button as SwiftUIButton, Menu, RNHostView } from "@expo/ui/swift-ui";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { disabled as swiftUIDisabled } from "@expo/ui/swift-ui/modifiers";
import { createRef, type RefObject } from "react";
import { Platform, StyleSheet, View } from "react-native";

import {
  LevelGauge,
  MovementLevelMenu,
  MovementLevelPanel,
  type EditorLevel,
  type MovementLevelMenuModel,
} from "@/features/activities/MovementLevelMenu";

/**
 * PRE-7 story A3.1 (D-439, MFN-05, MFN-07 ; Figma `9925:41506`, `9925:41515`, `9932:44044`,
 * `9577:19843`) — pastille de Niveau et popover : jauge, libellés (rang en texte, total dans le
 * choix), menu natif SwiftUI sur iOS (sous-menus, indisponibilités, coches), panneau de repli à
 * étapes hors iOS. Rappel : ces tests ne valent pas recette sur iPhone (JA).
 */

const anyNode = { includeHiddenElements: true } as const;
const ACCESS = { access: { height: 26 }, accessUnset: { opacity: 0.5 }, label: { fontSize: 13 }, labelSet: { color: "#141414" } };
const HIT_SLOP = { top: 1, bottom: 17, left: 6, right: 6 };

function menuModel(overrides: Partial<MovementLevelMenuModel> = {}): MovementLevelMenuModel {
  return {
    currentDefinitionId: "d2",
    levels: [
      { rank: 1, total: 3, name: "Squats assistés", exercises: [{ definitionId: "d1", summary: "3 séries de 10 rép." }] },
      {
        rank: 2,
        total: 3,
        name: "Squats",
        exercises: [
          { definitionId: "d2", summary: "3 séries de 12 rép." },
          { definitionId: "d3", summary: "4 séries de 8 rép." },
        ],
      },
      { rank: 3, total: 3, name: "Mobilisation du genou", exercises: [] },
    ],
    onChangeLevel: jest.fn(),
    onAddLevel: jest.fn(),
    ...overrides,
  };
}

function renderMenu(
  level: EditorLevel,
  onOpenPanel = jest.fn(),
  isPanelOpen = false,
  onClosePanel = jest.fn(),
  anchorRef: RefObject<View | null> = createRef<View>(),
) {
  render(
    <MovementLevelMenu
      level={level}
      accessStyles={ACCESS}
      hitSlop={HIT_SLOP}
      onOpenPanel={onOpenPanel}
      isPanelOpen={isPanelOpen}
      onClosePanel={onClosePanel}
      anchorRef={anchorRef}
      testID="level"
    />,
  );
  return { onOpenPanel, onClosePanel };
}

function withPlatform(os: typeof Platform.OS, run: () => void) {
  const restore = jest.replaceProperty(Platform, "OS", os);
  try {
    run();
  } finally {
    restore.restore();
  }
}

/** Modificateur `disabled` exact (et non un mot « true » quelconque de la sérialisation). */
const hasDisabled = (modifiers: unknown, value: boolean) => JSON.stringify(modifiers ?? []).includes(JSON.stringify(swiftUIDisabled(value)));

const reachedSegments = (testID: string) =>
  [1, 2, 3].filter((index) => screen.queryByTestId(`${testID}-segment-${index}-reached`, anyNode) !== null);

describe("PRE-7 A3.1 — LevelGauge (icon/niveau 9932:44044)", () => {
  it("tranches atteintes pleines, autres à 28 % ; au-delà de 3 : trois pleines ; vide : aucune", () => {
    render(
      <>
        <LevelGauge rank={2} testID="g2" />
        <LevelGauge rank={5} testID="g5" />
        <LevelGauge rank={null} testID="g0" />
      </>,
    );
    expect(reachedSegments("g2")).toEqual([1, 2]);
    expect(StyleSheet.flatten(screen.getByTestId("g2-segment-3", anyNode).props.style)).toMatchObject({ opacity: 0.28, top: "5.56%" });
    expect(StyleSheet.flatten(screen.getByTestId("g2-segment-1-reached", anyNode).props.style)).toMatchObject({
      top: "72.22%",
      left: "22.22%",
      right: "22.22%",
      height: "22.22%",
      backgroundColor: "#0508E5",
    });
    expect(reachedSegments("g5")).toEqual([1, 2, 3]);
    expect(reachedSegments("g0")).toEqual([]);
  });
});

describe("PRE-7 A3.1 — MovementLevelMenu", () => {
  it("affichage seul : « Niveau 2 » annoncé en texte, sans bouton ; vide : « Niveau », annoncé non renseigné", () => {
    renderMenu({ position: { rank: 2, total: 3 }, menu: null });
    expect(screen.getByTestId("level-label", anyNode).props.children).toBe("Niveau 2");
    expect(screen.getByTestId("level").props.accessibilityLabel).toBe("Niveau 2");
    expect(screen.getByTestId("level").props.accessibilityRole).toBeUndefined();
    screen.unmount();
    renderMenu({ position: null, menu: null });
    expect(screen.getByTestId("level-label", anyNode).props.children).toBe("Niveau");
    expect(screen.getByTestId("level").props.accessibilityLabel).toBe("Niveau — non renseigné");
    // Registre « à renseigner » de la rangée (voile), comme Catégorie et Zones.
    expect(StyleSheet.flatten(screen.getByTestId("level-pastille", anyNode).props.style)).toMatchObject({ height: 26, opacity: 0.5 });
    screen.unmount();
    // Aucune limite à trois niveaux : rang 5 annoncé en texte, trois tranches pleines.
    renderMenu({ position: { rank: 5, total: 6 }, menu: null });
    expect(screen.getByTestId("level-label", anyNode).props.children).toBe("Niveau 5");
    expect(reachedSegments("level-gauge")).toEqual([1, 2, 3]);
  });

  it("iOS : la pastille est le libellé d'un Menu SwiftUI natif — Changer de niveau (sous-menus), Ajouter un niveau", () =>
    withPlatform("ios", () => {
      const model = menuModel();
      renderMenu({ position: { rank: 2, total: 3 }, menu: model });
      const host = screen.getByTestId("level", anyNode);
      const root = within(host).UNSAFE_getAllByType(Menu)[0]!;
      expect(within(host).UNSAFE_getAllByType(RNHostView)).toHaveLength(1);
      expect(JSON.stringify(root.props.modifiers)).toContain("Niveau 2");
      // Cible 44 : débords de la rangée portés par la vue hébergée du libellé.
      expect(StyleSheet.flatten(screen.getByTestId("level-target", anyNode).props.style)).toEqual({
        paddingTop: 1,
        paddingBottom: 17,
        paddingLeft: 6,
        paddingRight: 6,
      });
      // … compensés par des marges négatives : la rangée garde sa hauteur de 32.
      expect(StyleSheet.flatten(screen.getByTestId("level-focus", anyNode).props.style)).toMatchObject({
        marginTop: -1,
        marginBottom: -17,
        marginLeft: -6,
        marginRight: -6,
      });

      const change = screen.getByTestId("level-change", anyNode);
      expect(change.props.label).toBe("Changer de niveau");
      expect(hasDisabled(change.props.modifiers, false)).toBe(true);
      // Niveau 1 : un Exercice → bouton ; niveau 2 : deux Exercices → sous-menu des résumés, coché ;
      // niveau 3 : geste local sans Exercice → indisponible.
      const level1 = screen.getByTestId("level-level-1", anyNode);
      expect([level1.props.label, level1.props.systemImage ?? null]).toEqual(["Niveau 1 sur 3 · Squats assistés", null]);
      const level2 = within(host).UNSAFE_getAllByType(Menu).find((menu) => menu.props.testID === "level-level-2")!;
      expect(level2).toBeDefined();
      expect([level2.props.label, level2.props.systemImage]).toEqual(["Niveau 2 sur 3 · Squats", "checkmark"]);
      const exercises = within(level2).UNSAFE_getAllByType(SwiftUIButton);
      expect(exercises.map((item) => [item.props.label, item.props.systemImage ?? null])).toEqual([
        ["3 séries de 12 rép.", "checkmark"],
        ["4 séries de 8 rép.", null],
      ]);
      const level3 = screen.getByTestId("level-level-3", anyNode);
      expect(level3.props.label).toBe("Niveau 3 sur 3 · Mobilisation du genou");
      expect(hasDisabled(level3.props.modifiers, true)).toBe(true);

      act(() => fireEvent(level1, "buttonPress"));
      expect(model.onChangeLevel).toHaveBeenLastCalledWith("d1");
      act(() => fireEvent(screen.getByTestId("level-level-2-d3", anyNode), "buttonPress"));
      expect(model.onChangeLevel).toHaveBeenLastCalledWith("d3");
      // L'Exercice ouvert est coché : le choisir ne fait rien.
      act(() => fireEvent(screen.getByTestId("level-level-2-d2", anyNode), "buttonPress"));
      act(() => fireEvent(level3, "buttonPress"));
      expect(model.onChangeLevel).toHaveBeenCalledTimes(2);
      const add = screen.getByTestId("level-add", anyNode);
      expect(add.props.label).toBe("Ajouter un niveau");
      act(() => fireEvent(add, "buttonPress"));
      expect(model.onAddLevel).toHaveBeenCalledTimes(1);
    }));

  it("iOS, sans groupe : pastille vide, « Changer de niveau » indisponible, « Ajouter un niveau » disponible", () =>
    withPlatform("ios", () => {
      renderMenu({ position: null, menu: menuModel({ levels: [] }) });
      expect(screen.getByTestId("level-label", anyNode).props.children).toBe("Niveau");
      expect(hasDisabled(screen.getByTestId("level-change", anyNode).props.modifiers, true)).toBe(true);
      expect(screen.queryByTestId("level-level-1", anyNode)).toBeNull();
      expect(screen.getByTestId("level-add", anyNode).props.modifiers).toBeUndefined();
    }));

  it("Android : bouton « Niveau 2 » (cible 44, développé) qui ouvre ou ferme le panneau", () =>
    withPlatform("android", () => {
      const anchorRef = createRef<View>();
      const { onOpenPanel, onClosePanel } = renderMenu(
        { position: { rank: 2, total: 3 }, menu: menuModel() },
        jest.fn(),
        false,
        jest.fn(),
        anchorRef,
      );
      // Mesure dans la fenêtre simulée (le simulacre React Native ne rappelle pas).
      (anchorRef.current as unknown as { measureInWindow: unknown }).measureInWindow = (
        callback: (x: number, y: number, width: number, height: number) => void,
      ) => callback(300, 120, 80, 26);
      const trigger = screen.getByTestId("level");
      expect(trigger.props.accessibilityRole).toBe("button");
      expect(trigger.props.accessibilityLabel).toBe("Niveau 2");
      expect(trigger.props.accessibilityState).toEqual({ expanded: false });
      expect(trigger.props.hitSlop).toEqual(HIT_SLOP);
      fireEvent.press(trigger);
      expect(onClosePanel).not.toHaveBeenCalled();
      expect(onOpenPanel).toHaveBeenCalledWith({ x: 300, y: 120, width: 80, height: 26 });
      screen.unmount();
      const reopened = renderMenu({ position: { rank: 2, total: 3 }, menu: menuModel() }, onOpenPanel, true);
      fireEvent.press(screen.getByTestId("level"));
      expect(reopened.onClosePanel).toHaveBeenCalledTimes(1);
    }));
});

describe("PRE-7 A3.1 — MovementLevelPanel (repli Android / web)", () => {
  it("étapes : racine → niveaux (total dans le choix) → Exercices d'un niveau à plusieurs ; aucun choix silencieux", () => {
    const model = menuModel();
    const onDismiss = jest.fn();
    render(<MovementLevelPanel menu={model} placement={{ top: 40, right: 16 }} onDismiss={onDismiss} testID="panel" />);
    expect(screen.getByTestId("panel-change").props.accessibilityLabel).toBe("Changer de niveau");
    expect(screen.getByTestId("panel-add").props.accessibilityLabel).toBe("Ajouter un niveau");
    fireEvent.press(screen.getByTestId("panel-change"));
    expect(screen.getByTestId("panel-level-1").props.accessibilityLabel).toBe("Niveau 1 sur 3 · Squats assistés");
    expect(screen.getByTestId("panel-level-2").props.accessibilityState).toEqual({ selected: true, disabled: false });
    expect(screen.getByTestId("panel-level-3").props.accessibilityState).toEqual({ selected: false, disabled: true });
    fireEvent.press(screen.getByTestId("panel-level-2"));
    expect(model.onChangeLevel).not.toHaveBeenCalled();
    expect(screen.getByTestId("panel-d2").props.accessibilityLabel).toBe("3 séries de 12 rép.");
    expect(screen.getByTestId("panel-d2-check")).toBeTruthy();
    fireEvent.press(screen.getByTestId("panel-d3"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(model.onChangeLevel).toHaveBeenCalledWith("d3");
  });

  it("niveau à un Exercice : ouvert directement ; Ajouter un niveau ; sans groupe : Changer indisponible", () => {
    const model = menuModel();
    const onDismiss = jest.fn();
    render(<MovementLevelPanel menu={model} placement={{ top: 40, right: 16 }} onDismiss={onDismiss} testID="panel" />);
    fireEvent.press(screen.getByTestId("panel-change"));
    fireEvent.press(screen.getByTestId("panel-level-1"));
    expect(model.onChangeLevel).toHaveBeenCalledWith("d1");
    screen.unmount();

    const alone = menuModel({ levels: [] });
    render(<MovementLevelPanel menu={alone} placement={{ top: 40, right: 16 }} onDismiss={onDismiss} testID="panel" />);
    expect(screen.getByTestId("panel-change").props.accessibilityState).toEqual({ selected: false, disabled: true });
    fireEvent.press(screen.getByTestId("panel-add"));
    expect(alone.onAddLevel).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByTestId("panel-outside"));
    expect(onDismiss).toHaveBeenCalledTimes(3);
  });
});

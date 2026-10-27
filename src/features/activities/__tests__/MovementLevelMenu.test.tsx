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
    onReorderLevels: jest.fn(),
    ...overrides,
  };
}

function renderMenu(
  level: EditorLevel,
  onOpenPanel = jest.fn(),
  isPanelOpen = false,
  onClosePanel = jest.fn(),
  anchorRef: RefObject<View | null> = createRef<View>(),
  onNativeMenuVisibilityChange?: (visible: boolean) => void,
) {
  render(
    <MovementLevelMenu
      {...(onNativeMenuVisibilityChange ? { onNativeMenuVisibilityChange } : {})}
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

  it("iOS : la pastille est le libellé d'un Menu SwiftUI natif — Naviguer vers (sous-menus), Ajouter un niveau", () =>
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
      // PRE-7 (R-9, D-448 point 9) : au Catalogue (choix par Exercice), « Naviguer vers ».
      expect(change.props.label).toBe("Naviguer vers");
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
      // PRE-7 (R-6, MFN-07, `10152:20369`) : « Ajouter un niveau » est un sous-menu natif du sens.
      const add = within(host).UNSAFE_getAllByType(Menu).find((menu) => menu.props.testID === "level-add")!;
      expect(add.props.label).toBe("Ajouter un niveau");
      const directions = within(add).UNSAFE_getAllByType(SwiftUIButton);
      expect(directions.map((item) => item.props.label)).toEqual(["Plus facile", "Plus difficile"]);
      act(() => fireEvent(screen.getByTestId("level-add-easier", anyNode), "buttonPress"));
      expect(model.onAddLevel).toHaveBeenLastCalledWith("BEFORE_ORIGIN");
      act(() => fireEvent(screen.getByTestId("level-add-harder", anyNode), "buttonPress"));
      expect(model.onAddLevel).toHaveBeenLastCalledWith("AFTER_ORIGIN");
      expect(model.onAddLevel).toHaveBeenCalledTimes(2);
    }));

  it("iOS, sans groupe : pastille vide, « Naviguer vers » indisponible, « Ajouter un niveau » disponible", () =>
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
    expect(screen.getByTestId("panel-change").props.accessibilityLabel).toBe("Naviguer vers");
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

  it("niveau à un Exercice : ouvert directement ; Ajouter un niveau ; sans groupe : Naviguer et Réordonner indisponibles", () => {
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
    expect(screen.getByTestId("panel-reorder").props.accessibilityState).toEqual({ selected: false, disabled: true });
    // PRE-7 (R-6, MFN-07) : « Ajouter un niveau » déploie le choix du sens.
    fireEvent.press(screen.getByTestId("panel-add"));
    expect(alone.onAddLevel).not.toHaveBeenCalled();
    expect(screen.getByTestId("panel-add-easier").props.accessibilityLabel).toBe("Plus facile");
    fireEvent.press(screen.getByTestId("panel-add-harder"));
    expect(alone.onAddLevel).toHaveBeenCalledWith("AFTER_ORIGIN");
    expect(onDismiss).toHaveBeenCalledTimes(2);
    fireEvent.press(screen.getByTestId("panel-outside"));
    expect(onDismiss).toHaveBeenCalledTimes(3);
  });
});

/** PRE-7 R-6 : niveaux d'un groupe, choix par mouvement (reprise, occurrence de Séance). */
function movementMenuModel(onChangeMovement = jest.fn<(movementId: string) => void>()): MovementLevelMenuModel {
  return menuModel({
    currentDefinitionId: null,
    levels: [
      { rank: 1, total: 3, name: "Squats assistés", movementId: "m1", exercises: [{ definitionId: "d1", summary: "3 séries" }] },
      { rank: 2, total: 3, name: "Squats", movementId: "m2", exercises: [] },
      { rank: 3, total: 3, name: "Mobilisation du genou", movementId: "m3", exercises: [] },
    ],
    onAddLevel: null,
    movementChoice: { currentMovementId: "m2", onChangeMovement },
  });
}

describe("PRE-7 R-6 — choix par mouvement (C09, MFN-09)", () => {
  it("iOS : un bouton par niveau, mouvement courant coché, mouvement local disponible ; « Ajouter » indisponible sans `onAddLevel`", () =>
    withPlatform("ios", () => {
      const model = movementMenuModel();
      renderMenu({ position: { rank: 2, total: 3 }, menu: model });
      const host = screen.getByTestId("level", anyNode);
      // Aucun sous-menu d'Exercices : chaque niveau est un bouton natif.
      expect(within(host).UNSAFE_getAllByType(Menu).map((menu) => menu.props.testID)).toEqual([
        undefined,
        "level-change",
        "level-add",
      ]);
      // PRE-7 (R-9, D-448 point 9) : en Séance et en reprise, le sous-menu garde « Changer de niveau ».
      expect(screen.getByTestId("level-change", anyNode).props.label).toBe("Changer de niveau");
      const level2 = screen.getByTestId("level-level-2", anyNode);
      expect([level2.props.label, level2.props.systemImage]).toEqual(["Niveau 2 sur 3 · Squats", "checkmark"]);
      const level3 = screen.getByTestId("level-level-3", anyNode);
      expect(level3.props.modifiers).toBeUndefined();
      act(() => fireEvent(level2, "buttonPress"));
      expect(model.movementChoice!.onChangeMovement).not.toHaveBeenCalled();
      act(() => fireEvent(level3, "buttonPress"));
      expect(model.movementChoice!.onChangeMovement).toHaveBeenCalledWith("m3");
      expect(model.onChangeLevel).not.toHaveBeenCalled();
      const add = within(host).UNSAFE_getAllByType(Menu).find((menu) => menu.props.testID === "level-add")!;
      expect(hasDisabled(add.props.modifiers, true)).toBe(true);
    }));

  it("panneau de repli : une ligne par niveau, choix direct du mouvement ; « Ajouter » indisponible", () => {
    const model = movementMenuModel();
    const onDismiss = jest.fn();
    render(<MovementLevelPanel menu={model} placement={{ top: 40, right: 16 }} onDismiss={onDismiss} testID="panel" />);
    expect(screen.getByTestId("panel-add").props.accessibilityState).toEqual({ selected: false, disabled: true });
    expect(screen.getByTestId("panel-change").props.accessibilityLabel).toBe("Changer de niveau");
    fireEvent.press(screen.getByTestId("panel-change"));
    expect(screen.getByTestId("panel-level-2").props.accessibilityState).toEqual({ selected: true, disabled: false });
    fireEvent.press(screen.getByTestId("panel-level-1"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(model.movementChoice!.onChangeMovement).toHaveBeenCalledWith("m1");
    expect(screen.queryByTestId("panel-d1")).toBeNull();
  });
});

type MenuEntry = { props: { testID: string } };
const menuEntries = (node: { props: { children?: unknown } }) =>
  ([node.props.children] as unknown[]).flat(2).filter(Boolean) as MenuEntry[];

describe("PRE-7 A3.2 / R-9 — accès à l'écran des niveaux (D-448 point 9)", () => {
  it("iOS : racine à trois entrées — Naviguer vers, Ajouter un niveau, Réordonner les niveaux", () =>
    withPlatform("ios", () => {
      const model = menuModel();
      renderMenu({ position: { rank: 2, total: 3 }, menu: model });
      const host = screen.getByTestId("level", anyNode);
      const change = within(host).UNSAFE_getAllByType(Menu).find((menu) => menu.props.testID === "level-change")!;
      const reorder = screen.getByTestId("level-reorder", anyNode);
      expect(reorder.props.label).toBe("Réordonner les niveaux");
      expect(hasDisabled(reorder.props.modifiers, false)).toBe(true);
      // Retiré du sous-menu des niveaux.
      expect(within(change).queryByTestId("level-reorder", anyNode)).toBeNull();
      const root = within(host).UNSAFE_getAllByType(Menu)[0]!;
      expect(menuEntries(root).map((entry) => entry.props.testID)).toEqual(["level-change", "level-add", "level-reorder"]);
      expect(change.props.label).toBe("Naviguer vers");
      act(() => fireEvent(reorder, "buttonPress"));
      expect(model.onReorderLevels).toHaveBeenCalledTimes(1);
      expect(model.onChangeLevel).not.toHaveBeenCalled();
    }));

  it("recette du 27/10 (remarque 3) : iOS — ouverture et fermeture du menu natif remontées (apparition / disparition)", () =>
    withPlatform("ios", () => {
      const visibility = jest.fn();
      renderMenu({ position: { rank: 2, total: 3 }, menu: menuModel() }, jest.fn(), false, jest.fn(), createRef<View>(), visibility);
      const modifiers = screen.getByTestId("level-reorder", anyNode).props.modifiers as { $type: string; eventListener?: () => void }[];
      modifiers.find((modifier) => modifier.$type === "onAppear")!.eventListener!();
      modifiers.find((modifier) => modifier.$type === "onDisappear")!.eventListener!();
      expect(visibility.mock.calls).toEqual([[true], [false]]);
    }));

  it("r11-menu-dehors : iOS — une nouvelle génération recrée l'hôte natif (l'ouverture suivante est de nouveau signalée)", () =>
    withPlatform("ios", () => {
      const level = { position: { rank: 2, total: 3 }, menu: menuModel() };
      const props = {
        level,
        accessStyles: ACCESS,
        hitSlop: HIT_SLOP,
        onOpenPanel: jest.fn(),
        isPanelOpen: false,
        onClosePanel: jest.fn(),
        onNativeMenuVisibilityChange: jest.fn(),
        anchorRef: createRef<View>(),
        testID: "level",
      };
      const { rerender } = render(<MovementLevelMenu {...props} nativeMenuGeneration={0} />);
      const before = screen.getByTestId("level-reorder", anyNode);
      rerender(<MovementLevelMenu {...props} nativeMenuGeneration={0} />);
      expect(screen.getByTestId("level-reorder", anyNode)).toBe(before);
      rerender(<MovementLevelMenu {...props} nativeMenuGeneration={1} />);
      expect(screen.getByTestId("level-reorder", anyNode)).not.toBe(before);
    }));

  it("iOS, Séance ou reprise : même racine, sous-menu « Changer de niveau »", () =>
    withPlatform("ios", () => {
      renderMenu({ position: { rank: 2, total: 3 }, menu: movementMenuModel() });
      const root = within(screen.getByTestId("level", anyNode)).UNSAFE_getAllByType(Menu)[0]!;
      expect(menuEntries(root).map((entry) => entry.props.testID)).toEqual(["level-change", "level-add", "level-reorder"]);
      expect(screen.getByTestId("level-change", anyNode).props.label).toBe("Changer de niveau");
    }));

  it("iOS, sans groupe : « Réordonner les niveaux » indisponible, comme le sous-menu des niveaux", () =>
    withPlatform("ios", () => {
      renderMenu({ position: null, menu: menuModel({ levels: [] }) });
      expect(hasDisabled(screen.getByTestId("level-change", anyNode).props.modifiers, true)).toBe(true);
      expect(hasDisabled(screen.getByTestId("level-reorder", anyNode).props.modifiers, true)).toBe(true);
    }));

  it("panneau de repli : troisième ligne de la racine, qui ferme le panneau puis ouvre l'écran", () => {
    const model = menuModel();
    const onDismiss = jest.fn();
    render(<MovementLevelPanel menu={model} placement={{ top: 40, right: 16 }} onDismiss={onDismiss} testID="panel" />);
    expect(screen.getAllByRole("button").map((row) => row.props.testID)).toEqual(["panel-change", "panel-add", "panel-reorder"]);
    expect(screen.getByTestId("panel-reorder").props.accessibilityLabel).toBe("Réordonner les niveaux");
    // L'étape des niveaux ne la contient plus.
    fireEvent.press(screen.getByTestId("panel-change"));
    expect(screen.queryByTestId("panel-reorder")).toBeNull();
    screen.unmount();
    render(<MovementLevelPanel menu={model} placement={{ top: 40, right: 16 }} onDismiss={onDismiss} testID="panel" />);
    fireEvent.press(screen.getByTestId("panel-reorder"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(model.onReorderLevels).toHaveBeenCalledTimes(1);
    expect(model.onChangeLevel).not.toHaveBeenCalled();
  });
});

describe("Recette A/B B.10 — menu Niveau de la fiche Mouvement", () => {
  it("b2-8 et q6-2 : « Ouvrir un autre niveau », textes réduits (repli), niveau archivé signalé « (archivé) »", () => {
    const model = menuModel({
      currentDefinitionId: null,
      levels: [
        { rank: 1, total: 2, name: "Squats assistés", exercises: [], movementId: "m1", archived: true },
        { rank: 2, total: 2, name: "Squats", exercises: [], movementId: "m2" },
      ],
      movementChoice: { currentMovementId: "m2", onChangeMovement: jest.fn() },
      levelsLabel: "Ouvrir un autre niveau",
      compact: true,
    });
    render(<MovementLevelPanel menu={model} placement={{ top: 40, right: 16 }} onDismiss={jest.fn()} testID="panel" />);
    expect(screen.getByTestId("panel-change").props.accessibilityLabel).toBe("Ouvrir un autre niveau");
    expect(StyleSheet.flatten(within(screen.getByTestId("panel-add")).getByText("Ajouter un niveau").props.style)).toMatchObject({
      fontSize: 12,
    });
    fireEvent.press(screen.getByTestId("panel-change"));
    expect(screen.getByTestId("panel-level-1").props.accessibilityLabel).toBe("Niveau 1 sur 2 · Squats assistés (archivé)");
    expect(screen.getByTestId("panel-level-2").props.accessibilityLabel).toBe("Niveau 2 sur 2 · Squats");
    // Choix par mouvement : le niveau archivé reste consultable (lecture seule, B.8).
    expect(screen.getByTestId("panel-level-1").props.accessibilityState).toEqual({ selected: false, disabled: false });
  });

  it("sans intitulé propre : « Naviguer vers » / « Changer de niveau » et taille inchangés", () => {
    render(<MovementLevelPanel menu={menuModel()} placement={{ top: 40, right: 16 }} onDismiss={jest.fn()} testID="panel" />);
    expect(screen.getByTestId("panel-change").props.accessibilityLabel).toBe("Naviguer vers");
    expect(StyleSheet.flatten(within(screen.getByTestId("panel-add")).getByText("Ajouter un niveau").props.style)).toMatchObject({
      fontSize: 13,
    });
  });
});

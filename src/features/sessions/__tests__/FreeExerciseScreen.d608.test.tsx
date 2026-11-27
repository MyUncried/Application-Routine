import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { ScrollView, StyleSheet } from "react-native";

import { numberTarget, stopConditionOf, type ExecutionParameters } from "@/domain/activities/ExecutionParameters";
import type { Movement } from "@/domain/activities/Movement";
import { freeExerciseOf, withFreeValues } from "@/domain/sessions/carrierMembership";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { MovementCatalogueEntry } from "@/features/activities/MovementCatalogueService";
import { enterExecutionSheetValue } from "@/features/activities/testing/executionSheetActions";
import { FreeExerciseScreen } from "@/features/sessions/FreeExerciseScreen";
import {
  exerciseOfFreePage,
  FREE_EXERCISE_RECOVERY_SECONDS,
  handMovementToFreeExercise,
  takeFreeExerciseHandedToComposition,
  type FreeExerciseHandoff,
} from "@/features/sessions/movementExercises";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

import PILOT from "../../../../catalogue/pilote/mouvements-60-candidats.json";

/**
 * D-608 (D-573 point 5 et D-571 point 2 de la branche de documentation `docs/planification-grille-creneaux` 3524f351, Hermann,
 * 26/11/2026 ; Formats § 9.10, paragraphe « Page « Exercice libre » » ; Figma « Exercice libre — Choix du mouvement » `13259:25991` et
 * « Exercice libre — Modale de type format » `13269:26160`) — création d'un exercice libre :
 * carte Libre → choix du mouvement (un seul, ✓ inactif sans mouvement ; nom inexistant validé → fiche de création) → page (cadre
 * Mouvement avec « Changer », phases seulement si le mouvement en a, Mode Répétitions et « À l'objectif » par défaut, Séries, Charge,
 * De chaque côté, Cadence, Récupération 30″) → ✓ : exercice remis à la Composition avec ses champs standards.
 * Jest ne prouve que l'arbre JS : le rendu et les gestes se vérifient sur iPhone.
 */

const mockPush = jest.fn();
const focusEffects: (() => void)[] = [];
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, back: jest.fn(), dismiss: jest.fn() }),
    useFocusEffect: (effect: () => void) => {
      focusEffects.push(effect);
    },
  };
});

const hidden = { includeHiddenElements: true } as const;

const movement = (id: string, name: string, phases: Movement["phases"] = []): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "jambes",
  bodyZoneIds: ["cuisses"],
  phases,
  nextPhaseId: phases.length + 1,
  aliases: [],
  levelGroup: null,
});
const SQUATS = movement("mv-squats", "Squats sautés");
const GAINAGE = movement("mv-gainage", "Gainage lent", [
  { id: 1, label: "Descente", defaultDurationSeconds: 3 },
  { id: 2, label: "Maintien", defaultDurationSeconds: 2 },
  { id: 3, label: "Remontée", defaultDurationSeconds: 1 },
] as unknown as Movement["phases"]);
const entry = (value: Movement): MovementCatalogueEntry => ({ movement: value, level: null, exerciseCount: 0, archived: false });
const service = { supportsMovementSearch: true, movementCatalogue: { listEntries: async () => [entry(SQUATS), entry(GAINAGE)] } } as never;

function renderScreen() {
  const onClose = jest.fn();
  const onDone = jest.fn();
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <FreeExerciseScreen onClose={onClose} onDone={onDone} />
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  return { onClose, onDone };
}

const validate = () => screen.getByTestId("free-exercise-choice-validate");
// Recette iPhone du 27/11/2026 (matin) : « Ajouter ce mouvement » (zone d'action du bas) ouvre la page ; ✓ reste grisé.
const add = () => screen.getByTestId("free-exercise-add");
const isSelected = (testID: string) => screen.getByTestId(testID).props.accessibilityState?.selected === true;

async function openPage(card: string) {
  fireEvent.press(await screen.findByTestId(card));
  await act(async () => {
    fireEvent.press(add());
  });
  await screen.findByTestId("free-exercise-page");
}

describe("D-608 — écran « Exercice libre — Choix du mouvement »", () => {
  beforeEach(() => {
    mockPush.mockReset();
    focusEffects.length = 0;
    takeFreeExerciseHandedToComposition();
  });

  it("coque du format : zone grise, titre « Exercice libre », accroche ; recherche, filtre, tri ; catalogue ; aucun « + Créer un mouvement »", async () => {
    renderScreen();
    expect(screen.getByTestId("free-exercise-choice-context")).toHaveStyle({ backgroundColor: "#F1F2F5" });
    expect(screen.getByTestId("free-exercise-choice-title")).toHaveTextContent("Exercice libre");
    expect(screen.getByTestId("free-exercise-choice-tagline")).toHaveTextContent("Réglez librement chaque paramètre de l’exercice.");
    expect(screen.getByTestId("free-exercise-search")).toBeTruthy();
    expect(screen.getByTestId("free-exercise-filter")).toBeTruthy();
    expect(screen.getByTestId("free-exercise-sort")).toBeTruthy();
    expect(await screen.findByTestId("free-exercise-card-mv-squats")).toBeTruthy();
    expect(screen.getByTestId("free-exercise-card-mv-gainage")).toBeTruthy();
    expect(screen.queryByText(/Créer un mouvement/)).toBeNull();
  });

  it("recette 27/11 (matin) : « Ajouter ce mouvement » en bas du catalogue (zone d'action partagée), « Fermer sans sélectionner » sans mouvement (réponse du 27/11, lot 24) ; ✓ toujours grisé ; un seul mouvement à la fois", async () => {
    const { onClose } = renderScreen();
    await screen.findByTestId("free-exercise-card-mv-squats");
    expect(screen.getByTestId("free-exercise-bottom-action")).toBeTruthy();
    expect(add()).toHaveTextContent("Fermer sans sélectionner");
    expect(add().props.accessibilityState?.disabled).not.toBe(true);
    expect(validate().props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(validate());
    expect(screen.queryByTestId("free-exercise-page")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("free-exercise-card-mv-squats"));
    // Recette du 26/11 (après-midi) : le mouvement choisi est figé en première ligne, hors de la liste.
    expect(isSelected("free-exercise-pinned-mv-squats")).toBe(true);
    expect(screen.queryByTestId("free-exercise-card-mv-squats")).toBeNull();
    // Le choix ne referme pas le catalogue : « Ajouter ce mouvement » s'active, ✓ reste grisé.
    expect(screen.getByTestId("free-exercise-choice")).toBeTruthy();
    expect(add()).toHaveTextContent("Ajouter ce mouvement");
    expect(add().props.accessibilityState?.disabled).not.toBe(true);
    expect(validate().props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(validate());
    expect(screen.queryByTestId("free-exercise-page")).toBeNull();
    fireEvent.press(screen.getByTestId("free-exercise-card-mv-gainage"));
    expect(isSelected("free-exercise-pinned-mv-gainage")).toBe(true);
    expect(screen.queryByTestId("free-exercise-pinned-mv-squats")).toBeNull();
    expect(isSelected("free-exercise-card-mv-squats")).toBe(false);
    // Toucher la carte figée la désélectionne : elle revient dans la liste.
    fireEvent.press(screen.getByTestId("free-exercise-pinned-mv-gainage"));
    expect(screen.queryByTestId("free-exercise-pinned")).toBeNull();
    expect(isSelected("free-exercise-card-mv-gainage")).toBe(false);
    // Sans choix, « Fermer sans sélectionner » ferme comme la croix.
    expect(add()).toHaveTextContent("Fermer sans sélectionner");
    fireEvent.press(add());
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("free-exercise-page")).toBeNull();
  });

  it("recette 27/11 (matin) : « Ajouter ce mouvement » valide le mouvement choisi, referme le catalogue et ouvre la page ; la liste réserve la hauteur de la zone d'action", async () => {
    renderScreen();
    await screen.findByTestId("free-exercise-card-mv-gainage");
    const reserve = StyleSheet.flatten(screen.getByTestId("free-exercise-list").props.contentContainerStyle) as { paddingBottom?: number };
    expect(reserve.paddingBottom).toBeGreaterThan(24);
    fireEvent.press(screen.getByTestId("free-exercise-card-mv-gainage"));
    await act(async () => {
      fireEvent.press(add());
    });
    expect(await screen.findByTestId("free-exercise-page")).toBeTruthy();
    expect(screen.queryByTestId("free-exercise-choice")).toBeNull();
    expect(screen.getByText("Gainage lent", hidden)).toBeTruthy();
  });

  it("nom inexistant validé : la fiche de création s'ouvre avec ce nom ; le mouvement créé revient et ouvre la page", async () => {
    renderScreen();
    await screen.findByTestId("free-exercise-card-mv-squats");
    fireEvent.changeText(screen.getByTestId("free-exercise-search"), "Burpees croisés");
    expect(screen.getByTestId("free-exercise-empty")).toBeTruthy();
    fireEvent(screen.getByTestId("free-exercise-search"), "submitEditing");
    expect(mockPush).toHaveBeenCalledWith({ pathname: "/movement", params: { context: "free", name: "Burpees croisés" } });
    // Fiche enregistrée : le mouvement revient à l'écran (retour au premier plan).
    handMovementToFreeExercise(movement("mv-new", "Burpees croisés"));
    await act(async () => {
      focusEffects[focusEffects.length - 1]!();
    });
    expect(await screen.findByTestId("free-exercise-page")).toBeTruthy();
    expect(screen.getByText("Burpees croisés", hidden)).toBeTruthy();
    // Recette du 26/11 (après-midi) : « Changer » retrouve le mouvement créé, choisi et figé.
    fireEvent.press(screen.getByTestId("execution-sheet-change-movement", hidden));
    expect(await screen.findByTestId("free-exercise-choice")).toBeTruthy();
    expect(isSelected("free-exercise-pinned-mv-new")).toBe(true);
  });

  it("nom existant validé : le mouvement est choisi, sans fiche de création", async () => {
    renderScreen();
    await screen.findByTestId("free-exercise-card-mv-squats");
    fireEvent.changeText(screen.getByTestId("free-exercise-search"), "squats sautés");
    fireEvent(screen.getByTestId("free-exercise-search"), "submitEditing");
    expect(mockPush).not.toHaveBeenCalled();
    expect(isSelected("free-exercise-pinned-mv-squats")).toBe(true);
  });

  it("recette 26/11 (après-midi) : mouvement choisi en première ligne, figé sous la recherche (patron et valeurs de la zone figée des formats, D-572), absent de la liste, gardé pendant une recherche", async () => {
    renderScreen();
    fireEvent.press(await screen.findByTestId("free-exercise-card-mv-gainage"));
    const root = screen.getByTestId("free-exercise-choice");
    const order = (testID: string) => root.props.children.flat().findIndex((child: { props?: { testID?: string } } | null) => child?.props?.testID === testID);
    expect(order("free-exercise-search-zone")).toBeLessThan(order("free-exercise-pinned"));
    expect(order("free-exercise-pinned")).toBeLessThan(order("free-exercise-list"));
    const zone = StyleSheet.flatten(screen.getByTestId("free-exercise-pinned").props.style) as { backgroundColor?: string; maxHeight?: number };
    expect(zone.backgroundColor).toBe("#FFFFFF");
    expect(zone.maxHeight).toBeGreaterThan(0);
    expect(StyleSheet.flatten(screen.getByTestId("free-exercise-pinned-scroll").props.contentContainerStyle)).toMatchObject({ marginHorizontal: 16, gap: 8, paddingTop: 4, paddingBottom: 8 });
    expect(screen.queryByTestId("free-exercise-card-mv-gainage")).toBeNull();
    fireEvent.changeText(screen.getByTestId("free-exercise-search"), "squats");
    expect(isSelected("free-exercise-pinned-mv-gainage")).toBe(true);
    expect(screen.getByTestId("free-exercise-card-mv-squats")).toBeTruthy();
  });

  it("recette 26/11 (après-midi) : « Tes » trouve « Tester » ; à chaque recherche ou filtre, la liste repart de son début, sous la recherche", async () => {
    const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo").mockImplementation(() => undefined);
    try {
      render(
        <TestSafeAreaProvider>
          <ActivityDefinitionServiceContext.Provider
            value={{ supportsMovementSearch: true, movementCatalogue: { listEntries: async () => [entry(SQUATS), entry(GAINAGE), entry(movement("mv-tester", "Tester"))] } } as never}
          >
            <FreeExerciseScreen onClose={jest.fn()} onDone={jest.fn()} />
          </ActivityDefinitionServiceContext.Provider>
        </TestSafeAreaProvider>,
      );
      await screen.findByTestId("free-exercise-card-mv-tester");
      for (const typed of ["T", "Te", "Tes", "Test", "Tester"]) {
        scrollTo.mockClear();
        fireEvent.changeText(screen.getByTestId("free-exercise-search"), typed);
        expect(screen.getByTestId("free-exercise-card-mv-tester")).toBeTruthy();
        expect(scrollTo).toHaveBeenCalledWith({ y: 0, animated: false });
      }
    } finally {
      scrollTo.mockRestore();
    }
  });

  it("croix : retour à la fenêtre « Créer un exercice »", async () => {
    const { onClose } = renderScreen();
    await screen.findByTestId("free-exercise-card-mv-squats");
    fireEvent.press(screen.getByTestId("free-exercise-choice-cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("recette 26/11 : le catalogue défile sous la zone de contexte et sous la recherche, jamais par-dessus", async () => {
    renderScreen();
    await screen.findByTestId("free-exercise-card-mv-squats");
    const z = (testID: string) => (StyleSheet.flatten(screen.getByTestId(testID).props.style) as { zIndex?: number }).zIndex ?? 0;
    const list = StyleSheet.flatten(screen.getByTestId("free-exercise-list").props.style) as { overflow?: string; zIndex?: number };
    expect(list.overflow).toBe("hidden");
    expect(z("free-exercise-choice-context")).toBeGreaterThan(z("free-exercise-search-zone"));
    expect(z("free-exercise-search-zone")).toBeGreaterThan(list.zIndex ?? 0);
    expect((StyleSheet.flatten(screen.getByTestId("free-exercise-search-zone").props.style) as { backgroundColor?: string }).backgroundColor).toBe("#FFFFFF");
  });

  // Recette iPhone du 26/11/2026 (soir), lib-changer et r26-recherche-tes. En feuille native (`formSheet`, iOS),
  // react-native-screens 4.26 (`RNSScreen.mm`, `applyFrameCorrectionForDescendantScrollView` / `tryFindDescendantScrollView`)
  // suit les PREMIERS sous-vues natives depuis l'écran et impose à la première ScrollView rencontrée le cadre entier de la feuille.
  // Fabric monte les enfants d'une vue par zIndex croissant, ordre du rendu à égalité (`sliceChildShadowNodeViewPairs.cpp`,
  // `ConcreteViewShadowNode.h`). Modèle de ce chemin sur l'arbre rendu : premier enfant hôte après ce tri, jusqu'à une feuille.
  const firstNativeSubviewPath = (testID: string): string[] => {
    type Node = { type: unknown; props: { style?: unknown; testID?: string }; children: (Node | string)[] };
    const hostChildren = (node: Node): Node[] =>
      node.children.flatMap((child) => (typeof child === "string" ? [] : typeof child.type === "string" ? [child] : hostChildren(child)));
    const path: string[] = [];
    let node = screen.getByTestId(testID) as unknown as Node;
    for (;;) {
      const children = hostChildren(node)
        .map((child, index) => ({ child, index, z: (StyleSheet.flatten(child.props.style as never) as { zIndex?: number } | undefined)?.zIndex ?? 0 }))
        .sort((a, b) => a.z - b.z || a.index - b.index);
      if (children.length === 0) return path;
      node = children[0]!.child;
      path.push(`${String(node.type)}${node.props.testID === undefined ? "" : `#${node.props.testID}`}`);
      if (node.type === "RCTScrollView") return path;
    }
  };

  it("recette 26/11 (soir) : aucune ScrollView sur le chemin des premiers enfants natifs — la feuille native ne retaille ni la liste ni la zone figée", async () => {
    renderScreen();
    await screen.findByTestId("free-exercise-card-mv-squats");
    // Sans choix : la liste ne doit pas être tirée en haut de la feuille, sous la zone de contexte et la recherche.
    expect(firstNativeSubviewPath("free-exercise-choice")).not.toContainEqual(expect.stringMatching(/^RCTScrollView/));
    // Avec un mouvement choisi : la ScrollView de la zone figée ne doit pas être étirée sur toute la feuille, sous la liste.
    fireEvent.press(screen.getByTestId("free-exercise-card-mv-gainage"));
    expect(screen.getByTestId("free-exercise-pinned")).toBeTruthy();
    expect(firstNativeSubviewPath("free-exercise-choice")).not.toContainEqual(expect.stringMatching(/^RCTScrollView/));
    // Premier enfant natif : la vue vide non aplatie, sans place dans la mise en page.
    const guard = screen.getByTestId("free-exercise-sheet-scroll-guard");
    expect(guard.props.collapsable).toBe(false);
    expect(StyleSheet.flatten(guard.props.style)).toMatchObject({ height: 0 });
  });

  it("recette 26/11 (soir) : exemples de Hermann sur le catalogue pilote réel (60 mouvements + « Tester ») — la recherche rend les bons mouvements à chaque frappe", async () => {
    const pilot = [...PILOT.records.map((record: { readonly name: string }) => record.name), "Tester"].map((name, index) => entry(movement(`mv-pilot-${index}`, name)));
    render(
      <TestSafeAreaProvider>
        <ActivityDefinitionServiceContext.Provider value={{ supportsMovementSearch: true, movementCatalogue: { listEntries: async () => pilot } } as never}>
          <FreeExerciseScreen onClose={jest.fn()} onDone={jest.fn()} />
        </ActivityDefinitionServiceContext.Provider>
      </TestSafeAreaProvider>,
    );
    await screen.findByTestId("free-exercise-card-mv-pilot-0");
    const shown = () =>
      screen
        .queryAllByTestId(/^free-exercise-card-mv-pilot-\d+$/)
        .map((card) => pilot.find((candidate) => `free-exercise-card-${candidate.movement.id}` === card.props.testID)!.movement.name);
    // « Ko » de Hermann (T, Te ok, ko ensuite ; b ok, bo, bu… ko ; r, ro ok, ko ensuite ; etirement, etirement d, etirement du ok,
    // ko ensuite) : chaque requête « ko » rend ses mouvements, mais au plus DEUX — la hauteur que la liste, tirée en haut de la
    // feuille, cachait sous la zone de contexte et la recherche ; les requêtes « ok » en rendent au moins trois.
    const expected: readonly (readonly [string, readonly string[]])[] = [
      ["T", ["Adho Mukha Svanasana (chien tête en bas)", "Deadlift (soulevé de terre)", "Élévation de jambe tendue", "Étirement du triceps au-dessus de la tête", "Strict pull-up (traction stricte)", "Tadasana (montagne)", "Tester", "The Hundred", "Thruster", "Trikonasana (triangle)"]],
      ["Te", ["Adho Mukha Svanasana (chien tête en bas)", "Deadlift (soulevé de terre)", "Élévation de jambe tendue", "Étirement du triceps au-dessus de la tête", "Tester"]],
      ["Tes", ["Tester"]],
      ["Test", ["Tester"]],
      ["bo", ["Box jump"]],
      ["bu", ["Burpee", "Burpee broad jump"]],
      ["r", ["Roll Up", "Rolling Like a Ball", "Rowing (rameur)"]],
      ["ro", ["Roll Up", "Rolling Like a Ball", "Rowing (rameur)"]],
      ["rol", ["Roll Up", "Rolling Like a Ball"]],
      ["etirement du", ["Étirement des extenseurs du poignet", "Étirement du haut du dos", "Étirement du mollet — gastrocnémien", "Étirement du quadriceps sur le côté", "Étirement du soléaire", "Étirement du triceps au-dessus de la tête"]],
      ["etirement du m", ["Étirement du mollet — gastrocnémien", "Étirement du soléaire"]],
      ["etirement du mo", ["Étirement du mollet — gastrocnémien", "Étirement du soléaire"]],
    ];
    for (const [typed, names] of expected) {
      fireEvent.changeText(screen.getByTestId("free-exercise-search"), typed);
      expect([typed, shown()]).toEqual([typed, names]);
      expect(screen.queryByTestId("free-exercise-empty")).toBeNull();
    }
  });
});

describe("D-608 — page « Exercice libre »", () => {
  beforeEach(() => {
    mockPush.mockReset();
    focusEffects.length = 0;
    takeFreeExerciseHandedToComposition();
  });

  it("recette 26/11 : le contenu de la page défile sous la zone de contexte (titre, boutons), jamais par-dessus", async () => {
    renderScreen();
    await openPage("free-exercise-card-mv-squats");
    const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style) as { zIndex?: number; overflow?: string };
    const body = style("execution-sheet-body");
    expect(body.overflow).toBe("hidden");
    expect(style("execution-sheet-free-context").zIndex ?? 0).toBeGreaterThan(style("execution-sheet-free-fade").zIndex ?? 0);
    expect(style("execution-sheet-free-fade").zIndex ?? 0).toBeGreaterThan(body.zIndex ?? 0);
  });

  it("coque : titre « Exercice libre », accroche, Retour ; cadres dans l'ordre ; Mouvement avec « Changer » ; sans phases : aucune ligne de phases", async () => {
    renderScreen();
    await openPage("free-exercise-card-mv-squats");
    expect(screen.getByTestId("execution-sheet-page", hidden)).toBeTruthy();
    expect(screen.queryByTestId("execution-sheet-modal", hidden)).toBeNull();
    expect(screen.getByTestId("execution-sheet-title", hidden)).toHaveTextContent("Exercice libre");
    expect(screen.getByTestId("execution-sheet-free-context", hidden)).toHaveStyle({ backgroundColor: "#F1F2F5" });
    expect(screen.getByTestId("execution-sheet-free-tagline", hidden)).toHaveTextContent("Réglez librement chaque paramètre de l’exercice.");
    const pageIcon: unknown = screen.getByTestId("execution-sheet-cancel-icon", hidden).props.source;
    expect(screen.getByTestId("execution-sheet-change-movement", hidden)).toHaveTextContent("Changer");
    expect(screen.getByText("Squats sautés", hidden)).toBeTruthy();
    expect(screen.queryByTestId("execution-sheet-row-phases", hidden)).toBeNull();
    for (const id of [
      "execution-sheet-row-mode",
      "execution-sheet-row-stop-condition",
      "execution-sheet-row-series-type",
      "execution-sheet-row-load",
      "execution-sheet-row-side",
      "execution-sheet-row-beep",
      "execution-sheet-row-recovery",
    ]) {
      expect(screen.getByTestId(id, hidden)).toBeTruthy();
    }
    // Retour (chevron) à la place de la croix (Figma `13269:26160`) — icônes de référence rendues en dernier (nouveau rendu).
    const back: unknown = render(<KodjoIcon name="control-back" testID="reference-back" />).getByTestId("reference-back").props.source;
    const close: unknown = render(<KodjoIcon name="control-close" testID="reference-close" />).getByTestId("reference-close").props.source;
    expect(pageIcon).toEqual(back);
    expect(pageIcon).not.toEqual(close);
  });

  it("mouvement avec phases : ligne « Phases du mouvement » avec « 3 phases »", async () => {
    renderScreen();
    await openPage("free-exercise-card-mv-gainage");
    expect(screen.getByTestId("execution-sheet-row-phases", hidden)).toBeTruthy();
    expect(screen.getByText("3 phases", hidden)).toBeTruthy();
  });

  it("valeurs par défaut : Mode Répétitions, Condition d'arrêt « À l'objectif », séries identiques, Récupération 30″", async () => {
    renderScreen();
    await openPage("free-exercise-card-mv-squats");
    expect(screen.getByTestId("execution-sheet-mode-control-REPETITIONS", hidden).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("execution-sheet-stop-condition-control-TARGET", hidden).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("execution-sheet-series-type-control-UNIFORM", hidden).props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByTestId("execution-sheet-row-recovery", hidden)).toHaveTextContent(/30/);
    expect(FREE_EXERCISE_RECOVERY_SECONDS).toBe(30);
  });

  it("« Changer » et Retour : retour au choix du mouvement", async () => {
    renderScreen();
    await openPage("free-exercise-card-mv-squats");
    fireEvent.press(screen.getByTestId("execution-sheet-change-movement", hidden));
    expect(await screen.findByTestId("free-exercise-choice")).toBeTruthy();
    // Recette du 26/11 (après-midi) : le mouvement reste choisi et figé en première ligne.
    expect(isSelected("free-exercise-pinned-mv-squats")).toBe(true);
    await openPage("free-exercise-card-mv-gainage");
    fireEvent.press(screen.getByTestId("execution-sheet-cancel", hidden));
    expect(await screen.findByTestId("free-exercise-choice")).toBeTruthy();
  });

  it("parcours complet, séries identiques : ✓ remet l'exercice à la Composition (paramètres, Récupération 30″) et retire les modales", async () => {
    const { onDone } = renderScreen();
    await openPage("free-exercise-card-mv-squats");
    enterExecutionSheetValue("execution-sheet-target", 12, "integer");
    await act(async () => {
      fireEvent.press(screen.getByTestId("execution-sheet-validate", hidden));
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    const handed = takeFreeExerciseHandedToComposition();
    expect(handed?.movement.id).toBe("mv-squats");
    expect(handed?.recoverySeconds).toBe(30);
    expect(handed?.parameters.mode).toBe("REPETITIONS");
    expect(stopConditionOf(handed!.parameters)).toBe("TARGET");
    expect(handed?.parameters.series).toMatchObject({ kind: "UNIFORM", count: 1, target: { kind: "NUMBER", value: 12 } });
  });

  it("séries variables : le tableau s'affiche et les séries variables sont remises", async () => {
    const { onDone } = renderScreen();
    await openPage("free-exercise-card-mv-squats");
    enterExecutionSheetValue("execution-sheet-target", 10, "integer");
    enterExecutionSheetValue("execution-sheet-series", 3, "integer");
    fireEvent.press(screen.getByTestId("execution-sheet-series-type-control-VARIABLE", hidden));
    await waitFor(() => expect(screen.getByTestId("execution-sheet-series-type-control-VARIABLE", hidden).props.accessibilityState).toMatchObject({ selected: true }));
    await act(async () => {
      fireEvent.press(screen.getByTestId("execution-sheet-validate", hidden));
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    const handed = takeFreeExerciseHandedToComposition();
    expect(handed?.parameters.series.kind).toBe("VARIABLE");
    expect(handed?.parameters.series.kind === "VARIABLE" && handed.parameters.series.rows.length).toBe(3);
  });
});

describe("D-608 — exercice créé : champs standards ; échange avec les formats (D-604)", () => {
  const parameters = (): ExecutionParameters =>
    ({
      version: 5,
      mode: "REPETITIONS",
      series: { kind: "UNIFORM", count: 4, target: numberTarget(12), pauseSeconds: 45, loadKg: 0, workPhases: [] },
      sideMode: "BILATERAL",
      sideOrder: "BY_SIDE",
      sideRecoverySeconds: 0,
      cadenceBeepIntervalSeconds: 0,
      countdownSeconds: 10,
      endSeconds: 5,
      loadEnabled: false,
    }) as unknown as ExecutionParameters;
  const handoff = (): FreeExerciseHandoff => ({ movement: SQUATS, parameters: parameters(), recoverySeconds: 30 });

  it("exercice de la Composition : occurrence du mouvement, paramètres de la page, Récupération 30″, défauts du Profil validés", () => {
    const exercise = exerciseOfFreePage(handoff(), "e1", { countdownSeconds: 10, endSeconds: 5 });
    expect(exercise).toMatchObject({ id: "e1", name: "Squats sautés", sourceMovementId: "mv-squats", postActivityRecoverySeconds: 30, sideMode: "BILATERAL" });
    expect(exercise.executionParameters).toEqual(parameters());
    expect(exercise.profileDefaultsPending).toBeUndefined();
    expect(exercise.format).toBeUndefined();
  });

  it("entrée dans un format : valeurs libres conservées, masquées ; sortie : elles réapparaissent", () => {
    const created = exerciseOfFreePage(handoff(), "e1", { countdownSeconds: 10, endSeconds: 5 });
    const entered = { ...withFreeValues(created), format: { key: "EMOM" as const, settings: {} }, executionParameters: { ...parameters(), mode: "DURATION" as const } };
    expect(entered.freeValues?.executionParameters).toEqual(parameters());
    const exited = freeExerciseOf(entered as never);
    expect(exited.executionParameters).toEqual(parameters());
    expect(exited.postActivityRecoverySeconds).toBe(30);
    expect(exited.format).toBeUndefined();
  });

  it("exercice sorti d'un format sans valeurs libres : défauts d'un exercice libre (Répétitions, « À l'objectif »)", () => {
    const created = exerciseOfFreePage(handoff(), "e1", { countdownSeconds: 10, endSeconds: 5 });
    const exited = freeExerciseOf({ ...created, format: { key: "EMOM", settings: {} } } as never);
    expect(exited.executionParameters.mode).toBe("REPETITIONS");
    expect(stopConditionOf(exited.executionParameters)).toBe("TARGET");
  });
});

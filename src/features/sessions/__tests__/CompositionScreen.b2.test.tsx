import { afterAll, beforeAll, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { Platform, StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import { createEmptyDraft, createExerciseDraft, type SessionDraft, type SessionDraftExercise } from "@/domain/sessions/SessionDraft";
import { structureCircuits } from "@/domain/sessions/structure";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { SessionDraftContext, type SessionDraftContextValue, type SessionDraftUpdate } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-9 story B.2 (COMP §1 et §5, D-451, ARB-06, ARB-19 ; Figma `10705:20223`, `10819:20344`,
 * `10836:20478`) — menu Créer à cinq actions + Annuler [01/11/2026 : quatre options, le « + » devient
 * Annuler — ch13 CE-T03-08 « Menu Créer — état cible »], Séance sans Circuit, mode enveloppe (poser
 * un Circuit ou un Cycle sur un premier contenu). Jest ne prouve pas le rendu sur iPhone.
 */

jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => undefined) }));
jest.mock("expo-crypto", () => {
  let counter = 0;
  return { randomUUID: jest.fn(() => `generated-${++counter}`) };
});
const mockPush = jest.fn();
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactActual = require("react") as typeof import("react");
  return {
    ...actual,
    useRouter: () => ({ push: mockPush, back: jest.fn(), dismissTo: jest.fn() }),
    useFocusEffect: (callback: () => void) => {
      ReactActual.useEffect(() => callback(), []);
    },
  };
});
const mockExitGuard = jest.fn();
jest.mock("@/features/sessions/useCompositionExitGuard", () => ({
  useCompositionExitGuard: (shouldBlock: boolean, onConfirmExit: () => void) => mockExitGuard(shouldBlock, onConfirmExit),
}));

const activityDefinitionService = {
  listBodyZones: jest.fn(async () => []),
  listLabels: jest.fn(async () => []),
  listCategories: jest.fn(async () => []),
} as unknown as ActivityDefinitionService;
const referentialService = { listLabels: jest.fn(async () => []) } as unknown as ReferentialService;

const probe: { draft: SessionDraft | null } = { draft: null };

function DraftHost({ initial, children }: { initial: SessionDraft; children: ReactNode }) {
  const [draft, setDraft] = useState(initial);
  useLayoutEffect(() => {
    probe.draft = draft;
  });
  const value = useMemo<SessionDraftContextValue>(
    () => ({
      draft,
      updateDraft: (update: SessionDraftUpdate) =>
        setDraft((current) => ({ ...current, ...(typeof update === "function" ? update(current) : update) })),
      resetDraft: jest.fn(),
    }),
    [draft],
  );
  return <SessionDraftContext.Provider value={value}>{children}</SessionDraftContext.Provider>;
}

async function renderComposition(draft: SessionDraft) {
  render(
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={activityDefinitionService}>
        <ReferentialServiceContext.Provider value={referentialService}>
          <DraftHost initial={draft}>
            <CompositionScreen />
          </DraftHost>
        </ReferentialServiceContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await act(async () => undefined);
}

function exercise(id: string, structuralPosition: SessionDraftExercise["structuralPosition"] = "BEFORE_TOUR"): SessionDraftExercise {
  return {
    ...createExerciseDraft(id, 0),
    name: `Exercice ${id}`,
    sourceMovementId: `movement-${id}`,
    structuralPosition,
    executionParameters: durationParameters(30, 1),
  };
}

/** Séance sans Circuit (D-451) : trois Exercices au niveau de la Séance, sans structure enregistrée. */
const flatDraft = (): SessionDraft => ({ ...createEmptyDraft(), name: "Séance", exercises: ["a", "b", "c"].map((id) => exercise(id)) });

const hidden = { includeHiddenElements: true } as const;
const t = strings.screens.composition.envelope;
const menu = strings.screens.activities.addToSession;

function openMenu() {
  fireEvent.press(screen.getByTestId("composition-add-activity-action"));
  return screen.getByTestId("composition-add-activity-tree");
}

async function envelopeAround(container: "CIRCUIT" | "CYCLE", targetTestID: string) {
  openMenu();
  fireEvent.press(screen.getByTestId(container === "CIRCUIT" ? "composition-add-activity-tree-circuit" : "composition-add-activity-tree-cycle"));
  fireEvent.press(screen.getByTestId(`${targetTestID}-target`));
  fireEvent.press(screen.getByTestId("composition-envelope-bar-confirm"));
  await act(async () => undefined);
}

let originalPlatformOS: typeof Platform.OS;
beforeAll(() => {
  originalPlatformOS = Platform.OS;
  Platform.OS = "ios";
});
afterAll(() => {
  Platform.OS = originalPlatformOS;
});

beforeEach(() => {
  mockPush.mockReset();
  mockExitGuard.mockReset();
  mockExitGuard.mockReturnValue({ isPendingExit: false, cancelExit: jest.fn(), confirmExit: jest.fn() });
});

describe("B.2 — menu Créer (COMP §5, Figma 10705:20223)", () => {
  // Ordre de Hermann du 01/11/2026, ch13 CE-T03-08 « Menu Créer — état cible » [remplace « cinq
  // actions puis Annuler, dans l'ordre »] : exactement quatre options, dans cet ordre, puis Annuler
  // à la place du « + » (pas de rangée Annuler, pas d'entrée Format — MENU-FMT-01).
  // [« exactement quatre options » — remplacé par la recette iPhone du 01/11/2026 (m11-menu, Hermann :
  // « il faut intégrer de nouveau l'option du menu « utiliser un mouvement existant » » ; « 2e, après
  // Créer » ; icône « Haltère (ancienne) ») : cinq options.]
  // [Référence Formats du 02/11/2026 (§7, CE-T03-08, Figma `10705:20223`) : « Utiliser des mouvements
  // existants » (2e) et « Utiliser un format d'entraînement » (3e, remplace « Utiliser une séance existante »).]
  it("référence du 02/11 : cinq options, dans l'ordre, chacune avec son icône ronde ; Annuler n'est pas une option ; « Utiliser un format d'entraînement » ouvre la fenêtre Formats", async () => {
    await renderComposition(flatDraft());
    const tree = openMenu();
    const labels = within(tree)
      .getAllByRole("button")
      .map((node) => node.props.accessibilityLabel);
    expect(labels).toEqual([
      menu.newActivity,
      menu.existingActivity,
      menu.useFormat,
      menu.addCircuit,
      menu.addCycle,
      menu.cancel,
    ]);
    expect(labels.slice(0, 3)).toEqual(["Créer un exercice", "Utiliser des mouvements existants", "Utiliser un format d’entraînement"]);
    expect(within(tree).queryByText(/séance existante/i)).toBeNull();
    // Contre-recette du 01/11 (m12-menu) : haltère pour « Créer un exercice », silhouette pour « Utiliser un mouvement existant ».
    expect(within(screen.getByTestId("composition-add-activity-tree-new-icon", hidden)).getByTestId("create-menu-icon-exercise", hidden)).toBeTruthy();
    expect(within(screen.getByTestId("composition-add-activity-tree-existing-icon", hidden)).queryByTestId("create-menu-icon-exercise", hidden)).toBeNull();
    // L'axe s'arrête toujours à « Ajouter un cycle » (cinquième rangée).
    const axis = StyleSheet.flatten(screen.getByTestId("composition-add-activity-tree-axis", hidden).props.style);
    const cycleRow = StyleSheet.flatten(screen.getByTestId("composition-add-activity-tree-cycle").props.style);
    expect(axis.top + axis.height).toBe(cycleRow.top + 16);
    const optionIDs = ["new", "existing", "format", "circuit", "cycle"].map((key) => `composition-add-activity-tree-${key}`);
    for (const testID of optionIDs) expect(screen.getByTestId(`${testID}-icon`, hidden)).toBeTruthy();
    // Annuler n'a ni pilule ni libellé : c'est le « + » transformé.
    expect(screen.queryByTestId("composition-add-activity-tree-cancel-label", hidden)).toBeNull();
    expect(within(screen.getByTestId("composition-add-activity-tree-format-icon", hidden)).getByTestId("create-menu-icon-format", hidden)).toBeTruthy();
    expect(screen.getByTestId("composition-add-activity-tree-circuit").props.accessibilityState).toEqual({ disabled: false });
    // Le menu s'efface ; la fenêtre Formats s'ouvre sur la Composition.
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-format"));
    expect(screen.queryByTestId("composition-add-activity-tree")).toBeNull();
    expect(screen.getByTestId("formats-window")).toBeTruthy();
    fireEvent.press(screen.getByTestId("format-model-TABATA"));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/format-questionnaire", params: { model: "TABATA" } });
  });

  it("recette du 01/11 : « Utiliser un mouvement existant » ouvre la sélection des Mouvements du Catalogue (action d'avant le 01/11) et ferme le menu", async () => {
    await renderComposition(flatDraft());
    openMenu();
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-existing"));
    // PRE-9 A.2 — ARB-22a, D-449 : sélection des Mouvements du Catalogue (plus `/activity-selection`).
    expect(mockPush).toHaveBeenLastCalledWith("/movement-selection");
    expect(screen.queryByTestId("composition-add-activity-tree")).toBeNull();
  });

  /*
   * Recette iPhone du 01/11/2026 — m11-annuler KO (« Le Bouton + ne devient pas X, et appuyer dessus
   * n'a aucun effet ») et m11-menu (« la zone de contexte doit être sous le voile grisé, seuls le
   * bouton créer -> annuler, et les options doivent être visible dessus »). Cause sur l'appareil : la
   * zone de contexte (`zIndex: 1`) passait au-dessus du menu, son frère sans `zIndex`. Jest ne peint
   * ni ne teste le toucher par `zIndex` : l'empilement est vérifié sur les styles des frères.
   */
  it("recette du 01/11 : le menu est au-dessus de la zone de contexte (frères de l'écran, zIndex supérieur) ; le « + » d'origine s'efface sous Annuler", async () => {
    await renderComposition(flatDraft());
    openMenu();
    const band = screen.getByTestId("screen-context-band", hidden);
    const tree = screen.getByTestId("composition-add-activity-tree", hidden);
    type Node = typeof tree;
    const ancestors = (node: Node) => {
      const chain: Node[] = [];
      for (let current: Node | null = node; current !== null; current = current.parent) chain.push(current);
      return chain;
    };
    // Ancêtre commun : le conteneur de l'écran (`ScreenShell`), dont la zone de contexte et le menu
    // sont des frères natifs.
    const bandChain = ancestors(band);
    const common = ancestors(tree).find((node) => bandChain.includes(node))!;
    expect(common).toBeTruthy();
    /** Plus grand `zIndex` sur le chemin d'un nœud jusqu'à l'ancêtre commun (exclu). */
    const zOf = (node: Node) =>
      ancestors(node)
        .slice(0, ancestors(node).indexOf(common))
        .reduce((z, current) => {
          const value = (StyleSheet.flatten(current.props.style) as { zIndex?: number } | undefined)?.zIndex;
          return typeof value === "number" ? Math.max(z, value) : z;
        }, 0);
    expect(zOf(band)).toBe(1);
    expect(zOf(tree)).toBeGreaterThan(zOf(band));
    expect(zOf(screen.getByTestId("composition-add-activity-tree-cancel"))).toBeGreaterThan(zOf(screen.getByTestId("composition-add-stop-action", hidden)));
    // Le « + » d'origine (sous le voile) ne se montre plus ni ne s'annonce : Annuler est à sa place.
    const plus = screen.getByTestId("composition-add-activity-action", hidden);
    expect(StyleSheet.flatten(plus.props.style).opacity).toBe(0);
    expect(plus.props.accessibilityElementsHidden).toBe(true);
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-cancel"));
    const restored = screen.getByTestId("composition-add-activity-action");
    expect(StyleSheet.flatten(restored.props.style).opacity).toBeUndefined();
  });

  it("« Créer un exercice » ouvre la création d'un Mouvement en contexte Séance et ferme le menu", async () => {
    await renderComposition(flatDraft());
    openMenu();
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-new"));
    // PRE-9 A.2 — ARB-22a, D-449 : création d'un Mouvement en contexte Séance (plus `/exercise`).
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: "/movement", params: { context: "session" } });
    expect(screen.queryByTestId("composition-add-activity-tree")).toBeNull();
  });

  it("le « + » devient Annuler à l'ouverture (croix 34 sur fond gris, au-dessus du voile), ferme sans mutation ni navigation, puis redevient « + »", async () => {
    const initial = flatDraft();
    await renderComposition(initial);
    const plus = screen.getByTestId("composition-add-activity-action");
    expect(plus.props.accessibilityLabel).toBe(strings.screens.composition.addActivity);
    openMenu();
    const cancel = screen.getByTestId("composition-add-activity-tree-cancel");
    expect(cancel.props.accessibilityLabel).toBe(menu.cancel);
    expect(StyleSheet.flatten(screen.getByTestId("composition-add-activity-tree-cancel-circle", hidden).props.style)).toMatchObject({
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "#E5E8F0",
    });
    expect(screen.getByTestId("composition-add-activity-tree-cancel-icon", hidden)).toBeTruthy();
    // Plus de « + » reposé au premier plan : seul celui de la zone de contexte, sous le voile.
    expect(screen.queryByTestId("composition-add-activity-tree-plus", hidden)).toBeNull();
    const draftBefore = probe.draft;
    fireEvent.press(cancel);
    expect(screen.queryByTestId("composition-add-activity-tree")).toBeNull();
    expect(screen.queryByTestId("composition-add-activity-tree-cancel", hidden)).toBeNull();
    expect(mockPush).not.toHaveBeenCalled();
    expect(probe.draft).toBe(draftBefore);
    expect(probe.draft).toEqual(initial);
    // Le « + » reprend son action d'ouverture.
    expect(screen.getByTestId("composition-add-activity-action").props.accessibilityLabel).toBe(strings.screens.composition.addActivity);
    openMenu();
    expect(screen.getByTestId("composition-add-activity-tree")).toBeTruthy();
  });

  it("Séance vide : « Ajouter un circuit » et « Ajouter un cycle » visibles et indisponibles (aucun contenu éligible)", async () => {
    await renderComposition(createEmptyDraft());
    openMenu();
    for (const [testID, label] of [
      ["composition-add-activity-tree-circuit", menu.addCircuit],
      ["composition-add-activity-tree-cycle", menu.addCycle],
    ] as const) {
      const option = screen.getByTestId(testID);
      expect(option.props.accessibilityState).toEqual({ disabled: true });
      expect(option.props.accessibilityLabel).toBe(`${label} — indisponible`);
      fireEvent.press(option);
    }
    expect(screen.queryByTestId("composition-envelope-bar")).toBeNull();
  });

  // [B.2 : « Séance à Points d'arrêt : aucun conteneur qui la ferait sortir de l'ancien modèle (B.6) —
  // actions indisponibles » — remplacé le 31/10/2026 par B.6 : les Points existent dans toute la structure.]
  it("Séance à Points d'arrêt : « Ajouter un circuit / un cycle » disponibles (B.6)", async () => {
    await renderComposition({
      ...flatDraft(),
      exercises: [exercise("a"), exercise("b", "IN_TOUR"), exercise("c", "AFTER_TOUR")],
      stopPoints: [{ id: "p1", scope: "BEFORE_TOUR", position: 1 }],
    });
    openMenu();
    expect(screen.getByTestId("composition-add-activity-tree-circuit").props.accessibilityState).toEqual({ disabled: false });
    expect(screen.getByTestId("composition-add-activity-tree-cycle").props.accessibilityState).toEqual({ disabled: false });
  });
});

describe("B.2 — Séance sans Circuit (D-451, COMP §1)", () => {
  it("une nouvelle Séance n'affiche aucun Circuit, vide ou non", async () => {
    await renderComposition(createEmptyDraft());
    expect(screen.queryByTestId("composition-tour-section", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-circuit-header", hidden)).toBeNull();
  });

  it("Exercices avant et après un Circuit vide : une seule séquence, sans en-tête de Circuit", async () => {
    await renderComposition({ ...flatDraft(), exercises: [exercise("a"), exercise("c", "AFTER_TOUR")] });
    expect(screen.queryByTestId("composition-tour-section", hidden)).toBeNull();
    const ids = screen.getAllByTestId(/^composition-exercise-row-/, hidden).map((node) => node.props.testID);
    expect(ids).toEqual(["composition-exercise-row-a", "composition-exercise-row-c"]);
  });
});

describe("B.2 — mode enveloppe (ARB-06 ; Figma 10819:20344, 10836:20478)", () => {
  it("« Ajouter un circuit » : contenus éligibles désignables, Confirmer indisponible tant que rien n'est désigné, autres commandes inactives", async () => {
    await renderComposition(flatDraft());
    openMenu();
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-circuit"));

    expect(screen.queryByTestId("composition-add-activity-tree")).toBeNull();
    expect(screen.queryByTestId("composition-save-action")).toBeNull();
    const confirm = screen.getByTestId("composition-envelope-bar-confirm");
    expect(confirm.props.accessibilityLabel).toBe(t.confirmCircuit);
    expect(confirm.props.accessibilityState).toEqual({ disabled: true });
    for (const id of ["a", "b", "c"]) {
      const target = screen.getByTestId(`composition-envelope-exercise-${id}-target`);
      expect(target.props.accessibilityLabel).toBe(`Envelopper Exercice ${id} dans le circuit`);
      expect(target.props.accessibilityState).toEqual({ selected: false });
    }
    // Cartes, en-tête de contexte et bornes : inactifs.
    expect(screen.getByTestId("composition-envelope-context-header", hidden).props.pointerEvents).toBe("none");
    expect(screen.getByTestId("composition-boundary-countdown-placement", hidden).props.pointerEvents).toBe("none");
    fireEvent.press(screen.getByTestId("composition-exercise-row-a", hidden));
    expect(mockPush).not.toHaveBeenCalled();

    // Toucher désigne. [B.2 : « un autre toucher déplace la désignation (une seule) » — remplacé par
    // B.4b (sélection multiple, CompositionScreen.b4b.test.tsx) : un second toucher du même contenu le retire.]
    fireEvent.press(screen.getByTestId("composition-envelope-exercise-a-target"));
    fireEvent.press(screen.getByTestId("composition-envelope-exercise-a-target"));
    fireEvent.press(screen.getByTestId("composition-envelope-exercise-b-target"));
    expect(screen.getByTestId("composition-envelope-exercise-a-target").props.accessibilityState).toEqual({ selected: false });
    expect(screen.getByTestId("composition-envelope-exercise-b-target").props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId("composition-envelope-bar-confirm").props.accessibilityState).toEqual({ disabled: false });
  });

  it("Confirmer le circuit : le Circuit naît autour de l'Exercice désigné (ancien modèle), zones du brouillon mises à jour", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-b");

    expect(screen.queryByTestId("composition-envelope-bar")).toBeNull();
    expect(screen.getByTestId("composition-save-action")).toBeTruthy();
    const section = screen.getByTestId("composition-tour-section");
    expect(within(section).getByTestId("composition-circuit-header")).toBeTruthy();
    expect(within(section).getByTestId("composition-exercise-row-b")).toBeTruthy();
    expect(within(section).queryByTestId("composition-exercise-row-a")).toBeNull();
    const positions = Object.fromEntries(probe.draft!.exercises.map((item) => [item.id, item.structuralPosition]));
    expect(positions).toEqual({ a: "BEFORE_TOUR", b: "IN_TOUR", c: "AFTER_TOUR" });
    expect(probe.draft!.tourRepeatCount).toBe(1);
    expect(probe.draft!.circuitNature).toBe("TOURS");
    expect(structureCircuits(probe.draft!.structure!).map((circuit) => circuit.exercises)).toEqual([["b"]]);
  });

  it("un second Circuit fait passer la Composition au rendu général : Circuit A et Circuit B", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-a");
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-c");

    expect(screen.queryByTestId("composition-tour-section", hidden)).toBeNull();
    const circuits = structureCircuits(probe.draft!.structure!);
    expect(circuits.map((circuit) => circuit.exercises)).toEqual([["a"], ["c"]]);
    const [first, second] = circuits;
    expect(screen.getByTestId(`composition-layout-circuit-${first!.id}-header-title`, hidden).props.children).toBe("Circuit A");
    expect(screen.getByTestId(`composition-layout-circuit-${second!.id}-header-title`, hidden).props.children).toBe("Circuit B");
    expect(within(screen.getByTestId(`composition-layout-circuit-${second!.id}`)).getByTestId("composition-exercise-row-c")).toBeTruthy();
  });

  it("« Ajouter un cycle » autour du Circuit : le Circuit est un bloc éligible ; le Cycle naît autour de lui", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-b");
    openMenu();
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-cycle"));
    // Exercices du niveau Séance et Circuit éligibles ; l'Exercice du Circuit ne l'est pas.
    expect(screen.getByTestId("composition-envelope-bar-confirm").props.accessibilityLabel).toBe(t.confirmCycle);
    expect(screen.getByTestId("composition-envelope-exercise-a-target")).toBeTruthy();
    expect(screen.queryByTestId("composition-envelope-exercise-b-target")).toBeNull();
    const circuitTarget = screen.getByTestId("composition-envelope-circuit-target");
    expect(circuitTarget.props.accessibilityLabel).toBe("Envelopper le circuit dans le cycle");
    fireEvent.press(circuitTarget);
    fireEvent.press(screen.getByTestId("composition-envelope-bar-confirm"));
    await act(async () => undefined);

    const cycle = probe.draft!.structure!.elements.find((element) => element.kind === "CYCLE");
    expect(cycle?.kind).toBe("CYCLE");
    if (cycle?.kind !== "CYCLE") return;
    expect(cycle.cycle.repeatCount).toBe(1);
    expect(cycle.cycle.members.map((member) => member.kind)).toEqual(["CIRCUIT"]);
    const block = screen.getByTestId(`composition-layout-cycle-${cycle.cycle.id}`);
    expect(within(block).getByTestId("composition-exercise-row-b")).toBeTruthy();
    expect(within(block).queryByTestId("composition-exercise-row-a")).toBeNull();
  });

  it("disposition générale : un Exercice d'un Cycle est éligible pour un Circuit ; un Circuit d'un Cycle ne l'est pas pour un Cycle", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CYCLE", "composition-envelope-exercise-a");
    openMenu();
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-circuit"));
    expect(screen.getByTestId("composition-envelope-exercise-a-target")).toBeTruthy();
    fireEvent.press(screen.getByTestId("composition-envelope-exercise-a-target"));
    fireEvent.press(screen.getByTestId("composition-envelope-bar-confirm"));
    await act(async () => undefined);

    const cycle = probe.draft!.structure!.elements.find((element) => element.kind === "CYCLE");
    if (cycle?.kind !== "CYCLE") throw new Error("Cycle absent");
    expect(cycle.cycle.members.map((member) => member.kind)).toEqual(["CIRCUIT"]);
    openMenu();
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-cycle"));
    const inner = cycle.cycle.members[0]!;
    if (inner.kind !== "CIRCUIT") throw new Error("Circuit absent");
    expect(screen.queryByTestId(`composition-envelope-circuit-${inner.circuit.id}-target`)).toBeNull();
    expect(screen.getByTestId("composition-envelope-exercise-b-target")).toBeTruthy();
  });

  it("Annuler (et le X) : sortie sans aucune mutation du brouillon", async () => {
    await renderComposition(flatDraft());
    const before = probe.draft;
    openMenu();
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-circuit"));
    fireEvent.press(screen.getByTestId("composition-envelope-exercise-b-target"));
    fireEvent.press(screen.getByTestId("composition-envelope-bar-cancel"));
    expect(screen.queryByTestId("composition-envelope-bar")).toBeNull();
    expect(screen.getByTestId("composition-save-action")).toBeTruthy();
    expect(probe.draft).toBe(before);
    expect(screen.queryByTestId("composition-tour-section")).toBeNull();
    expect(screen.queryByTestId("composition-envelope-exercise-b-target")).toBeNull();
  });
});

/**
 * Contre-recette iPhone du 30/10 (Hermann) — « le cadre avec liseré bleu n'entoure pas correctement
 * le circuit » ; « à la validation il faut que le cycle apparaisse progressivement ».
 */
describe("contre-recette du 30/10 — cadre du Circuit et apparition du Cycle", () => {
  it("the envelope frame of a Circuit follows its left and right edges (outset 16) and its radius (18)", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-b");
    openMenu();
    fireEvent.press(screen.getByTestId("composition-add-activity-tree-cycle"));
    const frame = StyleSheet.flatten(screen.getByTestId("composition-envelope-circuit-target").props.style);
    expect(frame).toMatchObject({ position: "absolute", top: 0, bottom: 0, left: -16, right: -16, borderRadius: 18 });
    // Le Circuit déborde de 16 de sa boîte : même valeur que le cadre.
    expect(StyleSheet.flatten(screen.getByTestId("composition-tour-section", hidden).props.style)).toMatchObject({ marginHorizontal: -16 });
    // Une carte garde le cadre à ses bords (aucun débord).
    expect(StyleSheet.flatten(screen.getByTestId("composition-envelope-exercise-a-target").props.style)).toMatchObject({ left: 0, right: 0 });
  });

  it("the Cycle posed by « Confirmer le cycle » fades in (surface, ring, header); a Cycle already there does not", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CYCLE", "composition-envelope-exercise-a");
    const cycle = probe.draft!.structure!.elements.find((element) => element.kind === "CYCLE");
    if (cycle?.kind !== "CYCLE") throw new Error("Cycle absent");
    const id = `composition-layout-cycle-${cycle.cycle.id}`;
    expect(screen.getByTestId(`${id}-surface`, hidden).props.entering).toBeTruthy();
    expect(screen.getByTestId(`${id}-rail-outer-ring`, hidden).props.entering).toBeTruthy();
    expect(screen.getByTestId(`${id}-header-reveal`, hidden).props.entering).toBeTruthy();
    // Aplat du Cycle porté par la couche qui apparaît.
    expect(StyleSheet.flatten(screen.getByTestId(`${id}-surface`, hidden).props.style)).toMatchObject({ backgroundColor: "#E0E2EF", borderRadius: 18 });

    const saved = probe.draft!;
    screen.unmount();
    await renderComposition(saved);
    expect(screen.getByTestId(`${id}-surface`, hidden).props.entering).toBeUndefined();
    expect(screen.getByTestId(`${id}-header-reveal`, hidden).props.entering).toBeUndefined();
  });
});

/**
 * Contre-recette iPhone du 30/10 (Hermann) — obs-3 : « Réduire la marge entre le bord bas du cadre
 * d'un exercice et le bord du circuit ou d'un cycle ; le bord bas du cadre d'un circuit et le bord du
 * cycle » (égale à celle entre le bas du gabarit photo et le cadre de la carte, 8) ; constat b :
 * apparition progressive du Circuit posé ; constat c : carte directement dans un Cycle sans fond
 * blanc rectangulaire.
 */
describe("contre-recette du 30/10 — marges basses, apparition du Circuit, carte dans un Cycle", () => {
  const circuitIdOf = (exerciseId: string): string => {
    const circuit = structureCircuits(probe.draft!.structure!).find((candidate) => candidate.exercises.includes(exerciseId));
    if (circuit === undefined) throw new Error("Circuit absent");
    return circuit.id;
  };
  const cycleId = (): string => {
    const cycle = probe.draft!.structure!.elements.find((element) => element.kind === "CYCLE");
    if (cycle?.kind !== "CYCLE") throw new Error("Cycle absent");
    return cycle.cycle.id;
  };

  it("obs-3 — Circuit: bottom margin 8 under its cards (14 − 6), top margin 14; Cycle: 14 on top, 8 under its last member", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-b");
    // Circuit de l'ancien modèle : marge 14, la liste des cartes déployées en reprend 6.
    expect(StyleSheet.flatten(screen.getByTestId("composition-tour-section", hidden).props.style)).toMatchObject({ paddingVertical: 14 });
    expect(StyleSheet.flatten(screen.getByTestId("composition-zone-in-tour", hidden).props.style)).toMatchObject({ marginBottom: -6 });

    await envelopeAround("CYCLE", "composition-envelope-circuit");
    const cycle = `composition-layout-cycle-${cycleId()}`;
    expect(StyleSheet.flatten(screen.getByTestId(cycle, hidden).props.style)).toMatchObject({ paddingTop: 14, paddingBottom: 8 });
    // Circuit dans le Cycle : 8 sous ses cartes, puis 8 jusqu'au bord du Cycle.
    const circuit = `composition-layout-circuit-${circuitIdOf("b")}`;
    expect(StyleSheet.flatten(screen.getByTestId(circuit, hidden).props.style)).toMatchObject({ paddingVertical: 14 });
    expect(StyleSheet.flatten(screen.getByTestId(`${circuit}-exercises`, hidden).props.style)).toMatchObject({ marginBottom: -6 });
  });

  it("constat b — the first Circuit posed by « Confirmer le circuit » fades in (surface, ring, header); not once saved and reopened", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-b");
    expect(screen.getByTestId("composition-tour-section-reveal", hidden).props.entering).toBeTruthy();
    expect(screen.getByTestId("composition-sequence-marker-circuit-reveal", hidden).props.entering).toBeTruthy();
    expect(screen.getByTestId("composition-circuit-header-reveal", hidden).props.entering).toBeTruthy();
    // L'aplat (statique tant que le Circuit n'est pas mesuré) est dans la couche qui apparaît.
    const layer = screen.getByTestId("composition-tour-section-reveal", hidden);
    expect(StyleSheet.flatten(within(layer).getByTestId("composition-tour-section-static-surface", hidden).props.style)).toMatchObject({
      backgroundColor: "#EBEDF5",
      borderRadius: 18,
    });

    const saved = probe.draft!;
    screen.unmount();
    await renderComposition(saved);
    expect(screen.getByTestId("composition-tour-section-reveal", hidden).props.entering).toBeUndefined();
    expect(screen.getByTestId("composition-circuit-header-reveal", hidden).props.entering).toBeUndefined();
  });

  it("constat b — a second Circuit fades in; the Circuit already there does not", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-b");
    await envelopeAround("CIRCUIT", "composition-envelope-exercise-a");
    const posed = `composition-layout-circuit-${circuitIdOf("a")}`;
    const existing = `composition-layout-circuit-${circuitIdOf("b")}`;
    expect(screen.getByTestId(`${posed}-surface`, hidden).props.entering).toBeTruthy();
    expect(screen.getByTestId(`${posed}-rail-ring-reveal`, hidden).props.entering).toBeTruthy();
    expect(screen.getByTestId(`${posed}-header-reveal`, hidden).props.entering).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId(`${posed}-surface`, hidden).props.style)).toMatchObject({ backgroundColor: "#EBEDF5", borderRadius: 18 });
    expect(screen.getByTestId(`${existing}-surface`, hidden).props.entering).toBeUndefined();
    expect(screen.getByTestId(`${existing}-header-reveal`, hidden).props.entering).toBeUndefined();
  });

  it("constat c — an Exercise card directly in a Cycle: its row has no (square) white background, only the rounded card", async () => {
    await renderComposition(flatDraft());
    await envelopeAround("CYCLE", "composition-envelope-exercise-a");
    const row = within(screen.getByTestId(`composition-layout-cycle-${cycleId()}`, hidden)).getByTestId("composition-activity-a", hidden);
    expect(StyleSheet.flatten(row.props.style).backgroundColor).toBe("transparent");
  });
});

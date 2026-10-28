import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Activity } from "@/domain/sessions/Session";
import type { StructureCircuit, StructureElement } from "@/domain/sessions/structure";
import { SessionCatalogueList } from "@/features/sessions/SessionCatalogueList";
import { compositionAccessibilityText, SessionCompositionTree, treeLineLabel } from "@/features/sessions/SessionCompositionTree";
import { projectSessionForCatalogue } from "@/features/sessions/sessionCatalogueProjection";

/**
 * PRE-8 (epic E, story E.3) — déploiement structuré de la composition (spécification du 27/10 §2,
 * `6214:3696`) : lignes de conteneurs, décalage de 16 par niveau, filets verticaux, récupérations
 * grisées, chevron seul contrôle, aucune ouverture ni écriture.
 */

let sequence = 0;
const exercise = (name: string, overrides: Partial<Activity> = {}): Activity => ({
  id: `ex-${++sequence}`,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  position: 0,
  name,
  executionParameters: durationParameters(45),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: [],
  categoryId: null,
  media: [],
  ...overrides,
});
const circuit = (id: string, exercises: readonly Activity[], repeatCount: number): StructureCircuit<Activity> => ({
  id,
  repeatCount,
  nature: "TOURS",
  exercises,
});

const projection = (id: string, elements: readonly StructureElement<Activity>[]) =>
  projectSessionForCatalogue(
    {
      id,
      name: `Séance ${id}`,
      color: "#3B82F6",
      labelId: null,
      status: "ACTIVE",
      archivedAt: null,
      updatedAt: "2026-10-28T08:00:00.000Z",
      structure: { elements, stopPoints: [] },
    },
    new Map(),
  );

const knee = () =>
  projection("genou", [
    { kind: "EXERCISE", exercise: exercise("Mobilisation du genou", { id: "warm" }) },
    {
      kind: "CYCLE",
      cycle: {
        id: "cy",
        repeatCount: 2,
        circuits: [
          circuit("c1", [
            exercise("Squat assisté", { id: "sq", executionParameters: repetitionParameters(12, 3) }),
            exercise("Extension de jambe", { id: "ext", executionParameters: durationParameters(45, 2), postActivityRecoverySeconds: 60 }),
          ], 3),
        ],
      },
    },
    { kind: "EXERCISE", exercise: exercise("Étirement ischio-jambiers", { id: "cool", executionParameters: durationParameters(30) }) },
  ]);

describe("PRE-8 E.3 — arbre rendu", () => {
  it("lignes de conteneurs sans valeur, noms et volumes, récupération grisée à sa position", () => {
    render(<SessionCompositionTree tree={knee().tree} testID="tree" />);
    expect(screen.getByTestId("tree-divider")).toBeTruthy();
    expect(screen.getByTestId("tree-line-cy")).toHaveTextContent("Cycle · 2 répétitions");
    expect(screen.getByTestId("tree-line-c1")).toHaveTextContent("Circuit · 3 tours");
    expect(screen.getByTestId("tree-line-sq")).toHaveTextContent("Squat assisté3 × 12 rép.");
    expect(screen.getByTestId("tree-line-ext:recovery")).toHaveTextContent("Récupération1 min");
    const recoveryName = screen.getByText("Récupération");
    expect(StyleSheet.flatten(recoveryName.props.style).color).toBe("#80858C");
  });

  it("décalage de 16 par niveau et un filet vertical par conteneur englobant ; deux décalages au plus", () => {
    render(<SessionCompositionTree tree={knee().tree} testID="tree" />);
    const padding = (key: string) => StyleSheet.flatten(screen.getByTestId(`tree-line-${key}`).props.style).paddingLeft;
    expect(padding("warm")).toBe(0);
    expect(padding("cy")).toBe(0);
    expect(padding("c1")).toBe(16);
    expect(padding("sq")).toBe(32);
    expect(screen.getByTestId("tree-line-sq-rail-1")).toBeTruthy();
    expect(screen.getByTestId("tree-line-sq-rail-2")).toBeTruthy();
    expect(screen.queryByTestId("tree-line-sq-rail-3")).toBeNull();
    expect(screen.queryByTestId("tree-line-warm-rail-1")).toBeNull();
  });

  it("conteneur trivial masqué : son exercice est listé directement", () => {
    const tree = projection("t", [
      { kind: "CIRCUIT", circuit: circuit("solo", [exercise("Gainage", { id: "g" })], 1) },
      { kind: "EXERCISE", exercise: exercise("Pompes", { id: "p" }) },
    ]).tree;
    render(<SessionCompositionTree tree={tree} testID="tree" />);
    expect(screen.queryByTestId("tree-line-solo")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("tree-line-g").props.style).paddingLeft).toBe(0);
  });

  it("libellés au singulier et nature Séries du Circuit", () => {
    expect(treeLineLabel({ kind: "CYCLE", key: "c", depth: 0, repeatCount: 1 }).name).toBe("Cycle · 1 répétition");
    expect(treeLineLabel({ kind: "CIRCUIT", key: "c", depth: 0, repeatCount: 4, nature: "SERIES" }).name).toBe("Circuit · 4 séries");
  });

  it("texte d'accessibilité de la composition", () => {
    expect(compositionAccessibilityText(knee().tree)).toMatch(/^Composition de la séance : Mobilisation du genou 45 s, Cycle · 2 répétitions, Circuit · 3 tours/);
  });
});

describe("PRE-8 E.3 — déploiement dans la liste", () => {
  const renderList = (onOpen = jest.fn()) => {
    render(<SessionCatalogueList sessions={[knee(), projection("seul", [{ kind: "EXERCISE", exercise: exercise("Pompes") }])]} emptyMessage={null} onOpenSession={onOpen} />);
    return onOpen;
  };

  it("replié par défaut ; le chevron déploie et replie, sans ouvrir la Séance", () => {
    const onOpen = renderList();
    expect(screen.queryByTestId("session-card-genou-composition")).toBeNull();
    fireEvent.press(screen.getByTestId("session-card-genou-disclosure"));
    expect(screen.getByTestId("session-card-genou-composition")).toBeTruthy();
    expect(screen.getByTestId("session-card-genou-disclosure").props.accessibilityState).toEqual({ expanded: true });
    fireEvent.press(screen.getByTestId("session-card-genou-disclosure"));
    expect(screen.queryByTestId("session-card-genou-composition")).toBeNull();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("une Séance d'un seul exercice n'a rien à déployer", () => {
    renderList();
    expect(screen.queryByTestId("session-card-seul-disclosure")).toBeNull();
    expect(screen.getByTestId("session-card-seul-open").props.accessibilityActions).toBeUndefined();
  });

  it("VoiceOver : action nommée de déploiement, état annoncé, composition ajoutée au nom", () => {
    renderList();
    const card = screen.getByTestId("session-card-genou-open");
    expect(card.props.accessibilityState).toEqual({ expanded: false });
    expect(card.props.accessibilityActions).toEqual([{ name: "toggleComposition", label: "Afficher la composition de Séance genou" }]);
    fireEvent(card, "accessibilityAction", { nativeEvent: { actionName: "toggleComposition" } });
    const expandedCard = screen.getByTestId("session-card-genou-open");
    expect(expandedCard.props.accessibilityState).toEqual({ expanded: true });
    expect(expandedCard.props.accessibilityLabel).toContain("Composition de la séance : Mobilisation du genou 45 s");
  });

  it("toucher la carte ouvre la Séance ; le chevron n'ouvre rien", () => {
    const onOpen = renderList();
    fireEvent.press(screen.getByTestId("session-card-genou-open"));
    expect(onOpen).toHaveBeenCalledWith("genou");
  });
});

describe("PRE-8 E.3 — animations", () => {
  const { act } = jest.requireActual<typeof import("@testing-library/react-native")>("@testing-library/react-native");
  const { AccessibilityInfo } = jest.requireActual<typeof import("react-native")>("react-native");

  const reveal = async (reduce: boolean) => {
    const spy = jest.spyOn(AccessibilityInfo, "isReduceMotionEnabled").mockResolvedValue(reduce);
    render(<SessionCatalogueList sessions={[knee()]} emptyMessage={null} onOpenSession={() => undefined} />);
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.press(screen.getByTestId("session-card-genou-disclosure"));
    const frame = screen.getByTestId("session-card-genou-composition");
    spy.mockRestore();
    return frame;
  };

  it("déploiement révélé par l'animation commune de mise en page", async () => {
    expect((await reveal(false)).props.entering).toBeDefined();
  });

  it("« Réduire les animations » : aucune animation", async () => {
    expect((await reveal(true)).props.entering).toBeUndefined();
  });
});

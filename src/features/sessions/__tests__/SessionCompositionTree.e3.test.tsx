import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { StyleSheet } from "react-native";

import { durationParameters, repetitionParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Activity } from "@/domain/sessions/Session";
import type { StructureCircuit, StructureElement } from "@/domain/sessions/structure";
import { SessionCatalogueList } from "@/features/sessions/SessionCatalogueList";
import type { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { compositionAccessibilityText, SessionCompositionTree, treeLineLabel } from "@/features/sessions/SessionCompositionTree";
import { projectSessionForCatalogue } from "@/features/sessions/sessionCatalogueProjection";

/**
 * PRE-8 (epic E, story E.3) — déploiement structuré de la composition (spécification du 27/10 §2,
 * `6214:3696`) : lignes de conteneurs, décalage de 16 par niveau, filets verticaux, récupérations
 * grisées, chevron seul contrôle, aucune ouverture ni écriture.
 */

/** La liste porte le cycle de vie (E.5) : un service fictif, jamais appelé par le déploiement. */
const inertService = new Proxy({}, { get: () => jest.fn() }) as unknown as SessionService;
const withService = (element: ReactElement) => <SessionServiceContext.Provider value={inertService}>{element}</SessionServiceContext.Provider>;

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
        members: [
          circuit("c1", [
            exercise("Squat assisté", { id: "sq", executionParameters: repetitionParameters(12, 3) }),
            exercise("Extension de jambe", { id: "ext", executionParameters: durationParameters(45, 2), postActivityRecoverySeconds: 60 }),
          ], 3),
        ].map((circuit) => ({ kind: "CIRCUIT" as const, circuit })),
      },
    },
    { kind: "EXERCISE", exercise: exercise("Étirement ischio-jambiers", { id: "cool", executionParameters: durationParameters(30) }) },
  ]);

describe("PRE-8 E.3 — arbre rendu", () => {
  it("lignes de conteneurs sans valeur, noms et volumes, récupération grisée à sa position", () => {
    render(<SessionCompositionTree tree={knee().tree} testID="tree" />);
    expect(screen.getByTestId("tree-divider")).toBeTruthy();
    // D-507 (Hermann, 06/11/2026) : « Cycle » + « N passages » à droite, « Circuit · séries groupées »
    // + « N tours » à droite. [Avant : « Cycle · 2 passages », « Circuit · 3 tours · groupées » — remplacé.]
    expect(screen.getByTestId("tree-line-cy")).toHaveTextContent("Cycle2 passages");
    expect(screen.getByTestId("tree-line-c1")).toHaveTextContent("Circuit · séries groupées3 tours");
    expect(screen.getByTestId("tree-line-sq")).toHaveTextContent("Squat assisté3 × 12 rép.");
    expect(screen.getByTestId("tree-line-ext:recovery")).toHaveTextContent("Récupération1′00″");
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

  // D-507 (Hermann, 06/11/2026 ; KODJO-Catalogues-cartes-modales-2026-11-06 §6) : la valeur passe à droite.
  it("libellés au singulier ; Cycle « N passages » et Circuit « séries groupées|alternées » + « N tours » à droite (D-507)", () => {
    expect(treeLineLabel({ kind: "CYCLE", key: "c", depth: 0, repeatCount: 1 })).toEqual({ name: "Cycle", value: "1 passage" });
    expect(treeLineLabel({ kind: "CYCLE", key: "c", depth: 0, repeatCount: 3 })).toEqual({ name: "Cycle", value: "3 passages" });
    expect(treeLineLabel({ kind: "CIRCUIT", key: "c", depth: 0, repeatCount: 4, nature: "SERIES" })).toEqual({
      name: "Circuit · séries alternées",
      value: "4 tours",
    });
    expect(treeLineLabel({ kind: "CIRCUIT", key: "c", depth: 0, repeatCount: 1, nature: "TOURS" })).toEqual({
      name: "Circuit · séries groupées",
      value: "1 tour",
    });
  });

  it("volumes écrits comme dans la Composition : « rép. », jamais « reps » (D-507)", () => {
    const tree = knee().tree;
    expect(treeLineLabel(tree.find((line) => line.key === "sq")!).value).toBe("3 × 12 rép.");
    expect(treeLineLabel(tree.find((line) => line.key === "ext")!).value).toBe("2 × 45″");
    expect(compositionAccessibilityText(tree)).not.toMatch(/reps/);
  });

  it("plusieurs cycles dans une même Séance (écran d'essai `11727:467`)", () => {
    const tree = projection("cycles", [
      { kind: "CYCLE", cycle: { id: "cy1", repeatCount: 2, members: [{ kind: "EXERCISE", exercise: exercise("A", { id: "a" }) }, { kind: "EXERCISE", exercise: exercise("B", { id: "b" }) }] } },
      { kind: "CYCLE", cycle: { id: "cy2", repeatCount: 3, members: [{ kind: "EXERCISE", exercise: exercise("C", { id: "c" }) }] } },
    ]).tree;
    render(<SessionCompositionTree tree={tree} testID="tree" />);
    expect(screen.getByTestId("tree-line-cy1")).toHaveTextContent("Cycle2 passages");
    expect(screen.getByTestId("tree-line-cy2")).toHaveTextContent("Cycle3 passages");
    expect(StyleSheet.flatten(screen.getByTestId("tree-line-c").props.style).paddingLeft).toBe(16);
  });

  it("texte d'accessibilité de la composition", () => {
    expect(compositionAccessibilityText(knee().tree)).toMatch(
      /^Composition de la séance : Mobilisation du genou 45″, Cycle 2 passages, Circuit · séries groupées 3 tours/,
    );
  });
});

/**
 * D-602 (Hermann, 25/11/2026 ; DSF Carte de séance § 4) : plus de synthèse dépliée dans la liste — toucher la carte (hors
 * Démarrer) ouvre la composition de la séance ; Démarrer garde sa cible propre. [PRE-8 E.3 et D-504 : chevron et zone
 * centrale déploient la composition, animations de déploiement — remplacés le 25/11/2026 ; l'arbre ci-dessus reste le
 * contenu de la variante Déployée conservée.]
 */
describe("D-602 — toucher la carte ouvre la composition", () => {
  const renderList = (onOpen = jest.fn()) => {
    render(withService(<SessionCatalogueList sessions={[knee(), projection("seul", [{ kind: "EXERCISE", exercise: exercise("Pompes") }])]} emptyMessage={null} onOpenSession={onOpen} />));
    return onOpen;
  };

  it("aucun chevron ni composition déployée dans la liste", () => {
    renderList();
    expect(screen.queryByTestId("session-card-genou-disclosure")).toBeNull();
    expect(screen.queryByTestId("session-card-genou-composition")).toBeNull();
    expect(screen.queryByTestId("session-card-genou-expanded-open")).toBeNull();
  });

  it("toucher la carte ou le visuel ouvre la Séance", () => {
    const onOpen = renderList();
    fireEvent.press(screen.getByTestId("session-card-seul-swipe-card"));
    expect(onOpen).toHaveBeenLastCalledWith("seul");
    fireEvent.press(screen.getByTestId("session-card-genou-visual-open"));
    expect(onOpen).toHaveBeenLastCalledWith("genou");
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it("Démarrer n'ouvre pas la Séance", () => {
    const onOpen = renderList();
    fireEvent.press(screen.getByTestId("session-card-genou-start"));
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("VoiceOver : activer la carte ouvre la Séance ; aucune action de déploiement", () => {
    const onOpen = renderList();
    const card = screen.getByTestId("session-card-genou-swipe-card");
    const actions = (card.props.accessibilityActions ?? []) as { name: string }[];
    expect(actions.map((action) => action.name)).not.toContain("toggleComposition");
    expect(card.props.accessibilityHint).toBe("Modifier la séance");
    // Activation VoiceOver = toucher de la carte (Pressable) : même chemin que le test précédent.
    fireEvent.press(card);
    expect(onOpen).toHaveBeenCalledWith("genou");
  });

  it("nom accessible : nom, durée, formats (« Libre »), mouvements", () => {
    renderList();
    const label = screen.getByTestId("session-card-genou-swipe-card").props.accessibilityLabel as string;
    expect(label).toContain("Séance genou");
    expect(label).toContain("Libre");
    expect(label).toContain("Mobilisation du genou, Squat assisté, Extension de jambe");
    expect(label).not.toContain("1 circuit · 4 exercices");
  });
});

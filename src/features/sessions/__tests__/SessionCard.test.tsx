import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import { durationParameters, repetitionParameters, uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import type { Activity } from "@/domain/sessions/Session";
import type { CatalogueSessionRecord } from "@/domain/sessions/SessionRepository";
import type { StructureElement } from "@/domain/sessions/structure";
import { fitCategoryCount, SessionCard } from "@/features/sessions/SessionCard";
import { projectSessionForCatalogue, type CatalogueCategoryRef } from "@/features/sessions/sessionCatalogueProjection";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-8 (epic E, story E.2) — carte unique du Catalogue des séances (spécification du 27/10 §1 et §3 ;
 * `6214:3572`, `6214:3625`). Remplace les tests de l'ancienne carte condensée (barre de couleur,
 * zones et étiquette sur la carte, chevron encadré à droite), dispositions retirées par la
 * spécification.
 */

const CATEGORIES = new Map<string, CatalogueCategoryRef>([
  ["renfo", { id: "renfo", name: "Renforcement", color: "#E5484D" }],
  ["mobilite", { id: "mobilite", name: "Mobilité", color: "#2E9B62" }],
  ["cardio", { id: "cardio", name: "Cardio", color: "#3B82F6" }],
]);

let sequence = 0;
const exercise = (overrides: Partial<Activity> = {}): Activity => ({
  id: `ex-${++sequence}`,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  position: 0,
  name: "Squat assisté",
  executionParameters: durationParameters(90, 3),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: ["genoux"],
  categoryId: "renfo",
  media: [],
  ...overrides,
});

const projection = (elements: readonly StructureElement<Activity>[], overrides: Partial<CatalogueSessionRecord> = {}) =>
  projectSessionForCatalogue(
    {
      id: "s1",
      name: "Renforcement du genou",
      color: "#F7D154",
      labelId: "lbl-hyrox",
      status: "ACTIVE",
      archivedAt: null,
      updatedAt: "2026-10-28T08:00:00.000Z",
      structure: { elements, stopPoints: [] },
      ...overrides,
    },
    CATEGORIES,
  );

const one = () => projection([{ kind: "EXERCISE", exercise: exercise() }]);
const many = () =>
  projection([
    { kind: "EXERCISE", exercise: exercise({ categoryId: "renfo" }) },
    { kind: "EXERCISE", exercise: exercise({ categoryId: "mobilite", executionParameters: repetitionParameters(10, 2) }) },
  ]);

describe("PRE-8 E.2 — carte unique", () => {
  // [« aucun chevron » pour un exercice — remplacé le 03/11/2026] Recette iPhone n° 3 du 03/11/2026
  // (autres constats, Hermann : « toutes les séances, même celles avec un seul exercice doivent avoir
  // un chevron et une vue déployée. »).
  it("un exercice : volume en synthèse, chevron, Lecture présente et indisponible", () => {
    render(<SessionCard projection={one()} />);
    expect(screen.getByTestId("session-card-s1-name")).toHaveTextContent("Renforcement du genou");
    expect(screen.getByTestId("session-card-s1-summary")).toHaveTextContent("3 × 1 min 30 s");
    expect(screen.getByTestId("session-card-s1-disclosure").props.accessibilityState).toEqual({ expanded: false });
    const play = screen.getByTestId("session-card-s1-play");
    expect(play.props.accessibilityLabel).toBe("Lancer la séance — indisponible");
    expect(play.props.accessibilityState).toEqual({ disabled: true });
  });

  it("plusieurs exercices : « N exercices », chevron accolé au nom, annoncé fermé", () => {
    const onToggle = jest.fn();
    render(<SessionCard projection={many()} onToggleExpanded={onToggle} />);
    expect(screen.getByTestId("session-card-s1-summary")).toHaveTextContent("2 exercices");
    const disclosure = screen.getByTestId("session-card-s1-disclosure");
    expect(disclosure.props.accessibilityState).toEqual({ expanded: false });
    expect(disclosure.props.accessibilityLabel).toBe("Afficher la composition de Renforcement du genou");
    fireEvent.press(disclosure);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("chevron pivoté et annoncé ouvert une fois déployé", () => {
    render(<SessionCard projection={many()} expanded onToggleExpanded={() => undefined} />);
    expect(screen.getByTestId("session-card-s1-disclosure").props.accessibilityState).toEqual({ expanded: true });
    expect(screen.getByTestId("session-card-s1-chevron-open")).toBeTruthy();
  });

  it("jamais « 1 exercice » ; « 0 exercice » pour une Séance vide (Q-E6)", () => {
    render(<SessionCard projection={projection([])} />);
    expect(screen.getByTestId("session-card-s1-summary")).toHaveTextContent("0 exercice");
  });

  it("catégories dédupliquées, ni étiquette ni zone ni barre de couleur sur la carte", () => {
    render(<SessionCard projection={many()} />);
    expect(screen.getByTestId("session-card-s1-categories-label")).toHaveTextContent("Renforcement · Mobilité");
    expect(screen.queryByText(/genoux/i)).toBeNull();
    expect(screen.queryByText(/hyrox/i)).toBeNull();
    expect(screen.queryByTestId("session-card-color-bar")).toBeNull();
  });

  it("durée : minutes et secondes sans arrondi (D-391), ≥ pour une borne minimale", () => {
    render(<SessionCard projection={many()} />);
    expect(screen.getByTestId("session-card-s1-duration").props.children).toMatch(/^≥ /);
  });

  it("visuel : vignette Libre sans photo, photo de l'exercice sinon", () => {
    const { unmount } = render(<SessionCard projection={one()} />);
    expect(screen.getByTestId("session-card-s1-format-FREE")).toBeTruthy();
    unmount();
    const asset = { id: "a1", kind: "IMAGE", uri: "media/a1.jpg", mimeType: "image/jpeg" } as unknown as MediaAsset;
    render(
      <SessionCard
        projection={projection([
          { kind: "EXERCISE", exercise: exercise({ media: [{ id: "l1", activityId: "x", assetId: "a1", position: 0, asset }] }) },
        ])}
      />,
    );
    expect(screen.getByTestId("session-card-s1-photo")).toBeTruthy();
  });

  it("carte archivée : aucune action directe, texte jusqu'à la marge", () => {
    render(<SessionCard projection={projection([{ kind: "EXERCISE", exercise: exercise() }], { status: "ARCHIVED", archivedAt: "x" })} />);
    expect(screen.queryByTestId("session-card-s1-play")).toBeNull();
    const card = StyleSheet.flatten(screen.getByTestId("session-card-s1").props.style);
    expect(card.borderColor).toBe("#D9D9D9");
  });

  it("mesures du gabarit : visuel 64 à 8 du bord, Lecture cible 48 à 8 du bord, rayon 12, bordure 0,5", () => {
    render(<SessionCard projection={one()} />);
    const card = StyleSheet.flatten(screen.getByTestId("session-card-s1").props.style);
    expect(card).toMatchObject({ borderRadius: 12, borderWidth: 0.5, borderColor: "#CCD1E0", backgroundColor: "#F9FAFC" });
    const play = StyleSheet.flatten(screen.getByTestId("session-card-s1-play").props.style);
    expect(play).toMatchObject({ width: 48, height: 48, right: 7.5 });
  });

  it("le toucher de Lecture est intercepté et n'ouvre rien", () => {
    const onOpen = jest.fn();
    render(<SessionCard projection={one()} onOpen={onOpen} />);
    expect(() => fireEvent.press(screen.getByTestId("session-card-s1-play"))).not.toThrow();
    expect(onOpen).not.toHaveBeenCalled();
  });

  // Recette iPhone n° 3 du 03/11/2026 (autres constats, Hermann : « l'appui sur la photo ou l'appui
  // sur la zone déployée ouvre la séance en modification, l'appui sur le reste de la carte (dont le
  // chevron) déploie la séance. »).
  it("un exercice déployé : le visuel et la zone déployée ouvrent, le chevron déploie", () => {
    const onOpen = jest.fn();
    const onToggle = jest.fn();
    render(
      <SessionCard projection={one()} expanded onToggleExpanded={onToggle} onOpen={onOpen}>
        <Text testID="composition">Composition</Text>
      </SessionCard>,
    );
    expect(screen.getByTestId("session-card-s1-chevron-open")).toBeTruthy();
    fireEvent.press(screen.getByTestId("session-card-s1-visual-open"));
    fireEvent.press(screen.getByTestId("composition"));
    expect(onOpen).toHaveBeenCalledTimes(2);
    fireEvent.press(screen.getByTestId("session-card-s1-disclosure"));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it("Séance vide : chevron aussi ; repliée, aucune zone déployée", () => {
    render(<SessionCard projection={projection([])} onOpen={() => undefined} />);
    expect(screen.getByTestId("session-card-s1-disclosure")).toBeTruthy();
    expect(screen.queryByTestId("session-card-s1-expanded-open")).toBeNull();
  });
});

describe("PRE-8 E.2 — « +N » sans couper un mot", () => {
  const overflow = (hidden: number) => 20 + hidden;
  it("toutes les catégories tiennent : aucune réduite", () => {
    expect(fitCategoryCount([60, 50], 10, overflow, 200)).toBe(2);
  });
  it("dépassement : noms entiers puis « +N »", () => {
    expect(fitCategoryCount([60, 50, 70], 10, overflow, 150)).toBe(2);
    expect(fitCategoryCount([60, 50, 70], 10, overflow, 100)).toBe(1);
  });
  it("au moins une catégorie", () => {
    expect(fitCategoryCount([300, 50], 10, overflow, 100)).toBe(1);
    expect(fitCategoryCount([], 10, overflow, 100)).toBe(0);
  });
  it("rendu « +N » une fois la largeur mesurée", () => {
    render(
      <SessionCard
        projection={projection([
          { kind: "EXERCISE", exercise: exercise({ categoryId: "renfo" }) },
          { kind: "EXERCISE", exercise: exercise({ categoryId: "mobilite" }) },
          { kind: "EXERCISE", exercise: exercise({ categoryId: "cardio" }) },
        ])}
      />,
    );
    const layout = (width: number) => ({ nativeEvent: { layout: { width, height: 15, x: 0, y: 0 } } });
    const prefix = "session-card-s1-categories";
    // Conteneur 130 ; noms 80, 50, 40 ; séparateur 10 ; « +1 » 20, « +2 » 22.
    fireEvent(screen.getByTestId(`${prefix}-texts`), "layout", layout(130));
    for (const [id, width] of [["name-0", 80], ["name-1", 50], ["name-2", 40], ["separator", 10], ["overflow-1", 20], ["overflow-2", 22]] as const) {
      fireEvent(screen.getByTestId(`${prefix}-measure-${id}`, { includeHiddenElements: true }), "layout", layout(width));
    }
    expect(screen.getByTestId("session-card-s1-categories-label")).toHaveTextContent("Renforcement +2");
  });
});

/**
 * Contre-recette iPhone du 30/10/2026 (Hermann : « Une séance incomplète doit avoir le même format
 * qu'un exercice incomplet (fond rouge liseré rouge) ») : Séance dont un Exercice porte « Paramètres
 * à compléter. » (ici, une phase sans durée) — fond `dangerSurface`, liseré 1 `danger`.
 */
describe("Contre-recette du 30/10 — Séance incomplète", () => {
  const incompleteExercise = () =>
    exercise({
      executionParameters: uniformParameters({ count: 3, target: 30, workPhases: [{ id: 1, label: "Tenir", durationSeconds: 0 }] }),
    });

  it("un Exercice à compléter : fond rouge, liseré rouge de 1 ; le contenu garde sa place", () => {
    const value = projection([{ kind: "EXERCISE", exercise: exercise() }, { kind: "EXERCISE", exercise: incompleteExercise() }]);
    expect(value.incomplete).toBe(true);
    render(<SessionCard projection={value} />);
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1").props.style)).toMatchObject({
      backgroundColor: colors.dangerSurface,
      borderColor: colors.danger,
      borderWidth: 1,
    });
    const play = StyleSheet.flatten(screen.getByTestId("session-card-s1-play").props.style);
    expect(play.right).toBe(7);
  });

  it("Séance complète : carte inchangée", () => {
    const value = one();
    expect(value.incomplete).toBe(false);
    render(<SessionCard projection={value} />);
    const style = StyleSheet.flatten(screen.getByTestId("session-card-s1").props.style);
    expect(style.backgroundColor).toBe(colors.surfaceSubtle);
    expect(style.borderWidth).toBe(0.5);
  });
});

/**
 * PRE-9, contre-recette n° 3 du 31/10/2026 (cr4-verifier, Hermann : « La carte de la séance dans le
 * catalogue de séances doit aussi être orange. ») : Séance dont un Exercice porte « Paramètre à
 * vérifier » (phase marquée, durée renseignée) — carte orange (`toVerifyColors`, liseré 1) ; « à
 * compléter » prime ; marque retirée (feuille ouverte) : carte normale.
 */
describe("Contre-recette n° 3 du 31/10 — Séance « Paramètre à vérifier »", () => {
  const phased = (durationSeconds: number) =>
    uniformParameters({ count: 3, target: 30, workPhases: [{ id: 1, label: "Tenir", durationSeconds }] });
  const toVerifyExercise = () => exercise({ executionParameters: phased(5), phasesToVerify: [1] });

  it("un Exercice à vérifier : fond orange, liseré orange de 1 ; le contenu garde sa place", () => {
    const value = projection([{ kind: "EXERCISE", exercise: exercise() }, { kind: "EXERCISE", exercise: toVerifyExercise() }]);
    expect(value.incomplete).toBe(false);
    expect(value.toVerify).toBe(true);
    render(<SessionCard projection={value} />);
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1").props.style)).toMatchObject({
      backgroundColor: toVerifyColors.surface,
      borderColor: toVerifyColors.border,
      borderWidth: 1,
    });
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1-play").props.style).right).toBe(7);
  });

  it("« à compléter » prime : un Exercice à compléter et un à vérifier → carte rouge", () => {
    const value = projection([
      { kind: "EXERCISE", exercise: toVerifyExercise() },
      { kind: "EXERCISE", exercise: exercise({ executionParameters: phased(0) }) },
    ]);
    expect(value.incomplete).toBe(true);
    expect(value.toVerify).toBe(false);
    render(<SessionCard projection={value} />);
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1").props.style)).toMatchObject({
      backgroundColor: colors.dangerSurface,
      borderColor: colors.danger,
    });
  });

  it("marque retirée (feuille ouverte) : carte normale", () => {
    const value = projection([{ kind: "EXERCISE", exercise: exercise({ executionParameters: phased(5) }) }]);
    expect(value.toVerify).toBe(false);
    render(<SessionCard projection={value} />);
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1").props.style).backgroundColor).toBe(colors.surfaceSubtle);
  });
});

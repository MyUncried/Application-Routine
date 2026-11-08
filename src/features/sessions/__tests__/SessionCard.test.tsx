import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import { durationParameters, repetitionParameters, uniformParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { MediaAsset } from "@/domain/media/MediaAsset";
import type { Activity } from "@/domain/sessions/Session";
import type { CatalogueSessionRecord } from "@/domain/sessions/SessionRepository";
import type { StructureElement } from "@/domain/sessions/structure";
import { fitCategoryCount, formatSessionStructureLine, SESSION_CARD_HEADER_HEIGHT, SessionCard } from "@/features/sessions/SessionCard";
import { projectSessionForCatalogue, type CatalogueCategoryRef } from "@/features/sessions/sessionCatalogueProjection";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";
import { colors, minTouchTarget } from "@/shared/ui/tokens";

/**
 * PRE-8 (epic E, story E.2) — carte unique du Catalogue des séances (spécification du 27/10 §1 et §3 ;
 * `6214:3572`, `6214:3625`). Remplace les tests de l'ancienne carte condensée (barre de couleur,
 * zones et étiquette sur la carte, chevron encadré à droite), dispositions retirées par la
 * spécification.
 */

// D-506 : plus de sablier sur la carte.
const SANDGLASS_ICON = require("../../../../assets/icons/icon-catalogue-sablier.svg");

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

describe("PRE-8 E.2 — carte unique (D-504 à D-506 du 06/11/2026)", () => {
  // [« un exercice : volume en synthèse, Lecture présente et indisponible » — remplacé le 06/11/2026 par
  // D-505 (« 1 exercice ») et D-504 (Démarrer remplace l'action lecture ronde).]
  it("un exercice : « 1 exercice », chevron, Démarrer présent et indisponible", () => {
    render(<SessionCard projection={one()} />);
    expect(screen.getByTestId("session-card-s1-name")).toHaveTextContent("Renforcement du genou");
    expect(screen.getByTestId("session-card-s1-summary")).toHaveTextContent("1 exercice");
    expect(screen.getByTestId("session-card-s1-disclosure").props.accessibilityState).toEqual({ expanded: false });
    expect(screen.queryByTestId("session-card-s1-play")).toBeNull();
    const start = screen.getByTestId("session-card-s1-start");
    expect(start).toHaveTextContent("Démarrer");
    expect(start.props.accessibilityLabel).toBe("Démarrer la séance — indisponible");
    expect(start.props.accessibilityState).toEqual({ disabled: true });
  });

  it("plusieurs exercices : « N exercices », chevron à gauche du nom, annoncé fermé", () => {
    const onToggle = jest.fn();
    render(<SessionCard projection={many()} onToggleExpanded={onToggle} />);
    expect(screen.getByTestId("session-card-s1-summary")).toHaveTextContent("2 exercices");
    const disclosure = screen.getByTestId("session-card-s1-disclosure");
    expect(disclosure.props.accessibilityState).toEqual({ expanded: false });
    expect(disclosure.props.accessibilityLabel).toBe("Afficher la composition de Renforcement du genou");
    fireEvent.press(disclosure);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("chevron → replié, ↓ déployé (D-504)", () => {
    const { rerender } = render(<SessionCard projection={many()} onToggleExpanded={() => undefined} />);
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1-chevron").props.style).transform).toEqual([{ rotate: "-90deg" }]);
    rerender(<SessionCard projection={many()} expanded onToggleExpanded={() => undefined} />);
    expect(screen.getByTestId("session-card-s1-disclosure").props.accessibilityState).toEqual({ expanded: true });
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1-chevron-open").props.style).transform).toEqual([{ rotate: "0deg" }]);
  });

  it("« 0 exercice » pour une Séance vide (Q-E6)", () => {
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

  it("durée : minutes et secondes sans arrondi (D-391), ≥ pour une borne minimale ; sans sablier (D-506)", () => {
    render(<SessionCard projection={many()} />);
    expect(screen.getByTestId("session-card-s1-duration").props.children).toMatch(/^≥ /);
    expect(screen.UNSAFE_queryAllByProps({ source: SANDGLASS_ICON })).toHaveLength(0);
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

  it("carte archivée : même format, sans Démarrer ; liseré d'archive à 50 %", () => {
    render(
      <SessionCard
        projection={projection([{ kind: "EXERCISE", exercise: exercise() }], { status: "ARCHIVED", archivedAt: "x" })}
        onStart={() => undefined}
      />,
    );
    expect(screen.queryByTestId("session-card-s1-start")).toBeNull();
    const card = StyleSheet.flatten(screen.getByTestId("session-card-s1").props.style);
    expect(card.borderColor).toBe("rgba(217, 217, 217, 0.5)");
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1-header").props.style).height).toBe(71);
  });

  it("modales de planification : Démarrer masqué (context « planning »)", () => {
    render(<SessionCard projection={one()} context="planning" onStart={() => undefined} />);
    expect(screen.queryByTestId("session-card-s1-start")).toBeNull();
    expect(screen.getByTestId("session-card-s1-disclosure")).toBeTruthy();
  });

  // [« visuel 64 à 8 du bord, Lecture cible 48 à 8 du bord » et fond #F9FAFC — remplacé le 06/11/2026 par D-504.]
  it("mesures du gabarit : carte 72, photo 64 à 4 du bord ; fond blanc, liseré 0,5 à 50 % ; textes à 8 du haut", () => {
    render(<SessionCard projection={one()} />);
    const card = StyleSheet.flatten(screen.getByTestId("session-card-s1").props.style);
    expect(card).toMatchObject({ borderRadius: 12, borderWidth: 0.5, borderColor: "rgba(204, 209, 224, 0.5)", backgroundColor: "#FFFFFF" });
    expect(card).toMatchObject({ shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 2 } });
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1-header").props.style).height).toBe(71);
    expect(SESSION_CARD_HEADER_HEIGHT).toBe(72);
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1-visual-open").props.style)).toMatchObject({ marginLeft: 3.5, marginTop: 3.5 });
    const texts = StyleSheet.flatten(screen.getByTestId("session-card-s1-texts").props.style);
    expect(texts).toMatchObject({ marginLeft: 8, paddingTop: 7.5, paddingRight: 11.5 });
  });

  it("Démarrer : pilule 24 à 12 du bord droit et 8 du bas, fond du catalogue des séances, bleu 12 Medium, ombre 0/2/4 14 %, cible 44", () => {
    render(<SessionCard projection={one()} onStart={() => undefined} />);
    const start = screen.getByTestId("session-card-s1-start");
    const style = StyleSheet.flatten(start.props.style);
    expect(style).toMatchObject({
      height: 24,
      borderRadius: 12,
      right: 11.5,
      top: 72 - 8 - 24 - 0.5,
      backgroundColor: colors.catalogueSessionsBackground,
      shadowColor: "#000000",
      shadowOpacity: 0.14,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 2 },
    });
    expect(style.borderWidth).toBeUndefined();
    // Cible : jeton `minTouchTarget` (48), au moins les 44 exigés.
    expect(start.props.hitSlop).toMatchObject({ top: (minTouchTarget - 24) / 2, bottom: (minTouchTarget - 24) / 2 });
    const label = StyleSheet.flatten(screen.getByText("Démarrer").props.style);
    expect(label).toMatchObject({ fontSize: 12, fontFamily: "Inter_500Medium", color: colors.primary });
    expect(start.props.accessibilityLabel).toBe("Démarrer");
  });

  it("cible du chevron portée au moins à 44 (jeton `minTouchTarget`) sans empiéter sur la photo", () => {
    render(<SessionCard projection={one()} />);
    expect(screen.getByTestId("session-card-s1-disclosure").props.hitSlop).toEqual({
      top: (minTouchTarget - 20) / 2,
      bottom: (minTouchTarget - 20) / 2,
      left: 8,
      right: minTouchTarget - 10 - 8,
    });
  });

  // D-504 (Hermann, 06/11/2026) : « toucher la photo ouvre la composition de séance en modification ;
  // Démarrer exécute la séance ; le chevron […] déploie/replie la séance ; toucher toute la zone
  // déployée ouvre la séance en modification. Ces cibles sont distinctes. »
  it("cibles distinctes : photo → ouvrir, Démarrer → exécuter, chevron → déployer, zone déployée → ouvrir", () => {
    const onOpen = jest.fn();
    const onToggle = jest.fn();
    const onStart = jest.fn();
    render(
      <SessionCard projection={one()} expanded onToggleExpanded={onToggle} onOpen={onOpen} onStart={onStart}>
        <Text testID="composition">Composition</Text>
      </SessionCard>,
    );
    const calls = () => [onOpen.mock.calls.length, onToggle.mock.calls.length, onStart.mock.calls.length];
    fireEvent.press(screen.getByTestId("session-card-s1-visual-open"));
    expect(calls()).toEqual([1, 0, 0]);
    fireEvent.press(screen.getByTestId("session-card-s1-start"));
    expect(calls()).toEqual([1, 0, 1]);
    fireEvent.press(screen.getByTestId("session-card-s1-disclosure"));
    expect(calls()).toEqual([1, 1, 1]);
    fireEvent.press(screen.getByTestId("composition"));
    expect(calls()).toEqual([2, 1, 1]);
  });

  it("Démarrer indisponible : le toucher est intercepté et n'ouvre ni ne déploie rien", () => {
    const onOpen = jest.fn();
    const onToggle = jest.fn();
    render(<SessionCard projection={one()} onOpen={onOpen} onToggleExpanded={onToggle} />);
    expect(() => fireEvent.press(screen.getByTestId("session-card-s1-start"))).not.toThrow();
    expect(onOpen).not.toHaveBeenCalled();
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("Séance vide : chevron aussi ; repliée, aucune zone déployée", () => {
    render(<SessionCard projection={projection([])} onOpen={() => undefined} />);
    expect(screen.getByTestId("session-card-s1-disclosure")).toBeTruthy();
    expect(screen.queryByTestId("session-card-s1-expanded-open")).toBeNull();
  });
});

/**
 * D-505 (Hermann, 06/11/2026 ; KODJO-Catalogues-cartes-modales-2026-11-06 §5) : ligne 3 « N circuits ·
 * N exercices » ; circuits omis sans circuit ou pour un seul circuit joué une seule fois ; « 1 exercice ».
 */
describe("D-505 — ligne 3 « N circuits · N exercices »", () => {
  const line = (elements: readonly StructureElement<Activity>[]) => {
    render(<SessionCard projection={projection(elements)} />);
    return screen.getByTestId("session-card-s1-summary");
  };
  const circuit = (id: string, count: number, repeatCount: number): StructureElement<Activity> => ({
    kind: "CIRCUIT",
    circuit: { id, repeatCount, nature: "TOURS", exercises: Array.from({ length: count }, () => exercise()) },
  });
  const single = (): StructureElement<Activity> => ({ kind: "EXERCISE", exercise: exercise() });

  it("aucun circuit : « N exercices »", () => {
    expect(line([single(), single(), single()])).toHaveTextContent(/^3 exercices$/);
  });
  it("un circuit d'un tour : circuit omis", () => {
    expect(line([circuit("c1", 2, 1)])).toHaveTextContent(/^2 exercices$/);
  });
  it("un circuit de plusieurs tours : « 1 circuit · N exercices », sans multiplier par les tours", () => {
    expect(line([circuit("c1", 2, 3)])).toHaveTextContent(/^1 circuit · 2 exercices$/);
  });
  it("plusieurs circuits : « N circuits · N exercices »", () => {
    expect(line([circuit("c1", 2, 1), circuit("c2", 3, 2), single()])).toHaveTextContent(/^2 circuits · 6 exercices$/);
  });
  it("un seul exercice : « 1 exercice »", () => {
    expect(line([single()])).toHaveTextContent(/^1 exercice$/);
  });
  it("formatSessionStructureLine : même règle pour l'accessibilité", () => {
    expect(formatSessionStructureLine({ shownCircuitCount: 2, exerciseCount: 5 })).toBe("2 circuits · 5 exercices");
    expect(formatSessionStructureLine({ shownCircuitCount: null, exerciseCount: 1 })).toBe("1 exercice");
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
    // D-504 : Démarrer à 12 du bord, compensé du bord 1.
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1-start").props.style).right).toBe(11);
  });

  it("Séance complète : carte inchangée", () => {
    const value = one();
    expect(value.incomplete).toBe(false);
    render(<SessionCard projection={value} />);
    const style = StyleSheet.flatten(screen.getByTestId("session-card-s1").props.style);
    expect(style.backgroundColor).toBe(colors.background);
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

  // [« liseré orange de 1 » — retiré le 08/11/2026 (Hermann : « pas de liseré orange ») : bord transparent de 1.]
  it("un Exercice à vérifier : fond orange, sans liseré (bord transparent de 1) ; le contenu garde sa place", () => {
    const value = projection([{ kind: "EXERCISE", exercise: exercise() }, { kind: "EXERCISE", exercise: toVerifyExercise() }]);
    expect(value.incomplete).toBe(false);
    expect(value.toVerify).toBe(true);
    render(<SessionCard projection={value} />);
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1").props.style)).toMatchObject({
      backgroundColor: toVerifyColors.surface,
      borderColor: "transparent",
      borderWidth: 1,
    });
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1-start").props.style).right).toBe(11);
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
    expect(StyleSheet.flatten(screen.getByTestId("session-card-s1").props.style).backgroundColor).toBe(colors.background);
  });
});

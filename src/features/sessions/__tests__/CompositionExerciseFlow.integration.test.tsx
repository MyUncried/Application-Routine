import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";

import type { Category } from "@/domain/categories/Category";
import type { CategoryRepository } from "@/domain/categories/CategoryRepository";
import type { Session, SessionSummary } from "@/domain/sessions/Session";
import type { SessionRepository, UpdateSessionOutcome } from "@/domain/sessions/SessionRepository";
import { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { strings } from "@/shared/i18n";

/**
 * Intégration bout-en-bout du parcours Activité en deux étapes (UI-ACT-001,
 * cycle de correction après contre-recette iPhone, 2026-09-03).
 *
 * Contrairement à `CompositionScreen.test.tsx`/`ExerciseScreen.test.tsx`
 * (chacun mocke `SessionDraftContext` séparément, aucun brouillon
 * réellement partagé), ce fichier utilise `renderRouter` avec les VRAIES
 * routes (`app/(creation)/_layout|composition|exercise.tsx`) : le
 * `SessionDraftProvider` réel est monté une seule fois par le layout, et
 * les deux écrans (`CompositionScreen`, `ExerciseScreen`) sont les vrais
 * composants — c'est le seul niveau qui prouve réellement les 7 résultats
 * attendus : `Valider` ouvre Informations complémentaires ; `Terminer`
 * enregistre atomiquement l'Activité ; elle s'insère entre Compte à rebours
 * et Tour ; le retour ramène sur Composition ; le résumé `N activité(s) ·
 * durée` est recalculé ; un double-appui sur `Terminer` ne crée pas de
 * doublon ; le bouton `Continuer` reste désactivé tant que le Nom de la
 * séance est vide, et s'active/navigue réellement vers `/categories` une
 * fois la Composition complète (T01-S09, résolution de l'ARBITRAGE
 * précédemment documenté par l'audit).
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const composition = strings.screens.composition;
const exercise = strings.screens.exercise;

/**
 * `/categories` (T01-S09) rend `CategoriesScreen`, qui appelle
 * `useSessionService()` dès le montage (`listCategories`) — un contexte
 * factice minimal (aucune dépendance SQLite réelle) est donc nécessaire
 * pour que le test n°8 ci-dessous puisse simplement PROUVER LA NAVIGATION
 * réelle vers cet écran, sans re-tester ici son propre comportement
 * (couvert par `CategoriesScreen.test.tsx`).
 */
class NoopSessionRepository implements SessionRepository {
  create(): Promise<Session> {
    return Promise.reject(new Error("not used by this navigation-only test"));
  }
  findById(): Promise<Session | null> {
    return Promise.resolve(null);
  }
  findSessionStatus(): Promise<"ACTIVE" | "ARCHIVED" | null> {
    return Promise.resolve(null);
  }
  listActive(): Promise<readonly SessionSummary[]> {
    return Promise.resolve([]);
  }
  update(): Promise<UpdateSessionOutcome> {
    return Promise.reject(new Error("not used by this navigation-only test"));
  }
}

class NoopCategoryRepository implements CategoryRepository {
  listAll(): Promise<readonly Category[]> {
    return Promise.resolve([]);
  }
}

function SessionServiceTestWrapper({ children }: { children: ReactNode }) {
  return (
    <SessionServiceContext.Provider
      value={new SessionService(new NoopSessionRepository(), new NoopCategoryRepository())}
    >
      {children}
    </SessionServiceContext.Provider>
  );
}

function renderCreationRouter() {
  return renderRouter(
    {
      index: () => null,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/_layout": require("../../../../app/(creation)/_layout").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/composition": require("../../../../app/(creation)/composition").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/exercise": require("../../../../app/(creation)/exercise").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/categories": require("../../../../app/(creation)/categories").default,
    },
    { initialUrl: "/composition", wrapper: SessionServiceTestWrapper },
  );
}

describe("Parcours Composition → Activité (deux étapes), vrai navigateur, vrai SessionDraftProvider (UI-ACT-001)", () => {
  it("1. Valider (étape 1 valide) ouvre Informations complémentaires (étape 2), sans encore rien enregistrer sur Composition", () => {
    renderCreationRouter();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    expect(screen.getByLabelText(exercise.backAccessibilityLabel)).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText(exercise.name), "Pompes");
    expect(screen.getByLabelText(exercise.validateAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });

    fireEvent.press(screen.getByLabelText(exercise.validateAction));

    // Étape 2 : le corps affiche désormais la Consigne/les Zones, plus le
    // segment Type/Mode d'exécution de l'étape 1.
    expect(screen.getByLabelText(exercise.instruction.label)).toBeTruthy();
    expect(screen.getByLabelText(exercise.finishAction)).toBeTruthy();
  });

  it("2-3-4-5. Terminer enregistre atomiquement l'Activité, revient sur Composition, l'insère entre Compte à rebours et Tour, sans changer le résumé du Tour (BEFORE_TOUR)", () => {
    const router = renderCreationRouter();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.changeText(screen.getByLabelText(exercise.name), "Pompes");
    fireEvent.press(screen.getByLabelText(exercise.validateAction));
    fireEvent.press(screen.getByLabelText(exercise.finishAction));

    // 4. Retour effectif sur Composition — l'écran Exercice est démonté.
    expect(router.getPathname()).toBe("/composition");
    expect(screen.queryByLabelText(exercise.name)).toBeNull();

    // 3. Insertion entre Compte à rebours et Tour : le bouton `+ Ajouter
    // une activité` reste utilisable (complétion REWORK12, COMP-03 —
    // abroge l'ancien masquage), la ligne Exercice existe, avec le nom
    // saisi.
    expect(screen.getByLabelText(composition.addActivity)).toBeTruthy();
    expect(screen.getByText("Pompes")).toBeTruthy();
    // REWORK12 (COMP-01) : la ligne Exercice reprend l'anatomie de
    // `BoundaryActivityRow` — son testID porte désormais l'identifiant réel
    // (généré par `Crypto.randomUUID()`, non prévisible ici), retrouvé par
    // préfixe (`composition-exercise-row-`).
    const exerciseRowTestId = findTestIdStartingWith(screen.toJSON(), "composition-exercise-row-");
    expect(exerciseRowTestId).not.toBeNull();

    const order = testIdOrder(screen.toJSON(), [
      "composition-row-icon-composition-initial-countdown",
      exerciseRowTestId as string,
    ]);
    expect(order).toEqual([
      "composition-row-icon-composition-initial-countdown",
      exerciseRowTestId,
    ]);

    // 5. Résumé du TOUR inchangé (correctif T02, 2026-09-08, point 1) :
    // cette Activité est insérée `BEFORE_TOUR` (D-078/RM-020, « entre Compte
    // à rebours et Tour », vérifié ci-dessus), donc hors de la zone
    // `IN_TOUR` — la synthèse propre au Tour, qui n'agrège plus QUE cette
    // zone, reste par conséquent l'état vide `"0 activité · 0 min"`. Avant
    // ce correctif, une Activité `BEFORE_TOUR` contribuait encore (à tort)
    // au nombre affiché par cette synthèse.
    expect(screen.getByText(composition.summary.empty)).toBeTruthy();
  });

  it("6. un double-appui rapproché sur Terminer (avant tout rendu intermédiaire) n'enregistre l'Activité qu'une seule fois — pas de doublon", () => {
    const router = renderCreationRouter();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.changeText(screen.getByLabelText(exercise.name), "Pompes");
    fireEvent.press(screen.getByLabelText(exercise.validateAction));

    act(() => {
      fireEvent.press(screen.getByLabelText(exercise.finishAction));
      fireEvent.press(screen.getByLabelText(exercise.finishAction));
    });

    expect(router.getPathname()).toBe("/composition");
    // Une seule ligne Exercice, un seul résumé "1 activité" — jamais "2 activités".
    expect(screen.getAllByText("Pompes")).toHaveLength(1);
    expect(screen.queryByText(/^2 activités ·/)).toBeNull();
  });

  it("7. Continuer reste désactivé tant que le Nom de la séance est vide, même avec une Activité valide (T01-S09 : résolution de l'ARBITRAGE — Nom manquant, pas un blocage permanent)", () => {
    renderCreationRouter();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.changeText(screen.getByLabelText(exercise.name), "Pompes");
    fireEvent.press(screen.getByLabelText(exercise.validateAction));
    fireEvent.press(screen.getByLabelText(exercise.finishAction));

    expect(screen.getByLabelText(composition.continueAction).props.accessibilityState).toMatchObject(
      { disabled: true },
    );
  });

  it("8. Continuer s'active pour une Composition complète (Nom + Activité valide) et ouvre réellement Catégories de la séance (T01-S09, CE-T01-11)", () => {
    const router = renderCreationRouter();

    fireEvent.changeText(screen.getByLabelText(composition.name), "Séance du soir");
    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.changeText(screen.getByLabelText(exercise.name), "Pompes");
    fireEvent.press(screen.getByLabelText(exercise.validateAction));
    fireEvent.press(screen.getByLabelText(exercise.finishAction));

    const continueAction = screen.getByLabelText(composition.continueAction);
    expect(continueAction.props.accessibilityState).toMatchObject({ disabled: false });

    fireEvent.press(continueAction);
    expect(router.getPathname()).toBe("/categories");
  });
});

/** Premier `testID` rencontré commençant par `prefix` — utilisé pour retrouver une ligne Exercice dont l'identifiant réel (UUID) n'est pas prévisible en test. */
function findTestIdStartingWith(tree: ReturnType<typeof screen.toJSON>, prefix: string): string | null {
  let found: string | null = null;
  walk(tree, (node) => {
    if (found === null && typeof node?.props?.testID === "string" && node.props.testID.startsWith(prefix)) {
      found = node.props.testID as string;
    }
  });
  return found;
}

/** Ordre de première apparition (parcours préfixe) des `testID` demandés dans l'arbre rendu. */
function testIdOrder(tree: ReturnType<typeof screen.toJSON>, ids: string[]): string[] {
  const found: string[] = [];
  walk(tree, (node) => {
    if (node?.props?.testID && ids.includes(node.props.testID)) {
      found.push(node.props.testID as string);
    }
  });
  return found;
}

function walk(node: any, visit: (node: any) => void): void {
  if (!node) {
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((child) => walk(child, visit));
    return;
  }
  visit(node);
  if (node.children) {
    walk(node.children, visit);
  }
}

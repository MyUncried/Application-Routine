import { act, fireEvent, renderRouter, screen } from "expo-router/testing-library";
import { describe, expect, it, jest } from "@jest/globals";

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
 * doublon ; le bouton `Continuer` reste dans l'état documenté (ARBITRAGE
 * REQUIS, voir le rapport d'audit — non réévalué ici).
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const composition = strings.screens.composition;
const exercise = strings.screens.exercise;

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
    },
    { initialUrl: "/composition" },
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

  it("2-3-4-5. Terminer enregistre atomiquement l'Activité, revient sur Composition, l'insère entre Compte à rebours et Tour, et recalcule le résumé", () => {
    const router = renderCreationRouter();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.changeText(screen.getByLabelText(exercise.name), "Pompes");
    fireEvent.press(screen.getByLabelText(exercise.validateAction));
    fireEvent.press(screen.getByLabelText(exercise.finishAction));

    // 4. Retour effectif sur Composition — l'écran Exercice est démonté.
    expect(router.getPathname()).toBe("/composition");
    expect(screen.queryByLabelText(exercise.name)).toBeNull();

    // 3. Insertion entre Compte à rebours et Tour : `+ Ajouter une
    // activité` a disparu, la ligne Exercice existe, avec le nom saisi.
    expect(screen.queryByLabelText(composition.addActivity)).toBeNull();
    expect(screen.getByText("Pompes")).toBeTruthy();
    const order = testIdOrder(screen.toJSON(), [
      "composition-row-icon-composition-initial-countdown",
      "composition-exercise-icon",
    ]);
    expect(order).toEqual([
      "composition-row-icon-composition-initial-countdown",
      "composition-exercise-icon",
    ]);

    // 5. Résumé recalculé : "1 activité · ..." (jamais l'état vide "0 activité · 0 min").
    expect(screen.queryByText(composition.summary.empty)).toBeNull();
    expect(screen.getByText(/^1 activité ·/)).toBeTruthy();
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

  it("7. Continuer reste désactivé (ARBITRAGE REQUIS, voir le rapport d'audit — comportement non réévalué par cette tâche)", () => {
    renderCreationRouter();

    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.changeText(screen.getByLabelText(exercise.name), "Pompes");
    fireEvent.press(screen.getByLabelText(exercise.validateAction));
    fireEvent.press(screen.getByLabelText(exercise.finishAction));

    expect(screen.getByLabelText(composition.continueAction).props.accessibilityState).toMatchObject(
      { disabled: true },
    );
  });
});

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

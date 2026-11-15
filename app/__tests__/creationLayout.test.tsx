import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { ComponentType, ReactNode } from "react";

/**
 * **T02-S02 (continuation après recette visuelle, point 13)** — le geste
 * natif iOS de retour par glissement horizontal doit être désactivé sur
 * TOUTES les routes du parcours de création, pas seulement `composition`.
 *
 * Ce geste appartient à `react-native-screens`/native-stack : il n'est jamais
 * observable depuis l'arbre React Native rendu. Le seul contrat vérifiable
 * par test est donc la CONFIGURATION passée au navigateur — d'où ce double
 * espion sur `Stack` et `Stack.Screen`, qui capture `screenOptions` et les
 * `options` de chaque route.
 */
const stackCalls: { screenOptions?: Record<string, unknown> }[] = [];
const screenCalls: { name?: string; options?: Record<string, unknown> }[] = [];

jest.mock("expo-router/stack", () => {
  function Stack(props: { screenOptions?: Record<string, unknown>; children?: ReactNode }) {
    stackCalls.push({ screenOptions: props.screenOptions });
    return props.children ?? null;
  }
  Stack.Screen = function StackScreen(props: {
    name?: string;
    options?: Record<string, unknown>;
  }) {
    screenCalls.push({ name: props.name, options: props.options });
    return null;
  };
  return { Stack };
});

jest.mock("@/features/sessions/SessionDraftProvider", () => ({
  SessionDraftProvider: ({ children }: { children: ReactNode }) => children,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const CreationLayout = (require("../(creation)/_layout") as { default: ComponentType }).default;

describe("CreationLayout — geste horizontal natif de changement d'écran (T02-S02)", () => {
  it("disables the native swipe-back gesture for the WHOLE creation flow, via screenOptions", () => {
    stackCalls.length = 0;
    screenCalls.length = 0;
    render(<CreationLayout />);

    expect(stackCalls).toHaveLength(1);
    // Porté par `screenOptions` : toute route ajoutée plus tard hérite de la
    // désactivation, sans qu'il faille penser à la déclarer.
    expect(stackCalls[0]!.screenOptions).toMatchObject({
      headerShown: false,
      gestureEnabled: false,
    });
  });

  /**
   * **T02-S02 (seconde recette visuelle, point 4)** : cette désactivation est
   * nécessaire mais NON SUFFISANTE — sur le premier écran de ce navigateur
   * imbriqué, c'est le navigateur PARENT qui traite le geste. Le contrat de
   * ce dernier est vérifié par `rootLayoutGesture.test.tsx`, et les deux
   * tests sont indissociables.
   *
   * V2-CAT-01 : `activity-selection` (sélection d'une Activité existante
   * depuis la Composition) rejoint le même `Stack`, sous le même
   * `screenOptions` hérité — aucune route du parcours n'est laissée avec le
   * geste natif.
   */
  // PRE-4, décision Q54 : la route `categories` est supprimée.
  it("covers composition, exercise and the other creation routes — no route of the flow is left with the native gesture", () => {
    stackCalls.length = 0;
    screenCalls.length = 0;
    render(<CreationLayout />);

    expect(screenCalls.map((call) => call.name)).toEqual([
      "composition",
      "exercise",
      // [PRE-9 A.3 du 04/11/2026 : route « activity-selection » (anciennes définitions du Catalogue) retirée.]
      // PRE-9 A.2 (ARB-22a) : sélection des Mouvements depuis la Composition, même `Stack`.
      "movement-selection",
      // [formats-window, format-questionnaire, format-summary, movement-sheet : feuilles de la pile racine depuis la règle de Hermann
      // du 06/11/2026 (ordre des écrans, aucun écran ouvert par anticipation) — voir `rootLayoutGesture.test.tsx`.]
      // Recette iPhone du 04/11/2026 (décision de Hermann) : fiche d'un Exercice ouverte par la photo, lecture seule.
      "exercise-sheet",
      // Demande de Hermann du 04/11/2026 (« Afficher en mode modale iOS […] Catalogue des mouvements : Filtres ») :
      // Filtres du Catalogue des mouvements ouvert par Créer, en feuille native.
      "selection-filters",
      // Fin de PRE-10 (spec `spec-guidage-reglages` §3.2) : « Guidage de la séance », feuille native ouverte par l'élément Guidage.
      "session-guidance",
    ]);
    // Aucune route ne RÉACTIVE le geste par une option locale : la
    // désactivation héritée reste donc effective partout.
    for (const call of screenCalls) {
      expect(call.options?.gestureEnabled).not.toBe(true);
    }
  });

  // Recette iPhone du 04/11/2026 — décision de Hermann : « Affichage au format de la modale iOS, apparition et
  // disparition par le bas. » : feuille native, sans poignée, fond blanc (comme les feuilles adoptées le 04/11).
  it("presents the read-only Exercise sheet as a native iOS form sheet, without grabber, on a white background", () => {
    stackCalls.length = 0;
    screenCalls.length = 0;
    render(<CreationLayout />);

    const sheet = screenCalls.find((call) => call.name === "exercise-sheet");
    expect(sheet?.options).toMatchObject({
      presentation: "formSheet",
      sheetGrabberVisible: false,
      contentStyle: { backgroundColor: "#FFFFFF" },
    });
  });

  // Demande de Hermann du 04/11/2026 (« Afficher en mode modale iOS (mode d'apparition identique à la fiche des
  // mouvements du questionnaire par exemple) […] Catalogue des mouvements : Filtres ») : feuille native, fond blanc.
  it("presents the movement selection filters as a native iOS form sheet, without grabber, on a white background", () => {
    stackCalls.length = 0;
    screenCalls.length = 0;
    render(<CreationLayout />);

    const sheet = screenCalls.find((call) => call.name === "selection-filters");
    expect(sheet?.options).toMatchObject({
      presentation: "formSheet",
      sheetGrabberVisible: false,
      contentStyle: { backgroundColor: "#FFFFFF" },
    });
  });
});

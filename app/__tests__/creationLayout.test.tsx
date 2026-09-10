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
   */
  it("covers composition, exercise AND categories — no route of the flow is left with the native gesture", () => {
    stackCalls.length = 0;
    screenCalls.length = 0;
    render(<CreationLayout />);

    expect(screenCalls.map((call) => call.name)).toEqual([
      "composition",
      "exercise",
      "categories",
    ]);
    // Aucune route ne RÉACTIVE le geste par une option locale : la
    // désactivation héritée reste donc effective partout.
    for (const call of screenCalls) {
      expect(call.options?.gestureEnabled).not.toBe(true);
    }
  });
});

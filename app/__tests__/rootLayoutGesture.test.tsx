import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { ComponentType, ReactNode } from "react";

/**
 * **T02-S02 (seconde recette visuelle, point 4)** — le geste natif de retour
 * par glissement horizontal doit être désactivé sur TOUT le parcours de
 * création, **y compris au niveau du navigateur PARENT**.
 *
 * Il l'était déjà dans le `Stack` imbriqué (`app/(creation)/_layout.tsx`),
 * sans effet observable : sur le PREMIER écran de ce navigateur imbriqué
 * (`composition`), la pile interne n'a rien à dépiler, et c'est ce navigateur
 * parent qui traite le geste, pour revenir de `(creation)` vers `(tabs)`.
 * Désactiver l'option au seul niveau enfant ne pouvait donc pas neutraliser
 * le geste — les deux niveaux doivent la porter.
 *
 * Ce reconnaisseur appartient à `react-native-screens` et n'est jamais
 * observable depuis l'arbre React Native rendu : le seul contrat vérifiable
 * par test est la CONFIGURATION transmise au navigateur.
 */
const screenCalls: { name?: string; options?: Record<string, unknown> }[] = [];

jest.mock("expo-router/stack", () => {
  function Stack(props: { children?: ReactNode }) {
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

// T1 Compte : la porte d'entrée du compte est testée à part (`src/features/account/__tests__`) ; ici, compte rattaché.
jest.mock("@/features/account/AccountGate", () => ({
  AccountGate: ({ children }: { children: unknown }) => children,
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("@expo-google-fonts/inter/useFonts", () => ({
  useFonts: () => [true, null],
}));
jest.mock("@expo-google-fonts/inter/400Regular", () => ({ Inter_400Regular: "Inter_400Regular" }));
jest.mock("@expo-google-fonts/inter/500Medium", () => ({ Inter_500Medium: "Inter_500Medium" }));
jest.mock("@expo-google-fonts/inter/600SemiBold", () => ({
  Inter_600SemiBold: "Inter_600SemiBold",
}));
jest.mock("@expo-google-fonts/inter/700Bold", () => ({ Inter_700Bold: "Inter_700Bold" }));

jest.mock("@/features/sessions/SessionServiceProvider", () => ({
  SessionServiceProvider: ({
    children,
    onReady,
  }: {
    children: ReactNode;
    onReady: () => void;
  }) => {
    onReady();
    return children;
  },
}));

jest.mock("@/features/sessions/CreationDraftProviders", () => ({
  CreationDraftProviders: ({ children }: { children: ReactNode }) => children,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const RootLayout = (require("../_layout") as { default: ComponentType }).default;

describe("RootLayout — geste horizontal natif du navigateur PARENT (T02-S02)", () => {
  it("disables the native swipe-back gesture on the (creation) group itself", () => {
    screenCalls.length = 0;
    render(<RootLayout />);

    const creation = screenCalls.find((call) => call.name === "(creation)");
    expect(creation).toBeDefined();
    // D-602 (25/11/2026) : options calculées selon la route — geste toujours désactivé ; depuis une carte du catalogue des
    // séances, modale plein écran (décision de Hermann du 27/11/2026) [feuille native `formSheet` — remplacée].
    const options = creation?.options as unknown;
    const resolve = (params: object | undefined) =>
      typeof options === "function" ? (options as (arg: { route: { params?: object } }) => object)({ route: { params } }) : options;
    expect(resolve(undefined)).toMatchObject({ gestureEnabled: false });
    expect(resolve({ screen: "composition", params: { sessionId: "s1", presentation: "modal" } })).toMatchObject({ gestureEnabled: false, presentation: "fullScreenModal" });
  });

  it("leaves the (tabs) group's own navigation behaviour untouched — only the creation flow is concerned", () => {
    screenCalls.length = 0;
    render(<RootLayout />);

    const tabs = screenCalls.find((call) => call.name === "(tabs)");
    expect(tabs).toBeDefined();
    expect(tabs?.options?.gestureEnabled).toBeUndefined();
  });

  /**
   * V2-PRE-2 (plan §6.5, CE-UI-01) : `profile-edit` est déclaré comme écran
   * de pile du navigateur RACINE — sa garde de sortie propre
   * (`useCompositionExitGuard`/`DecisionDialog`) intercepte déjà le geste
   * natif et la navigation programmatique ; aucune désactivation de geste
   * n'est donc nécessaire ici, contrairement à `(creation)`.
   */
  // [Remplacé le 14/11/2026 : « Modifier le profil » est un écran de l'onglet Profil, sous la barre de navigation
  // (demande de Hermann : « Ajoute la barre de navigation Kodjo à la page d'accueil du Profil »).]
  it("no longer registers profile-edit in the root stack: it lives in the Profil tab, under the navigation bar", () => {
    screenCalls.length = 0;
    render(<RootLayout />);

    expect(screenCalls.find((call) => call.name === "profile-edit")).toBeUndefined();
  });

  /**
   * Demande de Hermann du 04/11/2026 (texte exact) : « Afficher en mode modale iOS (mode d'apparition identique à la
   * fiche des mouvements du questionnaire par exemple) les 3 modales et écrans suivants : Catalogue des mouvements :
   * Filtres ; Catalogue des mouvements : Créer un mouvement ; Catalogue des séances : Filtres ».
   */
  // Hermann, 04/11/2026 : « catalogue des mouvements, appuyer sur la photo ouvre la fiche des mouvements en modification,
  // elle doit être ouverte sous forme de modale iOS » — toute la route `/movement` est une feuille native.
  it("presents the Movement route as a native iOS form sheet: creation, edition, consultation and new level", () => {
    screenCalls.length = 0;
    render(<RootLayout />);

    const movement = screenCalls.find((call) => call.name === "movement");
    const options = movement?.options as unknown as (props: { route: { params?: object } }) => Record<string, unknown>;
    const sheet = { presentation: "formSheet", sheetGrabberVisible: false, contentStyle: { backgroundColor: "#FFFFFF" }, gestureEnabled: false };
    expect(options({ route: {} })).toMatchObject(sheet);
    // Création depuis la Composition : même route, même écran (cohérence).
    expect(options({ route: { params: { context: "session" } } })).toMatchObject(sheet);
    expect(options({ route: { params: { movementId: "m1" } } })).toMatchObject(sheet);
    expect(options({ route: { params: { movementId: "m1", mode: "edit" } } })).toMatchObject(sheet);
    expect(options({ route: { params: { variantOf: "m1", placement: "AFTER_ORIGIN" } } })).toMatchObject(sheet);
  });

  // Règle de Hermann du 06/11/2026 (registre ch07 : « Je veux qu’on suive l’ordre des écrans et des modèles lorsqu’on les ouvre et
  // qu’on les ferme en fonction des décisions qu’ils ont prises ») : modale « Créer un exercice », questionnaire, récapitulatif et
  // fiche d'un mouvement — feuilles natives de la pile racine, au-dessus de l'écran qui les ouvre, sans geste natif (comme avant).
  it("presents the creation modal, the Format questionnaire and summary, and the movement sheet as native root form sheets", () => {
    screenCalls.length = 0;
    render(<RootLayout />);

    const sheet = (name: string) => screenCalls.find((call) => call.name === name)?.options;
    expect(sheet("formats-window")).toMatchObject({ presentation: "formSheet", sheetAllowedDetents: "fitToContents", gestureEnabled: false });
    // [« format-questionnaire » — supprimé le 15/11/2026 : écran unique de chaque Format (décision de Hermann, registre ch07).]
    expect(sheet("format-questionnaire")).toBeUndefined();
    expect(sheet("format-summary")).toMatchObject({ presentation: "formSheet", sheetGrabberVisible: false, contentStyle: { backgroundColor: "#FFFFFF" }, gestureEnabled: false });
    expect(sheet("movement-sheet")).toMatchObject({ presentation: "formSheet", gestureEnabled: false });
  });

  // Recette du 26/11/2026 (après-midi, Hermann : « j'appuie sur Démarrer - La séance s'exécute mais pas en plein écran, mais en
  // modale. KO (il faut en plein écran) ») : sans présentation propre, une route posée après une feuille de la pile racine hérite
  // d'une présentation modale (`getModalRouteKeys`). L'Exécution est donc toujours plein écran, sans geste, en fondu.
  it("presents the Execution route full screen whatever the stack below it (fullScreenModal, no gesture, fade)", () => {
    screenCalls.length = 0;
    render(<RootLayout />);

    const execution = screenCalls.find((call) => call.name === "execution");
    expect(execution?.options).toEqual({ presentation: "fullScreenModal", gestureEnabled: false, animation: "fade" });
  });

  it("presents the Catalogue filters as a native iOS form sheet, without grabber, on a white background", () => {
    screenCalls.length = 0;
    render(<RootLayout />);

    const filters = screenCalls.find((call) => call.name === "catalogue-filters");
    expect(filters?.options).toMatchObject({
      presentation: "formSheet",
      sheetGrabberVisible: false,
      contentStyle: { backgroundColor: "#FFFFFF" },
      gestureEnabled: false,
    });
  });
});

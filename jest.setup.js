// PRE-4 Q39 (Hermann, 2026-10-17, E-13) : la Feuille Paramètres d'exécution emploie
// les animations de mise en page de Reanimated (fil UI). Sous Jest, aucun module natif :
// on charge les simulacres livrés par les paquets eux-mêmes. Le simulacre de Reanimated
// 4.5.1 ne fournit pas `LayoutAnimationConfig` (« ADD ME IF NEEDED ») : rendu transparent
// de ses enfants, comme sans animation. Le complément est posé sur le module
// `react-native-reanimated/mock` lui-même, car `expo-router/testing-library` remplace
// `react-native-reanimated` par ce même simulacre. Les props `entering`/`exiting`/`layout`
// restent visibles sur la vue hôte, ce qui permet aux tests de les vérifier.
const { jest } = require("@jest/globals");

jest.mock("react-native-worklets", () => require("react-native-worklets/src/mock"));
jest.mock("react-native-reanimated/mock", () => {
  const reanimated = jest.requireActual("react-native-reanimated/mock");
  return {
    ...reanimated,
    LayoutAnimationConfig: ({ children }) => children,
  };
});
jest.mock("react-native-reanimated", () => require("react-native-reanimated/mock"));

// Constat de Hermann du 06/11/2026 (glisser des cartes du questionnaire / récapitulatif des Formats, geste natif de
// react-native-gesture-handler autorisé pour cet écran) : simulacres livrés par le paquet.
require("react-native-gesture-handler/jestSetup");

// A-2 (11/11/2026) : la garde des Mouvements importés lit le registre natif des catalogues ; sous Jest,
// garde inactive par défaut. Les tests de la garde injectent un registre SQLite réel.
jest.mock("@/features/catalogue/importedMovements", () => ({
  isImportedMovement: async () => false,
  importedMovementLabel: async () => null,
  importedMovementInfo: async () => null,
  sharedCatalogueRegistry: async () => {
    throw new Error("Registre natif indisponible sous Jest : injecter un registre.");
  },
}));

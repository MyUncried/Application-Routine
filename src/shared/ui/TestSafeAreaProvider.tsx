import type { ReactNode } from "react";
import { SafeAreaProvider, type Metrics } from "react-native-safe-area-context";

/**
 * Métriques déterministes pour les tests de composants utilisant
 * `useSafeAreaInsets` (`CatalogueScreen`, `CompositionScreen`,
 * `ExerciseScreen` — correction de conformité,
 * `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`). `react-native-safe-area-context`
 * exige un `SafeAreaProvider` réel dans l'arbre pour résoudre les insets ;
 * `expo-router/testing-library` (`renderRouter`) le fournit automatiquement,
 * mais un rendu direct via `@testing-library/react-native` (`render()`) ne
 * le fournit pas — ce composant comble cet écart pour ces tests.
 *
 * Valeurs représentatives d'un iPhone avec encoche (inset supérieur 47,
 * inset inférieur 34, correspondant à l'indicateur d'accueil) — ni nulles
 * (ce qui masquerait un oubli d'utilisation des insets), ni disproportionnées.
 */
const TEST_SAFE_AREA_METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 402, height: 874 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

export function TestSafeAreaProvider({ children }: { children: ReactNode }) {
  return <SafeAreaProvider initialMetrics={TEST_SAFE_AREA_METRICS}>{children}</SafeAreaProvider>;
}

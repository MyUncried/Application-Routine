import type { TextStyle } from "react-native";

/**
 * Police des écrans « Avant la séance » et « Fin de séance » — décision technique du 27/11/2026, à la suite de la remarque de Hermann
 * (« Police : pourtant Roboto est utilisé sur tous les écrans d'exécution il me semble ») : les écrans d'exécution utilisent
 * **Roboto Condensed**, embarquée (`app/_layout.tsx` : 500 Medium, 600 SemiBold, 700 Bold). Le texte « normal » du DSF prend la graisse
 * la plus légère disponible (500). [Police du système, Roboto non embarquée (SCOPE_EXPANSION_REQUIRED) — remplacé.]
 */
export const EXEC_FONT = {
  regular: { fontFamily: "RobotoCondensed_500Medium", fontWeight: "500" },
  semiBold: { fontFamily: "RobotoCondensed_600SemiBold", fontWeight: "600" },
  bold: { fontFamily: "RobotoCondensed_700Bold", fontWeight: "700" },
} as const satisfies Record<string, TextStyle>;

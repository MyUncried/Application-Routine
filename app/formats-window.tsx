import { Stack, useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useState } from "react";

import type { FormatModelKey } from "@/domain/sessions/formatModels";

import { closeCreationModals } from "@/features/sessions/creationNavigation";
import { FormatModelScreen, useFormatSheetDetent } from "@/features/sessions/FormatModelScreen";
import { FormatsWindow } from "@/features/sessions/FormatsWindow";
import { FreeExerciseScreen } from "@/features/sessions/FreeExerciseScreen";
import { takeFormatsWindowCloseRequest } from "@/features/sessions/movementExercises";

/**
 * Modale de création commune (complément du 5 novembre 2026, CE-CREATION-01) en feuille native iOS ajustée à son contenu
 * (essai adopté le 04/11/2026). « Exercice libre » ouvre la fiche de création d'un exercice par-dessus.
 * D-605 (Hermann, 25/11/2026 ; Formats § 9.7) : un Format remplace le contenu de cette même feuille native par son écran (choix des
 * mouvements, puis paramètres), haut de la feuille porté à celui des modales de format (y = 95) : la modale des formats ne reste visible
 * ni en haut ni sur les côtés. La croix du format revient au contenu de la fenêtre (feuille de nouveau ajustée à son contenu).
 * [Un Format ouvrait son écran par-dessus (feuilles empilées, `/format-summary`) — remplacé.]
 *
 * Règle de Hermann du 06/11/2026 (registre ch07 : « Je veux qu’on suive l’ordre des écrans et des modèles lorsqu’on les ouvre et
 * qu’on les ferme en fonction des décisions qu’ils ont prises ») : feuille de la pile racine, posée au-dessus de l'écran qui
 * l'ouvre — Catalogue des séances (« Créer ») ou Composition (menu « + »). La croix revient à cet écran. [Composition ouverte
 * d'avance sous la modale (\`create=1\`) et retour au Catalogue par elle — remplacés.]
 */
export default function FormatsWindowRoute() {
  const router = useRouter();
  const navigation = useNavigation();
  const [chosen, setChosen] = useState<FormatModelKey | null>(null);
  // D-608 (D-573 point 5, Hermann, 26/11/2026 ; Formats § 9.10) : la carte « Libre » ouvre l'écran « Exercice libre — Choix du
  // mouvement » puis la page de l'exercice libre, dans cette même feuille (comme un format, D-605). [Fiche de création d'un mouvement
  // (`/movement?context=session`) ouverte par-dessus — remplacée.]
  const [free, setFree] = useState(false);
  const detent = useFormatSheetDetent();
  // Fiche ouverte par Exercice libre, validée (n-cat-libre : « Validée > Composition de séance ») : elle a remis le Mouvement à la
  // Composition et revient ici — la modale se retire (signal consommé une seule fois) ; ouverte depuis le Catalogue, la
  // Composition s'ouvre alors avec l'exercice. Annulée (arbitrage du 06/11/2026, A) : la modale reste.
  useFocusEffect(
    useCallback(() => {
      if (takeFormatsWindowCloseRequest()) closeCreationModals(router, navigation);
    }, [navigation, router]),
  );
  if (free) {
    return (
      <>
        <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
        <FreeExerciseScreen onClose={() => setFree(false)} onDone={() => closeCreationModals(router, navigation)} />
      </>
    );
  }
  if (chosen !== null) {
    return (
      <>
        <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
        <FormatModelScreen key={chosen} stage="summary" model={chosen} onClose={() => setChosen(null)} />
      </>
    );
  }
  return (
    <>
    <Stack.Screen options={{ sheetAllowedDetents: "fitToContents" }} />
    <FormatsWindow
      onClose={() => router.back()}
      // Décisions de Hermann du 15/11/2026 (registre ch07, « For time — tableau unique, sans questionnaire » et « Formats à tableau —
      // écran unique, sans redondance ») : chaque Format ouvre directement son écran unique. [Questionnaire des autres Formats
      // (`/format-questionnaire`) — remplacé.]
      onSelect={(model) => setChosen(model)}
      onFreeExercise={() => setFree(true)}
    />
    </>
  );
}

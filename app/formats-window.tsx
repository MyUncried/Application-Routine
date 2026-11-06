import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback } from "react";

import { MOVEMENT_SESSION_CONTEXT } from "@/features/activities/MovementScreen";
import { closeCreationModals } from "@/features/sessions/creationNavigation";
import { FormatsWindow } from "@/features/sessions/FormatsWindow";
import { takeFormatsWindowCloseRequest } from "@/features/sessions/movementExercises";

/**
 * Modale de création commune (complément du 5 novembre 2026, CE-CREATION-01) en feuille native iOS ajustée à son contenu
 * (essai adopté le 04/11/2026). Un Format ouvre son questionnaire par-dessus (feuilles empilées) ; « Exercice libre » ouvre la
 * fiche de création d'un exercice par-dessus.
 *
 * Règle de Hermann du 06/11/2026 (registre ch07 : « Je veux qu’on suive l’ordre des écrans et des modèles lorsqu’on les ouvre et
 * qu’on les ferme en fonction des décisions qu’ils ont prises ») : feuille de la pile racine, posée au-dessus de l'écran qui
 * l'ouvre — Catalogue des séances (« Créer ») ou Composition (menu « + »). La croix revient à cet écran. [Composition ouverte
 * d'avance sous la modale (\`create=1\`) et retour au Catalogue par elle — remplacés.]
 */
export default function FormatsWindowRoute() {
  const router = useRouter();
  const navigation = useNavigation();
  // Fiche ouverte par Exercice libre, validée (n-cat-libre : « Validée > Composition de séance ») : elle a remis le Mouvement à la
  // Composition et revient ici — la modale se retire (signal consommé une seule fois) ; ouverte depuis le Catalogue, la
  // Composition s'ouvre alors avec l'exercice. Annulée (arbitrage du 06/11/2026, A) : la modale reste.
  useFocusEffect(
    useCallback(() => {
      if (takeFormatsWindowCloseRequest()) closeCreationModals(router, navigation);
    }, [navigation, router]),
  );
  return (
    <FormatsWindow
      onClose={() => router.back()}
      onSelect={(model) => router.push({ pathname: "/format-questionnaire", params: { model } })}
      onFreeExercise={() => router.push({ pathname: "/movement", params: { context: MOVEMENT_SESSION_CONTEXT } })}
    />
  );
}

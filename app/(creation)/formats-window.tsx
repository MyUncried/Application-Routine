import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback } from "react";

import { MOVEMENT_SESSION_CONTEXT } from "@/features/activities/MovementScreen";
import { FormatsWindow } from "@/features/sessions/FormatsWindow";
import { hasMovementsHandedToComposition } from "@/features/sessions/movementExercises";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";

/**
 * Modale de création commune (complément du 5 novembre 2026, CE-CREATION-01) en feuille native iOS ajustée à son contenu
 * (essai adopté le 04/11/2026). Un Format ouvre son questionnaire par-dessus (feuilles empilées) ; « Exercice libre » referme
 * la modale et ouvre la fiche de création d'un exercice (mouvement, puis paramètres) ; la croix revient au point de départ
 * (Composition, ou Catalogue des séances par la Composition d'arrivée, `app/(creation)/composition.tsx`).
 */
export default function FormatsWindowRoute() {
  const router = useRouter();
  const navigation = useNavigation();
  const { draft } = useSessionDraft();
  // Recette du 05/11/2026 (n-cat-libre, Hermann : « Fiche de mouvement : Validée > Composition de séance ; Annulée > Modale de
  // Création d'un exercice ») : la fiche de création s'ouvre par-dessus la modale ; validée, elle remet le Mouvement à la
  // Composition et revient ici — la modale se retire aussitôt, la Composition le reprend.
  useFocusEffect(
    useCallback(() => {
      if (hasMovementsHandedToComposition()) router.back();
    }, [router]),
  );
  // Recette du 05/11/2026 (n-cat-creer, Hermann : « Quand la croix ramène au catalogue, l'écran de composition de séance se
  // retire avant, on ne doit pas voir cet écran ») : ouverte par « Créer » du Catalogue sur un brouillon encore vide, la croix
  // revient directement au Catalogue des séances, Composition comprise. Depuis une Composition : retour à celle-ci.
  const close = () => {
    const routes = navigation.getState()?.routes ?? [];
    const below = routes[routes.findIndex((route) => route.name === "formats-window") - 1];
    const fromCatalogue = below?.name === "composition" && (below.params as { create?: string } | undefined)?.create === "1";
    if (fromCatalogue && draft.exercises.length === 0) router.dismissTo({ pathname: "/", params: { catalogueSegment: "sessions" } });
    else router.back();
  };
  return (
    <FormatsWindow
      onClose={close}
      onSelect={(model) => router.push({ pathname: "/format-questionnaire", params: { model } })}
      onFreeExercise={() => router.push({ pathname: "/movement", params: { context: MOVEMENT_SESSION_CONTEXT } })}
    />
  );
}

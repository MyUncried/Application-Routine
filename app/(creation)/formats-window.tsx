import { useRouter } from "expo-router";

import { MOVEMENT_SESSION_CONTEXT } from "@/features/activities/MovementScreen";
import { FormatsWindow } from "@/features/sessions/FormatsWindow";

/**
 * Modale de création commune (complément du 5 novembre 2026, CE-CREATION-01) en feuille native iOS ajustée à son contenu
 * (essai adopté le 04/11/2026). Un Format ouvre son questionnaire par-dessus (feuilles empilées) ; « Exercice libre » referme
 * la modale et ouvre la fiche de création d'un exercice (mouvement, puis paramètres) ; la croix revient au point de départ
 * (Composition, ou Catalogue des séances par la Composition d'arrivée, `app/(creation)/composition.tsx`).
 */
export default function FormatsWindowRoute() {
  const router = useRouter();
  return (
    <FormatsWindow
      onClose={() => router.back()}
      onSelect={(model) => router.push({ pathname: "/format-questionnaire", params: { model } })}
      onFreeExercise={() => {
        router.back();
        router.push({ pathname: "/movement", params: { context: MOVEMENT_SESSION_CONTEXT } });
      }}
    />
  );
}

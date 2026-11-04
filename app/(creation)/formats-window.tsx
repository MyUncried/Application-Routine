import { useRouter } from "expo-router";

import { FormatsWindow } from "@/features/sessions/FormatsWindow";

/**
 * ESSAI du 04/11/2026 (feuille native de bout en bout) : fenêtre « Formats d'entraînement » en feuille iOS ajustée à son
 * contenu ; un modèle ouvre son questionnaire par-dessus (feuilles empilées) ; la croix revient à la Composition.
 */
export default function FormatsWindowRoute() {
  const router = useRouter();
  return <FormatsWindow onClose={() => router.back()} onSelect={(model) => router.push({ pathname: "/format-questionnaire", params: { model } })} />;
}

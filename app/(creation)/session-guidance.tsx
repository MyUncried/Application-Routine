import { Stack, useRouter } from "expo-router";

import { SessionGuidanceSheet } from "@/features/sessions/SessionGuidanceSheet";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/**
 * Modale « Guidage sonore » de la Composition (documentation de main `ebe72f76`, Figma `12132:27436`), ouverte par le
 * bouton Guidage sonore de l'en-tête. Feuille native iOS de hauteur fixe, plafonnée sous le titre de l'écran, comme les
 * Filtres (recette du 04/11/2026 : une hauteur ajustée au contenu décalait la liste sous l'en-tête) ; le contenu défile
 * sous l'en-tête fixe. « Valider » applique au brouillon (enregistré avec la Séance), « Fermer » abandonne.
 * [Remplacé le 11/11/2026 — hauteur ajustée au contenu (recette w2 : texte par-dessus l'en-tête, ✕ et ✓ sans effet).]
 */
export default function SessionGuidanceRoute() {
  const router = useRouter();
  const { draft, updateDraft } = useSessionDraft();
  const detent = useTitleCappedSheetDetent(null);
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <SessionGuidanceSheet
        native={{}}
        initial={draft.guidance}
        onApply={(guidance) => {
          updateDraft({ guidance });
          router.back();
        }}
        onClose={() => router.back()}
      />
    </>
  );
}

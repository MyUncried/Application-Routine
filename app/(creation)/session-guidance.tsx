import { Stack, useRouter } from "expo-router";
import { useState } from "react";

import { SessionGuidanceSheet } from "@/features/sessions/SessionGuidanceSheet";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/**
 * Fin de PRE-10 — « Guidage de la séance », ouverte depuis l'élément Guidage de la Composition (spec
 * `spec-guidage-reglages` §3.2). Feuille native iOS, comme les autres feuilles de la Composition ; hauteur ajustée à
 * son contenu. ✓ applique au brouillon (enregistré avec la Séance), ✕ ferme sans rien changer.
 */
export default function SessionGuidanceRoute() {
  const router = useRouter();
  const { draft, updateDraft } = useSessionDraft();
  const [needed, setNeeded] = useState<number | null>(null);
  const detent = useTitleCappedSheetDetent(needed);
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <SessionGuidanceSheet
        initial={draft.guidance}
        onApply={(guidance) => {
          updateDraft({ guidance });
          router.back();
        }}
        onClose={() => router.back()}
        onMeasure={(height) => setNeeded(Math.ceil(height))}
      />
    </>
  );
}

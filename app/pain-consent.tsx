import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { PainConsentSheet } from "@/features/programs/PainConsentSheet";
import { pendingProgramSheet, releaseProgramSheet } from "@/features/programs/programSheetRelay";

/**
 * Feuille de consentement au suivi de la douleur (D-551, Figma « PROG — 13b ») — feuille native ajustée à son contenu, posée
 * sur la modale du programme. Fermer la feuille sans choisir vaut Annuler (l'interrupteur reste désactivé).
 */
export default function PainConsentRoute() {
  const router = useRouter();
  const [request] = useState(() => pendingProgramSheet("consent"));
  const answered = useRef(false);
  useEffect(() => {
    if (request === null && router.canGoBack()) router.back();
    return () => {
      if (!answered.current) request?.onCancel();
      releaseProgramSheet();
    };
  }, [request, router]);
  const answer = (allow: boolean) => {
    if (answered.current) return;
    answered.current = true;
    if (allow) request?.onAllow();
    else request?.onCancel();
    router.back();
  };
  return <PainConsentSheet onCancel={() => answer(false)} onAllow={() => answer(true)} />;
}

import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { releaseFilterSheet, useFilterSheetRequest, type FilterSheetRequest } from "@/features/activities/filterSheetRelay";
import { MovementFilterSheet } from "@/features/activities/MovementFilterSheet";
import { SessionFilterSheet } from "@/features/sessions/SessionFilterSheet";
import { useTitleCappedSheetDetent } from "@/shared/ui/nativeSheet";

/**
 * Demande de Hermann du 04/11/2026 (texte exact) : « Afficher en mode modale iOS (mode d'apparition identique à la fiche
 * des mouvements du questionnaire par exemple) les 3 modales et écrans suivants : Catalogue des mouvements : Filtres ;
 * Catalogue des mouvements : Créer un mouvement ; Catalogue des séances : Filtres ».
 *
 * Feuille de filtres demandée par l'écran appelant (`requestFilterSheet`), contenu inchangé (✕ / titre / ✓, groupes,
 * Réinitialiser). ✕ ferme sans appliquer, ✓ applique ; puis `onLeave` rend la main (route : `router.back()`, la feuille
 * redescend par le système, contenu conservé jusqu'au démontage). Un seul départ par ouverture.
 */
export function PendingFilterSheet({
  onLeave,
  onNeededHeight,
}: {
  readonly onLeave: () => void;
  readonly onNeededHeight?: (height: number) => void;
}) {
  const request = useFilterSheetRequest();
  const leaving = useRef<FilterSheetRequest | null>(null);
  if (request === null) return null;
  const leave = (then?: () => void) => {
    if (leaving.current === request) return;
    leaving.current = request;
    then?.();
    onLeave();
  };
  const native = onNeededHeight === undefined ? {} : { onNeededHeight };
  if (request.kind === "movements") {
    return (
      <MovementFilterSheet
        native={native}
        filters={request.filters}
        onApply={(filters, labels) => leave(() => request.onApply(filters, labels))}
        onClose={() => leave()}
      />
    );
  }
  return (
    <SessionFilterSheet
      native={native}
      filters={request.filters}
      onApply={(filters, labels) => leave(() => request.onApply(filters, labels))}
      onClose={() => leave()}
    />
  );
}

/**
 * Route de la feuille de filtres (`app/catalogue-filters.tsx`, `app/(creation)/selection-filters.tsx`), présentée en
 * `formSheet` comme la fiche du questionnaire : hauteur ajustée au contenu, plafonnée sous le titre de l'écran ouvert
 * dessous ; au-delà, les critères défilent.
 */
export function FilterSheetRoute() {
  // `router` impératif (stable) : l'effet ci-dessous ne doit se rejouer qu'au démontage, jamais pendant l'affichage.
  const request = useFilterSheetRequest();
  // Recette du 04/11/2026 (filtres vides ou décalés, traces relevées sur iPhone : la feuille changeait de hauteur après
  // l'ouverture, au chargement des Catégories et des Zones, et la liste n'était plus visible ni défilable) : hauteur fixe,
  // plafonnée sous le titre de l'écran, comme les feuilles qui fonctionnent (questionnaire, Créer un mouvement).
  // [Hauteur ajustée au contenu — remplacée.]
  const detent = useTitleCappedSheetDetent(null);
  const [opened] = useState(request);
  useEffect(() => {
    // Ouverture sans demande (rechargement, lien direct) : rien à filtrer, la feuille se referme.
    if (opened === null && router.canGoBack()) router.back();
    // Démontage (fin de la descente) : la demande est retirée.
    return () => releaseFilterSheet(opened);
  }, [opened]);
  return (
    <>
      <Stack.Screen options={{ sheetAllowedDetents: [detent] }} />
      <PendingFilterSheet onLeave={() => router.back()} />
    </>
  );
}

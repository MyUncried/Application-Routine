import type { ReactNode } from "react";

import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { SessionDraftProvider } from "@/features/sessions/SessionDraftProvider";

/**
 * Brouillon de séance et brouillon de Format, au niveau de l'application (règle de Hermann du 06/11/2026, registre ch07 :
 * aucun écran ouvert par anticipation). La modale « Créer un exercice » s'ouvre directement au-dessus du Catalogue des séances,
 * sans Composition dessous : le brouillon ne peut plus vivre dans le seul groupe de création. [Fournisseurs montés par
 * `app/(creation)/_layout.tsx` — déplacés ici.]
 */
export function CreationDraftProviders({ children }: { readonly children: ReactNode }) {
  return (
    <SessionDraftProvider>
      <FormatModelDraftProvider>{children}</FormatModelDraftProvider>
    </SessionDraftProvider>
  );
}

import { Stack } from "expo-router/stack";

import { CreationDraftProviders } from "@/features/sessions/CreationDraftProviders";

/**
 * Pile racine des tests de navigation réelle (`renderRouter`) : mêmes fournisseurs de brouillon que `app/_layout.tsx`
 * (règle de Hermann du 06/11/2026 : brouillons de séance et de Format au niveau de l'application).
 */
export function CreationRootStack() {
  return (
    <CreationDraftProviders>
      <Stack screenOptions={{ headerShown: false }} />
    </CreationDraftProviders>
  );
}

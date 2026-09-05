import { Stack } from "expo-router/stack";

import { SessionDraftProvider } from "@/features/sessions/SessionDraftProvider";

/**
 * Groupe de routes de la création/modification d'une Séance (T01-S07).
 *
 * `SessionDraftProvider` enveloppe un `Stack` imbriqué explicite — même
 * patron déjà éprouvé que `(tabs)/_layout.tsx` — plutôt que le primitif de
 * bas niveau `Slot` (`@hidden`, persistance entre routes non établie avec
 * confiance suffisante par lecture statique seule). Un navigateur ne
 * démonte pas ses ancêtres React lors d'une navigation entre ses propres
 * écrans : le brouillon survit donc à toute navigation entre écrans
 * enfants de ce `Stack` (T01-S08 ajoutera `exercise` au même `Stack`, sous
 * le même Provider, sans restructuration).
 *
 * `headerShown: false` est répété explicitement ici : ne se propage pas
 * automatiquement depuis le `Stack` racine (`app/_layout.tsx`) vers un
 * navigateur imbriqué distinct.
 *
 * `exercise` ajoutée en T01-S08, sous le même `Stack` et le même Provider,
 * sans restructuration — confirmant la prédiction du commentaire ci-dessus.
 *
 * `categories` ajoutée en T01-S09 (CE-T01-11), même patron — `Enregistrer
 * la séance` réinitialise le brouillon partagé (`resetDraft`) puis quitte
 * ce `Stack` entièrement (`router.dismissTo("/")`) vers le Catalogue.
 */
export default function CreationLayout() {
  return (
    <SessionDraftProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="composition" />
        <Stack.Screen name="exercise" />
        <Stack.Screen name="categories" />
      </Stack>
    </SessionDraftProvider>
  );
}

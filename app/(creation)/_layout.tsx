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
 *
 * `composition` : `gestureEnabled: false` (correctif T02, 2026-09-08, point
 * 3) — le geste natif iOS de retour par glissement horizontal (bord gauche
 * vers la droite) de `react-native-screens`/native-stack est un
 * reconnaisseur de gestes NATIF, extérieur à l'arbre React Native ; il
 * n'est jamais arrêté par la capture de responder JS de
 * `compositionGesture.ts` (glissement gauche des cartes d'Activité,
 * `SWIPE_REVEAL_DISTANCE`). Sans cette option, un glissement horizontal
 * commencé près du bord gauche de l'écran de Composition pouvait déclencher
 * le retour à l'écran précédent au lieu de — ou en plus de — l'action de
 * carte visée. Les gestes horizontaux propres aux cartes (glissement gauche
 * pour révéler `Dupliquer`/`Supprimer`, glissement inverse pour refermer)
 * restent inchangés : ils ne dépendent jamais de ce geste natif de
 * navigation, uniquement du responder system interne à l'écran.
 */
export default function CreationLayout() {
  return (
    <SessionDraftProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="composition" options={{ gestureEnabled: false }} />
        <Stack.Screen name="exercise" />
        <Stack.Screen name="categories" />
      </Stack>
    </SessionDraftProvider>
  );
}

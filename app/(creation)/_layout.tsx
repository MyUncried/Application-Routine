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
 * ce `Stack` entièrement (`router.dismissTo(...)`) vers le Catalogue,
 * segment `Séances` (UI-CAT-R-005/006, signal `catalogueSegment` consommé
 * par `CatalogueScreen`).
 *
 * VISUAL_CORRECTION (revue indépendante 5753653735, point 4) : une
 * tentative antérieure posait `animation: "slide_from_left"` sur
 * `categories` pour que la SORTIE (`Enregistrer la séance`) glisse vers la
 * gauche — mais l'option d'un écran de `Stack` régit SYMÉTRIQUEMENT son
 * ENTRÉE et sa SORTIE (native-stack ne distingue pas les deux) : elle
 * dégradait donc l'ENTRÉE (`Continuer`, composition → catégories), qui
 * glissait alors, à tort, depuis la gauche au lieu de la droite. Retirée :
 * `categories` reprend la transition STANDARD de la pile (`Continuer`
 * entre depuis la droite ; `Retour` en ressort vers la droite), déjà
 * contractuelle et correcte pour les deux transitions, sans régression de
 * l'une pour corriger l'autre. La destination et les règles métier de
 * `router.dismissTo` restent inchangées.
 *
 * `gestureEnabled: false` (correctif T02, 2026-09-08, point 3 ; **étendu à
 * TOUT le parcours par T02-S02, continuation après recette visuelle**) — le
 * geste natif iOS de retour par glissement horizontal (bord gauche vers la
 * droite) de `react-native-screens`/native-stack est un reconnaisseur de
 * gestes NATIF, extérieur à l'arbre React Native ; il n'est jamais arrêté par
 * la capture de responder JS de `compositionGesture.ts` (balayage des cartes
 * d'Activité, `SWIPE_REVEAL_DISTANCE`).
 *
 * L'option n'était posée que sur `composition`. La recette a montré que cela
 * ne suffit pas : `exercise` et `categories` appartiennent au même parcours
 * de création, portent eux aussi des gestes horizontaux (roulettes,
 * sélections) et un brouillon non enregistré — un retour natif déclenché par
 * inadvertance y contourne la garde de sortie, qui n'est armée que sur une
 * navigation explicite. Elle est donc portée par `screenOptions`, au niveau
 * du `Stack` : toute route AJOUTÉE PLUS TARD en hérite par défaut, sans
 * qu'il faille penser à la déclarer.
 *
 * **La navigation explicite reste entière** : `Retour` de l'en-tête,
 * `Terminer`, `Continuer`, `Enregistrer la séance` et `router.dismissTo`
 * fonctionnent à l'identique — seul le geste natif de bord d'écran est
 * neutralisé.
 */
export default function CreationLayout() {
  return (
    <SessionDraftProvider>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
        <Stack.Screen name="composition" />
        <Stack.Screen name="exercise" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="activity-selection" />
      </Stack>
    </SessionDraftProvider>
  );
}

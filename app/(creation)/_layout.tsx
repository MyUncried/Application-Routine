import { Stack } from "expo-router/stack";

import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
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
 * PRE-4, décision Q54 de Hermann (2026-10-18) : la route `categories` (écran
 * « Catégories de la séance », ajouté en T01-S09) est supprimée, vestige d'un parcours
 * disparu. `Enregistrer la séance` est désormais l'action finale de la Composition : elle
 * enregistre, réinitialise le brouillon partagé (`resetDraft`) puis quitte ce `Stack`
 * entièrement (`router.dismissTo(...)`) vers le Catalogue, segment `Séances`
 * (UI-CAT-R-005/006, signal `catalogueSegment` consommé par `CatalogueScreen`).
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
 * ne suffit pas : `exercise` (et, jusqu'à Q54, `categories`) appartiennent au même parcours
 * de création, portent eux aussi des gestes horizontaux (roulettes,
 * sélections) et un brouillon non enregistré — un retour natif déclenché par
 * inadvertance y contourne la garde de sortie, qui n'est armée que sur une
 * navigation explicite. Elle est donc portée par `screenOptions`, au niveau
 * du `Stack` : toute route AJOUTÉE PLUS TARD en hérite par défaut, sans
 * qu'il faille penser à la déclarer.
 *
 * **La navigation explicite reste entière** : `Retour` de l'en-tête,
 * `Terminer`, `Enregistrer la séance` et `router.dismissTo`
 * fonctionnent à l'identique — seul le geste natif de bord d'écran est
 * neutralisé.
 */
export default function CreationLayout() {
  return (
    <SessionDraftProvider>
      <FormatModelDraftProvider>
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
        <Stack.Screen name="composition" />
        <Stack.Screen name="exercise" />
        <Stack.Screen name="activity-selection" />
        {/* PRE-9 A.2 (ARB-22a) : « Utiliser un mouvement existant » depuis la Composition. */}
        {/* Recette iPhone n° 3 du 02/11/2026 (f3-questionnaire, Hermann : « Ouvrir le catalogue : un écran
            apparaît par la droite, c'est perturbant […] il faut donner l'impression qu'on ne change pas
            d'écran ») : depuis un questionnaire de Format, le Catalogue apparaît en fondu. */}
        <Stack.Screen
          name="movement-selection"
          options={({ route }) => ({
            animation: String((route.params as { purpose?: string } | undefined)?.purpose ?? "").startsWith("format-") ? "fade" : "default",
          })}
        />
        {/* PRE-9 C.3 (référence Formats du 02/11/2026, CE-FMT-02) : questionnaire et récapitulatif d'un modèle
            de la fenêtre Formats ; brouillon de modèle partagé (`FormatModelDraftProvider`). [C.2/C.3 du 01/11 :
            routes `session-model` et `format-parameters` — retirées le 02/11/2026.] */}
        {/* Mise à jour consolidée du 04/11/2026 (§1) : le parcours Format est une modale sur la Composition, par le
            bas, la Composition restant visible sous le voile ; l'étape (questionnaire / récapitulatif) change sur
            place, sans navigation. `format-summary` ouvre directement le récapitulatif (réédition depuis la
            Composition, §6 sexies). [Écrans pleins, récapitulatif poussé sans transition — remplacés.] */}
        <Stack.Screen name="format-questionnaire" options={{ presentation: "transparentModal", animation: "slide_from_bottom" }} />
        <Stack.Screen name="format-summary" options={{ presentation: "transparentModal", animation: "slide_from_bottom" }} />
        {/* Recette n° 3 du 03/11/2026 (autres constats) : fiche d'un mouvement du questionnaire ou du
            récapitulatif, en modale par le bas, lecture seule ; fermeture par sa croix (geste natif désactivé, T02-S02).
            Recette n° 3 bis (f3s-fiche) : feuille ajustée à son contenu, au plus jusqu'au titre de l'écran (hauteur
            fixée par la route). */}
        <Stack.Screen name="movement-sheet" options={{ presentation: "formSheet" }} />
      </Stack>
      </FormatModelDraftProvider>
    </SessionDraftProvider>
  );
}

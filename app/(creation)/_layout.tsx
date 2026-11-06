import { Stack } from "expo-router/stack";

/**
 * Groupe de routes de la création/modification d'une Séance (T01-S07).
 *
 * Règle de Hermann du 06/11/2026 (registre ch07 : aucun écran ouvert par anticipation) : le brouillon de séance et celui du
 * Format sont montés au niveau de l'application (`CreationDraftProviders`, `app/_layout.tsx`) ; la modale « Créer un
 * exercice », les questionnaires et récapitulatifs de Format et la fiche d'un mouvement sont des feuilles de la pile racine
 * (`app/formats-window.tsx`, `format-questionnaire`, `format-summary`, `movement-sheet`), posées au-dessus de l'écran qui
 * les ouvre. [Brouillon monté ici et feuilles de ce groupe — remplacés ; le texte d'origine ci-dessous décrit l'ancien montage.]
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
/**
 * Feuilles natives du parcours (essai adopté le 04/11/2026) — Hermann : « l'écran blanc s'arrête avant la fin de l'écran ce
 * qui crée une séparation » : fond blanc sur toute la hauteur de la feuille, sous le contenu.
 */
const SHEET_CONTENT = { backgroundColor: "#FFFFFF" } as const;

export default function CreationLayout() {
  return (
      <Stack screenOptions={{ headerShown: false, gestureEnabled: false }}>
        {/* [Recette du 05/11/2026 (n-cat-creer, n-cat-libre) : Composition ouverte par « Créer » (`create=1`) en fondu lent derrière
            la modale — remplacé par la règle du 06/11/2026 : la Composition ne s'ouvre qu'après une validation.] */}
        <Stack.Screen name="composition" />
        <Stack.Screen name="exercise" />
        {/* [PRE-9 A.3 du 04/11/2026 : route « activity-selection » (sélection des anciennes définitions) retirée.] */}
        {/* PRE-9 A.2 (ARB-22a) : « Utiliser un mouvement existant » depuis la Composition. */}
        {/* Recette iPhone n° 3 du 02/11/2026 (f3-questionnaire, Hermann : « Ouvrir le catalogue : un écran
            apparaît par la droite, c'est perturbant […] il faut donner l'impression qu'on ne change pas
            d'écran ») : depuis un questionnaire de Format, le Catalogue apparaît en fondu. */}
        {/* ESSAI du 04/11/2026 (Hermann : « l'utiliser aussi pour la modale du catalogue des mouvements lorsqu'on l'appelle à
            partir du bouton Créer ») : feuille native iOS. [Écran poussé, fondu depuis un questionnaire — remplacés par l'essai.] */}
        <Stack.Screen name="movement-selection" options={{ presentation: "formSheet", sheetGrabberVisible: false, contentStyle: SHEET_CONTENT }} />
        {/* PRE-9 C.3 (référence Formats du 02/11/2026, CE-FMT-02) : questionnaire et récapitulatif d'un modèle
            de la fenêtre Formats ; brouillon de modèle partagé (`FormatModelDraftProvider`). [C.2/C.3 du 01/11 :
            routes `session-model` et `format-parameters` — retirées le 02/11/2026.] */}
        {/* Mise à jour consolidée du 04/11/2026 (§1) : le parcours Format est une modale sur la Composition, par le
            bas, la Composition restant visible sous le voile ; l'étape (questionnaire / récapitulatif) change sur
            place, sans navigation. `format-summary` ouvre directement le récapitulatif (réédition depuis la
            Composition, §6 sexies). [Écrans pleins, récapitulatif poussé sans transition — remplacés.] */}
        {/* Recette du 04/11/2026 (f4-modale, Hermann : « Le voile grisé déjà en place […] doit simplement rester et
            accueillir la modale des formats ») : la route s'affiche sans transition ; la modale monte seule, par le bas,
            dans le voile de la fenêtre Formats resté en place (`FormatModelScreen`). [`slide_from_bottom` de la route,
            voile compris — remplacé.] */}
        {/* ESSAI du 04/11/2026 (branche pre9-bmad/essai-feuille-native, Hermann : « Pourquoi la modale des formats ne
            bénéficie-t-elle pas de cet effet "lumière" qui est appliqué à la modale de présentation de la fiche des
            mouvements ? » ; « Est-il possible de tester la première option, notamment sur la question du voile ? ») :
            feuille native iOS (Liquid Glass du système), haut à y = 95 par sa hauteur ; voile du système. */}
        {/* [formats-window, format-questionnaire, format-summary, movement-sheet : déplacées dans la pile racine (`app/_layout.tsx`),
            règle du 06/11/2026.] */}
        {/* Recette iPhone du 04/11/2026 (décision de Hermann) : appui court sur la photo d'une carte d'Exercice de
            la Composition — fiche de l'Exercice en lecture seule, « au format de la modale iOS, apparition et
            disparition par le bas » ; feuille native sans poignée, fond blanc, hauteur ajustée par la route. */}
        <Stack.Screen name="exercise-sheet" options={{ presentation: "formSheet", sheetGrabberVisible: false, contentStyle: SHEET_CONTENT }} />
        {/* Demande de Hermann du 04/11/2026 (« Afficher en mode modale iOS (mode d'apparition identique à la fiche des
            mouvements du questionnaire par exemple) […] Catalogue des mouvements : Filtres ») : Filtres du Catalogue des
            mouvements ouvert par Créer (`movement-selection`), même feuille native que dans le Catalogue (cohérence).
            [Modale React Native dessinée — voile en fondu, montée par translation, poignée — remplacée.] */}
        <Stack.Screen name="selection-filters" options={{ presentation: "formSheet", sheetGrabberVisible: false, contentStyle: SHEET_CONTENT }} />
      </Stack>
  );
}

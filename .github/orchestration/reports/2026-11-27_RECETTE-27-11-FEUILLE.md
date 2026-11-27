# Recette iPhone du 26/11/2026 (soir) — paquet FEUILLE

## Objectif

1. Décision de Hermann du 27/11/2026 (classe B) : la Composition ouverte depuis une carte du catalogue des séances (D-602) passe de la feuille native `formSheet` à une **modale plein écran** (`fullScreenModal`, sans geste, fermée par ses propres boutons). Réponse retenue : « Modale plein écran — Toujours une modale iOS qui monte du bas, fermée par la croix, mais sur tout l'écran : sans bord arrondi, sans l'écran visible derrière, et sans le geste de la feuille. » Constat d'origine (cahier, d607-compo-hauteur) : « Dès qu'on ouvre une séance sauvegardée, le recadrage du circuit, du cycle, le réordonnancement des exercices, ne marchent plus. […] l'appui long fonctionne, la carte se déplace un peu jusqu'au bord de l'autre objet et fait un rebond pour revenir à sa position. Création d'un circuit ou d'un cycle, pas de déplacement possible du périmètre. »
2. Ligne cahier d607-compo-notification (KO) : après le toucher d'un rappel pendant que la modale « Paramètres d'exécution » est ouverte sur la Composition d'une séance sauvegardée, puis « Retour » : Composition vide affichée avant la modale ; corps vide après fermeture de la modale ; exercice ajouté invisible ; tout réapparaît après fermeture et réouverture.

## Branche et commit de départ

- Worktree `C:\Dev\KODJO-R27-FEUILLE`, branche `fix/recette-27-11-feuille`, créée depuis `recette/agenda-axe-20261124` @ `202570906`.

## Périmètre

- Demandé : points 1 et 2.
- Traité : point 1 (implémenté) ; point 2 (analyse ; aucune modification de code — voir « Constats »).

## Constats et causes

### Historique (règle du diagnostic historique)

- D-602 (`2026-11-25_CARTE-SEANCE-MOSAIQUE.md`) : `creationRouteOptions` présente le groupe `(creation)` en `formSheet` quand `presentation=modal` ; recette du 25/11 : en-tête sans réserve de barre d'état (`topInset: 0`).
- Paquet NOTIF (`2026-11-26_RECETTE-26-11-NOTIF.md`, commit `3cf4b0f6a`, présent dans la base) : `useHostScreenFocused` démonte la `Modal` de `ExecutionParametersSheet` pendant le recouvrement et ne la présente de nouveau qu'à `transitionEnd` (repli 700 ms). Il a été recetté sur une Composition ; la ligne d607-compo-notification porte sur une Composition **en feuille** (séance sauvegardée ouverte depuis le catalogue, D-602 livré le 25/11). Aucune preuve conservée d'un succès comparable du même parcours (rappel → retour) sur une Composition en feuille : dernière preuve comparable **absente**.

### Point 1 — gestes de la Composition en feuille (cause plausible, non démontrée)

- Cause probable : la feuille native (`UISheetPresentationController`, react-native-screens 4.26) garde son geste de glisser même avec `gestureEnabled: false` (qui ne fait que bloquer la fermeture) ; il reprend le toucher dès que le défilement est verrouillé par le glisser d'une carte ou d'un bord de circuit, ce qui annule le geste React Native et ramène la carte. Concordance : une séance neuve (écran poussé, sans feuille) n'est pas touchée. Attribution : **plausible** ; Jest ne reproduit pas l'arbitrage des gestes natifs.
- La décision de Hermann supprime la feuille : plus de geste de feuille, quelle qu'en soit la cause exacte.

### Point 2 — symptômes après un rappel (cause non démontrée en code)

Lecture du code (base `202570906`) :

- `ReminderOpenGate` pousse `/execution` (`fullScreenModal`) sur la pile racine ; le retour (`router.back`) le retire. Ni l'Exécution ni la porte ne touchent au brouillon partagé (`useSessionDraft` absent de `src/features/execution`) : l'« écran vide » n'est pas un brouillon remis à zéro. Le corps de la Composition (`Animated.ScrollView` `composition-body`) est rendu sans condition dès que l'état est `ready` ; un brouillon vide afficherait encore le Compte à rebours initial et la Fin de séance. Or Hermann ne voit que la zone de contexte et le bouton d'action : c'est donc la **vue native** du corps (taille ou position) qui ne s'affiche pas, pas l'état React.
- Symptôme a (« Composition vide avant la modale ») : la Composition visible au retour **avant** la modale découle directement du correctif NOTIF : la `Modal` de React Native ne peut être présentée qu'une fois l'Exécution refermée (`transitionEnd`), sinon iOS ignore la présentation et bloque les touchers (constat de la veille). De plus, react-native-screens referme lui-même une modale étrangère (`Modal` de React Native) avant de présenter un nouvel écran modal (`RNSScreenStack.mm`, `setModalViewControllers`, branche « firstModalToBeDismissed » non possédée). Avec une `Modal` de React Native, l'écran hôte est donc nécessairement visible pendant la fermeture de l'Exécution ; seule la durée (fondu de l'Exécution + attente de `transitionEnd`) peut varier. Ce comportement ne change pas avec la modale plein écran.
- Symptômes b et c (corps vide, ajout invisible) : hypothèse, non démontrée — la feuille `formSheet` recouverte par une présentation plein écran (l'Exécution) puis découverte recalcule sa taille (`RNSScreen updateBounds` → état de taille transmis à React, `viewDidLayoutSubviews`) ; une taille transitoire erronée laisserait le corps flexible (`flex: 1`) à une hauteur nulle ou hors champ, tandis que la zone de contexte et l'action basse restent visibles. Une réouverture recrée la feuille, d'où le retour à la normale. La modale plein écran prend la taille de la fenêtre, sans détente ni calcul de hauteur de feuille : ces deux symptômes **peuvent** disparaître avec le point 1. À vérifier sur iPhone.
- Aucune correction de code n'est faite pour le point 2 : la cause n'est pas démontrée, et la seule cause établie (symptôme a) relève d'une limite de la primitive `Modal` (voir À CLARIFIER).

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : toutes les autres ouvertures de la Composition (Créer, planification, `keepDraft`) — `creationRouteOptions` les rend toujours `{ gestureEnabled: false }` (test « autres ouvertures : inchangées ») ; le paramètre `presentation=modal` et `isModalCompositionRoute` ; Démarrer dans l'action finale en modale (`modal && sessionId !== null`, inchangé) ; titre « Modifier une séance » ; `ExecutionParametersSheet`, `useHostScreenFocused`, `ReminderOpenGate`, `app/_layout.tsx` (non modifiés) ; feuilles natives posées au-dessus de la Composition (`movement-selection`, `exercise-sheet`, `formats-window`…), inchangées.
- CHANGE : présentation du groupe `(creation)` ouvert depuis une carte : `formSheet` (+ options de feuille) → `fullScreenModal`, `gestureEnabled: false` ; en-tête de la Composition en modale : réserve de barre d'état rétablie (suppression de `topInset: 0`).
- FORBIDDEN : remplacer la `Modal` des paramètres par une autre primitive ; toucher aux gestes de la Composition ; modification native.
- Démonstration : `git diff --stat 202570906` limité à `compositionRoutePresentation.ts`, au seul bloc de l'en-tête et au commentaire de la prop `modal` de `CompositionScreen.tsx`, aux trois tests et aux deux documents.

## Modifications

- `src/features/sessions/compositionRoutePresentation.ts` : `creationRouteOptions` renvoie `{ presentation: "fullScreenModal", gestureEnabled: false }` pour une ouverture depuis une carte ; commentaire daté (formulation remplacée annotée) ; import `NATIVE_SHEET_CONTENT` retiré.
- `src/features/sessions/CompositionScreen.tsx` : suppression de `{...(modal ? { topInset: 0 } : {})}` dans `FixedHeader` (commentaire daté) ; commentaire de la prop `modal` mis à jour.
- Tests : `compositionRoutePresentation.d602.test.ts`, `app/__tests__/rootLayoutGesture.test.tsx`, `CompositionScreen.test.tsx` (en-tête en modale : `paddingTop: 47`, réserve de la zone sûre de test).

## Tests et résultats

- `npx jest -w 1 --workerIdleMemoryLimit=800MB` : `compositionRoutePresentation.d602.test.ts`, `rootLayoutGesture.test.tsx`, `CompositionScreen.test.tsx`, `compositionCreateEntry.test.tsx`, `CatalogueScreen.test.tsx` — 5 suites, 471 tests : 470 PASS, 1 FAIL.
- Échec unique : `CompositionScreen.test.tsx` › « modale plein écran : … Démarrer (brouillon inchangé) … » — `Unable to find an element with testID: composition-save-action`, **après** l'assertion modifiée (`paddingTop`, qui passe). Échec **préexistant** : le même test échoue sur la base `202570906` sans mes modifications (vérifié par `git stash` de mes deux fichiers puis `-t "Démarrer \(brouillon inchangé\)"` : 1 échec, même message). Hors périmètre (cause non recherchée : l'identifiant `composition-save-action` n'est plus rendu dans ce cas sur la base).
- `npx tsc --noEmit` : PASS (code 0).
- `npx eslint` (5 fichiers de code et de test modifiés) : 0 erreur, 3 avertissements préexistants (`formatCompactDuration`, `OCCURRENCE_CARD_HEIGHT` dans `CompositionScreen.tsx`, `sessionDraftsEqual` dans le test), hors des lignes modifiées.
- Passe complète non lancée (consigne du brief).
- Une suite Jest verte ne prouve ni la présentation plein écran, ni l'arbitrage des gestes, ni l'affichage après un rappel sur iPhone.

## Classe documentaire et documents touchés

- Point 1 : classe B (décision explicite de Hermann du 27/11/2026).
  - Registre ch07, entrée D-602 : formulations « feuille native iOS » et « en-tête sans réserve de barre d'état » annotées comme remplacées ; complément daté « [Recette iPhone du 26/11/2026 (soir) : …] » (sans nouveau numéro).
  - `docs/DSF-CARTE-SEANCE-VISUEL-INFOS-2026-11-24.md` § 4 : complément daté (modale plein écran).
  - Recherche ciblée des autres mentions (`D-602`, `creationRouteOptions`, « Composition … feuille native ») : `KODJO-Spec-Carte-et-catalogue-seances-2026-10-27.md` et `KODJO-Catalogues-cartes-modales-2026-11-06.md` disent « modale iOS », toujours exact ; ch12 sans mention de cette présentation. Non modifiés.
  - `docs/KODJO-Formats-entrainement-2026-11-02.md` : non concerné.
- Point 2 : aucun document (pas de correction ; constat en À CLARIFIER).

## À CLARIFIER

1. Symptôme a du point 2 (« cet écran ne doit pas apparaître ») : avec la `Modal` de React Native utilisée par « Paramètres d'exécution » (primitive gelée), l'écran hôte est forcément visible le temps que l'Exécution se referme : iOS ne présente pas une modale depuis un écran en transition, et react-native-screens referme la `Modal` avant de présenter l'Exécution. Pistes, toutes hors de ce paquet et à arbitrer : (a) accepter un court passage par la Composition, éventuellement raccourci (présenter la modale sans attendre le repli de 700 ms, apparition sans montée) ; (b) fermer la modale des paramètres sans la rouvrir quand un rappel est touché ; (c) présenter « Paramètres d'exécution » comme route native (changement de primitive : `CHANGE_REQUEST_REQUIRED`). Lecture prudente appliquée : rien n'est changé.
2. Symptômes b et c : à vérifier sur iPhone avec la modale plein écran ; s'ils persistent, la cause n'est pas dans la présentation de la Composition et une instrumentation ciblée (mesure `onLayout` de `composition-body` après le retour) sera nécessaire.
3. Aucune modification native.

## Vérifications iPhone restantes

1. Catalogue des séances → toucher une carte : la Composition monte du bas et couvre tout l'écran (sans bord arrondi, sans l'écran du catalogue visible derrière) ; titre sous la barre d'état ; aucun geste vers le bas ne la ferme ; la croix, Enregistrer/Fermer et Démarrer fonctionnent.
2. Dans cette Composition : appui long puis glisser d'un exercice, d'un circuit et d'un cycle ; déplacement du bord d'un circuit ou d'un cycle : plus de rebond vers la position d'origine.
3. Composition depuis une carte, modale « Paramètres d'exécution » ouverte → toucher un rappel → Retour : noter si la Composition apparaît brièvement (attendu, voir À CLARIFIER 1) ; après fermeture de la modale, le corps de la séance est visible et un exercice ajouté apparaît.

## Fichiers modifiés

- `src/features/sessions/compositionRoutePresentation.ts`
- `src/features/sessions/CompositionScreen.tsx`
- `src/features/sessions/__tests__/compositionRoutePresentation.d602.test.ts`
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`
- `app/__tests__/rootLayoutGesture.test.tsx`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/DSF-CARTE-SEANCE-VISUEL-INFOS-2026-11-24.md`
- `.github/orchestration/reports/2026-11-27_RECETTE-27-11-FEUILLE.md`

## Commit final et état Git

Voir le message final de la mission (hash du commit de livraison ; branche poussée sur `origin/fix/recette-27-11-feuille`).

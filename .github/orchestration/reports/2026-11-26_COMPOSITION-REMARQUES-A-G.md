# 2026-11-26 — COMPOSITION-REMARQUES-A-G

## Identifiant et objectif

Remarques a à g de Hermann (cahier de recette, section « AUTRES REMARQUES ») sur la Composition de séance et la modale des paramètres d'exécution.

- Branche : `fix/composition-remarques-20261126` (worktree `C:\Dev\KODJO-D607-COMPO`)
- Commit de départ : `785ac655`
- Périmètre demandé : remarques a, b (+ g, identique), c, d, e, f.
- Périmètre traité : a, b/g, c, e, f corrigés ; d non démontrable en code (voir ci-dessous).

## Constats, causes et corrections

### a — trait bleu du menu Créer à travers la croix
- Cause : l'axe du menu partait du centre du bouton flottant (`CreateMenu.tsx`) ; la croix est un rond de verre translucide, l'axe se voyait au travers.
- Correction : l'axe part du bord de la croix (haut à l'ouverture vers le haut, bas à l'ouverture vers le bas, D-594).
- PRESERVE : couleur, largeur, position horizontale de l'axe, pile des options, croix (verre, place, taille). CHANGE : point de départ vertical de l'axe. FORBIDDEN : bouton flottant, options, voile.
- Classe : A (conformité à la demande de Hermann sur un rendu ; aucune règle métier).

### b / g — libellé de l'action principale
- Correction : « Continuer » devient « Enregistrer » (création et modification). En Modifier une séance, « Fermer » tant que le brouillon est égal à la Séance réhydratée (même comparaison que la garde de sortie, sans suppression animée en attente) ; « Fermer » referme comme le X, sans enregistrer ; dès qu'un changement existe, « Enregistrer » (règles d'activation inchangées).
- PRESERVE : flux `handleSave`, règles d'activation, message D-107, placement / enveloppe / consultation. CHANGE : libellés, bouton « Fermer » en modification non modifiée. FORBIDDEN : garde d'abandon, X de l'en-tête.
- Classe : B (évolution validée par Hermann : D-388 / PRE-6 story 2.1 « Continuer » remplacé). Documentation à mettre à jour par la session principale (registre ch07, DSF Composition, README sessions lignes citant « Continuer »).

### c — glisser-gauche qui revient si le doigt bouge aussi à la verticale
- Analyse historique : les gestionnaires `handleTouchMove` / `handleResponderMove` / `handleMoveShouldSetResponderCapture` exigent à chaque mouvement |dx| > |dy| depuis e02fc9be / 7c54b8ad (28 et 31/10) ; seul changement du chemin depuis : 4d08903a (16/11, verrou de défilement pendant le glissement : `setNativeProps({ scrollEnabled })` et état d'écran). Attribution : indéterminée (4d08903a plausible : la composante verticale n'est plus absorbée par la liste). Dernier succès comparable : non conservé.
- Mécanisme corrigé (démontré en code) : une fois le glissement engagé, la carte cessait de suivre le doigt dès que la composante verticale dépassait l'horizontale ; au relâchement, sous la moitié de la course, elle revenait à sa position initiale.
- Correction : `shouldFollowSwipe` (`compositionGesture.ts`) — direction verrouillée à l'horizontale jusqu'au relâchement ; appliqué aux cartes de la Composition et, par option `lockSwipeDirection`, à l'en-tête des Circuits / Cycles de la Composition (`SwipeActionsRow`, autres écrans inchangés).
- PRESERVE : seuil d'engagement, tolérance d'appui, verrou de défilement du 16/11, ouverture à mi-course, annulation du toucher. CHANGE : suivi après engagement. FORBIDDEN : Catalogue, Agenda, Journal.
- Classe : A (conformité au comportement attendu du glissement, V2-CAT-01 / CE-T03-08).

### d — trait du circuit / cycle : l'écran bouge, pas le cadre
- Non corrigé : `EnvelopeHandle` et `useEnvelopePerimeterDrag` sont inchangés depuis bc3d409e (01/11) ; aucune modification ultérieure de gestes, de `overflow`, de `scrollEnabled` ou de capture de répondeur n'explique en code le symptôme. Candidats non démontrés : 4d08903a (16/11, verrou de défilement partagé), 1352d1a3 (24/11, menu Créer du bouton flottant et `GestureHandlerRootView`). Attribution : indéterminée.
- Vérification ciblée proposée sur iPhone : créer un circuit par le menu Créer, désigner deux cartes, glisser le trait bas ; noter si la liste défile dès l'appui ou seulement au mouvement, et si le même geste fonctionne après un défilement arrêté depuis plus d'une seconde (piste : défilement encore considéré « en cours » par la `ScrollView`, qui prend alors l'appui).

### e — modale des paramètres inerte après une notification
- Cause probable (non démontrable sous Jest) : rappel touché → `router.push("/execution")` (RM-054b) pendant qu'une `Modal` React Native est ouverte ; au retour, la `Modal` réapparaît sans toucher actif.
- Correction : `useHostScreenFocused` (`src/shared/ui`) — la `Modal` de `ExecutionParametersSheet` est retirée pendant que son écran hôte est recouvert (`blur`) et présentée de nouveau au retour (`focus`), état conservé. Modification de la feuille limitée à 3 lignes (import, crochet, `visible`).
- PRESERVE : tout le contenu de la feuille, animations, fermeture. CHANGE : `visible`. FORBIDDEN : `handleEditActivity`, contenu de la feuille (session concurrente).
- Classe : D (technique, aucun effet sur les règles).

### f — message « Ce nom est déjà utilisé… » affiché deux fois
- Correction : seul le message sous le nom (zone de contexte) reste ; celui du bas de l'écran est retiré. Les autres messages d'échec du bas (D-107, nom de mouvement) sont inchangés.
- Classe : A.

## Tests

- `npx tsc --noEmit` : PASS
- `npx jest compositionGesture.test.ts CreateMenu.test.tsx useHostScreenFocused.test.tsx i18n/index.test.ts -w 1` : 4 suites, 107 tests PASS
- `npx jest CompositionScreen.test.tsx -w 1` : 431 tests, 430 PASS au premier passage, le test ajouté corrigé (assertion « Fermer » ambiguë avec le X) puis PASS seul
- `npx jest` CatalogueCompositionEditFlow, CompositionSaveFlow, CompositionExerciseFlow, CompositionPausesFlow, EmptySessionOpenFlow, ExerciseEditingPaths (`-w 1`) : PASS après adaptation (EmptySessionOpenFlow et ExerciseEditingPaths : « Fermer » en modification non modifiée)
- `npx jest SwipeActionsRow* ExecutionParametersSheet* -w 1` : 12 suites, 438 tests PASS

## Hypothèses non démontrées
- c : origine 4d08903a plausible, non démontrée.
- d : cause indéterminée.
- e : mécanisme de la `Modal` inerte supposé ; la correction n'est prouvée que sur iPhone.

## Vérifications sur iPhone
- a : menu Créer ouvert, le trait bleu s'arrête au bord de la croix.
- b/g : Composer une séance affiche « Enregistrer » ; Modifier une séance affiche « Fermer » sans changement, « Enregistrer » après un changement.
- c : glisser-gauche en diagonale sur une carte et sur un circuit : la carte suit le doigt et s'ouvre.
- d : reproduction ciblée ci-dessus.
- e : notification pendant la modale des paramètres d'un format, retour depuis l'Exécution : les boutons répondent.
- f : nom déjà utilisé : un seul message, sous le nom.

## Fichiers modifiés
Voir le commit : `CreateMenu.tsx`, `CompositionScreen.tsx`, `compositionGesture.ts`, `SwipeActionsRow.tsx`, `ExecutionParametersSheet.tsx`, `useHostScreenFocused.ts` (nouveau), `fr.ts`, `enScreensComposition.ts`, tests associés, ce rapport.

## Commit final et état Git
Commit de livraison : voir le message de commit « fix(composition): remarques a à g du 26/11 » sur `fix/composition-remarques-20261126` ; état attendu après commit : propre.

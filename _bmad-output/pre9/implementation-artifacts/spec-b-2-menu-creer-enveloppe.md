# B.2 — Menu Créer et création par enveloppe

Story PRE-9, epic B. Autorisation : mission de Hermann « KODJO — PRE-9 : lancement du développement BMAD » (29/10/2026). Plan : `../planning-artifacts/epics.md` § B.2. Dépend de : B.1 (`done`). Arbitrages : ARB-06, ARB-07 (décidés) ; ARB-23 (entrée « Format », livrée par C.4).

## Règles appliquées (classe A)

- **Séance sans Circuit** (D-451 « aucun cycle implicite », COMP §1 : « un conteneur naît autour de membres existants, jamais vide », « il disparaît lorsque son dernier membre en sort ») : une Séance commence sans Circuit ; un Circuit vide n'est ni affiché ni enregistré. Domaine : `NO_CIRCUIT_ID`, `legacyFromStructure` lit une structure sans Circuit comme l'ancien modèle à Circuit vide ; `withoutEmptyLegacyCircuit` à l'enregistrement (`toStructuredSessionInput`) — un Point en tête du Circuit vide prend sa place, les Points d'après reculent d'un rang. Une Séance enregistrée avec un Circuit vide le perd à son prochain enregistrement.
- **Menu Créer** (COMP §5, Figma `10705:20223`) : « Créer un nouvel exercice », « Utiliser un mouvement existant », « Utiliser une séance existante » (indisponible avant B.8), « Ajouter un circuit », « Ajouter un cycle », « Annuler ». [Remplacé le 01/11/2026 — ordre de Hermann « Menu Créer et transformation du bouton », ch13 CE-T03-08 « Menu Créer — état cible » : quatre options, Créer un exercice, Utiliser une séance existante, Ajouter un circuit, Ajouter un cycle ; plus d'entrée « Utiliser un mouvement existant » (Mouvements existants repris par la saisie du nom dans « Créer un exercice ») ni de rangée Annuler (le « + » devient Annuler). Voir `spec-menu-creer-parametres-01-11.md`.]
- **Enveloppe** (ARB-06, Figma `10819:20344`, `10836:20478`) : contenus éligibles en pointillé ; un seul contenu désigné (trait plein) ; « Confirmer le circuit / le cycle » crée le conteneur autour de lui (compte 1, séries groupées), « Annuler » ne change rien. Éligibles (règles d'imbrication D-451) : Circuit — Exercice du niveau Séance ou direct d'un Cycle ; Cycle — Exercice ou Circuit du niveau Séance. Les contenus suivants rejoignent le conteneur par glisser-déposer (B.4). Domaine : `envelopeCandidates`, `wrapInContainer`, `currentLayout`, `withLayout` (`layoutOperations.ts`).
- **Nouvel Exercice** (ARB-07) : après le dernier Exercice entré, dans son conteneur (`insertExerciseInLayout`, `insertIntoRichLayout`) ; ancien modèle inchangé.

## Limites et indisponibilités

- « Utiliser une séance existante » : indisponible (B.8).
- « Ajouter un circuit / un cycle » indisponible lorsqu'aucun contenu n'est éligible (Séance vide), ou lorsque la Séance porte des Points d'arrêt et que le conteneur la ferait sortir de l'ancien modèle (structure générale sans Point avant B.6).
- Exercice formaté : non éligible (ARB-27, C.4).
- Structure générale : glisser-déposer, balayage, placement toujours désactivés (B.4–B.6) ; un nouvel Exercice dans un Circuit alterné n'est pas encore adapté à N (B.3).
- Changement de comportement de l'ancien modèle : plus de dépose « dans le Circuit vide » ; sans Circuit, la dépose se fait entre les zones avant et après ; un Circuit n'est créé que par « Ajouter un circuit ».

## À CLARIFIER (classe C — choix provisoires en place)

1. **Présentation du menu** : style existant de l'arbre « + » conservé (ARB-19), sans les pastilles à icône ronde de Figma ni feuille d'actions native.
2. **Action indisponible** : traitement repris du Catalogue (opacité 0,5) ; libellé d'accessibilité « {action} — indisponible ».
3. **Enveloppe** : contour 2 px bleu primaire, pointillé (éligible) ou plein (désigné), fond lavande translucide.
4. **Accessibilité** : « Envelopper {nom} dans le circuit / le cycle » ; annonces « {nom} désigné », « Circuit / Cycle créé autour de {nom} ».
5. **« Dernier Exercice entré »** (ARB-07) lu comme le dernier Exercice affiché, comme aujourd'hui (`appendActivityAfterLastDisplayed`).
6. **Libellés du menu** alignés sur COMP §5 : « Un nouvel exercice » → « Créer un nouvel exercice », « Un exercice existant » → « Utiliser un mouvement existant ». [Remplacé le 01/11/2026 — ordre de Hermann, ch13 CE-T03-08 « Menu Créer — état cible » : l'entrée du menu et la fiche ouverte s'intitulent « Créer un exercice » ; « Utiliser un mouvement existant » est retirée du menu. Voir `spec-menu-creer-parametres-01-11.md`.]

## Anomalie connue (hors story)

En structure générale, changer le niveau d'un Exercice depuis son éditeur remplace son identifiant dans `draft.exercises` mais pas dans la disposition : la carte passe en fin de niveau principal. À corriger avec B.4 (déplacements).

## Synchronisation code / documentation

- **Classe A** : D-451, COMP §1, §5, ARB-06, ARB-07. Aucun document normatif modifié.
- **Classe C** : points 1 à 6.
- **Classe D** : opérations de disposition, mode enveloppe (`EnvelopeFrame`, barre `PlacementBar` réutilisée), rail sans Circuit.

## Tests

- Domaine : `layoutOperations.b2.test.ts` (6) ; tests A.1, A.2 et C.1 mis à jour pour la Séance sans Circuit (un d'eux avait une fixture d'Exercices de Circuit mal placés). Écran : `CompositionScreen.b2.test.tsx` (12), `compositionLayout.b2.test.ts` (3), `ActivitySelectionScreen.b2.test.tsx` (1) ; environ 20 tests de `CompositionScreen.test.tsx` et `SessionService.test.ts` adaptés (« PRE-9 B.2 — D-451, COMP §1 »).
- Suite complète : voir `sprint-status.yaml`. Recette iPhone : cahier `recette-iphone-apres-b2.md`.

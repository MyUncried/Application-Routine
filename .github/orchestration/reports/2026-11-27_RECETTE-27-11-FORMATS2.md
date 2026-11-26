# 2026-11-27 — RECETTE-27-11-FORMATS2

## Identifiant et objectif

Paquet FORMATS2 des corrections de la recette iPhone du 26/11/2026 (soir) : Death by (titre de colonne, incrément et phases), bouton ± de la barre du clavier, AMRAP à l'échec dans la modale, couleur du cadre d'un Circuit issu d'un format dans la Composition.

- Worktree : `C:\Dev\KODJO-R27-FORMATS2` (jonction `node_modules` → `C:\Dev\Application-routine\node_modules`).
- Branche : `fix/recette-27-11-formats2`, créée depuis `recette/agenda-axe-20261124` au commit `202570906`.
- Commit final : voir « État Git ».

## Périmètre demandé (mots de Hermann)

1. Death by (tableau de la page du format et modale) : « remplacer le titre de colonne "incrément" par "+/- /tour" » ; « Death by : le nom de colonne "incrément" est trop long, remplacer par le "+/- /tour" ».
2. Death by, « champ incrément, bouton clavier +/- : quand + est activé, le - est bleu clair, et inversement quand - est activé le + est clair ».
3. Death by : « Incrément par tour d'un exercice qui a un mouvement avec des phases : l'incrément doit être un multiple de la somme des phases (message d'information avec proposition inférieure, supérieure, ou annuler). Ce n'est pas une obligation. »
4. AMRAP, ligne « d607-amrap » : « Sélection "à l'échec" dans le tableau : "incrément par tour" dans la modale doit être grisé ».
5. Remarque a : « composition de séance : colorer le cadre du circuit de la couleur du format ».

Hors périmètre (autre paquet) : taille des champs, popover « De chaque côté », phases.

## Périmètre réellement traité

Les cinq points, avec les réserves ci-dessous (À CLARIFIER 1 à 4). Rapports relus : `2026-11-26_RECETTE-26-11-FORMATS.md`, `2026-11-26_RECETTE-26-11-SUITE1.md`.

## Constats et causes

1. **Titre de colonne.** Le tableau Death by de la page (`FormatModelScreen`, cas `DEATH_BY`) titrait « Départ | Incrément » (`table.increment`). La modale n'a pas de colonne : elle a une ligne « Incrément par intervalle ». Précédent de l'AMRAP (16/11, « +/- / tour (plus au dessus du moins) ») → « ± / tour », avec un nom lu par VoiceOver distinct (`perRound`).
2. **Bouton ±.** `KeyboardAccessoryBar` affichait un glyphe « ± » unique ; l'état (négatif / positif) n'était porté que par l'accessibilité (`selected`). Le bouton n'est branché que pour l'**Incrément par tour de l'AMRAP** (page du format : `signBar`, cases `inc` ; modale : `format?.key === "AMRAP"`). Le Death by n'a pas de bouton ± : son incrément est positif, au moins + 1 (Formats, « Règle » du complément du 5 novembre ; bornes `min: 1` dans la modale). Hermann a donc vu le bouton sur un AMRAP, ou demande son ajout au Death by (À CLARIFIER 1). Correction appliquée au bouton partagé (là où il existe).
3. **Incrément et phases.** Aucun contrôle. Le mécanisme existant d'arrondi de la durée de série au motif des phases (`phaseCycleFit`, `askPhaseRounding`, décision du 09/11, alerte native « Inférieur / Supérieur ») est réutilisé, avec « Annuler » en plus (pas d'obligation). « Somme des phases » = durée du motif (Σ des durées des phases, `workPhasesCycleSeconds`) : le contrôle ne vaut qu'en **Durée** (en Répétitions, une répétition = un motif, rien à comparer).
4. **AMRAP à l'échec.** Dans la modale, la ligne était déjà verrouillée (aucun champ, valeur « — » en `colors.disabled`) quand la cible est « À l'échec » et le brouillon valide ; mais **le titre « Incrément par tour » restait noir**, alors que la ligne « Nombre de répétitions par tour » grisée de D-608 point 9 a son titre grisé (`formatLockedLabel`). Cause **plausible, non démontrée sur iPhone** : le titre non grisé. Second cas couvert par prudence : le verrou dépendait de `validation.ok` ; un autre réglage incomplet rendait la ligne saisissable. Le verrou lit désormais aussi la condition d'arrêt du brouillon.
5. **Cadre du Circuit.** L'aplat de tout Circuit de la disposition générale est gris (`CIRCUIT_SURFACE_COLOR` #EBEDF5), sans liseré (règle du 06/11 : « Pas de liseré, dans aucune situation »). La couleur du format existe déjà : `formatModelColors(key).background` (zone de contexte de la page du format, en-tête des modales de ses exercices, D-608 point 7, `formatTintModelOf`). « Cadre » = aplat (le seul cadre du Circuit) ; couleur = `background` (une seule couleur déjà utilisée à ces deux endroits ; `band`, plus soutenue, n'est utilisée que pour la bande de la carte des formats).

## PRESERVE / CHANGE / FORBIDDEN

| | Éléments |
|---|---|
| PRESERVE | Nom lu par VoiceOver des cases Death by (« Incrément ») ; titre de la ligne de la modale (« Incrément par intervalle ») ; tableau `DeathByTable` de `FormatTables.tsx` (non monté en production) ; comportement du bouton ± (action, accessibilité, emplacement, fondu) ; bornes de l'incrément (Death by ≥ 1, ≤ 3600 s) ; alerte d'arrondi de la durée de série (`askPhaseRounding`) ; incrément AMRAP requis / « — » rouge (SUITE1) ; verrou buy-in / buy-out ; aplat des Circuits composés à la main ; tonalités « à compléter » / « à vérifier » du Circuit replié ; absence de liseré ; ancien modèle « Tour » de la Composition (`legacyCircuitTone`) ; taille des champs, popover « De chaque côté », phases (autre paquet). |
| CHANGE | `table.incrementHead` (« ± / tour ») en titre de la colonne Death by ; bouton ± : « + » au-dessus de « − », inactif atténué (bleu clair) ; alerte d'arrondi de l'incrément Death by en Durée (page et modale) ; titre grisé de l'Incrément par tour verrouillé ; verrou lu aussi sur le brouillon ; aplat, couches animées et en-tête collé d'un Circuit issu d'un format à la couleur du format. |
| FORBIDDEN | Nouvelle primitive (alerte native `Alert.alert` réutilisée) ; signe négatif pour le Death by ; blocage de la validation pour un incrément non multiple ; liseré ; refonte de `CompositionScreen`, `ExecutionParametersSheet`, `FormatModelScreen` (agents en parallèle : diffs localisés) ; modification native. |

Démonstration PRESERVE : `FormatTables.tsx`, `formatSheetContext.ts`, `formatModels.ts` absents du diff ; `askPhaseRounding` inchangé (suite `ExecutionParametersSheet.phases` 47/47 verte sans modification) ; tests SUITE1 (« — » rouge, buy-in grisé) verts sans modification (`format0711` 27/27) ; test `formatKeyboard.recette0411` (action et `selected` du bouton ±) vert sans modification ; Circuits à la main toujours #EBEDF5 (`CompositionScreen.b2` vert sans modification, nouveau test `d608` : Circuit « cb » #EBEDF5).

## Modifications

- `src/shared/i18n/resources/fr.ts`, `enScreensActivities.ts` : `table.incrementHead` (« ± / tour » / « ± / round »).
- `src/features/sessions/FormatModelScreen.tsx` : titre de colonne Death by (l. 2567) ; `onIncrement` (l. 2588) : après la saisie d'un incrément en Durée d'un mouvement à phases, alerte native (inférieur, supérieur, Annuler) ; `DEATH_BY_INCREMENT_MAX_SECONDS` (3600, borne de la modale).
- `src/domain/activities/phaseCycleFit.ts` (l. 43) : `incrementCycleRounding` (multiple inférieur proposé s'il reste ≥ 1 s, supérieur s'il reste dans la borne, `null` si multiple ou sans motif).
- `src/features/activities/ExecutionParametersSheet.tsx` (localisé) : `askIncrementRounding` (l. 918) appelé à la sortie du champ Incrément d'un Death by en Durée quand la valeur change ; verrou de l'Incrément AMRAP lu aussi sur le brouillon (l. 1877) ; titre grisé de la ligne verrouillée (`labelNode`, `formatLockedLabel`, l. 2280).
- `src/features/activities/KeyboardAccessoryBar.tsx` (l. 363) : « + » et « − » empilés, le signe inactif à l'opacité `BAR_DISABLED_OPACITY` (bleu clair) ; style `signLabel` remplacé par `signStack` / `signPart` / `signPartOff`.
- `src/features/sessions/CompositionScreen.tsx` (l. 9558, bloc Circuit de la disposition générale seulement) : `formatFill` = `formatModelColors(originModel ?? format.key).background` ; aplat au repos, couches animées (`CircuitSurface`) et en-tête collé (`StickyHeaderFrame`) ; tonalité du replié prioritaire.
- i18n `frExecutionParameters.ts`, `enExecutionParameters.ts` : `incrementCycleTitle`, `incrementCycleMessage`, `incrementCycleRoundTo`, `incrementCycleKeep`.
- Tests : nouveau `ExecutionParametersSheet.recette2611soir.test.tsx` (7 tests : helper, alerte inférieur / supérieur / Annuler et arrondi appliqué, inférieur nul exclu, multiple exact, Répétitions sans alerte, AMRAP à l'échec titre grisé, AMRAP à l'objectif non grisé, bouton ±) ; `CompositionScreen.d608.test.tsx` (cadre Tabata #FDECEC, Circuit à la main #EBEDF5) ; `FormatModelScreen.tableauUnique.test.tsx` (titres Death by).

## Tests et résultats

- `npx tsc --noEmit` : OK.
- `npx eslint <fichiers modifiés>` : 0 erreur ; 2 avertissements préexistants dans `CompositionScreen.tsx` (`formatCompactDuration`, `OCCURRENCE_CARD_HEIGHT`, non touchés).
- Jest ciblé (`npx jest -w 1 --workerIdleMemoryLimit=800MB`) :
  - `ExecutionParametersSheet.recette2611soir`, `ExecutionParametersSheet.format0711`, `formatKeyboard.recette0411`, `CompositionScreen.d608` : 4 suites, 50/50 ;
  - `FormatModelScreen.tableauUnique`, `FormatModelScreen.d603`, `FormatModelScreen.d607-d608`, `formats.recette0811` : 4 suites, 85/85 ;
  - `CompositionScreen.b2`, `CompositionScreen.circuitActions0411`, `CompositionScreen.supersetLimit`, `recette3.circuits`, `StickyHeader` : 5 suites, 55/55 ;
  - `ExecutionParametersSheet.phases` : 47/47 ; `ExecutionParametersSheet.test.tsx` filtré « AMRAP|Incrément|increment|Death|signe|sign » : 8/8.
- Passe complète non lancée (consigne).
- Non couvert par Jest : l'alerte de la **page** du format (pas de mouvement à phases dans les jeux d'essai de `FormatModelScreen` ; même helper que la modale, testé). Une suite Jest verte ne prouve ni le rendu iPhone (glyphes empilés, couleurs), ni l'alerte native réelle.

## Classe documentaire et documents touchés

Classe **B** (décisions explicites de Hermann).
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` : D-607, complément daté « [Recette iPhone du 26/11/2026 (soir) : …] » (points 1 à 4) ; D-608, complément daté (point 5).
- `docs/KODJO-Formats-entrainement-2026-11-02.md` : § 9.9, « Complément — recette iPhone du 26/11/2026 (soir) » (titre « Départ | Incrément » annoté remplacé) ; § 9.10, annotation datée (cadre du Circuit).

## À CLARIFIER

1. **Bouton ± du Death by.** Le bouton n'existe que pour l'AMRAP ; l'incrément du Death by est positif (≥ + 1, règle du 5 novembre). Le rendu « + / − » est appliqué au bouton existant (donc à l'AMRAP). Faut-il un bouton ± sur l'incrément du Death by (ce qui suppose un incrément négatif, contraire à la règle actuelle) ? Non fait.
2. **« +/- /tour » pour le Death by.** Le Death by progresse par intervalle (minute), pas par tour ; le titre demandé est appliqué tel quel, écrit « ± / tour » comme l'AMRAP (précédent du 16/11 : « +/- / tour (plus au dessus du moins) »). Le titre de la ligne de la modale reste « Incrément par intervalle » (ce n'est pas une colonne) ; à aligner si Hermann le souhaite.
3. **Annuler.** Lecture prudente : « Annuler » ferme le message et garde la valeur saisie (pas d'obligation). Multiple inférieur proposé seulement s'il est ≥ 1 s (0 interdit) ; supérieur seulement dans la borne du champ (1 h). Message seulement quand la valeur change, et seulement en Durée.
4. **Couleur du cadre.** Couleur de fond du format (`background`, celle de la zone de contexte et de l'en-tête des modales) plutôt que la couleur de bande (`band`, plus soutenue). Appliquée aussi à un Circuit porteur d'un format sans modèle d'origine (même règle que l'en-tête des modales, `formatTintModelOf`). Ancien modèle « Tour » de la Composition (hors disposition générale) non touché.
5. **Point 4, cause.** Le verrou fonctionnait déjà dans le cas testé (valeur « — » grisée, aucun champ) ; la correction porte sur le titre resté noir et sur le cas d'un brouillon invalide. Hypothèse, à vérifier sur iPhone.

## Vérifications iPhone restantes

Toutes — aucune vérification visuelle ni tactile n'a été faite :
1. Page Death by : colonne « ± / tour » à droite de « Départ ».
2. AMRAP (Volume croissant), case « ± / tour » : le bouton de la barre montre « + » au-dessus de « − » ; « + » foncé et « − » bleu clair ; un appui inverse.
3. Death by, mouvement à phases (ex. 5 s + 10 s), unité Durée : saisir 20 s en incrément puis Suivant / Fermer → message « Arrondir l'incrément ? » avec « Arrondir à 15 s », « Arrondir à 30 s », « Annuler » ; Annuler garde 20 s ; même chose dans la modale.
4. AMRAP, tableau : cocher « À l'échec » → ouvrir la modale du mouvement : « Incrément par tour » grisé (titre et « — »), aucun champ.
5. Composition : un Circuit issu d'un format (Tabata, EMOM…) a son cadre à la couleur du format (comme l'en-tête de ses modales) ; Circuit composé à la main gris ; Circuit replié à compléter : rouge prioritaire ; pas de raccord visible entre l'en-tête collé et le cadre pendant le défilement.

## Fichiers modifiés

- `src/domain/activities/phaseCycleFit.ts`
- `src/features/activities/ExecutionParametersSheet.tsx`
- `src/features/activities/KeyboardAccessoryBar.tsx`
- `src/features/sessions/CompositionScreen.tsx`
- `src/features/sessions/FormatModelScreen.tsx`
- `src/shared/i18n/resources/fr.ts`, `enScreensActivities.ts`, `frExecutionParameters.ts`, `enExecutionParameters.ts`
- `src/features/activities/__tests__/ExecutionParametersSheet.recette2611soir.test.tsx` (nouveau)
- `src/features/sessions/__tests__/CompositionScreen.d608.test.tsx`, `FormatModelScreen.tableauUnique.test.tsx`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/KODJO-Formats-entrainement-2026-11-02.md`
- `.github/orchestration/reports/2026-11-27_RECETTE-27-11-FORMATS2.md`

## État Git

Commit unique de livraison (code, tests, documentation, ce rapport) sur `fix/recette-27-11-formats2`, poussé sur `origin/fix/recette-27-11-formats2` ; hash communiqué dans le message final. Arbre propre après push (hors jonction `node_modules`, non suivie).

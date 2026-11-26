# 2026-11-26 — RECETTE-26-11-FORMATS

## Identifiant et objectif

Paquet FORMATS des corrections de la recette iPhone du 26/11/2026 (après-midi) : pages des formats (`FormatModelScreen`, tableaux, zone de contexte), modale Renforcement, écran d'exécution.

- Branche : `fix/recette-26-11-formats` (worktree `C:\Dev\KODJO-R26-FORMATS`)
- Départ : `feat/exercice-libre-page-20261126`, commit `30214251f`
- Commit final : voir l'état Git en fin de rapport (message de livraison).

## Périmètre demandé (verbatim de Hermann)

- GÉNÉRAL : « Zone de contexte : la durée totale est alignée à droite, en texte noir. »
- SUPERSET : « A la validation du nombre de mouvements, le titre change (ok), mais le sous-titre doit changer aussi (deux, trois, quatre, ou cinq). »
- TABATA, 30/30, HIIT : colonne « Objectif » → « Intervalle » ; Durée totale en dernière ligne (Tabata à la suite : après « Récupération entre les mouvements » ; sinon après « Exécution ») ; plus de colonne Charge, charge « (12 kg) » sous l'intervalle, rien sans charge ; dernière colonne alignée à droite.
- RENFORCEMENT : Durée totale après « Exécution » ; ligne globale « Nombre de séries » supprimée ; tableau dont la première colonne est « Séries » ; charge sous l'Objectif ; dernière colonne à droite ; modale « Paramètres d'exécution » en trois cadres (Mode / Nombre de répétitions, Nombre de séries, Pause, Charge / De chaque côté, Cadence) ; nombre de séries par mouvement (modèle de données et durée).
- DEATH BY : charge sous « Départ », plus de colonne Charge, Incrément aligné à droite.
- PROGRESSION : Durée totale après « Exécution ».
- ÉCRAN « EXÉCUTION D'UN EXERCICE — DÉMARRÉE » : quatrième forme d'angle en bas à gauche, symétrique, sans contenu.
- Documentation : Formats § 9.x et registre (compléments datés de D-607 / D-608), classe B.

## Périmètre réellement traité

Tous les points. Figma consulté en lecture (capture `12455:26716`, Tabata : Intervalle | Pause, « (12 kg) » sous l'intervalle, Pause calée à droite, Durée totale en dernière ligne) — lecture de source, pas une validation visuelle.

## Constats et causes

- **Zone de contexte** : les pages des formats n'ont pas de durée dans leur zone de contexte ; la Durée totale du cadre des paramètres y est déjà à droite, en noir (#141414). La seule « durée totale » d'une zone de contexte est celle de la séance dans `CompositionContextHeader` : en gris tertiaire, collée à la puce Étiquette. C'est elle qui est corrigée (lecture retenue ; voir À CLARIFIER).
- **Superset** : `formatModelName` suivait le nombre de mouvements, l'accroche (`taglines.SUPERSET`) non.
- **Tableaux** : depuis le 15/11 (« Formats à tableau »), Tabata / 30/30 / HIIT / Renforcement / À l'échec avaient Objectif | Pause | Charge, Death by Départ | Incrément | Charge (`formatBlocks`).
- **Ordre des lignes** : `totalRow` était placé avant `executionRow` (Tabata, 30/30, HIIT, Renforcement, Progression).
- **Nombre de séries du Renforcement** : aucune donnée par mouvement dans le brouillon (`MovementValues`), seulement `ModelAnswers.seriesCount` ; l'Exercice produit porte déjà son propre nombre de séries (`series.count`) — aucune migration nécessaire.
- **Modale Renforcement** (départ rapide `quickValueRow`) : sans cadre Mode (sauf unité à choisir), sans Pause, sans nombre de séries.
- **Exécution** : les coins ne sont posés que pour une information affectée (`executionCorners`) ; aucun coin vide.

## PRESERVE / CHANGE / FORBIDDEN

| | Éléments |
|---|---|
| PRESERVE | À l'échec (Objectif | Pause | Charge, sa colonne Charge) ; AMRAP, EMOM, Superset, For time (tableaux) ; ordre de Suivant Objectif > Pause > Charge ; modale « Paramètres d'exécution » des autres formats ; primitives (`DimensionBlock`, `TableCell`, `ChargeValue`, `ExecutionCornerBadge`, `SegmentedControl`) réutilisées sans remplacement ; zone de contexte des pages des formats ; Durée totale (texte) du cadre des paramètres. |
| CHANGE | Titres et colonnes des tableaux cités ; charge sous la première valeur ; alignement à droite de la dernière colonne (option `lastAlignRight` / `alignRight`, localisée) ; ordre des lignes (Durée totale en dernier) ; ligne « Nombre de séries » du Renforcement retirée ; colonne Séries + donnée `seriesCount` par mouvement ; accroche du Superset ; modale Renforcement (cadre Mode, ligne Nombre de séries, Pause) ; coin vide bas gauche ; durée de séance de la zone de contexte. |
| FORBIDDEN | Refonte de `ExecutionParametersSheet` (autre agent en parallèle : ajout localisé de 4 blocs seulement) ; nouvelle primitive ; migration de base ; changements « par cohérence » sur d'autres formats. |

Démonstration PRESERVE : test `UNTIL_FAILURE` des colonnes inchangé et vert ; tests AMRAP / EMOM / Progression / Superset des tableaux inchangés et verts ; ordre de Suivant : seule l'entrée `ser` est ajoutée en tête pour le Renforcement (`FormatTables.tableCellOrder`).

## Modifications

- `src/features/sessions/CompositionContextHeader.tsx` : durée de séance `marginLeft: "auto"`, bord droit de la colonne, `text-primary`, `textAlign: right`.
- `src/features/sessions/FormatModelScreen.tsx` : accroche du Superset selon le nombre de mouvements ; ordre des paramètres (Tabata/30/30/HIIT, Renforcement, Progression) ; ligne « Nombre de séries » du Renforcement retirée ; tableaux Intervalle | Pause, Séries | Objectif | Pause, Départ | Incrément ; charge sous la première valeur (`chargeBelow`, `ChargeValue`) ; dernière colonne à droite ; nombre de séries par mouvement (case du tableau, retour de la modale).
- `src/features/sessions/ForTimeBlocks.tsx` : `DimensionBlock.lastAlignRight` (titre de la dernière colonne à droite).
- `src/features/sessions/FormatTables.tsx` : `TableCell.alignRight` ; genre de case `ser` ; ordre de Suivant du Renforcement (Séries en tête).
- `src/domain/sessions/formatModels.ts` : `MovementValues.seriesCount` (additif) ; `strengthSeriesCount` ; construction du Renforcement avec le nombre du mouvement.
- `src/domain/sessions/formatTimeline.ts` : Déroulé du Renforcement au nombre de séries de chaque mouvement.
- `src/domain/sessions/formatReedit.ts` : réouverture — nombre de séries par mouvement repris quand les mouvements diffèrent.
- `src/features/activities/ExecutionParametersSheet.tsx` (localisé) : Renforcement — cadre Mode toujours présent, ligne « Nombre de séries » (champ clavier existant `scalarField("count")`), Pause rétablie, ordre de Suivant.
- `src/features/execution/ExecutionScreen.tsx` : coin vide bas gauche.
- i18n : `supersetTaglines`, `table.interval`, `table.seriesHead`, `seriesCountRow` (fr / en).
- Tests : `FormatModelScreen.tableauUnique`, `FormatModelScreen.d603`, `CompositionScreen` (durée de séance), `ExecutionScreen.amrapMax.d531` (coin vide).

**Donnée ajoutée (à signaler)** : `MovementValues.seriesCount` — donnée du brouillon du format seulement (non persistée telle quelle) ; l'Exercice enregistré porte son nombre de séries habituel. Durée totale : calculée sur la structure produite (`modelDuration`), donc à jour ; Déroulé aligné.

## Tests et résultats

- `npx tsc --noEmit` : OK.
- `npx eslint <fichiers modifiés>` : 0 erreur (1 avertissement préexistant, `openGeneric` dans `formatTimeline.ts`).
- Jest ciblé (première passe, avant mise à jour des tests) : `FormatModelScreen*`, `formatModels*`, `formatTimeline*`, `formatReedit*` — 15 suites, 7 échecs attendus (anciennes colonnes Charge, ancienne modale du Renforcement), tous mis à jour.
- Jest ciblé après mise à jour : voir la section « Résultats finaux » ci-dessous.
- Une suite Jest verte ne prouve pas le rendu iPhone.

## Classe documentaire

Classe **B** (décisions explicites de Hermann).
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` : compléments datés « [Recette iPhone du 26/11/2026 (après-midi) : …] » de D-607 (texte complet) et D-608 (modale du Renforcement, HIIT).
- `docs/KODJO-Formats-entrainement-2026-11-02.md` : § 9.9, « Complément — recette iPhone du 26/11/2026 (après-midi) » ; § 9.5, annotation de remplacement datée.

## À CLARIFIER

1. **Zone de contexte** : lecture retenue = durée de séance de la Composition (seule durée d'une zone de contexte) ; les pages des formats l'affichent déjà à droite en noir. Si Hermann visait autre chose, à préciser.
2. **Accroche Superset 3 à 5** : « … puis une récupération après le tour. » (au lieu de « après la paire »).
3. **Renforcement en alternance** : séries alternées = nombre de tours commun du circuit ; la case « Séries » d'une ligne règle tous les mouvements, la modale l'affiche imposé (non éditable effectivement). Nombre différent par mouvement en alternance : à décider.
4. **Coin vide** : posé quand le coin bas droit est affiché et le bas gauche libre ; pas sur les autres états de l'écran.

## Vérifications iPhone restantes

Toutes (rendu, alignements, tailles de la charge, clavier de la colonne Séries, modale en trois cadres, coin vide) — aucune vérification visuelle n'a été faite.

## Fichiers modifiés

Voir « Modifications » ; plus ce rapport.

---
title: 'R-5 — Création : unicité (C01), variante (C02), recherche R02 à R05'
type: 'feature'
created: '2026-10-26'
status: 'done'
baseline_commit: '4a6fecfb'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/KODJO-Niveaux-Recherche-Parcours-Regles-v7.md'
  - '{project-root}/docs/DSF-NIVEAUX-RECHERCHE-2026-10-25.md'
  - '{project-root}/_bmad-output/pre7/planning-artifacts/sprint-change-proposal-2026-10-26.md'
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-reprise-q1-q11.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Le parcours de création suit encore A2.3 :
- proximité lexicale par suite de mots (`movementSuggestion.ts`), proposée à la fin de la saisie dans une feuille à trois choix ;
- variante qui reprend description et médias, sans choix Plus facile / Plus difficile ni rattachement ;
- aucun contrôle d'unicité pendant la saisie : un nom pris n'échoue qu'à l'enregistrement, avec l'erreur générique (reports R-3 et R-4 de `deferred-work.md`) ;
- recherche explicite par sous-chaîne, sans « Voir tous les mouvements ».

D-445 C01 et C02 (ch07 l.897-898) et la v7 §2 (l.33-41) et §6 R02-R07 (l.84-267) remplacent ces règles ; la proposition du 26/10 §R-5 (critères 1 à 7) les met dans PRE-7.

**Approach:** Score R02 pur dans le domaine (normalisation, jetons, trigrammes par jeton, préfixe, seuils, bonus plafonnés, un résultat par mouvement sur nom et alias). Le corpus R07 devient un test. Le panneau sous le nom s'ouvre pendant la saisie et porte les cartes Résultat (`10199:22268`) ; l'écran de recherche suit R03. L'unicité est contrôlée pendant la saisie dans tous les éditeurs, et toujours garantie par le repository.

## Boundaries & Constraints

**Always:**
- **C01, unicité** (v7 l.35, l.67 ; MFN-06 ch10 l.363) :
  - clé `normalizeMovementName` ;
  - erreur « nom déjà utilisé » affichée pendant la saisie, et `Terminer` indisponible tant qu'elle dure ;
  - le contrôle exclut le mouvement en cours d'édition (correction, occurrence déverrouillée, Mouvement `NEW` de l'occurrence), mais pas pour une création distincte (« Créer un nouveau mouvement », variante, mouvement neuf) ;
  - dans une Séance, il couvre les mouvements enregistrés et ceux du brouillon (`NEW`, `EDITED` renommés) encore référencés ;
  - à l'enregistrement, une `DuplicateMovementNameError` affiche le message propre, jamais l'erreur générique.
- **C02, variante** (v7 l.37 ; MFN-07 l.371-373) :
  - « Créer une variante » sur une carte, puis Plus facile / Plus difficile ;
  - description et médias vierges ; Catégorie et Zones reprises de l'origine si elles sont vides ;
  - nom conservé, avec l'invite grise « (compléter le nom) » : affichée par-dessus le champ, jamais dans la valeur, effacée à la première saisie ;
  - similarité désactivée ensuite ;
  - à l'enregistrement, le mouvement est inséré avant (Plus facile) ou après (Plus difficile) l'origine dans son groupe, créé au besoin, depuis le Catalogue comme depuis une Séance ;
  - aucune question sur la correction de l'origine.
- **R02** (v7 l.84-164) :
  - normalisation NFD, ponctuation et traits d'union comme séparateurs ;
  - mots fonctionnels de la liste retirés ; finale `s` ou `x` retirée si le radical garde au moins 4 caractères ;
  - Dice des jetons : une correspondance exacte vaut 1 ; un rapprochement vaut 0,5 sous les trois conditions (même initiale, écart de longueur ≤ 2, distance ≤ 1 jusqu'à 5 caractères et ≤ 2 au-delà) ;
  - trigrammes par jeton, avec caractères de garde ;
  - score = 0,55 × jetons + 0,35 × trigrammes + 0,10 × préfixe ;
  - seuils 0,75 (suggestion) et 0,45 (listé) ;
  - bonus +0,10 pour la Catégorie et +0,10 pour une Zone partagées ; ils ne font jamais franchir 0,75 si le score de nom est sous 0,65.
- **R03** : la saisie du nom déclenche le classement. Le panneau s'ouvre de lui-même dès qu'un mouvement atteint 0,75, ou qu'il y a un conflit de nom.

  L'écran de recherche s'ouvre prérempli avec le nom. Selon la requête, une seule liste :
  - requête renseignée : résultats listés, classés par pertinence ;
  - requête renseignée sans résultat : annonce et « Voir tous les mouvements » ;
  - requête vide : tous les mouvements dans l'ordre du Catalogue.
- **R04** :
  - panneau de 5 résultats au plus ;
  - carte Résultat : photo, nom, « Niveau N », description, et deux actions « Créer une variante » / « Utiliser ce mouvement » ;
  - Entrée ferme le panneau sans sélection ;
  - ordre figé pendant un appui.
- **R05** : le nom et les alias participent au classement ; chaque mouvement apparaît une seule fois, à sa meilleure correspondance.
- **R07** : le corpus minimal de la v7 (l.230-243) est un test de comportement, jamais une comparaison à un score.
- Un mouvement sans exercice ni occurrence reste listé par la recherche (v7 l.27, report R-3).

**Never:**
- Aucune migration ni colonne pré-calculée : le score est calculé en mémoire, sur la liste lue (v7 l.164 laisse ce choix à l'analyse technique).
- Ni fusion, ni rattachement, ni présélection tirés de la recherche (v7 l.158).
- Aucune modification de `tokens.ts`, `migration001.ts`, `package.json` ou `app.json`.
- Hors périmètre (R-6) : commande Niveau en Séance, remplacement d'occurrence par rang, suffixe « - Nn ».

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Nom pris en création | « squats » ; « Squats » existe | message rouge et cartes ; `Terminer` indisponible | N/A |
| Nom proche | « Pompe » ; « Pompes » existe | panneau, « Pompes » en tête | N/A |
| Variante Plus facile | origine « Squats », rang 1 sur 1 | invite grise ; enregistrée en rang 1 sur 2, origine 2 | nom laissé égal à l'origine : `Terminer` indisponible (l'invite tient lieu de message, le message suit la reprise de saisie) |
| Correction, casse seule | « squats » → « Squats », même mouvement | aucun conflit ; « Créer un nouveau mouvement » est refusé avec le message | N/A |
| Séance, deux créations locales | 2e occurrence nommée comme la 1re | message pendant la saisie | N/A |
| Recherche sans résultat | « zzz » | annonce + « Voir tous » ; tous les mouvements, y compris un mouvement sans exercice | N/A |
| Concurrence | nom pris entre la lecture et l'écriture | message « nom déjà utilisé » | brouillon conservé |

</frozen-after-approval>

## Open Questions

Options conservatrices appliquées, à valider par Hermann (aucune ne bloque) :
- **Invite « (compléter le nom) »** : affichée après tout choix de variante, comme le disent C02 et v7 l.37. Le relevé initial ne l'affichait que pour un nom égal à celui de l'origine.
- **Libellés** : « Plus facile / Plus difficile », comme C02, MFN-07 et le popover `10152:20369`. La maquette `10140:20180` porte « Plus difficile / Moins difficile ».
- **Bonus** : 0,45 est jugé sur le score de nom seul (les bonus « réordonnent, ne promeuvent pas », v7 l.152). 0,75 est jugé sur le score avec bonus, plafonné sous 0,75 si le nom est sous 0,65.
- **Ordre « requête vide »** : les mouvements du Catalogue dans l'ordre de ses groupes, puis les mouvements sans exercice au Catalogue, par nom.
- **Rognage du pluriel** : seul le `s` ou le `x` final est retiré, ce qui couvre « es » (« pompes » donne « pompe », v7 l.95-97).
- **Disponibilité du panneau** : avant toute saisie détaillée (description, médias, paramètres). Catégorie et Zones peuvent être choisies, puisqu'elles portent les bonus R02.
- **Alias** : ils sont recherchés, mais aucune saisie n'est réalisée, faute de frame et de parcours (DSF l.156). La saisie est reportée.
- **« Ajouter un niveau »** du popover : il garde le comportement A3.1 (contenu repris, inséré après l'origine). L'alignement C02 et le choix du sens relèvent de la commande Niveau (R-6).

## Code Map

- `src/domain/activities/movementSuggestion.ts` : score R02, classement R05, seuils (remplace la proximité lexicale) ; `movementLevelPosition` est conservé.
- `src/domain/activities/Movement.ts` : `findMovementNameConflict` ; commentaire de `normalizeMovementName` (l.534).
- `SqliteMovementRepository.ts` (`joinMovementGroup` `BEFORE_ORIGIN`), `ActivityDefinitionRepository.ts` (`placement`), `SqliteActivityDefinitionRepository.ts`.
- `SessionDraft.ts`, `Session.ts`, `SqliteSessionRepository.ts` : `levelOrigin` du Mouvement `NEW` d'une variante créée en Séance.
- `ActivityDefinitionService.ts` : `listMovementChoices` remplace `searchMovements`.
- `MovementResultCard.tsx` (nouveau), `MovementSuggestionPanel.tsx` (remplace `MovementSuggestionSheet.tsx`), `MovementSearchScreen.tsx`, `useMovementOriginChoice.tsx`.
- `ActivityEditorForm.tsx` : assistance du nom en surimpression, invite grise.
- `ExerciseScreen.tsx` : éditeurs Catalogue et Séance.
- `CompositionScreen.tsx` : message propre au nom déjà utilisé.
- `fr.ts` : textes.

## Tasks & Acceptance

**Execution:**
- [x] Domaine R02/R05/C01 et tests, corpus R07 compris.
- [x] Placement avant / après l'origine (Catalogue, Séance) et tests.
- [x] Service `listMovementChoices` et tests.
- [x] Panneau, carte Résultat, écran de recherche, hook.
- [x] Éditeurs : unicité pendant la saisie, variante C02, invite ; Composition.
- [x] Tests d'intégration ; tests A2.3 adaptés ; README ; reports.

**Acceptance Criteria:**
- Given un mouvement « Squats » enregistré, when on saisit « squats » dans une création, then le message « Ce nom est déjà utilisé… » s'affiche avant toute validation, et `Terminer` reste indisponible.
- Given le panneau ouvert, when on choisit « Créer une variante » puis « Plus facile » et on complète le nom, then `Terminer` crée un nouveau mouvement placé avant l'origine dans le groupe, sans description ni médias.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
- `npx jest --maxWorkers=2` -- expected: toutes suites vertes

## Implementation Notes

- **Domaine.**
  - `movementSuggestion.ts` est réécrit : `normalizeSearchText`, `searchTokens`, `searchTrigrams`, `movementNameScore`, `rankMovements`, `variantLevelPosition`. `movementLevelPosition` est conservé.
  - Trigrammes : deux caractères de garde de chaque côté du jeton. Distance : Levenshtein, sur la longueur du plus long des deux jetons. Correspondances : exactes d'abord, puis la plus petite distance parmi les jetons restés libres.
  - Coefficients et seuils de la v7, inchangés : le corpus R07 passe sans ajustement.
  - `Movement.ts` gagne `findMovementNameConflict`, et le commentaire de `normalizeMovementName` est corrigé (l'unicité remplace « aucune contrainte »).
- **Persistance.** Aucune migration.
  - `joinMovementGroup` gagne `BEFORE_ORIGIN`, et l'origine `VARIANT` gagne `placement`.
  - `SessionMovementInput` et `DraftMovement` gagnent `levelOrigin` : en Séance, le groupe est rejoint dans la transaction ; si l'origine a disparu, la Séance est refusée.
- **Service.** `listMovementChoices` remplace `searchMovements`, et les comptes viennent de `listAll` au lieu d'une requête par mouvement.
- **Interface.**
  - `MovementSuggestionPanel` remplace `MovementSuggestionSheet`, et `MovementResultCard` remplace `MovementChoiceCard` ; leurs tests ont été supprimés ou remplacés.
  - Le hook `useMovementOriginChoice` est réécrit, ainsi que `MovementSearchScreen`.
  - `ActivityEditorForm` reçoit `nameAssist` (hôte en surimpression, position par `onLayout`) et `nameHint` (texte superposé : nom transparent, puis invite). La garde `nameEndSuppressedRef` est retirée.
- **Éditeurs.**
  - Unicité pendant la saisie, avec exclusion selon le contexte. Pendant l'invite, le message est masqué, mais `Terminer` reste indisponible si le nom conservé est pris.
  - « Créer un nouveau mouvement » est contrôlé sans exclusion (Catalogue, crayon de Séance).
  - `DuplicateMovementNameError` affiche le message propre (éditeur Catalogue, Composition).
  - Variante : pastille « Niveau N » prévue au Catalogue. La Séance n'a pas de pastille (R-6).
- **Tests.**
  - Nouveaux : `movementSearch.r07.test.ts` (corpus R07 et familles), `MovementSuggestionPanel.r5.test.tsx`, `ExerciseScreen.r5.integration.test.tsx` (remplace `ExerciseScreen.mfn.a23.integration.test.tsx`), et des cas « R-5 » dans `mfnServices.a13.test.ts` et `CompositionScreen.test.tsx`.
  - Adaptés : `movementSuggestion.a23.test.ts`, `movementSearch.a23.test.ts`, `ExerciseScreen.r4.integration.test.tsx` (nom pris : désormais signalé pendant la saisie) et `ExerciseScreen.mfn.a31.integration.test.tsx` (identifiant du panneau).
- **Reports** (`deferred-work.md`) : saisie des alias ; « Ajouter un niveau » encore à aligner sur C02 ; Zones et origine locale absentes de la carte Résultat ; rendu à constater en JA2.

## Spec Change Log

## Review Triage Log

Revue du 26/10/2026 : trois couches (Blind Hunter, Edge Case Hunter, Verification Gap) sur le diff depuis `4a6fecfb`. Le panneau sous le nom remplace une `Modal` : c'est voulu, la v7 l.186 impose un « panneau sous le nom ».

| # | Source | Constat | Verdict | Preuve | Route |
|---|---|---|---|---|---|
| 1 | BH, ECH | Les scores plafonnés sous 0,75 sont triés par nom, pas par pertinence | low | `rankMovements` : départage alphabétique à score égal | patch |
| 2 | BH | Plage d'accents de `normalizeMovementName` écrite en caractères bruts | low | Comportement identique (octets vérifiés), mais la clé UNIQUE devient fragile à l'édition | patch |
| 3 | BH, ECH | `takenFor` comparé par chaîne exacte, et `Terminer` bloqué après le refus d'un nouveau mouvement pour un simple changement de casse | medium | `useMovementOriginChoice` : `takenFor === name` | patch |
| 4 | ECH | « Reprenez ce mouvement » affiché alors que le mouvement en conflit n'est pas parmi les cartes | low | Correction directe | patch |
| 5 | ECH, BH | `variantOf` non réinitialisé (frappe dans le panneau, « Voir tous les mouvements ») | low | Correction directe | patch |
| 6 | BH | Panneau de 5 cartes sans défilement : cartes cachées sous le clavier, inaccessibles | medium | Hôte absolu sans hauteur bornée ; fermer le clavier ferme le panneau | patch |
| 7 | ECH | Renommage EDITED A→B suivi d'un NEW nommé A : échec selon l'ordre d'écriture | low | `writeSessionMovements` écrit dans l'ordre d'apparition ; correction directe (EDITED d'abord) | patch |
| 8 | ECH | `BEFORE_ORIGIN` avec origine absente du groupe : mauvais rang, sans erreur | low | `originIndex = -1` ; correction directe | patch |
| 9 | BH, VG | Commentaires, README et report de `deferred-work.md` périmés (rattachement de variante, anciens rapprochements, doublon dans le brouillon) | low | Lignes citées | patch |
| 10 | VG, BH | Tests manquants : « Utiliser ce mouvement » en Séance, aucun panneau sur une occurrence existante, `levelOrigin` conservé à la réédition, Catégorie choisie avant la saisie | low | Gaps filés ; cas de `mfn.a23` supprimés sans portage | patch (tests) |
| 11 | BH | « Utiliser ce mouvement » remplace la Catégorie et les Zones choisies avant la saisie | low | Avec C05, l'occurrence lit tout son contenu dans le mouvement choisi : adopter le mouvement, c'est adopter sa Catégorie et ses Zones. MFN-06 (« jamais d'écrasement silencieux ») est antérieur à C05 | defer (à constater en JA2) |
| 12 | BH, ECH | `levelOrigin` absent ou invalide à l'enregistrement : Séance bloquée par l'erreur générique | low | Seulement si l'origine disparaît entre le choix et l'enregistrement ; le correctif ajoute des gardes | defer |
| 13 | BH | Choix de variante irréversible sans quitter l'éditeur | low | Le cadre de variante du panneau a son retour ; ensuite, la garde d'abandon s'applique | reject |
| 14 | BH | Pas de pastille de niveau pour une variante en Séance | low | Commande Niveau en Séance : R-6 | defer (R-6) |
| 15 | BH | Classement recalculé à chaque frappe | low | Corpus local de quelques centaines d'entrées ; aucune mesure de lenteur | reject |
| 16 | BH, ECH | Invite « (compléter le nom) » tronquée ou décalée avec un nom long | low | Rendu, à constater en JA2 ; `accessibilityHint` conservé | reject |
| 17 | BH | Le message de Composition ne nomme pas le mouvement en conflit | low | Message NON VÉRIFIABLE ; cas devenu rare avec le contrôle pendant la saisie | reject |
| 18 | ECH | `levelOrigin` non validé (identifiant vide, lui-même, mouvement NEW) | low | Valeurs produites par l'éditeur seulement | reject |

# Revue de réconciliation : spine PRE-5 face au PRD, à l'addendum et aux décisions du 2026-10-19

- **Relecteur :** agent indépendant, en lecture seule (seul ce fichier est écrit).
- **Date :** 2026-10-19.
- **Objet :** `ARCHITECTURE-SPINE.md` (AD-18 à AD-33).
- **Entrées :**
  - `prd.md` : FR-1 à FR-45, NFR-1 à NFR-10, §6, §7, §8, §9 ;
  - `addendum.md` : Q-A1 à Q-A7 et « Vérifications techniques demandées » ;
  - décisions de Hermann du 2026-10-19 sur le §9 du PRD.
- **Code consulté pour vérifier quelques faits :** `bmad/pre5-depuis-pre4`, HEAD `277296c6`. Fichiers : `ExecutionParameters.ts`, `ExecutionParametersDraft.ts`, `validation.ts`, `composition.ts` et `executionCalculations.ts`.

## Verdict

Le spine couvre le PRD et l'addendum sur l'essentiel :

- les sept questions Q-A ont chacune une réponse argumentée ;
- les neuf décisions du §9 sont intégrées ;
- les exclusions du §8 sont respectées.

Il reste **trois trous de règle de haute gravité** dans le Brouillon et la validation des phases et de la Condition d'arrêt. Deux stories pourraient y diverger, et l'une des règles contredit FR-8. Le spine reste aussi muet sur l'état d'interface de la Cadence « Autre », et une interprétation de la décision sur la limite des étapes est à confirmer. Ces points sont à corriger avant le découpage en stories. Aucun ne remet en cause la structure (format v3, `workPhases`, `exerciseLoad.ts`, `KeyboardField`, `sheetSurface`).

## Constats

### C-01 : retrait de la dernière phase et D ; contradiction avec FR-8 (gravité : haute)

**Ce que dit le PRD (FR-8) :** « Supprimer la dernière phase restante ramène la ligne à « Aucune ». Sa durée devient la durée de série, modifiable (D-371). »

**Ce que dit le spine (AD-20) :**

- `deriveSeriesDuration` fixe `target` à `NUMBER(Σ)` si Σ ≥ 1, sinon à `UNSET` ;
- les transitions de phases du Brouillon l'appellent ;
- le retrait est l'une de ces transitions.

Appliquée au retrait de la dernière phase, la règle donne Σ = 0, donc `target = UNSET`. La durée de la phase retirée est perdue, ce qui contredit FR-8.

Seul le passage Avec → Sans est traité à part (« `target` déjà égal à la somme »). Le spine ne dit pas non plus que retirer la dernière phase fait passer la ligne à Sans (« Aucune »).

**Correctif :** dans AD-20, ajouter une transition explicite. Le retrait de la dernière phase équivaut à Avec → Sans : `workPhases = []`, et `target` conserve la durée de la phase retirée (si elle vaut au moins 1 s, sinon `UNSET` selon FR-8). Ce cas reste annulable par l'instantané de retrait, qui restitue phases et D. Réserver `deriveSeriesDuration` aux listes non vides. Ajouter le cas au test d'aller-retour d'AD-25.

### C-02 : disponibilité de ✓ calculée avant ou après la normalisation des phases (gravité : haute)

**Ce qu'exigent FR-3 et FR-9 :**

- la borne de 3 535 s s'applique à la somme **après** normalisation ;
- des phases à 0 s ou non renseignées ne bloquent jamais ✓ ;
- une somme normalisée au-delà de 3 535 s rend ✓ **indisponible**.

**Ce que fixe le spine :**

- AD-25 fixe l'ordre dans `commitSheetDraft` : `normalizeWorkPhases`, `normalizeLoad`, puis `validateForSave` ;
- AD-20 pose un invariant structurel : chaque `durationSeconds` est un entier ≥ 1, et `target` est la somme ;
- AD-25 impose `requestedParameters(openSheetDraft(p)) = p`, ce qui suggère que `requestedParameters` ne normalise pas.

**Le risque :** le spine ne dit pas sur quoi se calcule la **disponibilité** de ✓ (l'état du bouton, avant tout appui). Si elle reprend le chemin existant, `validateForSave(requestedParameters(draft))` sans normalisation, deux cas posent problème :

- une phase `null` ou à 0 viole l'invariant structurel et bloque ✓, contrairement à FR-9 ;
- inversement, une story peut tester la borne sur la somme brute.

Une story Feuille et une story Brouillon divergeraient ici.

**Correctif :** dans AD-25, poser une seule fonction pure, par exemple `committedParameters(draft, defaultLabel)` = normalisation puis `requestedParameters`. La disponibilité de ✓ et `commitSheetDraft` passent toutes deux par elle et par `validateForSave`. Préciser que `requestedParameters` seul n'est jamais validé quand des phases existent. Ajouter les cas de test :

- phases `[0, null]` : ✓ disponible, la validation existante de la durée décide ;
- six phases de 600 s : ✓ indisponible.

### C-03 : sens de « À la cible » quand la Cible est `UNSET`, éligibilité aux phases et affichage en identiques (gravité : haute)

**Ce que fixe le spine (AD-23) :** `stopConditionOf` renvoie `INCOMPLETE` dès qu'une ligne est `UNSET` sans mélange établi, y compris pour la série uniforme `UNSET`.

**Ce qu'exige le PRD :**

- **FR-19 :** en identiques, la Condition d'arrêt est une **entrée**, « À la cible par défaut ». Un nouvel Exercice, de Cible `UNSET`, doit donc afficher À la cible sélectionnée.
- **FR-2 :** les phases ne sont disponibles « qu'à Condition d'arrêt À la cible ».
- **FR-5 :** l'activation avec une valeur « — » (`UNSET`) doit créer « Phase 1 » à renseigner.

**Ce qui manque au spine :**

- la valeur que montre le segmenté en identiques quand `stopConditionOf` vaut `INCOMPLETE` ;
- l'**éligibilité** aux phases. AD-20 ne refuse que les transitions sortantes, quand des phases existent. Rien n'interdit au domaine de créer des phases en Répétitions, à l'échec (`target = FAILURE`) ou en Variables (FR-2, deuxième puce).

Une story pourrait afficher « aucune sélection » pour un Exercice neuf, ou créer « Phase 1 » à durée `null` sur une Cible `FAILURE`.

**Correctif :**

- **Dans AD-23 :** en identiques, la valeur affichée est À l'échec si et seulement si la Cible commune est `FAILURE`, sinon À la cible, `UNSET` compris. `stopConditionOf` ne sert qu'au résultat dérivé en Variables, et à QN-2.
- **Dans AD-20 :** ajouter un prédicat pur unique `canEnableWorkPhases(draft)` = Mode Durée, Identiques et Cible commune différente de `FAILURE`. La transition « Avec » est refusée par le domaine hors éligibilité, et l'option Avec est indisponible.

### C-04 : Cadence « Autre » ; l'état « ± révélé » n'est pas dérivable de la valeur (gravité : moyenne-haute)

**La décision du 2026-10-19 :** l'option affichée = `cadenceOptionOf(value)` (0 → Sans, 1, 2 et 5 → leur option, sinon Autre). AD-24 la reprend, avec « Choisir Autre révèle le ± existant ».

**La contradiction :** depuis Sans (0), toucher Autre laisse la valeur à 0. L'option affichée revient donc aussitôt à Sans. De même, régler le ± sur 1, 2 ou 5 fait basculer l'option affichée sur « 1 s », « 2 s » ou « 5 s ».

**Ce que le spine ne dit pas :**

- si toucher Autre modifie la valeur (et laquelle) ou non ;
- où vit l'état « ± de Cadence révélé » : surface `stepper(cadence)` du réducteur, état local ou dérivation ;
- si ce ± reste ouvert quand la valeur tombe sur 0, 1, 2 ou 5.

Deux implémentations raisonnables divergent : Autre sans effet visible, ou Autre qui force une valeur. FR-30 (« Aucune valeur personnalisée n'est mémorisée ») ne tranche pas.

**Correctif :**

- **Dans AD-24 et AD-27 :** le ± de Cadence est une surface du réducteur, `stepper(cadence)`, ouverte par Autre et fermée par toute autre surface ou par le choix d'une option fixe. Toucher Autre ne change pas la valeur. Tant que la surface est ouverte, l'option affichée reste Autre ; à sa fermeture, `cadenceOptionOf(value)` s'applique.
- Si cette lecture n'est pas celle de Hermann, la poser en question ouverte (QN-4) avant la story Cadence plutôt que de la laisser aux stories.

### C-05 : limite des étapes ; « saisie refusée » ou collage tronqué, et comptage (gravité : moyenne)

**La décision de Hermann (§9-6) :** « à 1 000 caractères au total, saisie refusée ».

**AD-22 :** « l'ajout est tronqué à la limite ». Un collage plus long que le reste disponible est donc **partiellement accepté**, ce qui n'est pas la même chose qu'une saisie refusée. Le comportement natif de `maxLength` tronque ; la décision peut se lire comme un refus du collage entier.

**Le comptage :** la limite porte sur la chaîne encodée, séparateurs compris (QN-1). Elle s'écarte de FR-34 (« textes seuls ») et du mot « au total » de la décision. QN-1 est bien signalée. En revanche, la colonne « Bloque » de la table des questions indique « Non » alors que la question conditionne la story Description et une éventuelle `migration011`.

**Correctif :**

- dans AD-22, distinguer la frappe (caractère refusé) du collage (tronqué, ou refusé en entier). Retenir l'une des deux lectures et la signaler à Hermann avec QN-1 ;
- dans la table des questions, marquer QN-1 « Bloque : story Description ».

Note : `normalizeInstruction` (trim externe seulement, `validation.ts:91`) et la validation en points de code (`validation.ts:375`) restent compatibles avec l'encodage `\n`. Cela répond à la partie de Q-A5 que le spine ne cite pas ; l'écrire en une ligne dans AD-22.

### C-06 : position de la mention de charge sans valeur par série (À l'échec) ; Δ48 dans la Phrase (gravité : moyenne)

**AD-29** place phases puis charge « juste après la valeur par série ». **FR-12 et Δ48** exigent la charge avec une Cible À l'échec. En identiques à l'échec, aucune valeur par série n'est prescrite (FR-21), et le cas d'une ligne variable à l'échec n'est pas couvert non plus.

Le point d'insertion n'est donc pas défini pour ces phrases. Seule la combinaison phases + charge a un cas de corpus imposé.

**Correctif :** dans AD-29, définir le point d'insertion quand la valeur par série est « à l'échec » (après le segment qui décrit les séries). Imposer des cas littéraux de fixture pour les trois cas Δ48 : Répétitions × Identiques, Répétitions × Variables, À l'échec avec charge. Ajouter un cas où toutes les charges variables sont égales (FR-42 : jamais présentées comme commune).

## Constats secondaires (gravité : basse)

- **B-01, repli par chevron intérieur (FR-28) :**
  - le spine n'indique ni où vit l'état déployé ou replié des options Variables, Avec (Phases) et Avec (Côtés), ni le geste qui le bascule (toucher l'option déjà choisie) ;
  - le spine ne dit pas non plus comment ce repli interagit avec une surface ouverte dans le contenu replié (« Ligne disparue »).

  **Correctif :** une ligne dans AD-24 et AD-27 (état d'interface de la Feuille, non persisté ; replier ferme la surface concernée).
- **B-02, ligne Durée de l'exercice absente (FR-31, RC ligne 11) :** Compte à rebours et Fin doivent alors être directement visibles, sans autre moyen de repli. AD-28 ne le dit pas. **Correctif :** l'ajouter.
- **B-03, cible tactile des lignes de 36 (FR-29, NFR-7, R-06) :** elle doit être « vérifiée sur appareil avant toute autre géométrie ». AD-33 ne prévoit d'essai précoce que pour le clavier. **Correctif :** inclure les lignes de 36 dans l'essai NFR-6, ou dans une vérification jointe.
- **B-04, Pause entre les côtés (FR-15 et P3-10) :** FR-15 dit que Sans « conserve leurs valeurs ». Or `setSideMode` (Draft, l. 534-535) recopie la valeur du Profil à chaque activation et écrase donc la valeur conservée au retour à Avec. Le PRD garde P3-10, et AD-21 ratifie l'existant sans relever la tension. **Correctif :** l'écrire dans AD-21 (la valeur est conservée sous Sans et persistée, puis remplacée par le Profil à la réactivation) et la signaler à Hermann si ce n'est pas l'intention.
- **B-05, comptage du libellé de phase :**
  - `maxLength` de `TextInput` compte en unités UTF-16 ;
  - la validation (`readV3`, `validateForSave`) « 1 à 20 caractères » n'a pas d'unité fixée ;
  - les étapes, elles, comptent en points de code.

  **Correctif :** une unité unique dans `WORK_PHASE_LIMITS`, et préciser si le libellé non vide est enregistré après suppression des espaces extérieurs (« après normalisation », FR-1).
- **B-06, activation de la charge en Variables (FR-12, FR-14) :** « la saisie s'ouvre », mais le spine ne dit pas sur quelle cellule (première de `loadFieldOrder` ?). Il ne dit pas non plus si `normalizeLoad` considère les lignes cachées ou les réserves. **Correctif :** une phrase dans AD-19 ou AD-26.
- **B-07, valeur négative (FR-14) :** AD-19 la confie à `setLoadValue` sans dire quel est « le comportement standard des champs numériques du projet ». **Correctif :** le relever dans le code (refus et retour à la valeur précédente ? 0 ?) et l'écrire. Sans cela, la story Charge invente la règle.
- **B-08, D-430 et durées admettant zéro (FR-45) :** le PRD demande à l'architecture de **relever** le pas actuel de Pause, Pause entre les côtés, Compte à rebours et Fin. Le code montre des bornes 0..300 et 0..60, sans palier de 5 s dans la Feuille ; la grille de 5 s n'existe que dans `Profile.ts:124`, que la décision exclut. AD-31 ne l'écrit pas.

  L'addendum cite aussi « les tests qui fixent un minimum ou un pas de 5 s ». Les commentaires de `EP:83-88`, `:254`, `:270` et `:317-319` mentionnent 5 s, et les tests de la roue et de `selectorOpeningPosition` en dépendent.

  **Correctif :** une ligne de relevé dans AD-31, et la mention des tests et commentaires à aligner (seule la valeur de `EP:88` change, mais ces textes doivent suivre).
- **B-09, transport (vérification de l'addendum) :** `composition.ts:217-243` passe par `cloneExecutionParameters`, ce qui est conforme. `ActivityDefinition.ts:339-365` n'est pas cité. **Correctif :** une ligne dans AD-18 ou AD-19 pour fermer explicitement chaque point de la liste « Transport (FR-41) ».
- **B-10, garde de la projection (FR-40) :** le spine s'appuie sur la validation et sur le CHECK. Il ne dit pas explicitement que `assertActivityColumns` (`SqliteSessionRepository.ts:1420-1424`) reste la garde de la projection. **Correctif :** l'écrire dans AD-20, puisque FR-40 demande que « la projection le garde aussi ».

## Points vérifiés sans écart

- **Q-A1 :** AD-18 traite la lecture v2 et `migration010`, la livraison atomique (AD-33), le retour arrière et l'absence de migration.
- **Q-A2 :** AD-19 traite l'activation, les valeurs, `checkStructuralNumber`, la conservation sous Sans et `alignRowsToBaseline`.
- **Q-A3 :** AD-20 traite `UniformSeries`, la valeur de D matérialisée et le nom distinct de `phasesRow`.
- **Q-A4 :** AD-21 et AD-29. `LedgerSide` n'est ni persisté ni relu hors de `executionCalculations.ts` ; le passage à l'ordinal ne touche aucun résultat historique.
- **Q-A6 :** AD-23 ; cas `UNSET` (assumption QN-2 signalée).
- **Q-A7 :** AD-26 et AD-27.
- **Vérifications techniques :** ancrage (AD-28), popover du Mode et tests (C-3), segmenté natif QP5-06 (AD-24).
- **Décisions du 2026-10-19 :**
  - barre du clavier Précédent / Suivant et « Fermer » à droite, ligne active visible : AD-26 ;
  - Phrase, phases puis charge : AD-29 ;
  - inversion par N conservée avec des phases : AD-31 et AD-20 ;
  - étapes, Entrée et collage : AD-22 (réserve C-05) ;
  - Cadence : AD-24 (réserve C-04) ;
  - charge Variables → Identiques et cellule vidée : AD-23 et AD-19 ;
  - grilles du Profil hors D-430 : AD-31 ;
  - Description à 14 sans cadre : AD-22.
- **NFR-1 à NFR-10, §7 et §8 :** aucun remplacement hors de R-01 à R-17, aucun jeton, aucune migration, clavier limité à deux contenus, exécution et formats exclus.

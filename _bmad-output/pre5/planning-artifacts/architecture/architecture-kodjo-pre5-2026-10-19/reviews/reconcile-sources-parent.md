# Revue de réconciliation : sources PRE-5 et spine parent

**Objet :** `ARCHITECTURE-SPINE.md` (PRE-5, delta, 2026-10-19).
**Relecteur :** agent indépendant, lecture seule. Seul ce fichier a été écrit.
**Entrées confrontées :**
- `table-delta.md` (la §6 prime sur la §3) ;
- `inventaire-code.md` (§7 et §8) ;
- `propagation-borne-1s.md` (D-430) ;
- spécification des phases consolidée (§2 et §5) ;
- spine parent PRE-4 (AD-1 à AD-17) ;
- PRD PRE-5, consulté pour FR-7, FR-8 et la limite de FR-34.

**Code relu (HEAD `52382b04`) :** `ExecutionParameters.ts` (`EXECUTION_BOUNDS`, `normalizeEffective`, fin de `validateForSave`), `ExecutionParametersDraft.ts` (`rememberCurrentTargets`, `setMode`, `commitSheetDraft`), `sheetSurface.ts`, `exerciseSnapshot.ts` et `SegmentedControl.tsx`.

## Verdict

Le spine couvre la quasi-totalité des points techniques de l'inventaire, de D-430 et de la §6. Il reste toutefois :
- **une contradiction grave** avec une règle produit décidée (suppression de la dernière phase) ;
- **un conflit avec le parent non listé** (option « À l'échec » de la roue commune) ;
- **quatre trous** où deux stories pourraient diverger.

Le tableau des invariants hérités est complet (AD-1 à AD-17). Aucun AD parent n'est contredit en silence sur un point structurant, hormis G-2 ci-dessous.

---

## 1. Constats graves

### G-1. AD-20 contredit la suppression de la dernière phase (spécification §2.3, FR-8, D-371, §6 QP5-04)

- **Règle source.** Spécification §2.3 : « Supprimer la dernière phase existante ramène la ligne à « Aucune » et conserve la durée qu'elle portait juste avant sa suppression comme durée de série. » La §6 (QP5-04) le reprend : « Supprimer la dernière phase restante conserve sa durée comme durée de série (§2.3, D-371). » PRD FR-8 (l. 187) aussi.
- **Ce qu'impose AD-20 :**
  - `deriveSeriesDuration` « fixe `target` à `NUMBER(Σ)` si Σ ≥ 1, sinon `UNSET` » ;
  - « seules les transitions de phases du Brouillon l'appellent » ;
  - le retrait figure dans ces transitions, sans exception.
- **Conséquence.** Le retrait de l'unique phase donne Σ = 0, donc `target = UNSET` : la durée est perdue. C'est exactement ce que la règle interdit.
- **Risque de divergence.** La story du domaine appliquera AD-20 à la lettre. Le test de recette FR-8 échouera, ou une story d'interface contournera le domaine.
- **Correctif.** Ajouter à AD-20, dans « Transitions » : « retrait de la dernière phase restante : `workPhases = []`, `target` = `NUMBER(durée de cette phase)` si elle est ≥ 1, sinon inchangé (`UNSET` si `null` ou 0) ; `deriveSeriesDuration` n'est pas appelé pour cette transition ». Ajouter un cas de test nommé dans AD-33 (story 1) ou AD-25 (Brouillon).

### G-2. Conflit non listé : l'option « À l'échec » est retirée de la roue de la Cible commune (parents AD-7 et AD-15 T25)

- **Côté parent :**
  - AD-15 T25 : le ✓ du Sélecteur commun remplace la Cible commune « par la valeur choisie (`NUMBER` ou `FAILURE`) » ;
  - AD-7 (contrat des roulettes) porte `failureOption` pour ce Sélecteur ;
  - ces comportements sont acceptés en PRE-4 (DSF Deux modes, Q8 = D-385).
- **Côté PRE-5 :** AD-23 dit « en identiques, aucune `failureOption` ». La Cible `FAILURE` commune n'est plus écrite que par le segmenté Condition d'arrêt (R-09, R-10, D-412, D-418).
- **Ce qui manque.** La table « Conflits avec le spine parent » ne cite ni R-09 ni R-10, ni AD-7, ni AD-15 T25. La ligne AD-7 des invariants hérités ne parle que du popover et des panneaux.
- **Correctif.** Ajouter **C-6** :

  | AD parent | Changement PRE-5 | Autorité |
  |---|---|---|
  | AD-7 (contrat `failureOption`) et AD-15 T25 (`FAILURE` par le Sélecteur commun) | Roue commune sans option d'échec ; `FAILURE` écrite par la Condition d'arrêt (AD-23) ; tests PRE-4 de l'option d'échec de la roue commune révisés par conception | R-09, R-10 ; D-412, D-418 |

  La ligne AD-7 des invariants hérités doit renvoyer à C-6.

---

## 2. Constats moyens : trous où deux stories peuvent diverger

### M-1. La somme des phases échappe à D-430 par la tolérance à la ligne de base (AD-13 parent, H25)

- **Règle.** D-430 et la §6 (QP5-04) fixent la somme des phases à 1..3 535 s, « hors de ces bornes, validation indisponible ». AD-20 renvoie cette borne au **niveau saisie** de la Cible Durée.
- **Problème.** Le niveau saisie n'est appliqué qu'aux valeurs différentes de la ligne de base (AD-13 parent, `validateForSave`). Une Cible héritée positive hors bornes, par exemple 5 999 s, est tolérée (H25).
- **Chemin réel :**
  1. ouvrir un Exercice historique dont la Cible commune vaut 5 999 s ;
  2. choisir Phases Avec (AD-20 : « durée = Cible `NUMBER` courante ») ;
  3. on obtient Phase 1 = 5 999 s, Σ = 5 999 = ligne de base ;
  4. le contrôle de saisie n'est pas appliqué, le ✓ est accepté et la somme viole D-430.
- **Effets secondaires.** La phase vaut alors plus que le maximum de sa roue (3 535). Le Deferred « Tolérance à la ligne de base des phases : le mécanisme existant suffit » est donc faux dans ce cas.
- **Correctif.** Ajouter à l'invariant structurel d'AD-20 : « `workPhases` non vide ⇒ Σ ∈ [1, `durationTarget.max`] », vérifié sans tolérance de ligne de base. Préciser aussi la transition Avec : quand la Cible courante dépasse `durationTarget.max`, la phase est créée à `null` (à renseigner), jamais au-dessus de la borne de sa roue.

### M-2. La mémoire « À la cible » n'est pas spécifiée assez précisément (AD-23, AD-25)

- **Code.** `rememberCurrentTargets` (`ExecutionParametersDraft.ts:238-252`) mémorise la Cible affichée **telle quelle**, `FAILURE` comprise. `setMode` garde une `FAILURE` (H27, AD-2 parent).
- **Ce que dit le spine.** « Extension de `targetsById` », pour restaurer « la dernière valeur `NUMBER` mémorisée pour cette identité et ce Mode ».
- **Scénario de divergence :**
  1. identiques, Durée, 30 s ;
  2. À l'échec ;
  3. passage en Répétitions : la mémoire Durée de l'identité devient `FAILURE` et écrase 30 ;
  4. retour en Durée : `FAILURE` conservée (H27) ;
  5. À la cible donne `UNSET`, alors que la §6 et Δ25 demandent « la dernière valeur chiffrée » (30 s).
- **Correctif.** Nommer une mémoire distincte, par exemple `lastNumberById[id][mode]`. Elle est écrite par la transition vers À l'échec et par toute écriture d'un `NUMBER`, et n'est **jamais** écrasée par une `FAILURE`. Ajouter ce scénario aux tests du Brouillon.

### M-3. `normalizeEffective` (N = 1) n'est pas couvert (inventaire §1, ligne « Normalisation N=1 »)

- **Constat.** L'inventaire demande de « décider le devenir de la Charge par série et des Phases à N = 1 ». Le spine est muet.
- **Code.** `normalizeEffective` (`ExecutionParameters.ts:341-353`) reconstruit `{ kind: "UNIFORM", count: 1, target, pauseSeconds }` à partir de la première ligne. Il est appelé par `validateForSave` (l. 690, valeur enregistrée), `commitSheetDraft`, la Phrase et les calculs.
- **Risque.** TypeScript imposera d'ajouter `loadKg` et `workPhases`, mais une story peut écrire `loadKg: 0` et perdre la charge de la ligne, ce qui ferait passer l'Exercice à Sans via `normalizeLoad`.
- **Correctif.** Ajouter à AD-19 : « `normalizeEffective` reprend le `loadKg` de la première ligne et pose `workPhases: []` ». Ajouter un cas à la liste des cas Δ48 des conventions de tests.

### M-4. La limite des étapes : le défaut retenu contredit une décision (AD-22, QN-1 ; §6 QP5-02 ; PRD FR-34 l. 552)

- **Décision.** La §6 classe QP5-02 « Recommandé », ce qui vaut décision : « La limite de 1 000 caractères porte sur l'ensemble des textes des étapes, numérotation exclue. »
- **Spine.** AD-22 retient par défaut la chaîne encodée, séparateurs compris, et place l'écart en QN-1 « non bloquant ».
- **Contrainte technique.** L'écart est réel : le CHECK `length(instruction) <= 1000` (`migration010.ts:548`) compte les séparateurs.
- **Problème.** Un défaut contraire à une décision de Hermann ne peut pas être appliqué d'office.
- **Correctif.** Passer QN-1 en **bloquant pour la story Description**, et soumettre l'alternative à Hermann :
  - (a) appliquer la décision, avec une `migration011` qui relâche le CHECK d'`activities` ;
  - (b) faire amender QP5-02.

  Ne pas coder le défaut avant sa réponse.

---

## 3. Constats mineurs

| # | Constat | Correctif |
|---|---|---|
| m-1 | Une phase à `null` (« à renseigner », fond `#FFF1F0`) est retirée sans bruit par `normalizeWorkPhases` dès qu'une autre phase est valide. La spécification §2.2 ne prévoit le retrait silencieux que pour 0 s ; « à renseigner » signale une valeur à saisir. Ce n'est pas bloquant pour une seule phase `null`, car Σ = 0 donne `UNSET` et la validation existante s'applique. Le cas `[6, null]` reste ambigu. | Dire explicitement que `null` est traité comme 0 au ✓ (lecture de la §6 QP5-04), ou bloquer le ✓. Ajouter une ligne dans les questions ouvertes si c'est un choix. |
| m-2 | AD-27 dit que `keyboard` « suit la famille des champs ± », puis l'en exclut pour ✓ et ✕ (absorbés). Or `sheetCommandsAbsorbed` (code) et T19 (parent) excluent explicitement les champs ±. L'appartenance de `stepper(rowPause)` à une famille, et son absorption, ne sont pas dites. | Rédiger AD-27 en famille propre : « `keyboard` : toucher = famille ± ; ✓ et ✕ = famille panneau (Q47) ». Préciser que `stepper(rowPause)` suit T19 (aucune absorption). |
| m-3 | Le retrait annulable d'une phase a « son propre instantané » (AD-25). AD-2 parent voulait un seul ensemble d'invalidation, défini une fois. Le spine ne dit pas si les deux annulations partagent l'emplacement du message « … supprimée — Annuler » (AD-8 parent). | Généraliser `pendingRemoval` en union `{ row } | { phase }`, ou fixer explicitement un seul message visible à la fois. |
| m-4 | `SegmentedControl` expose déjà `labelStyle` (`SegmentedControl.tsx:50`). La nouvelle prop `compact` (AD-24) fait double emploi. | Retenir `labelStyle` pour l'Enchainement, ou dire que `compact` le remplace en `inline`. |
| m-5 | Le garde de `readV2` et `serializeV2` (AD-18) n'autorise que `EP`, « leurs tests » et `readExecutionParameters`. La parité AD-10 vit dans `migration010.test.ts` et `preservation.story14.test.ts`. `readV1` doit aussi produire le modèle v3 (`workPhases: []`, `loadEnabled: false`, `loadKg: 0`) pour les Instantanés v1. | Lister explicitement les fichiers autorisés. Ajouter « `readV1` retourne le modèle courant avec les mêmes valeurs par défaut que `readV2` ». |
| m-6 | La rangée « Charge » d'identiques est d'abord un segmenté Avec / Sans (AD-24), puis « la valeur remplace Avec (« 20 kg ») » (Δ18). Le passage du segmenté au `KeyboardField` n'est pas décrit. Deux stories, la story `inline` et la story clavier, se le partagent. | Dans AD-24 ou AD-26, préciser le rendu de l'option Avec active (champ dans l'option, ou champ remplaçant le segmenté) et l'étiquette accessible. |
| m-7 | QP5-05 est accepté « sous réserve tactile, vérification sur appareil avant toute autre géométrie ». AD-28 fixe 36 sans cette réserve. | Ajouter la réserve et la recette à AD-28. |
| m-8 | Inventaire §3 : la hauteur maximale de la Feuille (`windowHeight - insets.top - 24`) « devra tenir compte du clavier ». AD-26 ne traite que les insets du défilement. | Dire que la hauteur maximale est inchangée, et que seuls les insets automatiques et le défilement calculé gèrent le clavier ; ou la traiter. |
| m-9 | La transition T3 du parent (« roue ouverte sur … 00:05 ») et `nearestGridValue` (AD-16 parent) relèvent de C-2, mais seuls AD-1, AD-13 et AD-16 y sont nommés. | Ajouter AD-15 T3 à C-2. |
| m-10 | Δ36 (« ligne absente → signaux visibles », repli par défaut) et Δ33 (« repli sans perte ») ne disent pas où vit l'état de repli des chevrons Phases, Côtés et Durée de l'exercice : état local ou réducteur. | Une phrase dans AD-28 : état d'interface local à la Feuille, hors Brouillon et hors `sheetSurface`, réinitialisé à l'ouverture. |

---

## 4. Points vérifiés sans écart

### Inventaire §7

| Point | Couvert par | État |
|---|---|---|
| 1 | AD-18 | Couvert |
| 2 | AD-20 : `UniformSeries`, transitions incompatibles refusées | Couvert |
| 3 | AD-20 | Couvert, sous réserve de M-1 |
| 4 | AD-19 | Couvert |
| 5 | AD-21 | Couvert |
| 6 | AD-23 | Couvert, sous réserve de M-2 |
| 7 | AD-28 | Couvert |
| 8 | AD-24 : vérification QP5-06 consignée | Couvert |
| 9 | AD-26 et AD-27 | Couvert |
| 10 | AD-22 | Couvert, sous réserve de M-4 |
| 11 | `workPhases` | Couvert |
| 12 | AD-28 | Couvert, sous réserve de m-7 |

Inventaire §8 : D-413 est acté dans C-3 et C-5. Les tests `Sheet.test.tsx:1257` et `:1368` sont révisés par conception.

### D-430

- AD-31 est conforme : `EP:88` est le seul changement de valeur. Les grilles du Profil sont exclues (§9-5, A1) et le maintien accéléré 1/5/10 est inchangé (A5).
- Phase ≥ 1 s, pas de 1 s.
- La somme 1..3535 est couverte, sous réserve de M-1.

### Spécification des phases

- §2.1, §2.2 et §2.4 : couverts par AD-20, AD-25 et AD-29.
- §5 :
  - extension du modèle canonique ;
  - versionnement avec lecture de l'ancienne version (C-1 justifié) ;
  - aucune phase à 0 dans les paramètres validés ;
  - durée de série dérivée, jamais écrite indépendamment ;
  - corpus étendu ;
  - compatibilité de lecture livrée avec l'écriture (AD-33, story 1).
- §2.3 n'est pas couvert : voir G-1.

### Table §6

- Les lignes Δ48, Δ49 et Δ50 sont couvertes.
- Les points 1 à 11 du §9 sont couverts : AD-19, AD-22, AD-23, AD-24, AD-26, AD-29 et AD-31.
- Pour QP5-01 à QP5-09, l'écart est M-4.

### Spine parent

- **AD-3 :** le nouvel `id` de phase sérialisé n'est pas une identité de ligne. C-1 couvre le changement de forme.
- **AD-4 :** intact.
- **AD-5 et AD-6 :** un seul calcul et un seul générateur, conservés.
- **AD-9 :** étendu.
- **AD-10 :** C-4 couvre le corpus.
- **AD-11 et AD-14 :** conformes.
- **AD-13 :** le contrôle décimal de la charge est une extension, pas un affaiblissement.
- **AD-16 :** le ± est conservé. Il est retiré des seules cellules (C-5).

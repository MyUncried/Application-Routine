---
title: "KODJO PRE-5 — Addendum technique au PRD"
created: 2026-10-19
updated: 2026-10-19
---

# Addendum technique au PRD PRE-5

Ce document regroupe les **questions d'architecture** que le PRD ne tranche pas. Il recense aussi les points de code à vérifier. L'architecture (`bmad-architecture`) y répond, à partir du code de `bmad/pre5-depuis-pre4` (HEAD `52382b04`).

Aucune réponse n'est présupposée ici. Les options citées viennent de `table-delta.md` et de la spécification des phases §5 ; elles ne valent pas recommandation. Abréviations : `EP` = `src/domain/activities/ExecutionParameters.ts` ; `Draft` = `src/domain/activities/ExecutionParametersDraft.ts` ; `Sheet` = `src/features/activities/ExecutionParametersSheet.tsx` ; `Form` = `src/features/activities/ActivityEditorForm.tsx`.

## Questions d'architecture

### Q-A1 : Version du JSON canonique (FR-39 ; Δ39 ; spécification des phases §5)

Faut-il étendre la version 2, ou passer à une version 3 ?

**Faits relevés :**

- `serializeV2` sérialise des clés énumérées (`EP:717-741`).
- `readV2` ignore les clés inconnues (`EP:778-834`).
- La colonne est en `TEXT`, sans CHECK (`migration009.ts:23-25`).

**La décision doit traiter explicitement :**

- la lecture des données PRE-4 et `migration010` ;
- la livraison de la lecture avec l'écriture ;
- l'effet d'un retour arrière applicatif sur une donnée écrite par PRE-5 ;
- l'absence de toute migration SQL si elle n'est pas nécessaire.

### Q-A2 : Représentation de la charge (FR-10 ; Δ16)

Questions à trancher :

- Où placer l'activation, et où placer les valeurs (commune, ou par ligne) ?
- Les valeurs sont-elles stockées en décimal, ou en unité entière (centièmes de kg, ou quarts) ?
- Comment lever le contrôle `checkStructuralNumber`, qui exige un entier (`EP:464-486`) ?
- Comment conserver les valeurs sous Sans ?
- Comment `alignRowsToBaseline` (`EP:412-435`) se comporte-t-il avec la charge ?

### Q-A3 : Emplacement des phases et maintien de D (FR-1, FR-3 ; Δ08, Δ09)

Deux questions :

- Les phases sont-elles un champ de `UniformSeries` (`EP:116-121`), ou un autre emplacement des paramètres ?
- La durée de série est-elle maintenue et dérivée à chaque écriture, ou calculée à la lecture (`workSeconds`, `projectScalars`) ?

**Contraintes à respecter :**

- La durée de série n'est jamais écrite indépendamment des phases.
- Le nom anglais est distinct de `phasesRow` et de `withProfilePhases` (cadrage, clarification 7).

### Q-A4 : Représentation de Avec pour les côtés (FR-15, FR-16 ; Δ21, Δ22)

`SideMode` a trois valeurs. Le CHECK `side_mode` est défini dans `migration005.ts:36-39`, `migration006.ts:28` et `migration010.ts:491`.

Consommateurs gauche / droite à neutraliser :

- le registre de durée (réponse de l'architecture, AD-21, revue du 19/10 : `LedgerSide` est interne à `executionCalculations.ts`, ni affiché ni persisté ; il reste inchangé, la neutralité ne touchant que l'affichage) ;
- la Phrase (FR-18) ;
- les sous-titres D/G du lexique ;
- l'indicateur de la Composition (`fr.ts:47-50`).

Faut-il une nouvelle valeur, ou une lecture des valeurs historiques comme Avec ? Ajouter une valeur au CHECK imposerait de reconstruire deux tables. La consigne est d'éviter une nouvelle valeur de CHECK si possible.

### Q-A5 : Encodage des étapes (FR-33, FR-34 ; Δ02)

Les colonnes existantes sont `description` (sans CHECK) et `instruction` (`CHECK ≤ 1000`, `migration010.ts:548`).

Quel encodage pour la liste : dans ces colonnes, ou dans une autre structure ? Une migration n'est admise que si l'architecture la rend nécessaire (NFR-3). La limite de 1 000 caractères, numérotation exclue, doit rester compatible avec ce CHECK.

Points de code concernés :

- `INSTRUCTION_MAX_LENGTH` et sa validation (`src/domain/sessions/validation.ts:42`, `:368-381`) ;
- `normalizeInstruction` ;
- le `maxLength` du champ (`Form:419`) ;
- `formValueEquals` (`ExerciseScreen.tsx:192-200`) ;
- le transport d'`instruction` (`ActivityDefinition.ts:361`).

Il n'y a ni reprise, ni conversion des anciens textes (FR-35). Si les étapes sont encodées une par ligne, il faut tenir compte du piège des fins de ligne CRLF (AGENTS.md).

### Q-A6 : Mémoire de la dernière valeur chiffrée (FR-19, FR-21 ; Δ25, Δ27)

Où vit-elle pendant l'édition : dans le brouillon seulement (`TargetsByMode`), sans persistance ? Le choix doit garder les trois cibles typées comme seule donnée persistée.

Le résultat AR-01 (FR-20) est calculé par une fonction pure, lue par la Feuille, à partir des prédicats existants (`EP:226-238`). Cette fonction doit traiter le cas `UNSET` : une cellule vide n'est comptée ni comme cible, ni comme échec.

### Q-A7 : Champ de saisie clavier dans la `Modal` de la Feuille (FR-23 à FR-25 ; Δ29, Δ49)

À concevoir :

- le composant de champ ;
- une nouvelle surface « saisie clavier » dans `sheetSurface.ts`, selon la règle d'une seule surface ouverte ;
- la gestion du clavier dans la `Modal` (patrons `BodyZonePickerModal.tsx:92-104`, `:314-318`, `Form:236-252`) ;
- l'enchaînement du focus pour Précédent / Suivant, avec les primitives natives ;
- le fond de la cellule active.

Les composants définitifs ou directement réutilisables (`KeyboardField` final, barre Précédent / Suivant / Fermer, fond actif) sont recettés tôt sur iPhone (NFR-6), sans interface provisoire à reconstruire. Le libellé de phase au clavier texte ne dépend pas de l'issue de cet essai.

## Vérifications techniques demandées à l'architecture

- **Ancrage des panneaux (FR-26) :** les panneaux sont placés par rapport à un seul groupe (`groupBox`, `variableGroupY`, `Sheet:1303-1333`, `:982`). Il faut redéfinir le repère pour quatre cadres.
- **Popover du Mode (R-01) :** retrait de `NativeRowPopover` (`Sheet:325-410`). Les tests `ExecutionParametersSheet.test.tsx:1257` et `:1368` sont révisés par conception.
- **Segmenté natif (FR-27, QP5-06) :** vérification courte de l'API `@expo/ui` 57 dans la documentation Expo v57 avant tout remplacement. Le `SegmentedControl` existant est réutilisé par défaut.
- **Bornes minimales des durées (FR-45, Δ50, décision de Hermann du 19/10) :** points de code à vérifier :
  - la borne de saisie de la durée de série, `EP:88` (aujourd'hui 5..3535) ;
  - les CHECK SQL et la projection scalaire (`projectScalars`, `EP:856-869` ; `assertActivityColumns`, `SqliteSessionRepository.ts:1420-1424`), qui acceptent déjà 1..5999 selon l'inventaire ;
  - les roues de durée (`DurationWheelPicker`) : minimum et pas de 1 s, sans nouveau composant ;
  - `validation.ts` ;
  - les tests qui fixent un minimum ou un pas de 5 s.

  Les maxima et les calculs ne changent pas.
- **Garde de la projection (FR-40) :** la somme des phases dans la projection scalaire et dans `assertActivityColumns`.
- **Transport (FR-41) :**
  - `cloneExecutionParameters` (`EP:937-948`) ;
  - `ActivityDefinition.ts:339-365` ;
  - `composition.ts:217-243` ;
  - `exerciseSnapshot.ts:91-135` ;
  - `runNativeDatabaseIntegrationCheck.ts:62`.
- **Brouillon (FR-11) :** `openSheetDraft`, `plain` et `requestedParameters` (`Draft:132-195`), `setSeriesCount` (`:269-306`), `removeRow` et `undoRemoval` (`:489-522`). Chaque transition structurelle remet `pendingRemoval` à `null`.

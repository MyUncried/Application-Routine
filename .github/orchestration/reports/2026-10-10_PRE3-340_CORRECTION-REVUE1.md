# PRE-3 — correction après la première revue indépendante (#340)

## Identité de la mission

- **Identifiant** : PRE3-340_CORRECTION-REVUE1
- **Mission** : `docs/preparation/PRE-3/planification/execution/preuves/mission-correction-revue1.md`
- **Objectif** : corriger les constats REV-01 à REV-06 de `2026-10-10_PRE3-340_REVUE-IMPLEMENTATION-1.md`, relancer les tests et publier les preuves sur la même branche pour une seconde revue indépendante.
- **Branche** : `feat/pre3-exercice-20261009`
- **Tête de départ** : `94c8512e` (contient la revue). Référence examinée par la revue : `96c46c74`. Plan approuvé : `43e7b344`.
- **Écrivain** : Claude Code local, seul écrivain, dans un worktree isolé.
- **Limites** : aucune fusion, aucune auto-approbation, #340 reste ouverte, aucune modification VNext/V2 ni du protocole.

## Périmètre

- **Demandé** : REV-01 à REV-06 ; extension bornée à deux suites d’intégration et à `app.json` (texte Photos uniquement) ; régressions exhaustives dans les suites propriétaires ; relance complète des tests ; preuves versionnées sans écraser les précédentes.
- **Traité** : tout le périmètre demandé, sauf les comparaisons **rendues**, bloquées par l’environnement (voir REV-06). Aucun chemin hors `write_scope@43e7b344` ∪ extension ∪ chemins documentaires n’a été modifié.

## Livraison (commits)

| Commit | Contenu |
|---|---|
| `12506088` | Corrections dans le `write_scope` : REV-01, REV-02, REV-03, REV-06 et leurs tests propriétaires |
| `11447e6d` | **Extension bornée**, commit séparé : les 2 suites d’intégration (REV-04) et `app.json` `photosPermission` (REV-05) |
| commit documentaire | Ce rapport et les preuves `*-revue1.*` (hash communiqué dans la réponse de livraison) |

## Analyse historique (avant correction)

| Constat | Parcours | Introduction | Détection | Attribution |
|---|---|---|---|---|
| REV-01 | Changement de mode dans la feuille Paramètres | `bdc133c3` (brouillon avec réserve unique par position, sans mémoire par mode) | Revue 1, sur `96c46c74` (repro rouge) | Démontrée : la repro échoue sur `96c46c74` et passe après `12506088` |
| REV-02 | Total à N=1 dans un tableau variable | `bdc133c3` : `applyRequestedTotal` exigeait l’uniforme du brouillon, alors que l’inversion porte sur l’effectif | Revue 1 | Démontrée (même méthode) |
| REV-03 | Réessai d’import de médias | `bdc133c3` : le réessai ajoutait le média en fin de liste | Revue 1 | Démontrée (même méthode) |
| REV-04 | 2 intégrations sur l’ancien éditeur | Remplacement de l’éditeur dans `bdc133c3` ; signalé dès la livraison (`SCOPE_EXPANSION_REQUIRED`) | Livraison `96c46c74` | Démontrée ; ce n’était pas un défaut du code PRE-3 mais un écart de périmètre |
| REV-05 | Invite Photos | Texte PRE-2 antérieur, devenu inexact avec PRE-3 | Livraison `96c46c74` | Démontrée |

Aucun de ces constats ne vient d’une optimisation ou du transport : il n’y avait aucun succès comparable antérieur, puisque ces parcours sont nouveaux dans PRE-3.

## Constats et corrections

- **REV-01**
  - Le brouillon porte maintenant :
    - une identité par ligne (`rowIds`, `hiddenIds`, `savedIds`, `uniformId`) ;
    - des cibles mémorisées par mode et par identité (`targetsById[id][mode]`).
  - `setMode` recharge les cibles du mode visé, ou « — » s’il n’en a pas. Une valeur d’un autre mode n’est donc jamais réutilisée comme cible.
  - Le retour au mode précédent restaure ses cibles. N, pauses, bip et ordre sont conservés.
  - Le déplacement et le clonage d’une ligne gardent son identité.
  - ✕ annule tout. ✓ n’émet que l’état effectif valide, sans identité ni réserve.
- **REV-02**
  - `applyRequestedTotal` ne vérifie plus que l’inversibilité des paramètres **effectifs**.
  - Un brouillon variable ramené à N=1 est d’abord normalisé en uniforme, puis le total est appliqué. `isRequestedTotalEditable` pilote l’édition du total.
  - Les réglages uniformes affichés à N=1 modifient la première ligne effective : aucun contrôle actif n’est sans effet.
  - Si N remonte, la réserve est restaurée.
- **REV-03** : `selectionNeighbours` et `placeRetriedMedia` (domaine) replacent un média réessayé avant son premier voisin suivant encore présent, sinon après son dernier voisin précédent, sinon en fin. Il n’y a ni doublon ni perte.
  - Les échecs des lots précédents sont conservés et une annulation est neutre.
  - Un réordonnancement ou un retrait explicite fait avant le réessai est respecté.
- **REV-04** : les deux suites pilotent le parcours PRE-3 réel : Catégorie, Zone, feuille Paramètres et providers référentiels.
  - Nombre de tests inchangé (2 et 5) ; nombre d’`expect` 14 → 15 et 19 → 19.
  - Trois assertions ont été **remplacées**, aucune n’a été supprimée silencieusement :
    1. `bodyZoneRow.count == 1` devient « zones = [cuisses, dos] » et « paramètres et Catégorie non nuls » : PRE-3 impose une Zone à chaque Exercice.
    2. « Description masquée avant déploiement de section » devient « un seul nœud accessible » : les sections repliables n’existent plus.
    3. « Libellé Durée totale visible » devient « phrase de la carte : 1 série de 45 s. » : le total redondant est omis, conformément à phrase v1.
  - Contrats conservés :
    - persistance et ordre d’insertion ;
    - atomicité en cas d’échec (base fermée avant l’enregistrement, aucune donnée partielle) ;
    - position, double appui et Continuer.
- **REV-05** : le nouveau texte est « Routine accède à vos photos et vidéos pour choisir la photo de votre profil et ajouter des médias à vos exercices. »
  - Les options `cameraPermission: false` et `microphonePermission: false` ne changent pas.
  - Configuration générée (`config-expo-revue1.json`) : `NSPhotoLibraryUsageDescription` est à jour ; aucune clé caméra ni micro.
- **REV-06** : écarts corrigés dans le périmètre, détaillés dans `comparaison-visuelle-revue1.md` :
  - ✓ grisé, cellule signalée et message de Série incomplète ; total « — » (v13 §6) ;
  - poignée de glisser et actions accessibles ; groupe variable encadré ; contrôle de divulgation ;
  - largeurs des steppers ; message d’ajustement sous le total ;
  - retour à la ligne de présentation de la phrase ; menu par média (D-335) ;
  - feuille Catégorie sans coche avec le titre Figma ; actions de création ;
  - résumé compact et durée sur la carte Catalogue.
  - **Aucune comparaison rendue** n’a été faite : il n’y a ni simulateur, ni appareil, ni EAS CLI sur ce poste (Windows ARM64). Le candidat, la commande de build et une procédure bornée sont dans `procedure-appareil-revue1.md`.

## Preuves et tests

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | PASS |
| `npx eslint src app` | PASS, 0 erreur, 0 avertissement |
| `npx jest --json` | **97/97 suites, 1914/1914 tests**. Avant : 95/97 et 1886/1893 |
| repro de revue `revue-independent-transitions.repro.tsx` (commande de la mission) | **3/3 PASS**, attendus inchangés |
| obligations `tests-and-preservation.json@43e7b344` | **442/442 PASS**, dont les 276 phrases et les 13 cas numériques |
| `verifier-passe2.cjs` | PASS (2143 contrôles) |
| `controle-portee.cjs` original | Exit 1, **attendu et non falsifié** : il signale exactement `app.json` et les 2 suites de l’extension |
| contrôle étendu (`write_scope` ∪ extension ∪ documentaire) | PASS. 72 chemins dans le `write_scope`, 3 dans l’extension, documentaires ; 0 chemin inattendu ; dans `app.json`, seul `photosPermission` change |
| `npx expo config --type introspect` | PASS (voir REV-05) |

- **SQL réel** : SQLite via `node:sqlite`, en mémoire et sur fichier ; fichiers réels pour les copies de médias. Nouveau test REV-03 : liens A, B, C relus après réouverture du fichier de base.
- **Régressions propriétaires ajoutées** :
  - REV-01 : 6 cas dans le domaine et 1 dans la feuille ;
  - REV-02 : 2 dans le domaine et 2 dans la feuille ;
  - REV-03 : 3 dans le domaine, 2 dans l’éditeur et 1 sur fichiers et SQLite réels.
  - Liste dans `resultats-tests-revue1.json#/rev_regressions`.
- **Preuves publiées** dans `docs/preparation/PRE-3/planification/execution/preuves/` :
  - `resultats-tests-revue1.json`, `couverture-obligations-revue1.json`, `controle-portee-revue1.json`, `config-expo-revue1.json` ;
  - `comparaison-visuelle-revue1.md`, `procedure-appareil-revue1.md`.
  - Les preuves de la livraison `96c46c74` sont conservées intactes.

## Couverture P3-01..23

Toutes les obligations sont PASS (442). Répartition :

| Exigence | Obligations | Exigence | Obligations | Exigence | Obligations |
|---|---|---|---|---|---|
| P3-01 | 14 | P3-02 | 3 | P3-03 | 6 |
| P3-04 | 2 | P3-05 | 3 | P3-06 | 3 |
| P3-07 | 3 | P3-08 | 5 | P3-09 | 5 |
| P3-10 | 4 | P3-11 | 4 | P3-12 | 17 |
| P3-13 | 8 | P3-14 | 5 | P3-15 | 283 |
| P3-16 | 8 | P3-17 | 16 | P3-18 | 4 |
| P3-19 | 5 | P3-20 | 7 | P3-21 | 2 |
| P3-22 | 4 | P3-23 | 11 | | |

S’y ajoutent INTERACTION (10) et ACCESSIBILITY (10).

Pour P3-20 (surfaces) et P3-21 (accessibilité), la preuve est structurelle et simulée. Le rendu natif et VoiceOver réel restent à vérifier sur appareil.

## Change Control (PRESERVE / CHANGE / FORBIDDEN)

- **PRESERVE**, vérifié par les suites inchangées et vertes :
  - roulette native `DurationWheelPicker.tsx`, non modifiée (R-1) ;
  - politique du stepper Profil (R-2) : `InlineStepper` ne gagne que les props optionnelles `width` et `invalid`, et `ProfileStepper.test` reste vert ;
  - `SegmentedControl.tsx` et `tokens.ts`, non modifiés ;
  - migrations 001..009, Profil, Composition hors résumé compact.
- **CHANGE** : 22 chemins du `write_scope` (commit `12506088`) et 3 chemins de l’extension (`11447e6d`).
- **FORBIDDEN respecté** :
  - aucune nouvelle dépendance, aucun nouvel asset, aucune primitive remplacée ;
  - le glisser utilise les props *responder* natives de React Native, comme l’écran Composition ;
  - aucune modification VNext, V2 ou du protocole.

## Hypothèses non démontrées

- Le rendu réel (360 / 402 / 440, texte agrandi) et la fluidité du glisser de la poignée au doigt. Seuls le calcul de destination et les actions sont testés.
- L’affichage de `ActionSheetIOS` et l’annonce VoiceOver des actions de média sur un appareil.
- L’invite système iOS : vérifiée seulement dans la configuration générée.

## Éléments non corrigés ou hors périmètre

- Écarts qui exigent un chemin hors périmètre, identifiés sans élargissement, avec chemins et consommateurs dans `comparaison-visuelle-revue1.md` :
  - `SegmentedControl.tsx` (E7, E14) ;
  - `DurationWheelPicker.tsx` (E8, tension avec R-1, déjà arbitrée) ;
  - icône photo-ajout et `KodjoIcon.tsx` (E9) ;
  - `expo-linear-gradient` (E1) ;
  - dialogue d’abandon D-094 (E13).
- **Note sur une source** : l’énoncé de l’obligation P3-13 cite 225 s, alors que la spécification et le calcul indépendant donnent 195 s. Le test suit la spécification ; le point est signalé au pilote sans modifier le plan figé.
- Il ne reste aucune question fonctionnelle nouvelle.

## Vérifications restant à faire sur appareil réel

- Avant tout : une nouvelle build native, avec la commande `npx eas-cli build --profile review --platform ios` (compte EAS requis ; non lancée ici).
- Les étapes R1 à R10 de `procedure-appareil-revue1.md`, et les sections A à D de `procedure-appareil.md`.
- Aucun contrôle de base de données ni de calcul n’y est demandé.

## Fichiers modifiés (94c8512e → tête)

- **Code**, dans le `write_scope` :
  - `src/domain/activities/ExecutionParametersDraft.ts` et `src/domain/media/ActivityMedia.ts` ;
  - `src/features/activities/{ActivityCard,ActivityEditorForm,ActivityMediaList,ExecutionParametersSheet}.tsx` ;
  - `src/features/reference-data/{BodyZonePickerModal,CategoryPickerModal}.tsx` ;
  - `src/features/sessions/compositionPresentation.ts` ;
  - `src/shared/i18n/index.ts` et `src/shared/ui/ProfileStepper.tsx`.
- **Tests**, dans le `write_scope` : `ExecutionParametersDraft.test.ts`, `ActivityMediaImportService.test.ts`, `ActivityCard.test.tsx`, `ActivityEditorForm.test.tsx`, `ActivityMediaList.test.tsx`, `ExecutionParametersSheet.test.tsx`, `BodyZonePickerModal.test.tsx`, `CategoryPickerModal.test.tsx`, `ExerciseScreen.test.tsx`, `compositionPresentation.test.ts` et `LocalMediaStore.test.ts`.
- **Extension** : `app.json`, `CompositionExerciseFlow.integration.test.tsx` et `CategoriesSaveFlow.integration.test.tsx`.
- **Documentaire** : ce rapport et les 6 preuves `*-revue1.*`.

## Commit final et état Git

- Commits de code : `12506088` et `11447e6d`. Le commit final est le commit documentaire qui contient ce rapport ; son hash est communiqué dans la réponse de livraison et visible sur la branche.
- État distant avant publication : `origin/feat/pre3-exercice-20261009` = `94c8512e`, à vérifier par fetch avant le push.
- Publication sans force. Aucune fusion. #340 reste ouverte. Aucune auto-approbation.
- Étape suivante : seconde revue indépendante.

# PRE-3 (#340) — correction après la recette iPhone 2

## Identité de la mission

| Élément | Valeur |
|---|---|
| Identifiant | `PRE3-340_CORRECTION-RECETTE2` |
| Objectif | Traiter les 10 écarts de la recette 2 : corriger les défauts et les ajustements dans le périmètre autorisé, proposer les extensions, consigner les décisions et mettre à jour la documentation, puis publier une mise à jour de retest vérifiée. |
| Source | `KODJO_PRE3_Recette2_Ecarts_et_Mission_Claude.md` |
| Branche | `feat/pre3-exercice-20261009`, au départ `b1399804` (local = distant) |
| Candidat testé | `0f86cddb`, OTA `01a12f22-927f-70a1-9060-17e3379ccc2d` sur le build 7 (chargement confirmé par Hermann) |
| Plan approuvé | `43e7b344` |
| Écrivain | Claude Code local, seul, même worktree isolé sans conversion des fins de ligne |
| Limites | Aucun PRE-4, aucune fusion, aucune clôture, aucun `VISUAL_APPROVED`, aucune modification du protocole |

## Périmètre

**Demandé** :
- 10 écarts (T-10, T-15, T-49, T-53, T-58, N-01 à N-05) ;
- registre, décisions et documentation ;
- extensions proposées ;
- procédure de retest unique ;
- mise à disposition vérifiée.

**Traité** :
- corrigés : T-10/F-02, T-15, T-49 (éditeur), T-58, N-01, N-02, N-05 ;
- T-53 : non reproduit par analyse, capture demandée ;
- T-49 (Catalogue, Composition), N-03, N-04 : extensions proposées, non réalisées.

## Analyse historique (avant correction)

| Écart | Introduction | Détection | Attribution |
|---|---|---|---|
| F-02 (T-10) | `bdc133c3` : répéteur `InlineStepper` créé une fois, closure du premier appui | Recette 1 (non reproduit), recette 2 | **Démontrée** : test rouge sur l’original (« 30 rép. »). Explique aussi le contournement déclaré : désactiver puis réactiver l’interrupteur remonte les steppers. Les reproductions précédentes appuyaient pour la première fois **après** le changement de mode, ce qui masquait le défaut. |
| T-15 | `12506088` : glisser par responder dans un `ScrollView` défilant | Recette 2 (après la correction du plantage F-01, `50691dc0`) | **Plausible** : défilement natif d’iOS concurrent du responder. Le test Jest ne simule pas le défilement natif ; le correctif supprime la concurrence. |
| T-49 (éditeur) | `HeaderSeparator` d’origine (PRE-2) ; contour `sessionNameBorder` (PRE-2) ; fondu en bandes `f372cc5d` | Recette 2 | Barre et contour : présentations existantes, retirées sur décision (D-348). Liserés : **plausible** (interstices entre bandes). |
| N-05 | `bdc133c3` : Terminer dans le `KeyboardAvoidingView` | Recette 2 | **Démontrée** (structure ; test rouge sur l’original) |
| T-58, N-01, N-02 | — | Recette 2 | Ajustements de présentation (D-346, D-347), pas des défauts |

## Modifications

**Code** (`2f7ab29207e404bcf750411d42b9c5a119f376b0`, uniquement dans la `write_scope@43e7b344`) :
- `ProfileStepper.tsx` (F-02) ;
- `ExecutionParametersSheet.tsx` (T-15, T-58) ;
- `ActivityEditorForm.tsx` (T-49, N-05) ;
- `ExerciseScreen.tsx` (T-49) ;
- `CategoryPickerModal.tsx`, `BodyZonePickerModal.tsx` (N-01, N-02) ;
- `tokens.ts` et chapitre 12 (`snackbarActionSurface`).

**Tests** : F-02, T-15 (×2), N-05 et N-01/N-02 (×2) ajoutés. Trois assertions remplacées et tracées (D-5 → T-58, Annuler retiré, en-tête sans séparateur). Aucune suppression.

**Documentation** :
- registre 07 : D-345 à D-349 ;
- v13 : D-345, D-346 ;
- contrats 13, CE-UI-09 : D-347 ;
- chapitre 06 l.184 : exception D-349 pour l’éditeur, et D-348 ;
- chapitre 12 : token T-58.

**Preuves** :
- `registre-recette2.md`, `procedure-retest-recette2.md` ;
- `resultats-tests-recette2.json`, `couverture-obligations-recette2.json`, `controle-portee-recette2.json`.

## Preuves et tests

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | PASS |
| `npx eslint src app` | PASS |
| `npx jest --json` | **97/97 suites, 1949/1949 tests** |
| `verifier-passe2.cjs` | PASS (2143) |
| Obligations `@43e7b344` | **442/442 PASS** |
| Contrôle de portée étendu | PASS : code dans la `write_scope` d’origine ; documents normatifs demandés ; preuves |
| Contrôles de mutation | F-02, T-15, N-05 : rouges sur l’original, verts après correction |

## Hypothèses non démontrées

- T-15 : la concurrence avec le défilement natif est la cause probable, pas observée. Le défilement automatique aux bords n’est pas ajouté.
- T-49 : l’origine des deux liserés du bas n’est pas observée ; une capture est demandée s’ils persistent.
- T-58 : opacité 10 % retenue (lisibilité du texte blanc), à confirmer.
- N-05 : la tenue du curseur pendant l’édition au milieu du texte repose sur le défilement interne d’iOS ; elle n’est pas observée.

## Non corrigé, en attente

| Point | Raison |
|---|---|
| T-53 | Non reproduit : capture et version d’iOS demandées |
| EXT-R2-A (Catalogue, Composition) | Extension hors PRE-3 ; préciser le champ de nom en Composition |
| EXT-R2-B (Étiquette) | Extension hors PRE-3 ; règle de sélection à décider |
| EXT-R2-C (menu d’appui long) | Composant partagé hors du périmètre d’écriture |

## Vérifications restant à faire sur appareil

`procedure-retest-recette2.md`, R2-01 à R2-11.

## Commit final et état Git

Commit de code `2f7ab292`. La publication, la vérification distante et la mise à jour OTA sont consignées dans la section « Publication » ajoutée après leur exécution.

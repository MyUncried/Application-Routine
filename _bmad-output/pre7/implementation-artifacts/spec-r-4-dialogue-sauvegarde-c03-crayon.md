---
title: 'R-4 — Dialogue unique de sauvegarde du mouvement (C03), crayon depuis une Séance (C04), vocabulaire « mouvement »'
type: 'feature'
created: '2026-10-26'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/docs/KODJO-Niveaux-Recherche-Parcours-Regles-v7.md'
  - '{project-root}/docs/figma-niveaux-2026-10-25/releve-utilisateur.md'
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-reprise-q1-q11.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** La sauvegarde d'un mouvement modifié suit encore MFN-08 :
- question posée seulement si le mouvement est « déjà utilisé » ;
- libellés « Corriger cet exercice / Créer un nouvel exercice » et « Corriger ce geste / En faire un geste distinct » ;
- feuille basse ;
- contenu d'une occurrence de Séance verrouillé sans crayon.

D-445 C03 et C04, validées par Hermann, remplacent ces règles. L'interface parle encore de « geste », alors que la v7 §1 impose « mouvement ».

**Approach:** Une seule règle de domaine décide la sauvegarde, selon la matrice C03. Elle s'applique dans tous les contextes d'édition d'un mouvement existant : Catalogue, reprise en création et occurrence de Séance par le crayon. Le dialogue est centré, conforme aux maquettes `9952:44349`, `10253:20414` et `10257:20651`. Depuis une Séance :
- « Mettre à jour ce mouvement » inscrit la correction dans le brouillon ;
- « Créer un nouveau mouvement » remplace l'occurrence par une nouvelle occurrence d'un nouveau mouvement ;
- tout est écrit à l'enregistrement de la Séance.

## Boundaries & Constraints

**Always:**
- **Matrice C03.**
  - Nom enregistré modifié (comparaison exacte après normalisation des espaces par la validation) : le dialogue « Vous souhaitez : » s'ouvre toujours, avec deux choix explicites « Mettre à jour ce mouvement » et « Créer un nouveau mouvement », plus Annuler. Aucune présélection ; Confirmer reste visible mais indisponible jusqu'au choix.
  - Nom inchangé et contenu modifié, avec au moins un autre exercice ou une exécution enregistrée : « Vous avez modifié ce mouvement », Annuler / Confirmer.
  - Contenu modifié sans autre exercice ni exécution : sauvegarde silencieuse.
  - Paramètres seuls : aucun dialogue.
- **Contenu concerné** : nom, alias, description, médias, Catégorie, Zones et structure des phases (identités, libellés, ordre). Les durées de phase et les autres paramètres n'en font jamais partie.
- **Autres exercices** : définitions du Catalogue et occurrences de Séance persistées, comptées une fois, hors objet édité. Le nombre d'exécutions vaut 0 tant que le moteur T04 n'existe pas, et la règle prend déjà ce nombre en entrée.
- **Portée affichée.**
  - Avec au moins un autre exercice : « {n} autres exercices utilisent ce mouvement. » ou « 1 autre exercice utilise ce mouvement. ».
  - Sans autre exercice (choix du nom) : « Aucun autre exercice n'utilise ce mouvement. ».
- **Annuler** revient au brouillon de l'éditeur, intact, sans écriture.
- **Crayon C04.**
  - Dans l'éditeur d'occurrence d'un mouvement enregistré, le crayon déverrouille le contenu et la structure.
  - « Mettre à jour » inscrit un mouvement `EDITED` dans la table du brouillon : toutes ses occurrences l'affichent, et le repository le met à jour à l'enregistrement.
  - « Créer un nouveau mouvement » : nouveau mouvement `NEW` (nouvel identifiant) et nouvelle occurrence à la même place, avec les paramètres transférés par identité (structure éditée). L'ancienne occurrence est retirée du brouillon. Aucun rattachement automatique au groupe de niveaux (Q10).
- **Vocabulaire.** Tous les textes d'interface « geste » deviennent « mouvement » ; les identifiants de code restent inchangés (D-201).
- **Dialogue.** Composant natif `Modal` centré, avec les dimensions du relevé (354 de large, marges 24, cartes 306 × 68, boutons 147 × 48) et les jetons existants. `tokens.ts` reste inchangé.

**Never:**
- Aucune feuille basse ni aucun `Alert` pour ce dialogue.
- Aucune présélection.
- Aucun bouton de création distincte hors du dialogue.
- Aucune déduction automatique entre correction et nouveau mouvement.
- Aucune modification de schéma.
- Aucune recherche R02 (R-5) et aucune commande Niveau en Séance (R-6).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Nom modifié, 0 autre | « Squat » → « Squats », seul exercice | dialogue de choix, « Aucun autre exercice… », Confirmer indisponible | N/A |
| Casse seule | « squat » → « Squat » | dialogue de choix (nom enregistré modifié) | N/A |
| Description modifiée, 2 autres | nom inchangé | « Vous avez modifié ce mouvement », « 2 autres exercices… », Annuler / Confirmer | N/A |
| Zones modifiées, 0 autre | nom inchangé | sauvegarde silencieuse | N/A |
| Durées de phase seules | structure inchangée | aucun dialogue | N/A |
| Séance, crayon + Mettre à jour | 2 occurrences du mouvement dans le brouillon | les deux affichent la correction ; à l'enregistrement, le mouvement est mis à jour | N/A |
| Séance, crayon + Créer un nouveau | nom changé | l'occurrence est remplacée à la même place ; l'autre occurrence garde l'ancien mouvement | nom déjà pris : refus à l'enregistrement (R-5 : contrôle pendant la saisie) |

</frozen-after-approval>

## Code Map

- `src/domain/activities/movementSave.ts` (nouveau) : `movementContentChanged`, `decideMovementSave(before, after, otherUsageCount, executionCount)` donnant `NONE | SILENT | CONFIRM | CHOICE`.
- `src/domain/activities/sharedCorrection.ts` : l'évaluation expose la décision C03 ; retrait du cas `INELIGIBLE` devenu inatteignable (report R-2).
- `src/features/activities/ActivityDefinitionService.ts` :
  - compte les autres exercices : définitions hors édité, plus occurrences ;
  - le nombre d'exécutions vaut 0 ;
  - retrait de `INELIGIBLE_SIBLINGS`.
- `src/features/activities/IdentityDecisionSheet.tsx` est remplacé par `MovementSaveDialog.tsx`, le dialogue centré à deux variantes.
- `src/features/sessions/ExerciseScreen.tsx` :
  - éditeur Catalogue et reprise : la décision C03 remplace `requiresIdentityDecision` ;
  - éditeur d'occurrence : crayon (`EditMovementAction`, existant), décision C03 au moment de Terminer, puis `withDraftMovement` pour un mouvement `EDITED`, ou remplacement d'occurrence par un nouveau mouvement.
- `src/domain/sessions/SessionDraft.ts` / `composition.ts` : `replaceOccurrenceWithNewMovement` (même place, nouvel identifiant, paramètres transférés).
- `src/shared/i18n/resources/fr.ts` : textes du dialogue (relevé `releve-utilisateur.md` §4) et « geste » → « mouvement ».
- Tests :
  - domaine : matrice ;
  - composant : Confirmer indisponible, choix, Annuler ;
  - intégration : Catalogue, reprise, Séance avec Mettre à jour et avec Créer un nouveau.

## Tasks & Acceptance

**Execution:**
- [x] Domaine C03 et ses tests.
- [x] Dialogue `MovementSaveDialog` et ses tests.
- [x] Éditeur : Catalogue, reprise, crayon en Séance (deux choix) ; textes.
- [x] Tests d'intégration ; tests de l'ancien dialogue adaptés.

**Acceptance Criteria:**
- Given une occurrence d'un mouvement enregistré dans une Séance, when on touche le crayon, modifie la description et termine, then sans autre exercice la sauvegarde est silencieuse, et avec d'autres exercices une confirmation est demandée. Après l'enregistrement de la Séance, le Catalogue montre la nouvelle description.
- Given le dialogue de choix ouvert, when aucun choix n'est sélectionné, then Confirmer est visible et indisponible, et Annuler reste disponible.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

## Implementation Notes

- **Domaine.** `movementSave.ts` : `movementContentOf`, `movementContentChanged`, `decideMovementSave`. `assessSharedCorrection` rend `decision` (remplace `sensitiveChange` / `requiresIdentityDecision`) ; Catégorie, Zones et alias entrent dans le contenu (champ absent = inchangé) ; exécutions = 0. Cas `INELIGIBLE` / `INELIGIBLE_SIBLINGS` et `correctionScope` retirés.
- **Catalogue et reprise.** `ActivityDefinitionService.assessActivityDefinitionCorrection` compare au Mouvement enregistré (Catégorie `NEW` = modifiée). L'éditeur ouvre `MovementSaveDialog` pour `CHOICE` / `CONFIRM` ; UPDATE et CONFIRM → correction (étape de complétion des frères conservée), NEW_MOVEMENT → origine `VARIANT` sans rattachement (Q10) ; `SILENT` / `NONE` → correction directe. `IdentityDecisionSheet` et son test supprimés.
- **Crayon C04.** `EditMovementAction` sur une occurrence existante d'un Mouvement enregistré (service avec `MovementRepository`). Le crayon lit le contenu courant (entrée `EDITED` du brouillon, sinon `getMovement`) et passe le compteur de phase à la Feuille. À `Terminer` : autres exercices = `countMovementUsage` (définitions + occurrences des AUTRES Séances : `MovementRepository.countOccurrences(id, excludingSessionId)`, sans changement de schéma) + autres occurrences du brouillon. UPDATE / CONFIRM / SILENT → `withDraftMovement(draftMovementOf(…, "EDITED"))` ; NEW_MOVEMENT → `replaceOccurrenceWithNewMovement` (`SessionDraft.ts`, nouvel identifiant d'occurrence et de Mouvement, sans alias ni groupe, réserve de Circuit transférée). Nom et description comparés normalisés (`movementContentOfDraft`).
- **Vocabulaire.** Textes « geste » de `fr.ts` → « mouvement » ; bloc `identityDecision` retiré.
- **Points ouverts** (consignés dans `deferred-work.md`) : correction de structure depuis la Séance sans complétion des frères du Catalogue ; pas de crayon sur une occurrence en création reprise par « Même mouvement » ; échec de lecture de l'usage à `Terminer` sans message.

## Spec Change Log

## Review Triage Log

Revue du 26/10/2026 : trois couches (Blind Hunter, Edge Case Hunter, Verification Gap) sur le diff depuis `e4761a67`.

| # | Source | Constat | Verdict | Preuve | Route |
|---|---|---|---|---|---|
| 1 | BH, VG | Déverrouillage avec une entrée EDITED dans le brouillon : la référence « avant » est cette entrée, pas le Mouvement enregistré ; cette branche n'a aucun test | low | Comparer à l'enregistré redemanderait le choix pour une modification de paramètres seuls sur une seconde occurrence (vue déjà corrigée) ; la référence du brouillon est la bonne. Le manque de test est réel | patch (test) |
| 2 | VG | Catégorie et Zones dans la comparaison du Catalogue non testées au niveau du service | low | Gap filé | patch (tests `mfnServices.a13`) |
| 3 | VG, BH | `countOccurrences(id, excludingSessionId)` sans test direct | low | Gap filé | patch (test deux Séances) |
| 4 | VG | `nextPhaseId` du Mouvement déverrouillé non vérifié | low | Gap filé | patch (test) |
| 5 | VG, BH, ECH | Réserve de Circuit après « Créer un nouveau mouvement » | false | Séries modifiées : `exitCircuit` retire l'entrée de l'ancienne occurrence, et la nouvelle n'en a pas, comme le veut la règle de réserve. Séries inchangées : `nextReserve` transfère l'entrée (test de domaine) | reject |
| 6 | ECH | Description « avant » non normalisée comme la saisie | low | `getMovement` rend la description brute, la saisie passe par `encodeInstructionSteps` ; correction directe | patch |
| 7 | BH | Dialogue du Catalogue conditionné à `origin !== null`, qu'il n'utilise plus | low | Si `origin` est nul, `Terminer` ne fait rien ; correction directe | patch |
| 8 | BH | `movementUsed` et `affectedDefinitionCount` ne sont plus lus | low | Aucun lecteur hors des tests ; suppression | patch |
| 9 | BH, ECH | README encore orientés vers `IdentityDecisionSheet` et son test supprimé | low | Lignes citées | patch |
| 10 | BH | Couverture perdue de `SiblingCompletionStep` et `durationEntryValue` avec le test supprimé | medium | Cas présents dans `IdentityDecisionSheet.a22.test.tsx` à `e4761a67`, absents du diff | patch (restauration) |
| 11 | BH | Retour système du dialogue non testé | low | Gap | patch (test) |
| 12 | BH, ECH | Nom déjà pris (y compris casse seule plus « Créer un nouveau ») : erreur générique à l'enregistrement | medium | Même cause que le report R-3 n° 1 ; la spec renvoie le contrôle pendant la saisie à R-5 | defer (R-5) |
| 13 | BH | CONFIRM avec 0 autre exercice et des exécutions : texte contradictoire | low | Inatteignable avant T04 (exécutions = 0) | reject |
| 14 | BH | Échec de lecture au déverrouillage silencieux | low | Lecture locale ; journal seulement | defer |
| 15 | BH | Commentaire de géométrie du dialogue et constantes locales | low | Valeurs relevées sur Figma et documentées ; `tokens.ts` verrouillé | reject |
| 16 | BH | Catégorie et Zones requises dès le déverrouillage | false | Après la 013, tout Mouvement a une Catégorie et des Zones | reject |
| 17 | BH | Crayon masqué sans `supportsSharedCorrection` non testé | low | Doublures antérieures seulement | reject |
| 18 | ECH | Saisie pendant le comptage asynchrone à `Terminer` | low | Lecture locale de quelques millisecondes | reject |
| 19 | ECH | Lecture terminée après démontage | low | Sans effet visible | reject |
| 20 | ECH | `sourceMovementId` entouré d'espaces | false | Identifiants générés, jamais saisis | reject |
| 21 | ECH | Original remplacé : les copies restantes gardent « (copie n) » | low | Q3 : le numéro de copie est un attribut non modifiable ; aucune renumérotation décidée | reject |

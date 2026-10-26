---
title: 'Recette JA — copie locale déverrouillée et fermeture du clavier du nom'
type: 'bugfix'
created: '2026-10-26'
status: 'done'
baseline_commit: '40cac07a655b18c73a90c8847a972b8fe3bb3390'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/implementation-artifacts/epic-A2-context.md'
  - '{project-root}/src/features/activities/README.md'
  - '{project-root}/src/features/sessions/README.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recette iPhone JA de Hermann, deux corrections tranchées par lui le 26/10/2026. R1 : la copie (duplication de Composition) d'une occurrence créée localement et non encore enregistrée a son contenu et sa structure de phases verrouillés, alors que sa source reste modifiable ; à l'enregistrement, les deux partagent un Mouvement de structures différentes (`deferred-work.md`, entrées A1.2 « filiation de la copie locale » et A2.1 « copie verrouillée »). R2 : nom de l'Exercice en saisie, clavier ouvert, un appui ailleurs ouvre la Feuille des paramètres ou met la Description en saisie au lieu de seulement fermer le clavier.

**Approach:** R1 — « La copie d'un exercice local doit être déverrouillée » (Hermann) : la copie en attente (`pendingLocalMovement`) est traitée comme sa source, modifiable jusqu'au premier enregistrement de la Séance (exception de création locale MFN-09). À la conversion du brouillon pour l'enregistrement, une copie en attente ne garde la filiation pré-allouée que si son geste est identique à celui de sa référence ; sinon elle devient une création locale indépendante (son propre Mouvement). R2 — « un appui sur une zone de l'écran doit fermer le clavier et ne doit pas ouvrir les paramètres ou éditer la zone de description » (Hermann) : tant que le Nom a le focus, le corps défilant de l'éditeur passe en `keyboardShouldPersistTaps="never"` (primitive native) et la zone des étapes de Description ne reçoit pas le toucher.

## Boundaries & Constraints

**Always:** Après le premier enregistrement, verrouillage normal (filiation persistée, sans `pendingLocalMovement`). Une copie non modifiée garde la filiation de sa source (MFN-09 l.448, MFN/AC32). Hors saisie du Nom, `keyboardShouldPersistTaps` reste `"handled"` (barre d'accessoire, ↑ de la Description D-351, étapes D-425 inchangés). Commentaires en français citant la décision de recette du 26/10/2026.

**Never:** Pas de modification du repository, du schéma, de `tokens.ts`, `app.json`, `package.json` ni des specs produit. Pas d'overlay ou de réimplémentation du mécanisme de fermeture. Pas de changement des accès de la rangée de classification (Catégorie, Zone, Niveau), hors du corps défilant.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Copie intacte | source locale S + copie `S (copie)` inchangée | copie garde `sourceMovementId = S`, `pendingLocalMovement` | N/A |
| Copie modifiée | copie : phase, description, média, catégorie, zone ou nom changé | copie émise sans filiation (Mouvement propre) | N/A |
| Source modifiée après duplication | S changée, copie intacte | copie émise sans filiation | N/A |
| Source supprimée | 2 copies en attente vers S | 1re copie = référence (crée S) ; 2e partage si identique, sinon détachée | N/A |
| Nom en saisie | focus Nom | corps `never`, étapes Description `pointerEvents="none"` | N/A |
| Description en saisie | focus Description | corps `handled` | N/A |

</frozen-after-approval>

## Code Map

- `src/features/sessions/ExerciseScreen.tsx` -- `openedOccurrenceOf` (~l.1087) : `phaseStructureLocked` = filiation non vide ; à exclure si `pendingLocalMovement === true`. `contentLocked` en dérive (l.1392). Suggestions non concernées (`available` exige `!isEditingExisting`).
- `src/domain/sessions/composition.ts` -- `duplicateActivity` (filiation pré-allouée, inchangée), `nextCopyName` (forme du suffixe) ; y ajouter `settlePendingLocalCopies`.
- `src/domain/sessions/SessionDraft.ts` -- `toCreateSessionInput` / `toUpdateSessionInput` : appliquer `settlePendingLocalCopies(draft.exercises)` avant la conversion.
- `src/infrastructure/database/repositories/SqliteSessionRepository.ts` -- `resolveNewOccurrenceFiliation` (l.731) : une copie sans filiation crée son Mouvement à son identifiant ; inchangé.
- `src/features/activities/ActivityEditorForm.tsx` -- `TextInput` Nom (l.440, hors `ScrollView`), `ScrollView` `exercise-body` (l.597, `handled`), zone `exercise-description-steps-area` (l.630).
- `node_modules/react-native/Libraries/Components/ScrollView/ScrollView.js` l.1487-1520 -- capture native du premier appui en `never` (cible non `TextInput`).

## Tasks & Acceptance

**Execution:**
- [x] `src/features/sessions/ExerciseScreen.tsx` -- déverrouiller la copie en attente -- R1.
- [x] `src/domain/sessions/composition.ts` -- `settlePendingLocalCopies` (comparaison nom modulo suffixe de copie, description, médias, Catégorie, Zones, structure des phases) -- R1 filiation.
- [x] `src/domain/sessions/SessionDraft.ts` -- appliquer avant création et modification -- R1.
- [x] `src/features/activities/ActivityEditorForm.tsx` -- état focus du Nom ; `never` et `pointerEvents` conditionnels -- R2.
- [x] Tests : `composition.test.ts` (matrice), `SessionDraft` (conversion), `ExerciseScreen.test.tsx` (copie en attente modifiable ; test A2.1 réduit à la filiation réelle), `ActivityEditorForm.test.tsx` (R2).
- [x] `deferred-work.md`, READMEs `src/features/activities`, `src/features/sessions`, `src/domain` -- ligne de résolution, contrat.

**Acceptance Criteria:**
- Given une copie en attente ouverte dans l'éditeur, when on modifie nom, description, médias, Catégorie, Zones ou phases, then les champs sont modifiables comme sur la source.
- Given une Séance enregistrée puis rouverte, when on ouvre la copie, then elle est verrouillée (filiation persistée).
- Given le Nom en saisie, when on appuie sur la Carte Paramètres ou la Description, then le clavier se ferme seulement (vérifié sur iPhone en recette ; en test, prop native).

## Design Notes

R1, choix conservateur : partager seulement si le geste est identique (option du brief « partage seulement si structures identiques », élargie à tout le contenu du Mouvement : un Mouvement partagé de noms ou médias différents serait aussi incohérent, MFN-03). Le nom de la copie est identique s'il vaut le nom de la référence ou un nom de copie `{nom} (copie[ N])` de ce nom. Rien n'est écrit dans le brouillon : la décision est prise à la conversion, sur l'état final (source et copie éditables dans n'importe quel ordre). MFN-09 l.448 (« Ce nom reste non éditable ») et MFN/AC32 sont dépassés pour la copie locale non enregistrée par la décision de Hermann ; propagation documentaire à proposer.

R2 : règle absente de ch13 CE-T03-04 (l.840-854) et ch06 (l.1897) ; décision de recette de Hermann du 26/10/2026. Portée : saisie du Nom, corps défilant seulement. Les accès Catégorie / Zone / Niveau sont hors `ScrollView` ; le menu de Niveau iOS est une primitive native non interceptable sans remplacement ; leur ouverture depuis la saisie du nom est un comportement validé (A2.3, `nameEndSuppressedRef`). Arbitrage à soumettre. Le premier appui fermant le clavier, la fin de saisie du nom peut proposer un geste proche (A2.3), comportement attendu.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes suites vertes (base 172 suites, 4 309 tests)
- `npx tsc --noEmit` -- expected: aucun erreur
- `npm run lint` -- expected: aucun erreur

**Manual checks (if no CLI):**
- iPhone (recette Hermann) : Nom en saisie, appui sur la Carte puis sur la Description : clavier fermé, rien d'autre ; second appui : action normale.

## Implementation Notes

- R1 : `settlePendingLocalCopies` reconnaît aussi un nom de copie de copie (`{nom} (copie) (copie)`) ; quand la référence est elle-même une copie (source supprimée), le nom est comparé à sa base sans suffixes. Une base tronquée par `NAME_MAX_LENGTH` n'est reconnue qu'au premier suffixe (sinon la copie est détachée, choix conservateur).
- R2 : `onFocus` / `onBlur` du Nom sont désormais toujours posés (`onFocus` réarmait déjà `nameEndSuppressedRef` quand `onNameEndEditing` est fourni ; comportement identique).
- Vérification : 172 suites, 4 328 tests verts ; `tsc` et `lint` sans erreur. Effet tactile R2 non vérifiable sous Jest (recette iPhone).

## Spec Change Log

## Review Triage Log

Passe 1 (revues blind-hunter BH, edge-case EC, verification-gap VG) :

| # | Constat | Verdict | Preuve / route |
|---|---------|---------|----------------|
| BH1 / EC2 | Copie C2 d'une copie C1 modifiée : comparée à S, détachée comme C1 ; deux Mouvements pour deux copies identiques | low | Réel (`duplicateActivity` étale `S` et la marque) ; issue cohérente (jamais de Mouvement partagé de contenus différents) ; correction = regroupement par contenu, complexité ajoutée, cas rare — rejeté |
| BH2 | Source supprimée : référence = première copie dans l'ordre d'affichage | low | Réel, mais aligné sur l'ordre de traitement du repository ; issue cohérente — rejeté |
| BH3 | Règle « partage si identique » présentée comme décidée par Hermann dans `deferred-work.md` | low | Réel (Hermann n'a tranché que le déverrouillage) — patch : « option conservatrice, à valider par Hermann » |
| BH4 | Passage en séries variables = changement de geste | false | Les phases n'existent qu'en séries identiques (ch13 l.1222) : passer en variables retire la structure, contenu du geste (MFN-09) |
| BH5 | Description comparée en chaîne brute | low | Une différence d'encodage est une différence de contenu ; cas rare, conservateur — rejeté |
| BH6 | Rangs de suffixe saisis à la main (« (copie 999) ») acceptés | low | Réel, sans incohérence de contenu ; rare — rejeté |
| BH7 | Aucun test SQLite du détachement | false | Une copie détachée est une occurrence sans filiation, chemin couvert par `mfnServices.a13.test.ts` ; repository inchangé |
| BH8 | Test écran partiel sur AC1 | low | Réel — patch : Description, Catégorie, Zones vérifiées |
| BH9 | Boucle à un élément dans le test A2.1 | low | Réel — patch : cas simple |
| BH10 | Bords de `isNameFocused` (sans `onNameEndEditing`, nom verrouillé, médias, lien de recherche) | low | `onFocus` toujours posé, sans effet observable ; nom verrouillé jamais focalisé ; capture des médias et du lien conforme à la règle — rejeté |
| BH11 | Arbitrage rangée de classification sans sources ni proposition | low | Réel (CLAUDE.md) — patch dans `deferred-work.md` |
| BH12 | Incohérences de la spec (statut, numéros de ligne, coquille) | low | Correction = édition de la spec de ce build — rejeté (règle step-04) |
| BH13 | Propagation documentaire incomplète (ch13 l.854, ch06 l.1897) | low | Réel — patch dans `deferred-work.md` |
| VG1 | Branche « base tronquée » de `isNameOrCopyNameOf` non testée | medium | Pré-vérifié — patch : test `NAME_MAX_LENGTH` |
| EC1 | `series` mal formée : `phaseStructureOf` lèverait avant validation | low | Brouillons typés ; copie en attente issue de `duplicateActivity` seulement ; garde d'un état non démontré — rejeté |
| EC3 | Média retiré puis rajouté (nouvel `assetId`) détache la copie | low | Réel, conservateur ; rare — rejeté |
| EC4 | Clavier matériel / pas de métriques : pas de capture, la Carte s'ouvre | low | Aucun clavier logiciel à fermer ; cas hors recette iPhone — rejeté |
| EC5 | Même cas : Description inerte pendant le focus du Nom | low | Idem EC4 — rejeté |
| EC6 | Lien « Rechercher un geste » demande un second appui | false | Conforme à la règle de Hermann (« un appui sur une zone de l'écran doit fermer le clavier »), noté en Design Notes |

Vérification après patch : 172 suites, 4 329 tests verts ; `npx tsc --noEmit` et `npm run lint` sans erreur.

---
title: 'R-3 — Modèle D-445 C05 : occurrence sans copie de contenu, nom unique, alias, migration 013'
type: 'feature'
created: '2026-10-26'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-reprise-q1-q11.md'
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-copie-locale-identite.md'
  - '{project-root}/docs/KODJO-Niveaux-Recherche-Parcours-Regles-v7.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Une occurrence de Séance copie le contenu de son Mouvement : nom, description, médias, Catégorie, Zones et libellés de phases. Cela contredit D-445 C05 et l'arbitrage Q1 de Hermann (« l'occurrence doit référencer directement le Mouvement et lire son contenu courant… aucune duplication persistante… aucun mécanisme de propagation »). Le nom n'est pas unique (C01), il n'existe pas d'alias, et le drapeau « déjà utilisé » (`used`) subsiste (C03 : « aucun indicateur d'utilisation irréversible »).

**Approach:**
- **Migration 013**, une seule fois (Q2) : réinitialisation ponctuelle, nouveau schéma, avis.
- **Persistance.** L'occurrence ne garde que ses propres données : paramètres locaux en forme Catalogue v5, avec les durées par `phaseId`, position, récupération et numéro de copie (Q3). Elle référence le Mouvement par une clé étrangère. Le contenu est lu dans le Mouvement à chaque lecture.
- **Brouillon de Séance.** Il porte une table des Mouvements nouveaux ou modifiés (source unique du contenu à enregistrer). Les champs de contenu d'une occurrence n'y sont qu'une vue de son Mouvement, jamais persistée.

## Boundaries & Constraints

**Always:**
- **Migration 013.**
  - Conserver `users`, `profiles`, `categories`, `body_zones`, `labels` et `migration_notices`, sans aucune modification.
  - Supprimer Mouvements, groupes de Niveaux, Exercices et Séances, avec leurs liens : Zones, médias, phases, Cycles, Circuits, Points d'arrêt et `media_assets`. Les fichiers physiques ne sont pas touchés.
  - Recréer le schéma : `movements` sans `used`, avec `normalized_name` UNIQUE ; nouvelle table `movement_aliases` ; `activities` sans `name`, `instruction` ni `category_id`, avec `copy_number` et `source_movement_id` NOT NULL REFERENCES `movements(id)` ON DELETE RESTRICT.
  - Supprimer `activity_body_zones` et `session_activity_media`.
  - Avis `EXERCISES_AND_SESSIONS_RESET` si au moins un Exercice ou une Séance existait. Une seule exécution, sous `user_version` ; aucun effet au lancement suivant.
- **Lecture.** Une occurrence lit le nom, la description, les médias, la Catégorie, les Zones et la structure des phases dans son Mouvement. Ses durées sont associées par `phaseId`.
  - Une phase du Mouvement sans durée est manquante (signalée et non exécutable, C05).
  - Une durée sans phase est ignorée.
  - Cette tolérance vaut pour les occurrences et les définitions : leurs exercices peuvent rester incomplets après une correction partagée (v7 §2).
- **Suffixe « (copie) ».** C'est l'attribut d'occurrence non éditable `copyNumber` (Q3) : 1 = « (copie) », n = « (copie n) ». Il est affiché après le nom du Mouvement et ne le renomme jamais. La duplication garde le même Mouvement et prend le plus petit numéro libre parmi les occurrences de ce Mouvement dans la Composition.
- **Brouillon.**
  - Une occurrence créée dans la Séance reçoit un Mouvement NEW dans la table du brouillon ; son identifiant est celui de l'occurrence.
  - La copie référence le même Mouvement.
  - Modifier le contenu d'un Mouvement du brouillon met à jour son entrée, et toutes ses occurrences l'affichent.
  - `settlePendingLocalCopies` et `pendingLocalMovement` sont retirés.
- **Enregistrement de la Séance**, dans une seule transaction : insertion des Mouvements NEW, mise à jour des Mouvements EDITED, puis écriture des occurrences.
  - Un nom déjà pris est refusé par l'erreur typée `DuplicateMovementNameError`, aussi en cas d'écriture concurrente (index UNIQUE). Aucune fusion ni aucun renommage implicite.
- **Suppression.**
  - Supprimer le dernier Exercice ne supprime jamais le Mouvement (v7 §2).
  - Un Mouvement encore référencé n'est jamais supprimé (RESTRICT).
- **Dialogue de correction.** Le drapeau `used` est retiré. La condition devient C03 : au moins un autre exercice (définitions et occurrences persistées, comptées une fois) ou une exécution enregistrée, qui vaut toujours zéro sans T04.
- **Alias** : domaine (`Movement.aliases`) et persistance seulement. L'interface d'édition et la recherche viennent avec R-5.
- **Test de migration** sur une base de copie au schéma 012 peuplée. Les tests existants sont adaptés, jamais supprimés sans remplacement.

**Never:**
- Aucune modification de `migration001`–`012`, `tokens.ts`, `app.json` ou `package.json`.
- Aucune lecture de forme v4.
- Aucune copie de contenu dans l'occurrence, ni aucune synchronisation de copies persistées.
- Aucun dialogue C03, crayon ni nouveau libellé (R-4).
- Aucune recherche R02 (R-5) et aucune commande Niveau en Séance (R-6).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Migration sur base 012 peuplée | 2 Exercices, 1 Séance, Catégorie et Zone renommées | tables vidées et recréées ; référentiels intacts ; avis count 3 ; relancer : rien | erreur → annulation complète, `user_version` 12 |
| Lecture après correction | Mouvement renommé « Squat bulgare » | toutes ses occurrences et définitions affichent le nouveau nom | N/A |
| Phase ajoutée au Mouvement | occurrence sans durée pour la phase 3 | lue `INCOMPLETE`, phase 3 manquante | N/A |
| Copie locale + correction | X local, copie, description modifiée sur la copie | les deux affichent la nouvelle description ; un seul Mouvement créé ; paramètres distincts | N/A |
| Copies | X, X copie, X copie, puis suppression de la 1ʳᵉ copie et nouvelle copie | numéros 1, 2, puis 1 réattribué | N/A |
| Nom déjà pris | nouvel Exercice « squat » alors que « Squat » existe | Séance non enregistrée | `DuplicateMovementNameError` |

</frozen-after-approval>

## Code Map

- `src/infrastructure/database/migrations/migration013.ts` (nouveau), à brancher dans `migrateDatabase.ts` et dans les constantes de version, sur le patron de `migration012.ts`.
- `src/infrastructure/database/repositories/SqliteSessionRepository.ts` :
  - jointure vers `movements` (nom, description, Catégorie), `movement_body_zones`, `movement_media` et `movement_phases` ;
  - écriture : paramètres Catalogue v5 (`splitResolvedParameters`), `copy_number`, upsert des Mouvements du brouillon ;
  - retrait de `resolveNewOccurrenceFiliation` et de `markSessionMovementsUsed`.
- `SqliteMovementRepository.ts` : sans `used`, avec alias, et un nom en double transformé en `DuplicateMovementNameError`.
- `SqliteActivityDefinitionRepository.ts`, `SqliteMediaRepository.ts` et `SqliteBodyZoneRepository.ts` : références vers `movement_*` à la place des tables d'occurrence supprimées.
- `src/domain/activities/Movement.ts` :
  - retrait de `used` et de `markMovementUsed`, ajout de `aliases` ;
  - `resolveCatalogParameters` devient tolérant.
- `sharedCorrection.ts` : condition C03 par comptage.
- `src/domain/sessions/Session.ts`, `validation.ts`, `SessionDraft.ts`, `composition.ts`, `sessionDuplication.ts` :
  - `copyNumber` ;
  - `SessionDraft.movements` et `SessionMovementInput` ;
  - `movementId` obligatoire pour un Exercice.
- Features :
  - `ExerciseScreen.tsx` (création locale vers un Mouvement NEW du brouillon ; édition du contenu d'un Mouvement NEW) ;
  - `OccurrenceCard.tsx` et `compositionPresentation.ts` (nom affiché avec le suffixe) ;
  - `CatalogueScreen` et le flux d'ajout (référence au Mouvement).
- READMEs des tranches touchées.

## Tasks & Acceptance

**Execution:**
- [ ] Migration 013 et son test sur une base de copie.
- [ ] Domaine du Mouvement et des Séances : contrats, brouillon, duplication, validation.
- [ ] Repositories : lecture jointe, écriture sans copie, unicité, alias.
- [ ] Features : création locale, copie, affichage du suffixe.
- [ ] Tests adaptés ; nouveaux tests pour la matrice.

**Acceptance Criteria:**
- Given une Séance enregistrée avec deux occurrences du même Mouvement, when on modifie le Mouvement depuis le Catalogue, then la Séance relue affiche le nouveau contenu sur les deux occurrences, chacune avec ses propres paramètres.
- Given la base de l'iPhone au schéma 012, when l'application démarre, then la 013 s'exécute une fois, l'avis s'affiche, et le Profil, les Catégories, les Zones et les Étiquettes sont intacts.

## Verification

**Commands:**
- `npm test -- --maxWorkers=2` -- expected: toutes suites vertes
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur

## Implementation Notes

## Spec Change Log

## Review Triage Log

Revue du 26/10/2026 : trois couches (Blind Hunter, Edge Case Hunter, Verification Gap) sur le diff depuis `d8674d96`, sans les fichiers de R-4.

| # | Source | Constat | Verdict | Preuve | Route |
|---|---|---|---|---|---|
| 1 | BH, ECH, VG | `DuplicateMovementNameError` (nom déjà pris) aboutit à l'erreur générique d'enregistrement de la Séance | medium | `CompositionScreen.handleSave` capte toute erreur en `"error"` ; la matrice I/O de la spec prévoit « Séance non enregistrée », sans message dédié | defer (R-5 : contrôle d'unicité pendant la saisie) |
| 2 | ECH | Deux créations locales de même nom dans un brouillon : `Continuer` inactif sans explication | medium | `validateSessionMovements` rend `DUPLICATE` sur `exercise.name`, que la Composition n'affiche pas | defer (même cause que 1, R-5) |
| 3 | BH | Un Mouvement local dont la dernière occurrence est retirée reste en base et garde son nom | maybe-false | Le Mouvement reste trouvable par `MovementRepository.search` (suggestions A23). Il manque une vérification : sa visibilité et sa suppression depuis l'écran de recherche R03 | defer (medium non vérifié, R-5) |
| 4 | BH | Un Mouvement `EDITED` venu d'une Séance contourne `assessSharedCorrection` | low | L'interface ne produit que `NEW` en R-3. En R-4, la décision C03 est prise dans l'éditeur, avant le brouillon ; le repository n'est que persistance | reject |
| 5 | BH | Les durées de phase d'une occurrence ne sont pas confrontées à la structure de son Mouvement | false | La résolution tolérante est voulue (spec, I/O « phase retirée ») : une phase retirée perd sa durée, une phase ajoutée devient INCOMPLETE | reject |
| 6 | BH, ECH | Un `sourceMovementId` différent sur une occurrence existante est ignoré à la mise à jour | low | Aucun chemin ne le produit : R-4 remplace l'occurrence par une nouvelle. Le correctif ajoute une garde | reject |
| 7 | BH | La portée d'une correction du Catalogue ignore les occurrences de Séance | low | `otherUsageCount` les compte déjà pour décider de la question. L'affichage de la portée est refait par R-4 (spec R-4 : définitions et occurrences) | defer (R-4) |
| 8 | BH | Codes d'erreur d'alias différents entre `validateMovement` et `validateSessionMovements` | low | validation.ts rendait `UNRECOGNIZED` pour les deux cas | patch : `REQUIRED` / `DUPLICATE` alignés |
| 9 | BH, ECH | Le JSDoc de `withDraftMovement` annonce « aucun nouvel objet si rien ne change », ce qui est faux | low | La fonction reconstruit toujours la table et les vues | patch : commentaire corrigé |
| 10 | BH | migration013 laisse les fichiers physiques des médias supprimés | low | Même choix que la 012, documenté dans son en-tête ; seul le stockage est perdu | defer |
| 11 | BH | Schéma `activities` : la branche RECOVERY reste et l'erreur cite D-041 | false | Les citations D-041 suivent la convention existante du fichier (l.817, 858, 1164) ; la branche CHECK est inerte | reject |
| 12 | BH | `countMovementOccurrences` compte une copie à part | false | Une copie est une occurrence, donc un autre exercice (Q3) : compter chaque ligne est voulu | reject |
| 13 | BH, ECH | Réédition d'une occurrence d'un Mouvement NOUVEAU : Catégorie ou Zones vidables (`requireReferences: false`), d'où un Mouvement invalide et `Continuer` inactif sans message | medium | `ExerciseScreen.tsx` : `requireReferences: !isEditingExisting` | patch : références requises aussi pour un Mouvement non enregistré |
| 14 | ECH | Échange de noms entre deux Mouvements dans un même enregistrement, refusé selon l'ordre | low | Inatteignable (aucun renommage `EDITED` en R-3), correctif en deux passes | reject |
| 15 | VG | Suffixe de copie non vérifié dans le libellé d'accessibilité, les Volumes de Circuit et l'ancre de point d'arrêt | low | Gap filé par la couche | patch : tests `copyNumber` 1 et 2 dans `compositionPresentation.test.ts` et `circuit.test.ts` (l'ancre réutilise le même `occurrenceDisplayName`) |
| 16 | VG | Traduction de l'index UNIQUE en `DuplicateMovementNameError` jamais exercée | low | Gap filé ; écriture concurrente quasi inatteignable en base locale | defer |
| 17 | VG | Double avis de réinitialisation 011 → 013 | false | Après la 012, Exercices et Séances valent 0 ; la 013 n'écrit l'avis que si leur total est positif | reject |

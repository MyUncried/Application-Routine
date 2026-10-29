# A.1 — Brouillon, service et dépôt sur la structure générale (fondation)

Story PRE-9, epic A. Autorisation : mission de Hermann « KODJO — PRE-9 : lancement du développement BMAD » (29/10/2026). Plan : `../planning-artifacts/epics.md` § A.1 ; architecture : `../planning-artifacts/architecture-pre9.md` §2–§3. Dépend de : —. Arbitrages : ARB-06 (Point d'arrêt dans un conteneur), D-451.

## Objectif

Faire de la structure générale D-449 / D-451 le modèle commun du brouillon, du service et de la persistance, sans changer volontairement le comportement visible de la Composition.

## Critères d'acceptation et preuves

| Critère (epics.md § A.1) | Livré | Preuve |
|---|---|---|
| Le brouillon porte une `SessionStructure` ; création, modification, consultation, duplication et réouverture passent par le chemin structuré | `SessionDraft.structure` (disposition : Exercices par identifiant, Circuits et Cycles avec identités, comptes, natures, Points) ; `toStructuredSessionInput` ; `SessionService` sur `createStructured` / `updateStructured` / `findStructuredById` / `findForConsultation` (structure générale) ; duplication d'une structure riche avec identités nouvelles | `structure.a1.test.ts`, `cycleMembers.a1.test.ts`, `SessionService.test.ts` |
| Exercices directs de Cycle dans le domaine et en base | `StructureCycle.members` (Exercice direct ou Circuit, rang partagé) ; `activities.cycle_id` ; durée : un Exercice direct compte une fois par répétition du Cycle (RM-252) ; compte du Cycle 1..99 (D-451) | `structure.a1.test.ts`, `cycleMembers.a1.test.ts` |
| Emplacement de Point d'arrêt dans un Cycle (`session_stop_points.cycle_id`, ARB-06) | Emplacement `{ circuitId, cycleId?, position }` validé (conteneur unique et connu, rang borné) ; écrit et relu par le dépôt ; contraintes SQL (au plus un parent, rang unique par Cycle, CASCADE) | `structure.a1.test.ts`, `cycleMembers.a1.test.ts` (schéma) |
| Migration 016 testée en mémoire et sur copie de base | Reconstruction sans perte d'`activities` et `session_stop_points` ; empreinte (comptes et contenu) et `foreign_key_check` contrôlés ; échec → annulation totale, base au schéma 15 ; reprise au démarrage suivant ; installation neuve | `migration016.test.ts` (base FICHIER au schéma 15, relue par une nouvelle connexion) ; migrations 012–015 et chaîne complète (`migrateDatabase.test.ts`) |
| Une Séance existante se rouvre à l'identique ; une Séance à Cycles (Exercices directs) et multi-Circuits se rouvre, se consulte et se duplique sans erreur | Ancien modèle : zones, compte, nature, Points et identité du Circuit relus et réenregistrés à l'identique ; structure riche : disposition conservée, contenu modifiable, consultation entière, duplication | `migration016.test.ts`, `cycleMembers.a1.test.ts` |
| L'écran de Composition conserve exactement son comportement (tests d'intégration existants verts) | Aucun fichier d'écran modifié ; le brouillon garde ses champs de l'ancien modèle, lus par l'écran | Suites `src/features/sessions` et `src/features/activities` (voir § Tests) |
| Réserve de séries par Circuit ; Points de l'ancien modèle conservés | Points conservés à leurs positions (portées, ordre) | `migration016.test.ts`, `cycleMembers.a1.test.ts` |

## Choix techniques (classe D, aucun effet utilisateur)

- **Cycle à membres** : `StructureCycle<E>.members` remplace `circuits` ; aides `cycleCircuits`, `cycleExercises`, `mapStructure`.
- **Point d'arrêt** : `cycleId` facultatif dans l'emplacement ; un Point de Cycle rend la structure non représentable dans l'ancien modèle. La garde `STRUCTURE_STOP_POINTS_UNSUPPORTED` est **conservée** : la généralisation de RM-219 / RM-251 / D-441 / D-442 à toute la structure relève de B.6 (ARB-02a/b). A.1 livre l'emplacement (domaine, schéma, lecture, écriture), pas les règles.
- **Migration 016** : `activities` et `session_stop_points` reconstruites (SQLite n'ajoute ni clé étrangère composite ni CHECK multi-colonnes par `ALTER TABLE`), définition 014 reprise par programme (`MIGRATION_014_DDL`), lignes recopiées, `cycle_id` NULL. `cycles.repeat_count` garde son CHECK `≥ 1` ; la borne 99 est appliquée par le domaine.
- **Disposition du brouillon** (`SessionDraft.structure`) : tant que la Composition n'édite que l'ancien modèle, une disposition représentable est recalculée depuis les zones, le compte, la nature et les Points du brouillon (seule l'identité du Circuit est reprise) ; une disposition plus riche fait foi (contenu des Exercices tiré du brouillon, Exercice retiré → retiré, Exercice nouveau → fin du niveau principal). Identité d'un Circuit créé : `newContainerId` injecté dans le service (`Crypto.randomUUID` dans `SessionServiceProvider`).
- **Compatibilité conservée** (non supprimée prématurément) : port `SessionRepository` de l'ancien modèle (`create`, `update`, `findById`) et projections `structureFromLegacy` / `legacyFromStructure` / `toLegacySession`, encore utilisés par des tests de dépôt et la vérification native ; plus aucun appelant de production dans le service. `SessionService.getSession` (ancien modèle) n'a pas d'appelant de production.

## Synchronisation code / documentation

- **Classe A (conformité)** : Exercices directs de Cycle, parent unique, compte de Cycle 1..99, durée RM-252 — règles déjà écrites (D-451, ch07 ; ch09 « D-451 », l.126-141). Le test « sans plafond de répétitions » (D-449 §4) devient « compte jusqu'à 99 (D-451) ».
- **Classe B** : emplacement de Point d'arrêt dans un Cycle — ARB-06, consigné au registre en DOC.0 (`21ee706a`). Aucune autre règle touchée.
- **Classe D** : migration 016, port structuré du service, disposition du brouillon (ci-dessus). Pas d'entrée ch12 (les migrations 014–015 n'y figurent pas non plus).
- Documents mis à jour : `_bmad-output/pre8/implementation-artifacts/spec-e-catalogue-seances.md` (R-E6 annotée : limite levée côté données et service, rendu en B.1). Aucune formulation normative contraire trouvée (recherche ciblée : « cycle contient des circuits » ch09 l.19, déjà annotée en DOC.0 ; « aucune borne haute » de D-449 §4, remplacée par D-451 au registre).

## Limites et reports

- **Composition** : une Séance à Cycles ou à plusieurs Circuits s'ouvre désormais sans erreur, mais l'écran actuel n'en montre que la liste des Exercices (pas de conteneurs) ; rendu et édition : B.1 à B.4. Aucune Séance de ce type ne peut être créée depuis l'interface avant B.2 ; elles n'existent que dans les tests.
- **Points d'arrêt dans les structures riches** : refusés à l'enregistrement jusqu'à B.6.
- **Copie de base réelle de l'iPhone** : non disponible sur ce poste ; la migration est éprouvée sur une base fichier peuplée comme une base d'appareil, relue par une nouvelle connexion. Point de vérification sur appareil : recette après B.2.
- Aucune recette iPhone à ce stade (pas de changement visible).

## Tests

- `tsc --noEmit` et ESLint (fichiers touchés) : sans erreur.
- Lots complets après la dernière modification : `src/domain` 48 suites / 1 625 tests verts ; `src/infrastructure` 31 suites / 493 tests verts (dont `migration016`, `cycleMembers.a1`, `structure.a1`).
- `src/features/activities` : 819 tests verts (après la bascule du service). `src/features/sessions` : 62 suites vertes sur 65 au premier passage ; les 3 suites aux faux dépôts de l'ancien modèle (`SessionService`, `EmptySessionOpenFlow`, `CatalogueCompositionEditFlow`) corrigées puis vertes isolément (29 tests).
- Une première relance a été interrompue par Claude Code pour manque de mémoire du poste. Relance du 29/10, un seul processus Jest (`--maxWorkers=1`) : `src/features/sessions` 65 suites / 1 437 tests verts ; puis suite complète du projet (224 suites sur 224 listées par `jest --listTests`) : 4 783 tests verts. A.1 passe à `done`.
